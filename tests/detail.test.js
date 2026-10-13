const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createDetailContext() {
  const context = vm.createContext({
    document: { querySelector: () => ({}) },
    window: { matchMedia: () => ({ matches: false }) }
  });
  const projectRoot = path.resolve(__dirname, '..');
  const detailCode = fs.readFileSync(path.join(projectRoot, 'js/detail.js'), 'utf8')
    .replace(/initializeCarDetail\(\);\s*$/, '');
  const sourceCode = ['data.js', 'common.js', 'detail-data.js'].map(fileName =>
    fs.readFileSync(path.join(projectRoot, 'js', fileName), 'utf8')).join('\n');
  vm.runInContext(sourceCode + '\n' + detailCode, context);
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function parameters(carId) {
  return { get: () => carId };
}

test('детальная страница выбирает авто строго по ID', () => {
  const context = createDetailContext();
  context.parameters = parameters('4');
  assert.equal(evaluate(context, 'getSelectedCar(parameters).model'), '520d');
  for (const invalidId of ['999', '', '-1', '1x', '<script>']) {
    context.parameters = parameters(invalidId);
    assert.equal(evaluate(context, 'getSelectedCar(parameters)'), null);
  }
  context.parameters = parameters(null);
  assert.equal(evaluate(context, 'getSelectedCar(parameters).id'), 1);
});

test('поля, заголовок и описание принадлежат выбранному авто', () => {
  const context = createDetailContext();
  const heroMarkup = evaluate(context, 'createHeroMarkup(CARS[3], getCarDetailContent(CARS[3]))');
  assert.match(heroMarkup, /BMW 520d xDrive Luxury/);
  assert.match(heroMarkup, /45\s*300/);
  assert.match(heroMarkup, /36\s*000 км/);
  assert(!heroMarkup.includes('Santa Fe'));
  const specificationMarkup = evaluate(context, 'createDetailSpecificationsMarkup(CARS[3])');
  assert.match(specificationMarkup, /car-specs__value">—/);
});

test('неизвестные расходы уточняются без выдуманных тарифов', () => {
  const context = createDetailContext();
  assert.equal(evaluate(context, 'formatDetailPrice(undefined)'), 'Уточняется');
  assert.equal(evaluate(context, 'getCostBreakdown(CARS[0], getCarDetailContent(CARS[0])).services'), undefined);
  assert.equal(evaluate(context, 'getCostBreakdown(CARS[0], getCarDetailContent(CARS[0])).vehicle'), 18900);
  assert.match(evaluate(context, 'createCostRowsMarkup(CARS[3], getCarDetailContent(CARS[3]))'), /Уточняется/);
});

test('ссылка карточки передает ID и открывает новую вкладку', () => {
  const appCode = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf8');
  assert.match(appCode, /href="car\.html\?id=\$\{car\.id\}" target="_blank" rel="noopener noreferrer"/);
});
