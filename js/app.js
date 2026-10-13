/**
 * Каталог AVTOPRIDE: фильтры, карточки, пагинация и свайперы.
 * Данные подключаются в data.js; файл не требует фреймворков и сборщика.
 */
'use strict';

// Конфигурация и ссылки на постоянные элементы страницы.
const CARS_PER_PAGE = 9;
const MAX_PRICE = Math.ceil(Math.max(...CARS.map(car => car.priceRb)) / 1000) * 1000;
const MAX_MILEAGE = Math.ceil(Math.max(...CARS.map(car => car.mileage)) / 10000) * 10000;
const FILTER_SET_NAMES = ['offers', 'brands', 'fuels', 'drives', 'gearboxes', 'years'];
const CATEGORY_IMAGE_NAMES = ['sedan', 'crossover', 'minivan', 'coupe', 'electric', 'premium', 'budget'];
const OFFER_OPTIONS = [
  { value: 'hit', label: 'Хит заказов' },
  { value: 'top', label: 'Топовые предложения' }
];
const FILTER_OPTIONS = {
  brands: getUniqueCarValues('brand').sort(),
  fuels: ['Бензин', 'Дизель', 'Электро', 'Гибрид', 'Газ'],
  drives: ['Передний', 'Полный', 'Задний'],
  gearboxes: ['Механика', 'Автомат', 'Робот'],
  years: getUniqueCarValues('year').sort((firstYear, secondYear) => secondYear - firstYear)
};
const SORT_COMPARATORS = {
  'price-asc': (firstCar, secondCar) => firstCar.priceRb - secondCar.priceRb,
  'price-desc': (firstCar, secondCar) => secondCar.priceRb - firstCar.priceRb,
  'year-desc': (firstCar, secondCar) => secondCar.year - firstCar.year,
  'mileage-asc': (firstCar, secondCar) => firstCar.mileage - secondCar.mileage
};
const RANGE_INPUT_FIELDS = {
  priceMin: 'priceMin', priceMinR: 'priceMin',
  priceMax: 'priceMax', priceMaxR: 'priceMax',
  kmMin: 'mileageMin', kmMax: 'mileageMax'
};
const elements = {
  categoryTrack: document.querySelector('#cats'),
  categoryPreviousButton: document.querySelector('#catsPrev'),
  categoryNextButton: document.querySelector('#catsNext'),
  filterPanel: document.querySelector('#filter'),
  desktopFilterSlot: document.querySelector('#filterSlot'),
  mobileFilterContent: document.querySelector('#mobileFilterContent'),
  mobileFilterDialog: document.querySelector('#mobileFilters'),
  activeFilterCount: document.querySelector('#filterCount'),
  showCarsButton: document.querySelector('#showFilteredCars'),
  resultCount: document.querySelector('#found'),
  carList: document.querySelector('#grid'),
  pagination: document.querySelector('#pager'),
  sortSelect: document.querySelector('#sort'),
  favoritesDrawer: document.querySelector('#favoritesDrawer'),
  favoritesCount: document.querySelector('#favoritesCount'),
  favoritesSummary: document.querySelector('#favoritesSummary'),
  favoritesContent: document.querySelector('#favoritesContent')
};
const mobileFilterMedia = window.matchMedia('(max-width: 900px)');
const FAVORITES_STORAGE_KEY = 'avtopride.favoriteCarIds';
let favoriteCarIds = readFavoriteCarIds();
let catalogState = createInitialCatalogState();
let categoryDragState = null;
let suppressCategoryClick = false;

/** Возвращает независимые наборы выбранных значений при каждом сбросе. */
function createInitialCatalogState() {
  return {
    priceMin: 0, priceMax: MAX_PRICE, mileageMin: 0, mileageMax: MAX_MILEAGE,
    offers: new Set(), brands: new Set(), fuels: new Set(),
    drives: new Set(), gearboxes: new Set(), years: new Set(),
    categoryName: null, sort: 'price-asc', page: 1
  };
}

function getUniqueCarValues(fieldName) {
  return [...new Set(CARS.map(car => car[fieldName]))];
}

