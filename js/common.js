/** Общие функции каталога и детальной страницы: форматирование и фотогалерея. */
'use strict';

const EXCHANGE_RATE_BYN = RATE;
const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
let photoDragState = null;

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 332 260"><rect width="332" height="260" fill="#232323"/>' +
  '<path d="M60 160l22-40c4-8 10-12 20-12h128c10 0 16 4 22 12l20 40v30H60z" fill="#3a3a3a"/>' +
  '<circle cx="104" cy="192" r="18" fill="#111"/><circle cx="228" cy="192" r="18" fill="#111"/></svg>'
);


function formatNumber(number) {
  return number.toLocaleString('ru-RU');
}


/** Экранирует значения данных перед вставкой в HTML, в том числе атрибуты. */
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function getScrollBehavior() {
  return reducedMotionMedia.matches ? 'auto' : 'smooth';
}


function createSpecificationMarkup(label, value) {
  return `<li class="car-specs__item">
    <span class="car-specs__label">${escapeHtml(label)}:</span>
    <i class="car-specs__separator" aria-hidden="true"></i>
    <b class="car-specs__value">${escapeHtml(value ?? '—')}</b>
  </li>`;
}

/** images — фотобанк; img — совместимость с прежними одиночными фотографиями. */
function getCarPhotos(car) {
  const photos = Array.isArray(car.images)
    ? car.images.filter(imageUrl => typeof imageUrl === 'string' && imageUrl.trim())
    : [];
  return photos.length ? photos : [car.img || PLACEHOLDER_IMAGE];
}

/** Навигация галереи создаётся только при наличии нескольких фотографий. */
function createPhotoGalleryMarkup(car, showOfferBadges = false) {
  const photos = getCarPhotos(car);
  const hasMultiplePhotos = photos.length > 1;
  const photoSlides = photos.map((imageUrl, photoIndex) => {
    const photoDescription = hasMultiplePhotos ? ` — фото ${photoIndex + 1} из ${photos.length}` : '';
    return `
      <div class="photo-gallery__slide">
        <img class="photo-gallery__image" src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(car.brand)} ${escapeHtml(car.model)}${photoDescription}"
          loading="lazy" draggable="false">
      </div>`;
  }).join('');

  return `
    <div class="photo-gallery ${hasMultiplePhotos ? 'photo-gallery--multiple' : ''}">
      <div class="photo-gallery__track"
        ${hasMultiplePhotos ? 'tabindex="0" role="group" aria-label="Фотографии автомобиля"' : ''}>
        ${photoSlides}
      </div>
      ${createPhotoBadgesMarkup(car, showOfferBadges)}
      ${hasMultiplePhotos ? createPhotoControlsMarkup(photos.length) : ''}
    </div>`;
}

/** Дополнительные метки показываются только при соответствии данным авто. */
function createPhotoBadgesMarkup(car, showOfferBadges) {
  const badges = ['Под заказ'];
  if (showOfferBadges) {
    if (car.mileage <= 10000) badges.push('Пробег до 10 000');
    if (car.tags.includes('hit')) badges.push('Хит');
  }
  return `<div class="photo-gallery__badges">${badges.map(label =>
    `<span class="photo-gallery__badge">${escapeHtml(label)}</span>`).join('')}</div>`;
}

function createPhotoControlsMarkup(photoCount) {
  const indicators = Array.from({ length: photoCount }, (_, photoIndex) => `
    <button class="photo-gallery__indicator ${photoIndex === 0 ? 'photo-gallery__indicator--active' : ''}"
      data-photo-index="${photoIndex}" aria-label="Фото ${photoIndex + 1} из ${photoCount}"
      aria-current="${photoIndex === 0 ? 'true' : 'false'}"></button>
  `).join('');

  return `
    <button class="photo-gallery__arrow photo-gallery__arrow--previous"
      data-photo-step="-1" aria-label="Предыдущее фото" disabled>‹</button>
    <button class="photo-gallery__arrow photo-gallery__arrow--next"
      data-photo-step="1" aria-label="Следующее фото">›</button>
    <div class="photo-gallery__indicators">${indicators}</div>`;
}


// Управление галереями работает в списке и на детальной странице автомобиля.
function getPhotoIndex(photoTrack) {
  return photoTrack.clientWidth ? Math.round(photoTrack.scrollLeft / photoTrack.clientWidth) : 0;
}

function scrollToPhoto(galleryElement, requestedIndex) {
  const photoTrack = galleryElement.querySelector('.photo-gallery__track');
  const lastPhotoIndex = photoTrack.children.length - 1;
  const nextPhotoIndex = Math.max(0, Math.min(lastPhotoIndex, requestedIndex));
  photoTrack.scrollTo({ left: nextPhotoIndex * photoTrack.clientWidth, behavior: getScrollBehavior() });
}

