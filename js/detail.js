/** Детальная страница выбранного автомобиля. ID передаётся ссылкой из каталога. */
'use strict';

const detailElements = {
  main: document.querySelector('#carDetail'),
  contactDialog: document.querySelector('#contactDialog'),
  contactTitle: document.querySelector('#contactTitle'),
  contactDescription: document.querySelector('#contactDescription'),
  contactEmail: document.querySelector('#contactEmail')
};

/** Не подменяем неизвестный ID другим автомобилем. Без ID открывается пример макета. */
function getSelectedCar(searchParameters) {
  const rawCarId = searchParameters.get('id');
  if (rawCarId === null) return CARS.find(car => car.id === 1);
  if (!/^\d+$/.test(rawCarId)) return null;
  return CARS.find(car => car.id === Number(rawCarId)) ?? null;
}

function getCarTitle(car) {
  return `${car.brand} ${car.model} ${car.trim}`;
}

function formatDetailPrice(price, roundToHundreds = false) {
  if (!Number.isFinite(price)) return 'Уточняется';
  const convertedPrice = price * EXCHANGE_RATE_BYN;
  const priceInByn = roundToHundreds ? Math.round(convertedPrice / 100) * 100 : Math.round(convertedPrice);
  return `${formatNumber(price)} $ / ${formatNumber(priceInByn)} BYN`;
}

/** У других автомобилей используем их поля, а не описание Santa Fe из макета. */
function getCarDetailContent(car) {
  return CAR_DETAIL_CONTENT[car.id] ?? {
    introduction: `${car.brand} ${car.model} ${car.trim} — автомобиль под заказ из Кореи. Ниже представлены характеристики выбранного варианта и предварительная стоимость под ключ в Беларуси.`,
    descriptionTitle: `${car.brand} ${car.model} — ${car.trim}`,
    descriptionParagraphs: [
      `${car.brand} ${car.model}, ${car.year} года выпуска. Пробег — ${formatNumber(car.mileage)} км. Тип топлива — ${car.fuel.toLowerCase()}, коробка передач — ${car.gearbox.toLowerCase()}, привод — ${car.drive.toLowerCase()}. Мощность — ${car.power} л.с.`,
      'Подробное описание комплектации и состояния уточняется после проверки конкретного автомобиля. Перед выкупом согласуем историю, документы, фотографии и итоговый расчет.'
    ]
  };
}

function createDetailSpecificationsMarkup(car) {
  const driveLabel = { Полный: '4WD', Передний: 'FWD', Задний: 'RWD' }[car.drive];
  const specifications = [
    ['Год', car.year], ['Пробег', `${formatNumber(car.mileage)} км`],
    ['Коробка', car.gearbox.toLowerCase()], ['Топливо', car.fuel.toLowerCase()],
    ['Привод / Мощность', `${driveLabel} / ${car.power} л.с.`],
    ['Цена в Корее', `${formatNumber(car.priceKr)} $`], ['VIN', car.vin],
    ['Местоположение', car.location], ['Дата первой регистрации', car.registrationDate],
    ['Состояние', car.condition], ['Повреждения', car.damage], ['Статус', car.status ?? 'Под заказ']
  ];
  return specifications.map(([label, value]) => createSpecificationMarkup(label, value)).join('');
}

function createHeroMarkup(car, detailContent) {
  const title = getCarTitle(car);
  return `
    <section class="detail-hero">
      <div class="catalog__container">
        <nav class="detail-hero__breadcrumbs" aria-label="Навигация">
          <a href="index.html">Главная</a><span aria-hidden="true">/</span>
          <a href="index.html">Каталог авто</a><span aria-hidden="true">/</span>
          <span>${escapeHtml(title)}</span>
        </nav>
        <h1 class="detail-hero__title">${escapeHtml(title)}</h1>
        <p class="detail-hero__description">${escapeHtml(detailContent.introduction)}</p>
        <div class="detail-hero__content">
          <div class="detail-hero__gallery">${createPhotoGalleryMarkup(car, true)}</div>
          <aside class="detail-summary" aria-labelledby="specificationsTitle">
            <h2 class="detail-summary__title" id="specificationsTitle">Характеристики авто:</h2>
            <div class="detail-summary__price">
              <span>Под ключ в РБ:</span><i aria-hidden="true"></i>
              <strong>${formatDetailPrice(car.priceRb, true)}</strong>
            </div>
            <ul class="car-specs detail-summary__specs">${createDetailSpecificationsMarkup(car)}</ul>
            <div class="detail-summary__actions">
              <a class="detail-button detail-button--primary" href="#estimate">Получить расчет</a>
              <button class="detail-button detail-button--outline" data-contact="inspection">Запросить осмотр</button>
            </div>
          </aside>
        </div>
      </div>
    </section>`;
}