// Фильтрация не изменяет исходный массив автомобилей.
function matchesSelectedValues(selectedValues, carValue) {
  return selectedValues.size === 0 || selectedValues.has(carValue);
}

function matchesCatalogFilters(car) {
  const selectedCategory = CATS.find(category => category.name === catalogState.categoryName);
  return car.priceRb >= catalogState.priceMin && car.priceRb <= catalogState.priceMax
    && car.mileage >= catalogState.mileageMin && car.mileage <= catalogState.mileageMax
    && (!catalogState.offers.size || car.tags.some(tag => catalogState.offers.has(tag)))
    && matchesSelectedValues(catalogState.brands, car.brand)
    && matchesSelectedValues(catalogState.fuels, car.fuel)
    && matchesSelectedValues(catalogState.drives, car.drive)
    && matchesSelectedValues(catalogState.gearboxes, car.gearbox)
    && matchesSelectedValues(catalogState.years, car.year)
    && (!selectedCategory || selectedCategory.test(car));
}

function getFilteredCars() {
  return CARS.filter(matchesCatalogFilters).sort(SORT_COMPARATORS[catalogState.sort]);
}

function countActiveFilters() {
  const selectedOptionsCount = FILTER_SET_NAMES.reduce(
    (count, filterName) => count + catalogState[filterName].size, 0
  );
  return selectedOptionsCount + Number(catalogState.categoryName !== null)
    + Number(catalogState.priceMin > 0 || catalogState.priceMax < MAX_PRICE)
    + Number(catalogState.mileageMin > 0 || catalogState.mileageMax < MAX_MILEAGE);
}

// Создание разметки: функции возвращают HTML и не назначают обработчики событий.
/** Создаёт строковую карточку со ссылкой на детальную страницу. */
function createCarCardMarkup(car) {
  const priceInByn = formatNumber(Math.round(car.priceRb * EXCHANGE_RATE_BYN / 100) * 100);
  const driveLabel = { Полный: '4WD', Задний: 'RWD', Передний: 'FWD' }[car.drive];
  const isFavorite = favoriteCarIds.has(car.id);

  return `
    <article class="car-card" data-car="${car.id}">
      ${createPhotoGalleryMarkup(car)}
      <div class="car-card__body">
        <div class="car-card__heading">
          <h3 class="car-card__title">
            ${escapeHtml(car.brand)} ${escapeHtml(car.model)}
            <small class="car-card__trim">/ ${escapeHtml(car.trim)}</small>
          </h3>
          <div class="car-card__actions">
            <button class="car-card__action ${isFavorite ? 'car-card__action--selected' : ''}"
              data-favorite="${car.id}" aria-pressed="${isFavorite}"
              aria-label="В избранное: ${escapeHtml(car.brand)} ${escapeHtml(car.model)}">
              <img class="car-card__action-icon" src="assets/icons/heart.svg" alt="">
            </button>
            <a class="car-card__action" href="car.html?id=${car.id}" target="_blank" rel="noopener noreferrer"
              aria-label="Подробнее: ${escapeHtml(car.brand)} ${escapeHtml(car.model)}">
              <img class="car-card__action-icon" src="assets/icons/external.svg" alt="">
            </a>
          </div>
        </div>
        <div class="car-card__details">
          <ul class="car-specs">
            ${createSpecificationMarkup('Год', car.year)}
            ${createSpecificationMarkup('Пробег', formatNumber(car.mileage) + ' км')}
            ${createSpecificationMarkup('Коробка', car.gearbox.toLowerCase())}
            ${createSpecificationMarkup('Топливо', car.fuel.toLowerCase())}
            ${createSpecificationMarkup('Привод / Мощность', `${driveLabel} / ${car.power} л.с.`)}
            ${createSpecificationMarkup('Цена в Корее', formatNumber(car.priceKr) + ' $')}
          </ul>
          <div class="car-card__extra">
            <ul class="car-specs">
              ${createSpecificationMarkup('Состояние', car.condition)}
              ${createSpecificationMarkup('Дата первой регистрации', car.registrationDate)}
              ${createSpecificationMarkup('VIN', car.vin)}
            </ul>
            <div class="car-card__price">
              <span class="car-card__price-label">Итого:</span>
              <span class="car-card__price-value">${formatNumber(car.priceRb)} $ / <b>${priceInByn} BYN</b></span>
            </div>
          </div>
        </div>
      </div>
    </article>`;
}

