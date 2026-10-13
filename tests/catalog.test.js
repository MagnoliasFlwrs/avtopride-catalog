// Проверки поведения каталога без дополнительных зависимостей: node --test.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createCatalogContext() {
  const elementsBySelector = new Map();
  function getElement(selector) {
    if (!elementsBySelector.has(selector)) {
      elementsBySelector.set(selector, {
        innerHTML: '', textContent: '', hidden: false, style: {}, value: '',
        querySelector: getElement,
        scrollLeft: 0, scrollWidth: 1400, clientWidth: 1200
      });
    }
    return elementsBySelector.get(selector);
  }
  const context = vm.createContext({
    document: { querySelector: getElement, querySelectorAll: () => [] },
    window: { matchMedia: () => ({ matches: false }) }
  });
  const projectRoot = path.resolve(__dirname, '..');
  const catalogCode = fs.readFileSync(path.join(projectRoot, 'js/app.js'), 'utf8')
    .replace(/initializeCatalog\(\);\s*$/, '');
  vm.runInContext(fs.readFileSync(path.join(projectRoot, 'js/data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(projectRoot, 'js/common.js'), 'utf8') + '\n' + catalogCode, context);
  return context;
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

test('фильтры сочетаются, сортировка не меняет исходные данные', () => {
  const context = createCatalogContext();
  assert.equal(evaluate(context, 'getFilteredCars().length'), 24);
  evaluate(context, 'catalogState.categoryName = "Кроссоверы"; catalogState.brands.add("Hyundai");');
  assert.equal(evaluate(context, 'getFilteredCars().length'), 3);
  evaluate(context, 'catalogState.fuels.add("Дизель");');
  assert.equal(evaluate(context, 'getFilteredCars()[0].model'), 'Santa Fe');
  evaluate(context, 'catalogState = createInitialCatalogState(); catalogState.sort = "price-desc";');
  assert.equal(evaluate(context, 'getFilteredCars()[0].priceRb'), 189000);
  assert.equal(evaluate(context, 'CARS[0].id'), 1);
});

test('сброс создаёт независимые наборы, счётчик учитывает диапазоны', () => {
  const context = createCatalogContext();
  evaluate(context, 'catalogState.brands.add("Kia"); catalogState.priceMin = 10000;');
  assert.equal(evaluate(context, 'countActiveFilters()'), 2);
  evaluate(context, 'catalogState = createInitialCatalogState();');
  assert.equal(evaluate(context, 'countActiveFilters()'), 0);
});

test('фотобанк: одно фото без навигации, несколько с индикаторами, пустые значения пропускаются', () => {
  const context = createCatalogContext();
  assert.equal(evaluate(context, 'createPhotoGalleryMarkup({...CARS[0], images: []}).includes("data-photo-step")'), false);
  assert.equal(evaluate(context, 'getCarPhotos(CARS[1]).length'), 1);
  const markup = evaluate(context, 'createPhotoGalleryMarkup({...CARS[0], images:["one.jpg", "", null, "two.jpg"]})');
  assert.equal((markup.match(/class="photo-gallery__slide"/g) || []).length, 2);
  assert.equal((markup.match(/data-photo-index=/g) || []).length, 2);
  assert.match(markup, /photo-gallery__indicator--active/);
});

test('галерея ограничивает переходы первой и последней фотографией', () => {
  const context = createCatalogContext();
  const photoTrack = { children: [1, 2, 3], clientWidth: 300, scrollLeft: 0, scrollTo(options) { this.position = options.left; } };
  context.gallery = { querySelector: () => photoTrack };
  evaluate(context, 'scrollToPhoto(gallery, 99)');
  assert.equal(photoTrack.position, 600);
  evaluate(context, 'scrollToPhoto(gallery, -1)');
  assert.equal(photoTrack.position, 0);
});

test('пагинация ограничивает страницу и возвращает пустое состояние', () => {
  const context = createCatalogContext();
  evaluate(context, 'catalogState.page = 99; renderCarList();');
  assert.equal(evaluate(context, 'catalogState.page'), 3);
  assert.equal(evaluate(context, '(elements.carList.innerHTML.match(/<article/g) || []).length'), 6);
  evaluate(context, 'catalogState.brands.add("Неизвестная марка"); renderCarList();');
  assert.equal(evaluate(context, 'catalogState.page'), 1);
  assert.equal(evaluate(context, 'elements.pagination.innerHTML'), '');
  assert.match(evaluate(context, 'elements.carList.innerHTML'), /catalog-results__empty/);
  assert.deepEqual(Array.from(evaluate(context, 'getPaginationItems(20, 10)')), [1, '…', 9, 10, 11, '…', 20]);
});

test('разметка экранирует текст и атрибуты данных', () => {
  const context = createCatalogContext();
  const markup = evaluate(context, 'createCarCardMarkup({...CARS[0], brand:"<script>", model:"\\\"test", images:["photo.jpg\\\" onerror=\\\"alert(1)"]})');
  assert(!markup.includes('<script>'));
  assert.match(markup, /&lt;script&gt;/);
  assert.match(markup, /photo.jpg&quot; onerror=&quot;/);
});


test('избранное читает только известные ID и выдерживает поврежденное хранилище', () => {
  const context = createCatalogContext();
  context.storedValue = '[1, 1, 4, 999, "2"]';
  evaluate(context, 'window.localStorage = { getItem: () => storedValue };');
  assert.deepEqual(Array.from(evaluate(context, '[...readFavoriteCarIds()]')), [1, 4]);
  context.storedValue = '{invalid';
  assert.equal(evaluate(context, 'readFavoriteCarIds().size'), 0);
});

test('избранное сохраняется, строки панели не зависят от фильтров', () => {
  const context = createCatalogContext();
  evaluate(context, 'window.localStorage = { setItem: (key, value) => { window.savedFavorites = value; } };');
  evaluate(context, 'catalogState.brands.add("Kia"); toggleFavoriteCar(1); toggleFavoriteCar(4);');
  assert.equal(evaluate(context, 'window.savedFavorites'), '[1,4]');
  assert.equal(evaluate(context, 'elements.favoritesCount.textContent'), 2);
  assert.match(evaluate(context, 'elements.favoritesContent.innerHTML'), /Hyundai Santa Fe/);
  assert.match(evaluate(context, 'elements.favoritesContent.innerHTML'), /BMW 520d/);
  evaluate(context, 'toggleFavoriteCar(1); toggleFavoriteCar(4);');
  assert.match(evaluate(context, 'elements.favoritesContent.innerHTML'), /Пока ничего не сохранено/);
  assert.equal(evaluate(context, 'window.savedFavorites'), '[]');
});