/** Полоса бренда из макета; декоративные логотипы не дублируют текст для скринридера. */
function createBrandRibbonMarkup() {
  const logosMarkup = Array.from({ length: 5 }, (_, logoIndex) => `
          <div class="brand-ribbon__logo">
            <span class="brand-ribbon__mark ${logoIndex >= 3 ? 'brand-ribbon__mark--vector' : ''}">
              ${logoIndex >= 3 ? '<img src="assets/detail/brand-mark-vector.svg" alt="">' : ''}
            </span>
            <span class="brand-ribbon__wordmark">
              <img src="assets/detail/${logoIndex >= 3 ? 'brand-wordmark-vector.png' : 'brand-wordmark.png'}" alt="">
            </span>
          </div>`).join('');
  // Две одинаковые группы обеспечивают бесшовное повторение CSS-анимации.
  return `
    <div class="brand-ribbon" aria-hidden="true">
      <div class="brand-ribbon__track">
        <div class="brand-ribbon__group">${logosMarkup}</div>
        <div class="brand-ribbon__group">${logosMarkup}</div>
      </div>
    </div>`;
}

function createDescriptionMarkup(car, detailContent) {
  return `
    <section class="car-description catalog__container" aria-labelledby="descriptionTitle">
      <div class="car-description__content">
        <span class="detail-section-label">Описание автомобиля</span>
        <h2 class="detail-section-title car-description__title" id="descriptionTitle">${escapeHtml(detailContent.descriptionTitle)}</h2>
        <div class="car-description__paragraphs">
          ${detailContent.descriptionParagraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        </div>
        <h3 class="car-description__subtitle">Что важно знать по этому автомобилю?</h3>
        <div class="car-description__paragraphs">
          <p>При покупке ${escapeHtml(car.brand)} ${escapeHtml(car.model)} из Кореи важно смотреть не только на саму модель, но и на конкретное состояние автомобиля, его историю, документы и <a href="#estimate">итоговую стоимость под ключ</a>. Цена на площадке в Корее — это только часть общего бюджета, поэтому перед выкупом важно заранее понимать все этапы сделки.</p>
          <p class="car-description__emphasis">В рамках подбора и расчета по этому автомобилю обычно учитываются:</p>
          <ul class="car-description__list">${PURCHASE_CHECKLIST.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          <p>Чтобы понимать реальный бюджет покупки, лучше заранее запросить точный расчет, проверку автомобиля и полное сопровождение до передачи машины в Беларуси.</p>
        </div>
      </div>
      <div class="car-description__image-wrapper">
        <img class="car-description__image" src="assets/detail/description-car.png" alt="" loading="lazy">
        <span class="car-description__mark" aria-hidden="true"></span>
      </div>
    </section>`;
}

/** Суммы неизвестных расходов не выдумываются для остальных автомобилей. */
function getCostBreakdown(car, detailContent) {
  // Статьи расходов из макета — демоданные. Не выводим недостающие суммы из общего итога.
  return { vehicle: car.priceKr, ...detailContent.costs };
}

function createCostRowsMarkup(car, detailContent) {
  const costs = getCostBreakdown(car, detailContent);
  return COST_BREAKDOWN_FIELDS.map(costField => `
    <li class="cost-breakdown__item">
      <div class="cost-breakdown__line">
        <span class="cost-breakdown__label">${escapeHtml(costField.title)}:</span>
        <i class="cost-breakdown__separator" aria-hidden="true"></i>
        <strong class="cost-breakdown__amount">${formatDetailPrice(costs[costField.key])}</strong>
      </div>
      <p class="cost-breakdown__description">${escapeHtml(costField.description)}</p>
    </li>`).join('');
}

