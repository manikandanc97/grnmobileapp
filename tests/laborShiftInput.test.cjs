const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function loadTs(path, dependencies = {}) {
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(name => {
    if (!(name in dependencies)) throw new Error('Unexpected dependency: ' + name);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}

function editor(initial = {}) {
  let selection = null;
  const createElement = (type, props, ...children) => ({ type, props: props || {}, children });
  const Money = () => {};
  const { LaborShiftInput } = loadTs('src/components/labor/LaborShiftInput.tsx', {
    react: { __esModule: true, default: { createElement }, useState: () => [selection, value => { selection = value; }] },
    'react-native': { View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable', StyleSheet: { create: value => value } },
    '@/constants/theme': { Colors: { light: {} }, Radius: {}, Spacing: {}, TouchTargets: { min: 44 } },
    '@/lib/laborShifts': loadTs('src/lib/laborShifts.ts'),
    '@/lib/finance': loadTs('src/lib/finance.ts'),
    '@/components/ui/Money': { Money },
  });
  const props = { roleLabel: 'Masons', count: '0', extras: {}, rate: 1200, ...initial };
  props.onCountChange = value => { props.count = value; };
  props.onExtrasChange = value => { props.extras = value; };
  function nodes(value = LaborShiftInput(props)) {
    if (Array.isArray(value)) return value.flatMap(item => nodes(item));
    if (!value || typeof value !== 'object') return [];
    return [value, ...nodes(value.children)];
  }
  return {
    props,
    input: () => nodes().find(node => node.type === 'TextInput').props,
    select: shift => nodes().find(node => node.props.accessibilityLabel === `Masons: ${shift} ${shift === '0.5' || shift === '1' ? 'shift' : 'shifts'}`).props.onPress(),
    total: () => nodes().filter(node => node.type === Money).at(-1).props.amount,
    buttons: () => nodes().filter(node => node.type === 'Pressable'),
  };
}

test('two workers on 1.5 shifts receive 3600 at a base wage of 1200', () => {
  const view = editor();
  view.select('1.5');
  view.input().onChangeText('2');
  assert.equal(view.props.count, '0');
  assert.equal(view.props.extras['1.5'], '2');
  assert.equal(view.total(), 3600);
});

test('switching shifts retains each group and produces the correct mixed total', () => {
  const view = editor({ count: '3', extras: { '1.5': '2', '2': '1' } });
  view.select('1.5');
  assert.equal(view.input().value, '2');
  view.input().onChangeText('4');
  view.select('1');
  assert.equal(view.input().value, '3');
  view.select('2');
  assert.equal(view.input().value, '1');
  assert.equal(view.props.extras['1.5'], '4');
  assert.equal(view.total(), 13200);
});

test('clearing the normal group stays on its field and retains extra-shift workers', () => {
  const view = editor({ count: '3', extras: { '1.5': '2' } });
  view.input().onChangeText('0');
  assert.match(view.input().accessibilityLabel, /on 1 shift$/);
  assert.equal(view.input().value, '0');
  assert.equal(view.total(), 3600);
});

test('an asynchronously reopened extra-shift record selects its populated group', () => {
  const view = editor();
  assert.equal(view.input().value, '0');
  view.props.extras = { '0.5': '0', '1.5': '2', '2': '0' };
  assert.match(view.input().accessibilityLabel, /on 1.5 shifts$/);
  assert.equal(view.input().value, '2');
});

test('changing wage rates recalculates every group and preserves a zero rate', () => {
  const view = editor({ count: '3', extras: { '1.5': '2' } });
  assert.equal(view.total(), 7200);
  view.props.rate = 1000;
  assert.equal(view.total(), 6000);
  view.props.rate = 0;
  assert.equal(view.total(), 0);
  assert.equal(view.props.extras['1.5'], '2');
});

test('saving locks all controls and count input accepts only whole workers', () => {
  const view = editor();
  for (const invalid of ['abc4', '1.5', '-1']) {
    view.input().onChangeText(invalid);
    assert.equal(view.props.count, '0');
  }
  view.input().onChangeText('4');
  assert.equal(view.props.count, '4');
  view.props.disabled = true;
  assert.equal(view.input().editable, false);
  assert.ok(view.buttons().every(button => button.props.disabled));
});
