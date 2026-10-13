const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadService({ nativeModule = false, netInfo, os = 'android', browser, fetch = async () => ({ status: 200 }) } = {}) {
  const timers = new Map();
  const appState = { currentState: 'active', addEventListener: (_, listener) => { appState.listener = listener; return { remove() {} }; } };
  let nextTimer = 0;
  let imports = 0;
  let requests = 0;
  const module = { exports: {} };
  const source = fs.readFileSync('src/services/networkStatus.ts', 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports, __DEV__: false, console, AbortController,
    process: { env: { EXPO_PUBLIC_SUPABASE_URL: 'https://example.test/' } },
    window: browser?.window, navigator: browser?.navigator,
    setTimeout: (fn, ms) => { timers.set(++nextTimer, { fn, ms }); return nextTimer; },
    clearTimeout: id => timers.delete(id),
    fetch: (...args) => { requests++; return fetch(...args); },
    require: name => {
      if (name === 'react-native') return { Platform: { OS: os }, AppState: appState, NativeModules: { RNCNetInfo: nativeModule ? {} : null } };
      if (name === '@react-native-community/netinfo') {
        imports++;
        if (!netInfo) throw new Error('NativeModule.RNCNetInfo is null');
        return { default: netInfo };
      }
      throw new Error('Unexpected dependency: ' + name);
    },
  });
  return { service: module.exports.networkStatus, timers, appState, get imports() { return imports; }, get requests() { return requests; } };
}

test('a missing RNCNetInfo module does not crash startup or import NetInfo', async () => {
  const loaded = loadService();
  assert.equal(loaded.imports, 0);
  assert.equal(loaded.service.getNetworkState().isInternetReachable, null);
  const state = await loaded.service.refresh();
  assert.equal(state.status, 'connected');
  assert.equal(state.isInternetReachable, true);
  assert.equal(state.type, 'unknown');
  assert.equal(loaded.requests, 1);
});

test('a failed NetInfo initialization also falls back without crashing', async () => {
  const loaded = loadService({ nativeModule: true });
  assert.equal(loaded.imports, 1);
  assert.equal((await loaded.service.refresh()).status, 'connected');
});

test('fallback disconnect and reconnect notify subscribers for offline sync', async () => {
  let connected = false;
  const loaded = loadService({ fetch: async () => { if (!connected) throw new Error('Network request failed'); return { status: 401 }; } });
  const states = [];
  const unsubscribe = loaded.service.subscribe(state => states.push(state.status));
  assert.equal((await loaded.service.refresh()).status, 'disconnected');
  connected = true;
  assert.equal((await loaded.service.refresh()).status, 'connected');
  assert.deepEqual(states, ['unknown', 'disconnected', 'connected']);
  unsubscribe();
  connected = false;
  await loaded.service.refresh();
  assert.equal(states.length, 3);
});

test('fallback checks the configured backend without credentials and shares concurrent retries', async () => {
  let resolve;
  const loaded = loadService({ fetch: (url, options) => {
    assert.equal(url, 'https://example.test/auth/v1/health');
    assert.equal(options.method, 'GET');
    assert.equal(options.headers, undefined);
    return new Promise(done => { resolve = done; });
  } });
  const first = loaded.service.refresh();
  const second = loaded.service.refresh();
  assert.equal(first, second);
  assert.equal(loaded.requests, 1);
  resolve({ status: 500 });
  assert.equal((await first).isConnected, true);
});

test('a stalled fallback request times out and permits another refresh', async () => {
  const loaded = loadService({ fetch: (_, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Aborted')));
  }) });
  const request = loaded.service.refresh();
  [...loaded.timers.values()].find(timer => timer.ms === 8000).fn();
  assert.equal((await request).status, 'disconnected');
  const retry = loaded.service.refresh();
  [...loaded.timers.values()].find(timer => timer.ms === 8000).fn();
  await retry;
  assert.equal(loaded.requests, 2);
});

test('fallback polling pauses in the background and refreshes on foreground', async () => {
  const loaded = loadService();
  await loaded.service.refresh();
  assert.equal([...loaded.timers.values()].filter(timer => timer.ms === 60000).length, 1);
  loaded.appState.currentState = 'background';
  loaded.appState.listener('background');
  assert.equal(loaded.timers.size, 0);
  loaded.appState.currentState = 'active';
  loaded.appState.listener('active');
  await loaded.service.refresh();
  assert.equal(loaded.requests, 2);
});

test('available NetInfo keeps native events and newer events beat stale fetches', async () => {
  let listener;
  let resolve;
  const loaded = loadService({ nativeModule: true, netInfo: {
    addEventListener: next => { listener = next; return () => {}; },
    fetch: () => new Promise(done => { resolve = done; }),
  } });
  listener({ type: 'none', isConnected: false, isInternetReachable: false });
  resolve({ type: 'wifi', isConnected: true, isInternetReachable: true });
  assert.equal((await loaded.service.refresh()).status, 'disconnected');
  listener({ type: 'cellular', isConnected: true, isInternetReachable: true });
  assert.equal(loaded.service.getNetworkState().isCellular, true);
  assert.equal(loaded.requests, 0);
});

test('native unknown connectivity stays unknown rather than reporting offline', async () => {
  const loaded = loadService({ nativeModule: true, netInfo: {
    addEventListener: () => () => {},
    fetch: async () => ({ type: 'unknown', isConnected: null, isInternetReachable: null }),
  } });
  const state = await loaded.service.refresh();
  assert.equal(state.status, 'unknown');
  assert.equal(state.isConnected, true);
  assert.equal(state.isInternetReachable, null);
});

test('web fallback follows browser online and offline events', async () => {
  const handlers = {};
  const browser = { navigator: { onLine: false }, window: { addEventListener: (event, handler) => { handlers[event] = handler; } } };
  const loaded = loadService({ os: 'web', browser });
  assert.equal((await loaded.service.refresh()).status, 'disconnected');
  browser.navigator.onLine = true;
  handlers.online();
  assert.equal((await loaded.service.refresh()).status, 'connected');
  handlers.offline();
  assert.equal(loaded.service.getNetworkState().status, 'disconnected');
  assert.equal(loaded.requests, 0);
  assert.equal(loaded.timers.size, 0);
});

test('static web rendering makes no connectivity requests or timers', () => {
  const loaded = loadService({ os: 'web' });
  assert.equal(loaded.service.getNetworkState().status, 'unknown');
  assert.equal(loaded.requests, 0);
  assert.equal(loaded.timers.size, 0);
});
