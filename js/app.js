const PER_PAGE = 9;
const $ = s => document.querySelector(s);
const fmt = n => n.toLocaleString('ru-RU');
const uniq = key => [...new Set(CARS.map(c => c[key]))];
const PRICE_MAX = Math.ceil(Math.max(...CARS.map(c => c.priceRb)) / 1000) * 1000;
const KM_MAX = Math.ceil(Math.max(...CARS.map(c => c.mileage)) / 10000) * 10000;

// Опции фильтров собираются из данных
const OPTIONS = {
  brands:    uniq('brand').sort(),
  fuels:     ['Бензин', 'Дизель', 'Электро', 'Гибрид', 'Газ'],
  drives:    ['Передний', 'Полный', 'Задний'],
  gearboxes: ['Механика', 'Автомат', 'Робот'],
  years:     uniq('year').sort((a, b) => b - a)
};
const OFFERS = [{ v: 'hit', label: 'Хит заказов' }, { v: 'top', label: 'Топовые предложения' }];

const initial = () => ({
  priceMin: 0, priceMax: PRICE_MAX, kmMin: 0, kmMax: KM_MAX,
  offers: new Set(), brands: new Set(), fuels: new Set(), drives: new Set(), gearboxes: new Set(), years: new Set(),
  cat: null, sort: 'price-asc', page: 1, view: 'grid'
});
let state = initial();

/* ---------- фильтрация и сортировка ---------- */
const inSet = (set, v) => !set.size || set.has(v);

function getFiltered() {
  const s = state, cat = CATS.find(c => c.name === s.cat);
  const list = CARS.filter(c =>
    c.priceRb >= s.priceMin && c.priceRb <= s.priceMax &&
    c.mileage >= s.kmMin && c.mileage <= s.kmMax &&
    (!s.offers.size || c.tags.some(t => s.offers.has(t))) &&
    inSet(s.brands, c.brand) && inSet(s.fuels, c.fuel) && inSet(s.drives, c.drive) &&
    inSet(s.gearboxes, c.gearbox) && inSet(s.years, c.year) &&
    (!cat || cat.test(c))
  );
  const by = {
    'price-asc': (a, b) => a.priceRb - b.priceRb,
    'price-desc': (a, b) => b.priceRb - a.priceRb,
    'year-desc': (a, b) => b.year - a.year,
    'mileage-asc': (a, b) => a.mileage - b.mileage
  }[s.sort];
  return list.sort(by);
}

/* ---------- рендер ---------- */
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 332 260"><rect width="332" height="260" fill="#232323"/>' +
  '<path d="M60 160l22-40c4-8 10-12 20-12h128c10 0 16 4 22 12l20 40v30H60z" fill="#3a3a3a"/>' +
  '<circle cx="104" cy="192" r="18" fill="#111"/><circle cx="228" cy="192" r="18" fill="#111"/></svg>');
const CAT_SVG = '<svg viewBox="0 0 200 80"><path d="M10 56l14-26c3-5 6-8 13-8h82c7 0 11 3 15 8l13 26v14H10z" fill="#fff"/><circle cx="46" cy="70" r="10" fill="#161616"/><circle cx="144" cy="70" r="10" fill="#161616"/></svg>';

function card(c) {
  const byn = fmt(Math.round(c.priceRb * RATE / 100) * 100);
  return `<article class="card">
    <div class="card-img"><img src="${c.img || PLACEHOLDER}" alt="${c.brand} ${c.model}" loading="lazy"><span class="badge">Под заказ</span></div>
    <div><div class="dashes"><i></i><i></i><i></i><i></i></div>
    <div class="card-body">
      <h3>${c.brand} ${c.model}<small>${c.trim}</small></h3>
      <ul class="spec">
        <li><span>Год:</span><i></i><b>${c.year}</b></li>
        <li><span>Пробег:</span><i></i><b>${fmt(c.mileage)} км</b></li>
        <li><span>Коробка:</span><i></i><b>${c.gearbox.toLowerCase()}</b></li>
        <li><span>Топливо:</span><i></i><b>${c.fuel.toLowerCase()}</b></li>
        <li><span>Привод / Мощность:</span><i></i><b>${c.drive === 'Полный' ? '4WD' : c.drive === 'Задний' ? 'RWD' : 'FWD'} / ${c.power} л.с.</b></li>
        <li><span>Цена в Корее:</span><i></i><b>${fmt(c.priceKr)} $</b></li>
      </ul></div></div>
    <div class="price"><span>Цена в РБ:</span><span><b>${fmt(c.priceRb)} $</b> / ${byn} BYN</span></div>
  </article>`;
}

const checks = (name, items) => items.map(i => {
  const v = i.v ?? i, label = i.label ?? i;
  return `<label class="chk"><input type="checkbox" data-set="${name}" value="${v}" ${state[name].has(String(v)) || state[name].has(v) ? 'checked' : ''}>${label}</label>`;
}).join('');