function updatePhotoNavigation(galleryElement) {
  const photoTrack = galleryElement.querySelector('.photo-gallery__track');
  if (!galleryElement.classList.contains('photo-gallery--multiple') || !photoTrack.clientWidth) return;
  const currentPhotoIndex = getPhotoIndex(photoTrack);
  galleryElement.querySelector('.photo-gallery__arrow--previous').disabled = currentPhotoIndex === 0;
  galleryElement.querySelector('.photo-gallery__arrow--next').disabled = currentPhotoIndex === photoTrack.children.length - 1;
  galleryElement.querySelectorAll('[data-photo-index]').forEach((indicator, photoIndex) => {
    const isActive = photoIndex === currentPhotoIndex;
    indicator.classList.toggle('photo-gallery__indicator--active', isActive);
    indicator.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

function handlePhotoNavigationClick(photoButton) {
  const galleryElement = photoButton.closest('.photo-gallery');
  const photoTrack = galleryElement.querySelector('.photo-gallery__track');
  const requestedIndex = photoButton.dataset.photoIndex !== undefined
    ? Number(photoButton.dataset.photoIndex)
    : getPhotoIndex(photoTrack) + Number(photoButton.dataset.photoStep);
  scrollToPhoto(galleryElement, requestedIndex);
}

function handlePhotoKeydown(event) {
  if (!event.target.matches('.photo-gallery--multiple .photo-gallery__track')) return;
  const photoTrack = event.target;
  const currentPhotoIndex = getPhotoIndex(photoTrack);
  const keyTargets = {
    ArrowLeft: currentPhotoIndex - 1, ArrowRight: currentPhotoIndex + 1,
    Home: 0, End: photoTrack.children.length - 1
  };
  if (keyTargets[event.key] === undefined) return;
  event.preventDefault();
  scrollToPhoto(photoTrack.closest('.photo-gallery'), keyTargets[event.key]);
}

function startPhotoDrag(event) {
  const photoTrack = event.target.closest('.photo-gallery--multiple .photo-gallery__track');
  if (!photoTrack || event.pointerType !== 'mouse' || event.button !== 0) return;
  photoDragState = {
    track: photoTrack, startX: event.clientX,
    initialIndex: getPhotoIndex(photoTrack), initialScrollLeft: photoTrack.scrollLeft
  };
  photoTrack.setPointerCapture(event.pointerId);
  photoTrack.classList.add('photo-gallery__track--dragging');
  event.preventDefault();
}

function movePhotoDrag(event) {
  if (!photoDragState) return;
  photoDragState.track.scrollLeft = photoDragState.initialScrollLeft + photoDragState.startX - event.clientX;
}

/** Короткое движение возвращает фото на место; отменённый жест не меняет слайд. */
function finishPhotoDrag(event) {
  if (!photoDragState) return;
  const { track, startX, initialIndex } = photoDragState;
  const distance = startX - event.clientX;
  const threshold = Math.min(60, track.clientWidth * 0.2);
  const photoStep = event.type !== 'pointercancel' && Math.abs(distance) > threshold ? Math.sign(distance) : 0;
  track.classList.remove('photo-gallery__track--dragging');
  scrollToPhoto(track.closest('.photo-gallery'), initialIndex + photoStep);
  photoDragState = null;
}

function restorePhotoPositions() {
  document.querySelectorAll('.photo-gallery--multiple').forEach(galleryElement => {
    const photoTrack = galleryElement.querySelector('.photo-gallery__track');
    const activeIndicator = galleryElement.querySelector('[aria-current="true"]');
    if (!photoTrack.clientWidth || !activeIndicator) return;
    photoTrack.scrollTo({ left: Number(activeIndicator.dataset.photoIndex) * photoTrack.clientWidth, behavior: 'instant' });
    updatePhotoNavigation(galleryElement);
  });
}


function handleGalleryScroll(event) {
  if (event.target.classList?.contains('photo-gallery__track')) {
    updatePhotoNavigation(event.target.closest('.photo-gallery'));
  }
}


/** Общая галерея назначает обработчики один раз на каждой странице. */
function bindPhotoGalleryEvents() {
  document.addEventListener('click', event => {
    const photoButton = event.target.closest('[data-photo-step], [data-photo-index]');
    if (photoButton) handlePhotoNavigationClick(photoButton);
  });
  // scroll не всплывает, поэтому используем capture для динамических галерей.
  document.addEventListener('scroll', handleGalleryScroll, true);
  document.addEventListener('keydown', handlePhotoKeydown);
  document.addEventListener('pointerdown', startPhotoDrag);
  document.addEventListener('pointermove', movePhotoDrag);
  document.addEventListener('pointerup', finishPhotoDrag);
  document.addEventListener('pointercancel', finishPhotoDrag);
  window.addEventListener('resize', restorePhotoPositions);
}