function createEstimateMarkup(car, detailContent) {
  return `
    <section class="detail-estimate catalog__container" id="estimate" aria-labelledby="estimateTitle">
      <h2 class="detail-section-title" id="estimateTitle">Предварительный расчет</h2>
      <p class="detail-estimate__introduction">Расчет показывает ориентировочную стоимость автомобиля под ключ в Беларуси.<br>Итог зависит от выбранного авто, курса валют, условий доставки и таможенного оформления.</p>
      <div class="detail-estimate__content">
        <div class="cost-breakdown">
          <div class="cost-breakdown__heading">
            <h3 class="cost-breakdown__title">Итого под ключ:</h3>
            <div class="cost-breakdown__price">${formatDetailPrice(car.priceRb, true)}</div>
          </div>
          <h3 class="cost-breakdown__title cost-breakdown__title--details">Детализация стоимости:</h3>
          <ul class="cost-breakdown__list">${createCostRowsMarkup(car, detailContent)}</ul>
          <div class="cost-breakdown__total">
            <h3 class="cost-breakdown__title">Итого под ключ:</h3>
            <div class="cost-breakdown__price">${formatDetailPrice(car.priceRb, true)}</div>
          </div>
        </div>
        <div class="detail-estimate__image-wrapper">
          <img class="detail-estimate__image" src="assets/detail/calculation-car.png" alt="" loading="lazy">
        </div>
      </div>
      <aside class="estimate-note">
        <h3 class="estimate-note__title">Примечание</h3>
        <div class="estimate-note__paragraphs">
          <p>Расчет является предварительным и не считается публичной офертой. Точная стоимость зависит от конкретного автомобиля, актуального курса валют, условий доставки, таможенных платежей и дополнительных расходов при оформлении.</p>
          <p>После подбора и проверки конкретного автомобиля мы подготовим точный расчет под ключ: с доставкой, таможенными платежами, оформлением и сопровождением до получения авто в Беларуси.</p>
        </div>
        <div class="estimate-note__actions">
          <button class="detail-button detail-button--primary" data-contact="estimate">Получить точный расчет</button>
          <button class="detail-button detail-button--light-outline" data-contact="consultation">Получить консультацию</button>
        </div>
        <img class="estimate-note__mark" src="assets/detail/note-mark.png" alt="" loading="lazy">
      </aside>
    </section>`;
}

function renderMissingCar() {
  document.title = 'Автомобиль не найден — AVTOPRIDE';
  detailElements.main.innerHTML = `
    <section class="detail-error catalog__container">
      <h1 class="detail-section-title">Автомобиль не найден</h1>
      <p>Проверьте ссылку или выберите автомобиль из каталога.</p>
      <a class="detail-button detail-button--primary" href="index.html">Вернуться в каталог</a>
    </section>`;
}

function openContactDialog(car, requestType) {
  const requestTitles = {
    inspection: 'Запросить осмотр', estimate: 'Получить точный расчет', consultation: 'Получить консультацию'
  };
  detailElements.contactTitle.textContent = requestTitles[requestType];
  detailElements.contactDescription.textContent = `Свяжитесь с нами по автомобилю ${getCarTitle(car)}. Менеджер уточнит детали и подготовит ответ.`;
  const emailSubject = `${requestTitles[requestType]}: ${getCarTitle(car)} (ID ${car.id})`;
  detailElements.contactEmail.href = `mailto:info@avtopride.by?subject=${encodeURIComponent(emailSubject)}`;
  detailElements.contactDialog.showModal();
}

function bindDetailPageEvents(car) {
  bindPhotoGalleryEvents();
  document.addEventListener('click', event => {
    const contactButton = event.target.closest('[data-contact]');
    if (contactButton) openContactDialog(car, contactButton.dataset.contact);
    if (event.target.closest('#closeContact')) detailElements.contactDialog.close();
  });
}

function initializeCarDetail() {
  const selectedCar = getSelectedCar(new URLSearchParams(window.location.search));
  if (!selectedCar) {
    renderMissingCar();
    return;
  }
  const detailContent = getCarDetailContent(selectedCar);
  document.title = `${getCarTitle(selectedCar)} — AVTOPRIDE`;
  detailElements.main.innerHTML = createHeroMarkup(selectedCar, detailContent)
    + createBrandRibbonMarkup() + createDescriptionMarkup(selectedCar, detailContent)
    + createEstimateMarkup(selectedCar, detailContent);
  bindDetailPageEvents(selectedCar);
}

initializeCarDetail();