function renderFilter() {
  const s = state;
  $('#filter').innerHTML = `
    <div class="f-block"><h3>Стоимость, $</h3>
      <div class="range-row"><input type="number" id="priceMin" value="${s.priceMin}"><input type="number" id="priceMax" value="${s.priceMax}"></div>
      <div class="dual"><div class="fill" id="priceFill"></div>
        <input type="range" id="priceMinR" min="0" max="${PRICE_MAX}" step="100" value="${s.priceMin}">
        <input type="range" id="priceMaxR" min="0" max="${PRICE_MAX}" step="100" value="${s.priceMax}"></div></div>
    <div class="f-block"><h3>Предложения</h3><div class="f-list">${checks('offers', OFFERS)}</div></div>
    <div class="f-block"><h3>Марка авто</h3><div class="f-list scroll">${checks('brands', OPTIONS.brands)}</div></div>
    <div class="f-block"><h3>Двигатель</h3><div class="f-list">${checks('fuels', OPTIONS.fuels)}</div></div>
    <div class="f-block"><h3>Привод</h3><div class="f-list">${checks('drives', OPTIONS.drives)}</div></div>
    <div class="f-block"><h3>Коробка</h3><div class="f-list">${checks('gearboxes', OPTIONS.gearboxes)}</div></div>
    <div class="f-block"><h3>Пробег, км</h3>
      <div class="range-row"><input type="number" id="kmMin" value="${s.kmMin}"><input type="number" id="kmMax" value="${s.kmMax}"></div></div>
    <div class="f-block"><h3>Год</h3><div class="f-list scroll">${checks('years', OPTIONS.years)}</div></div>
    <button class="clear" id="clear">очистить фильтр</button>`;
  updateFill();
}

function updateFill() {
  const f = $('#priceFill'); if (!f) return;
  f.style.left = (state.priceMin / PRICE_MAX * 100) + '%';
  f.style.right = (100 - state.priceMax / PRICE_MAX * 100) + '%';
}

function renderCats() {
  $('#cats').innerHTML = CATS.map(c =>
    `<div class="cat ${state.cat === c.name ? 'is-on' : ''}" data-cat="${c.name}">${CAT_SVG}<span>${c.name}</span></div>`).join('');
}

function pageList(total, cur) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const p = new Set([1, cur - 1, cur, cur + 1, total].filter(n => n >= 1 && n <= total));
  const out = []; let prev = 0;
  [...p].sort((a, b) => a - b).forEach(n => { if (n - prev > 1) out.push('…'); out.push(n); prev = n; });
  return out;
}

function renderList() {
  const list = getFiltered(), pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  state.page = Math.min(state.page, pages);
  const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
  $('#found').textContent = fmt(list.length);
  $('#grid').className = 'grid' + (state.view === 'list' ? ' list' : '');
  $('#grid').innerHTML = slice.length ? slice.map(card).join('')
    : '<div class="empty">По выбранным параметрам ничего не найдено. Измените фильтр или очистите его.</div>';
  $('#pager').innerHTML = pages < 2 ? '' :
    pageList(pages, state.page).map(n => n === '…' ? '<span>…</span>' : `<button data-page="${n}" class="${n === state.page ? 'is-on' : ''}">${n}</button>`).join('') +
    `<button class="next" data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''}>›</button>`;
}

/* ---------- события ---------- */
const reset = () => { state = initial(); renderAll(); };
function renderAll() { renderCats(); renderFilter(); renderList(); $('#sort').value = state.sort; }
const touch = () => { state.page = 1; renderList(); };

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.set) {
    const v = isNaN(t.value) ? t.value : (t.dataset.set === 'years' ? +t.value : t.value);
    t.checked ? state[t.dataset.set].add(v) : state[t.dataset.set].delete(v);
    touch();
  }
  if (t.id === 'sort') { state.sort = t.value; touch(); }
});

document.addEventListener('input', e => {
  const id = e.target.id, v = +e.target.value || 0;
  const map = { priceMin: 'priceMin', priceMinR: 'priceMin', priceMax: 'priceMax', priceMaxR: 'priceMax', kmMin: 'kmMin', kmMax: 'kmMax' };
  if (!map[id]) return;
  state[map[id]] = v;
  if (state.priceMin > state.priceMax) { if (map[id] === 'priceMin') state.priceMin = state.priceMax; else state.priceMax = state.priceMin; }
  if (id.startsWith('price')) {
    ['priceMin', 'priceMax'].forEach(k => { $('#' + k).value = state[k]; $('#' + k + 'R').value = state[k]; });
    updateFill();
  }
  touch();
});

document.addEventListener('click', e => {
  const cat = e.target.closest('[data-cat]');
  if (cat) { state.cat = state.cat === cat.dataset.cat ? null : cat.dataset.cat; renderCats(); touch(); return; }
  const pg = e.target.closest('[data-page]');
  if (pg && !pg.disabled) { state.page = +pg.dataset.page; renderList(); $('#grid').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  const view = e.target.closest('[data-view]');
  if (view) {
    state.view = view.dataset.view;
    document.querySelectorAll('.view').forEach(b => b.classList.toggle('is-on', b === view));
    renderList(); return;
  }
  if (e.target.id === 'clear') reset();
});

renderAll();