function createCheckboxMarkup(filterName, options) {
  return options.map(option => {
    const optionValue = option.value ?? option;
    const optionLabel = option.label ?? option;
    const isChecked = catalogState[filterName].has(optionValue);
    return `<label class="catalog-filter__option">
      <input class="catalog-filter__checkbox" type="checkbox" data-set="${filterName}"
        value="${escapeHtml(optionValue)}" ${isChecked ? 'checked' : ''}>
      ${escapeHtml(optionLabel)}
    </label>`;
  }).join('');
}

/** Формирует номера страниц с многоточиями для длинного списка. */
function getPaginationItems(totalPages, currentPage) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const visiblePages = new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]
    .filter(pageNumber => pageNumber >= 1 && pageNumber <= totalPages));
  const paginationItems = [];
  let previousPage = 0;
  [...visiblePages].sort((firstPage, secondPage) => firstPage - secondPage).forEach(pageNumber => {
    if (pageNumber - previousPage > 1) paginationItems.push('…');
    paginationItems.push(pageNumber);
    previousPage = pageNumber;
  });
  return paginationItems;
}

// Обновление DOM: состояние хранится отдельно от разметки.
function createFilterGroupMarkup(title, content) {
  return `
    <div class="catalog-filter__group">
      <h3 class="catalog-filter__heading">${escapeHtml(title)}</h3>
      ${content}
    </div>`;
}

function createFilterOptionsMarkup(filterName, options, isScrollable = false) {
  return `
    <div class="catalog-filter__options ${isScrollable ? 'catalog-filter__options--scrollable' : ''}">
      ${createCheckboxMarkup(filterName, options)}
    </div>`;
}

function createRangeInputsMarkup(minimumId, maximumId, minimumValue, maximumValue, label) {
  return `
    <div class="catalog-filter__range-inputs">
      <input class="catalog-filter__number" type="number" id="${minimumId}"
        aria-label="${label}: от" value="${minimumValue}">
      <input class="catalog-filter__number" type="number" id="${maximumId}"
        aria-label="${label}: до" value="${maximumValue}">
    </div>`;
}

function renderFilterPanel() {
  const priceControls = `
    ${createRangeInputsMarkup('priceMin', 'priceMax', catalogState.priceMin, catalogState.priceMax, 'Стоимость, $')}
    <div class="catalog-filter__range-slider">
      <div class="catalog-filter__range-fill" id="priceFill"></div>
      <input class="catalog-filter__slider" type="range" id="priceMinR"
        aria-label="Минимальная стоимость" min="0" max="${MAX_PRICE}" step="100" value="${catalogState.priceMin}">
      <input class="catalog-filter__slider" type="range" id="priceMaxR"
        aria-label="Максимальная стоимость" min="0" max="${MAX_PRICE}" step="100" value="${catalogState.priceMax}">
    </div>`;

  elements.filterPanel.innerHTML = `
    ${createFilterGroupMarkup('Стоимость, $', priceControls)}
    ${createFilterGroupMarkup('Предложения', createFilterOptionsMarkup('offers', OFFER_OPTIONS))}
    ${createFilterGroupMarkup('Марка авто', createFilterOptionsMarkup('brands', FILTER_OPTIONS.brands, true))}
    ${createFilterGroupMarkup('Двигатель', createFilterOptionsMarkup('fuels', FILTER_OPTIONS.fuels))}
    ${createFilterGroupMarkup('Привод', createFilterOptionsMarkup('drives', FILTER_OPTIONS.drives))}
    ${createFilterGroupMarkup('Коробка', createFilterOptionsMarkup('gearboxes', FILTER_OPTIONS.gearboxes))}
    ${createFilterGroupMarkup('Пробег, км', createRangeInputsMarkup('kmMin', 'kmMax', catalogState.mileageMin, catalogState.mileageMax, 'Пробег, км'))}
    ${createFilterGroupMarkup('Год', createFilterOptionsMarkup('years', FILTER_OPTIONS.years, true))}
    <button class="catalog-filter__reset" id="clear">очистить фильтр</button>`;
  updatePriceRangeFill();
}

