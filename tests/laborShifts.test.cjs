const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function loadTs(path, dependencies = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(name => {
    if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}
const shifts = loadTs('src/lib/laborShifts.ts');

test('mixed shifts retain real headcount and pay for the worked shifts', () => {
  const record = shifts.buildLaborPayload({ mason: '3' }, { mason: '1200' }, { mason: { '1.5': '2' } });
  assert.equal(record.mason_count, 5);
  assert.equal(shifts.calculateRecordLaborCount(record), 5);
  assert.equal(shifts.calculateRecordLaborShifts(record), 6);
  assert.equal(shifts.calculateRecordLaborCost(record), 7200);
  assert.equal(shifts.getLaborShiftSummary(record, 'mason'), '3 × 1 shift · 2 × 1.5 shifts');
});

test('half, normal, extra and double shifts work together across categories', () => {
  const record = shifts.buildLaborPayload({ mason: '1', painter: '2' }, { mason: '1000', painter: '800' }, { mason: { '0.5': '2', '1.5': '1', '2': '1' }, painter: { '1.5': '1' } });
  assert.equal(shifts.calculateRecordLaborCount(record), 8);
  assert.equal(shifts.calculateRecordLaborShifts(record), 9);
  assert.equal(shifts.calculateRecordLaborCost(record), 8300);
});

test('legacy records keep one shift per worker and stored zero rates', () => {
  const legacy = { mason_count: 2, mason_rate: 1200, painter_count: 1, painter_rate: 0 };
  assert.equal(shifts.calculateRecordLaborCount(legacy), 3);
  assert.equal(shifts.calculateRecordLaborShifts(legacy), 3);
  assert.equal(shifts.calculateRecordLaborCost(legacy), 2400);
  assert.equal(shifts.readLaborShiftDraft(legacy).counts.mason, '2');
  assert.equal(shifts.calculateRecordLaborCost(null), 0);
});

test('shift counts survive storage and reopening without doubling the workers', () => {
  for (const role of shifts.WORKER_ROLES) {
    const record = shifts.buildLaborPayload({ [role.key]: '4' }, { [role.key]: '1234.5' }, { [role.key]: { '0.5': '1', '1.5': '2', '2': '1' } });
    const saved = JSON.parse(JSON.stringify(record));
    const draft = shifts.readLaborShiftDraft(saved);
    assert.equal(draft.counts[role.key], '4');
    const rebuilt = shifts.buildLaborPayload(draft.counts, { [role.key]: '1234.5' }, draft.extras);
    assert.deepEqual(rebuilt, saved);
    assert.equal(shifts.calculateRecordLaborCount(rebuilt), 8);
    assert.equal(shifts.calculateRecordLaborCost(rebuilt), 11727.75);
    assert.equal(shifts.calculateRecordLaborCost({ ...rebuilt, [role.rateKey]: 0 }), 0);
  }
});

test('negative, fractional and malformed counts/rates cannot be saved', () => {
  for (const count of ['-1', '1.5', 'abc', 'Infinity', '2147483648']) {
    assert.throws(() => shifts.buildLaborPayload({ mason: count }, { mason: '1000' }, {}));
    assert.throws(() => shifts.buildLaborPayload({}, { mason: '1000' }, { mason: { '1.5': count } }));
  }
  for (const rate of ['-1', 'abc', 'Infinity']) assert.throws(() => shifts.buildLaborPayload({ mason: '1' }, { mason: rate }, {}));
});

test('removing all extra workers clears previously saved shift details', () => {
  const draft = shifts.readLaborShiftDraft({ mason_count: 5, shift_counts: { mason: { '1.5': 2 } } });
  draft.extras.mason = {};
  const result = shifts.buildLaborPayload(draft.counts, { mason: '1000' }, draft.extras);
  assert.deepEqual(result.shift_counts, {});
  assert.equal(result.mason_count, 3);
  assert.equal(shifts.calculateRecordLaborCost(result), 3000);
});

function mockService({ connected = true, error = null, previous = null } = {}) {
  const queued = [];
  const cached = [];
  const writes = [];
  let latestPayload;
  const query = {
    upsert: payload => { latestPayload = Array.isArray(payload) ? payload[0] : payload; writes.push(latestPayload); return query; },
    update: payload => { latestPayload = payload; writes.push(payload); return query; },
    select: () => query,
    eq: () => query,
    single: async () => {
      const currentError = typeof error === 'function' ? error(writes.length) : error;
      return { error: currentError, data: currentError ? null : { ...latestPayload, id: 'row-id' } };
    },
  };
  const service = loadTs('src/services/siteLabor.ts', {
    '@/lib/supabase': { supabase: { from: () => query } },
    '@/lib/laborShifts': shifts,
    './notifications': { createNotification: async () => {} },
    './offlineStorage': { offlineStorage: { get: async () => previous ? { data: previous } : null, set: async (...args) => cached.push(args) } },
    './offlineQueue': { offlineQueue: { enqueue: async item => queued.push(item) } },
    './networkStatus': { networkStatus: { getNetworkState: () => ({ isConnected: connected }) } },
    '@/lib/dataSync': { dataSync: { notify: () => {} } },
  });
  return { service, writes, queued, cached };
}
const samplePayload = () => ({ ...shifts.buildLaborPayload({ mason: '1' }, { mason: '1200' }, { mason: { '1.5': '1' } }), site_id: 'site-id', work_date: '2026-10-13' });

test('a missing migration cannot silently discard shifts or overwrite the cache', async () => {
  for (const operation of ['create', 'update']) {
    const mock = mockService({ error: { code: 'PGRST204', message: 'shift_counts column missing' } });
    const promise = operation === 'create' ? mock.service.createSiteLabor(samplePayload(), 'user-id') : mock.service.updateSiteLabor('row-id', samplePayload(), 'user-id');
    await assert.rejects(promise, /Update the attendance database/);
    assert.equal(mock.writes.length, 1);
    assert.equal(mock.cached.length, 0);
    assert.equal(mock.queued.length, 0);
  }
});

test('offline create and edit preserve the complete shift payload for sync', async () => {
  for (const operation of ['create', 'update']) {
    const mock = mockService({ connected: false });
    const result = operation === 'create' ? await mock.service.createSiteLabor(samplePayload(), 'user-id') : await mock.service.updateSiteLabor('row-id', samplePayload(), 'user-id');
    assert.deepEqual(mock.queued[0].payload.shift_counts, samplePayload().shift_counts);
    assert.equal(shifts.calculateRecordLaborCost(result), 3000);
    assert.equal(shifts.calculateRecordLaborCount(result), 2);
    assert.equal(mock.writes.length, 0);
  }
});

test('successful online saves send and cache shifts without changing headcount', async () => {
  const mock = mockService();
  const result = await mock.service.createSiteLabor(samplePayload(), 'user-id');
  assert.equal(shifts.calculateRecordLaborCost(result), 3000);
  assert.equal(result.mason_count, 2);
  assert.deepEqual(mock.cached[0][2].shift_counts, samplePayload().shift_counts);
});

test('editing only rates offline retains stored headcounts and extra shifts', async () => {
  const previous = { ...samplePayload(), id: 'row-id' };
  const mock = mockService({ connected: false, previous });
  const result = await mock.service.updateSiteLabor('row-id', { site_id: 'site-id', work_date: '2026-10-13', mason_rate: 1000 }, 'user-id');
  assert.equal(result.mason_count, 2);
  assert.deepEqual(result.shift_counts, previous.shift_counts);
  assert.equal(shifts.calculateRecordLaborCost(result), 2500);
  assert.equal(shifts.calculateRecordLaborCost(mock.cached[0][2]), 2500);
});

test('normal attendance preserves extended roles before the shift migration is applied', async () => {
  for (const operation of ['create', 'update']) {
    const mock = mockService({ error: write => write === 1 ? { code: 'PGRST204', message: 'shift_counts column missing' } : null });
    const payload = { ...shifts.buildLaborPayload({ painter: '3' }, { painter: '1000' }, {}), site_id: 'site-id', work_date: '2026-10-13' };
    const result = operation === 'create' ? await mock.service.createSiteLabor(payload, 'user-id') : await mock.service.updateSiteLabor('row-id', payload, 'user-id');
    assert.equal(mock.writes.length, 2);
    assert.equal(mock.writes[1].painter_count, 3);
    assert.equal(mock.writes[1].shift_counts, undefined);
    assert.equal(shifts.calculateRecordLaborCost(result), 3000);
  }
});