function updatePriceRangeFill() {
  const rangeFill = elements.filterPanel.querySelector('#priceFill');
  rangeFill.style.left = `${catalogState.priceMin / MAX_PRICE * 100}%`;
  rangeFill.style.right = `${100 - catalogState.priceMax / MAX_PRICE * 100}%`;
}

function renderCategories() {
  const previousScrollLeft = elements.categoryTrack.scrollLeft;
  elements.categoryTrack.innerHTML = CATS.map((category, categoryIndex) => {
    const isSelected = catalogState.categoryName === category.name;
    return `<button type="button" class="category-carousel__item ${isSelected ? 'category-carousel__item--selected' : ''}"
      data-cat="${escapeHtml(category.name)}" aria-pressed="${isSelected}">
      <div class="category-carousel__image-wrapper"><img class="category-carousel__image"
        src="assets/categories/${CATEGORY_IMAGE_NAMES[categoryIndex]}.png" alt="" draggable="false"></div>
      <span class="category-carousel__label">${escapeHtml(category.name)}</span>
    </button>`;
  }).join('');
  elements.categoryTrack.scrollLeft = previousScrollLeft;
  updateCategoryNavigation();
}

function renderResultSummary(resultCount) {
  const activeFiltersCount = countActiveFilters();
  elements.resultCount.textContent = formatNumber(resultCount);
  elements.activeFilterCount.textContent = activeFiltersCount;
  elements.activeFilterCount.hidden = activeFiltersCount === 0;
  elements.showCarsButton.textContent = `Показать автомобили (${formatNumber(resultCount)})`;
}

function renderPagination(totalPages) {
  if (totalPages < 2) {
    elements.pagination.innerHTML = '';
    return;
  }
  elements.pagination.innerHTML = getPaginationItems(totalPages, catalogState.page).map(pageNumber => {
    if (pageNumber === '…') return '<span class="pagination__ellipsis">…</span>';
    return `<button class="pagination__button ${pageNumber === catalogState.page ? 'pagination__button--active' : ''}"
      data-page="${pageNumber}" aria-label="Страница ${pageNumber}" ${pageNumber === catalogState.page ? 'aria-current="page"' : ''}>${pageNumber}</button>`;
  }).join('') + `<button class="pagination__button pagination__button--next" aria-label="Следующая страница"
    data-page="${catalogState.page + 1}" ${catalogState.page === totalPages ? 'disabled' : ''}>›</button>`;
}

function renderCarList() {
  const filteredCars = getFilteredCars();
  const totalPages = Math.max(1, Math.ceil(filteredCars.length / CARS_PER_PAGE));
  catalogState.page = Math.min(catalogState.page, totalPages);
  const startIndex = (catalogState.page - 1) * CARS_PER_PAGE;
  const visibleCars = filteredCars.slice(startIndex, startIndex + CARS_PER_PAGE);
  renderResultSummary(filteredCars.length);
  elements.carList.innerHTML = visibleCars.length ? visibleCars.map(createCarCardMarkup).join('')
    : '<div class="catalog-results__empty">По выбранным параметрам ничего не найдено. Измените фильтр или очистите его.</div>';
  renderPagination(totalPages);
}

function renderCatalog() {
  renderCategories();
  renderFilterPanel();
  renderCarList();
  elements.sortSelect.value = catalogState.sort;
}

/** При изменении параметров возвращаемся на первую страницу результатов. */
function refreshFilteredResults() {
  catalogState.page = 1;
  renderCarList();
}

function resetCatalogFilters() {
  catalogState = createInitialCatalogState();
  renderCatalog();
}

// Категории: нативный свайп на сенсорном экране и перетаскивание мышью.
function updateCategoryNavigation() {
  const categoryTrack = elements.categoryTrack;
  elements.categoryPreviousButton.disabled = categoryTrack.scrollLeft <= 2;
  elements.categoryNextButton.disabled = categoryTrack.scrollLeft >= categoryTrack.scrollWidth - categoryTrack.clientWidth - 2;
}

function scrollCategories(direction) {
  const categoryItem = elements.categoryTrack.querySelector('.category-carousel__item');
  const categoryGap = parseFloat(getComputedStyle(elements.categoryTrack).gap) || 0;
  elements.categoryTrack.scrollBy({
    left: direction * (categoryItem.getBoundingClientRect().width + categoryGap),
    behavior: getScrollBehavior()
  });
}

function startCategoryDrag(event) {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  categoryDragState = { startX: event.clientX, initialScrollLeft: elements.categoryTrack.scrollLeft, hasMoved: false };
  suppressCategoryClick = false;
}

function moveCategoryDrag(event) {
  if (!categoryDragState) return;
  const distance = event.clientX - categoryDragState.startX;
  if (Math.abs(distance) > 5) categoryDragState.hasMoved = true;
  if (!categoryDragState.hasMoved) return;
  elements.categoryTrack.classList.add('category-carousel__track--dragging');
  elements.categoryTrack.scrollLeft = categoryDragState.initialScrollLeft - distance;
}

function finishCategoryDrag() {
  if (!categoryDragState) return;
  suppressCategoryClick = categoryDragState.hasMoved;
  categoryDragState = null;
  elements.categoryTrack.classList.remove('category-carousel__track--dragging');
}

/** После перетаскивания не выбираем категорию случайным завершающим кликом. */
function preventCategoryClickAfterDrag(event) {
  if (!suppressCategoryClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressCategoryClick = false;
}

// Диалоги: используем один DOM фильтра, чтобы сохранить введённые значения.
function placeFilterPanel() {
  if (!mobileFilterMedia.matches && elements.mobileFilterDialog.open) elements.mobileFilterDialog.close();
  const filterContainer = mobileFilterMedia.matches ? elements.mobileFilterContent : elements.desktopFilterSlot;
  filterContainer.append(elements.filterPanel);
}

function closeFilterOnBackdropClick(event) {
  if (event.target !== elements.mobileFilterDialog) return;
  const dialogBounds = elements.mobileFilterDialog.getBoundingClientRect();
  const isOutsideDialog = event.clientX < dialogBounds.left || event.clientX > dialogBounds.right
    || event.clientY < dialogBounds.top || event.clientY > dialogBounds.bottom;
  if (isOutsideDialog) elements.mobileFilterDialog.close();
}

/** Устаревшие ID и повреждённые данные хранилища не попадают в избранное. */
function readFavoriteCarIds() {
  try {
    const storedIds = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(storedIds)) return new Set();
    return new Set(storedIds.filter(carId => Number.isInteger(carId) && CARS.some(car => car.id === carId)));
  } catch {
    // Если браузер запрещает localStorage, избранное продолжает работать в этой вкладке.
    return new Set();
  }
}

function saveFavoriteCarIds() {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteCarIds]));
  } catch {
    // Сохраняем выбор в памяти даже при недоступном постоянном хранилище.
  }
}

function updateFavoriteButtons() {
  document.querySelectorAll('[data-favorite]').forEach(favoriteButton => {
    const isFavorite = favoriteCarIds.has(Number(favoriteButton.dataset.favorite));
    favoriteButton.classList.toggle('car-card__action--selected', isFavorite);
    favoriteButton.setAttribute('aria-pressed', isFavorite);
  });
}

/** Компактные строки панели не зависят от фильтров и текущей страницы каталога. */
function createFavoriteRowMarkup(car) {
  const carName = `${car.brand} ${car.model}`;
  const detailUrl = `car.html?id=${car.id}`;
  const priceInByn = Math.round(car.priceRb * EXCHANGE_RATE_BYN / 100) * 100;
  return `
    <article class="favorite-row">
      <a class="favorite-row__image-link" href="${detailUrl}" target="_blank" rel="noopener noreferrer" aria-label="Подробнее: ${escapeHtml(carName)}">
        <img class="favorite-row__image" src="${escapeHtml(getCarPhotos(car)[0])}" alt="" loading="lazy">
      </a>
      <div class="favorite-row__body">
        <a class="favorite-row__title" href="${detailUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(carName)}</a>
        <p class="favorite-row__trim">${escapeHtml(car.trim)}</p>
        <p class="favorite-row__specs">${car.year} · ${formatNumber(car.mileage)} км</p>
        <p class="favorite-row__price">${formatNumber(car.priceRb)} $ <span class="favorite-row__currency">/ ${formatNumber(priceInByn)} BYN</span></p>
      </div>
      <button class="favorite-row__remove" data-remove-favorite="${car.id}" aria-label="Удалить из избранного: ${escapeHtml(carName)}">×</button>
    </article>`;
}

function renderFavoritesDrawer() {
  const favoriteCars = [...favoriteCarIds].map(carId => CARS.find(car => car.id === carId)).filter(Boolean);
  elements.favoritesCount.textContent = favoriteCars.length;
  elements.favoritesSummary.textContent = `Выбрано автомобилей: ${favoriteCars.length}`;
  elements.favoritesContent.innerHTML = favoriteCars.length
    ? favoriteCars.map(createFavoriteRowMarkup).join('')
    : `<div class="favorites-drawer__empty">
        <img class="favorites-drawer__empty-icon" src="assets/icons/heart.svg" alt="">
        <h3 class="favorites-drawer__empty-title">Пока ничего не сохранено</h3>
        <p>Нажимайте на сердечко в карточке, чтобы собрать здесь понравившиеся автомобили.</p>
      </div>`;
}

function toggleFavoriteCar(carId) {
  if (!CARS.some(car => car.id === carId)) return;
  favoriteCarIds.has(carId) ? favoriteCarIds.delete(carId) : favoriteCarIds.add(carId);
  saveFavoriteCarIds();
  updateFavoriteButtons();
  renderFavoritesDrawer();
}

function openFavoritesDrawer() {
  elements.favoritesDrawer.classList.remove('favorites-drawer--closing');
  elements.favoritesDrawer.showModal();
}

/** Ждём завершения выезда, сохраняя блокировку фона и фокус внутри dialog. */
function closeFavoritesDrawer() {
  const drawer = elements.favoritesDrawer;
  if (!drawer.open || drawer.classList.contains('favorites-drawer--closing')) return;
  if (reducedMotionMedia.matches) {
    drawer.close();
    return;
  }
  drawer.classList.add('favorites-drawer--closing');
  drawer.addEventListener('animationend', () => {
    drawer.close();
    drawer.classList.remove('favorites-drawer--closing');
  }, { once: true });
}

function handleFavoritesBackdropClick(event) {
  if (event.target !== elements.favoritesDrawer) return;
  const bounds = elements.favoritesDrawer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    closeFavoritesDrawer();
  }
}

function synchronizeFavoriteCars(event) {
  if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;
  favoriteCarIds = readFavoriteCarIds();
  updateFavoriteButtons();
  renderFavoritesDrawer();
}

// Обработчики делегированы: повторный рендер не создаёт дублирующихся слушателей.
function handleFilterChange(event) {
  const changedInput = event.target;
  const filterName = changedInput.dataset.set;
  if (FILTER_SET_NAMES.includes(filterName)) {
    const selectedValue = filterName === 'years' ? Number(changedInput.value) : changedInput.value;
    if (changedInput.checked) catalogState[filterName].add(selectedValue);
    else catalogState[filterName].delete(selectedValue);
    refreshFilteredResults();
  }
  if (changedInput === elements.sortSelect) {
    catalogState.sort = changedInput.value;
    refreshFilteredResults();
  }
}

function handleRangeInput(event) {
  const inputField = RANGE_INPUT_FIELDS[event.target.id];
  if (!inputField) return;
  catalogState[inputField] = Number(event.target.value) || 0;
  if (catalogState.priceMin > catalogState.priceMax) {
    if (inputField === 'priceMin') catalogState.priceMin = catalogState.priceMax;
    else catalogState.priceMax = catalogState.priceMin;
  }
  if (inputField.startsWith('price')) {
    ['priceMin', 'priceMax'].forEach(fieldName => {
      elements.filterPanel.querySelector(`#${fieldName}`).value = catalogState[fieldName];
      elements.filterPanel.querySelector(`#${fieldName}R`).value = catalogState[fieldName];
    });
    updatePriceRangeFill();
  }
  refreshFilteredResults();
}

function handleCatalogClick(event) {
  const clickedElement = event.target;
  const categoryButton = clickedElement.closest('[data-cat]');
  if (categoryButton) {
    const categoryName = categoryButton.dataset.cat;
    catalogState.categoryName = catalogState.categoryName === categoryName ? null : categoryName;
    renderCategories();
    refreshFilteredResults();
    return;
  }
  const pageButton = clickedElement.closest('[data-page]');
  if (pageButton && !pageButton.disabled) {
    catalogState.page = Number(pageButton.dataset.page);
    renderCarList();
    elements.carList.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
    return;
  }
  const favoriteButton = clickedElement.closest('[data-favorite]');
  if (favoriteButton) toggleFavoriteCar(Number(favoriteButton.dataset.favorite));
  if (clickedElement.closest('#openFavorites')) openFavoritesDrawer();
  if (clickedElement.closest('#closeFavorites')) closeFavoritesDrawer();
  const removeFavoriteButton = clickedElement.closest('[data-remove-favorite]');
  if (removeFavoriteButton) {
    const removedIndex = [...elements.favoritesContent.querySelectorAll('[data-remove-favorite]')].indexOf(removeFavoriteButton);
    toggleFavoriteCar(Number(removeFavoriteButton.dataset.removeFavorite));
    // После удаления строки переводим фокус к следующей, а не на фон страницы.
    const remainingButtons = elements.favoritesContent.querySelectorAll('[data-remove-favorite]');
    (remainingButtons[Math.min(removedIndex, remainingButtons.length - 1)] ?? document.querySelector('#closeFavorites')).focus();
  }
  if (clickedElement.closest('#openFilters')) elements.mobileFilterDialog.showModal();
  if (clickedElement.closest('#closeFilters, #showFilteredCars')) elements.mobileFilterDialog.close();
  if (clickedElement.closest('#clear')) resetCatalogFilters();
}

function handleWindowResize() {
  updateCategoryNavigation();
}

/** Назначается один раз после загрузки DOM и данных. */
function bindCatalogEvents() {
  elements.favoritesDrawer.addEventListener('click', handleFavoritesBackdropClick);
  elements.favoritesDrawer.addEventListener('cancel', event => {
    event.preventDefault();
    closeFavoritesDrawer();
  });
  window.addEventListener('storage', synchronizeFavoriteCars);
  document.addEventListener('change', handleFilterChange);
  document.addEventListener('input', handleRangeInput);
  document.addEventListener('click', handleCatalogClick);
  bindPhotoGalleryEvents();
  elements.categoryPreviousButton.addEventListener('click', () => scrollCategories(-1));
  elements.categoryNextButton.addEventListener('click', () => scrollCategories(1));
  elements.categoryTrack.addEventListener('pointerdown', startCategoryDrag);
  elements.categoryTrack.addEventListener('click', preventCategoryClickAfterDrag, true);
  elements.categoryTrack.addEventListener('scroll', updateCategoryNavigation, { passive: true });
  window.addEventListener('pointermove', moveCategoryDrag);
  window.addEventListener('pointerup', finishCategoryDrag);
  window.addEventListener('pointercancel', finishCategoryDrag);
  window.addEventListener('resize', handleWindowResize);
  mobileFilterMedia.addEventListener('change', placeFilterPanel);
  elements.mobileFilterDialog.addEventListener('click', closeFilterOnBackdropClick);
}

function initializeCatalog() {
  renderCatalog();
  renderFavoritesDrawer();
  placeFilterPanel();
  bindCatalogEvents();
}

initializeCatalog();
