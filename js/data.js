// Моковые данные. Цены в $, BYN считается по курсу.
const RATE = 3.25;
const PREMIUM = ['Audi', 'BMW', 'Bentley', 'Cadillac', 'Genesis'];

// tags: 'hit' — «Хит заказов», 'top' — «Топовые предложения»
const CARS = [
  { id: 1,  brand: 'Hyundai',   model: 'Santa Fe',   trim: 'Prestige 2.2D 4WD', year: 2022, mileage: 42000,  fuel: 'Дизель',  drive: 'Полный',    power: 202, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 18900, priceRb: 28900, tags: ['hit'] },
  { id: 2,  brand: 'Kia',       model: 'Sportage',   trim: 'Prestige 2.0D AWD', year: 2023, mileage: 21000,  fuel: 'Дизель',  drive: 'Полный',    power: 186, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 20400, priceRb: 31200, tags: [] },
  { id: 3,  brand: 'Audi',      model: 'A6',         trim: '45 TFSI quattro',   year: 2021, mileage: 58000,  fuel: 'Бензин',  drive: 'Полный',    power: 245, gearbox: 'Робот',    body: 'Седаны',     priceKr: 27800, priceRb: 40100, tags: ['top'] },
  { id: 4,  brand: 'BMW',       model: '520d',       trim: 'xDrive Luxury',     year: 2022, mileage: 36000,  fuel: 'Дизель',  drive: 'Полный',    power: 190, gearbox: 'Автомат',  body: 'Седаны',     priceKr: 31500, priceRb: 45300, tags: ['top', 'hit'] },
  { id: 5,  brand: 'Cadillac',  model: 'XT5',        trim: 'Premium Luxury',    year: 2019, mileage: 74000,  fuel: 'Бензин',  drive: 'Полный',    power: 310, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 19900, priceRb: 30100, tags: [] },
  { id: 6,  brand: 'Chevrolet', model: 'Bolt EUV',   trim: 'Premier',           year: 2022, mileage: 29000,  fuel: 'Электро', drive: 'Передний',  power: 200, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 16200, priceRb: 25400, tags: ['hit'] },
  { id: 7,  brand: 'Citroen',   model: 'C5 Aircross',trim: 'Shine 1.5D',        year: 2020, mileage: 64000,  fuel: 'Дизель',  drive: 'Передний',  power: 130, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 13600, priceRb: 21800, tags: [] },
  { id: 8,  brand: 'Dodge',     model: 'Challenger', trim: 'R/T 5.7',           year: 2018, mileage: 83000,  fuel: 'Бензин',  drive: 'Задний',    power: 375, gearbox: 'Автомат',  body: 'Купе',       priceKr: 22700, priceRb: 34600, tags: [] },
  { id: 9,  brand: 'Dongfeng',  model: 'Aeolus E70', trim: 'Comfort',           year: 2021, mileage: 47000,  fuel: 'Электро', drive: 'Передний',  power: 163, gearbox: 'Автомат',  body: 'Седаны',     priceKr: 8800,  priceRb: 15200, tags: [] },
  { id: 10, brand: 'Bentley',   model: 'Continental GT', trim: 'V8',            year: 2020, mileage: 31000,  fuel: 'Бензин',  drive: 'Полный',    power: 550, gearbox: 'Робот',    body: 'Купе',       priceKr: 148000, priceRb: 189000, tags: ['top'] },
  { id: 11, brand: 'Hyundai',   model: 'Sonata',     trim: 'Premium 2.5',       year: 2023, mileage: 12000,  fuel: 'Газ',     drive: 'Передний',  power: 180, gearbox: 'Автомат',  body: 'Седаны',     priceKr: 16800, priceRb: 26300, tags: ['hit'] },
  { id: 12, brand: 'Kia',       model: 'Carnival',   trim: 'Prestige 2.2D',     year: 2022, mileage: 39000,  fuel: 'Дизель',  drive: 'Передний',  power: 202, gearbox: 'Автомат',  body: 'Минивены',   priceKr: 24100, priceRb: 36000, tags: ['hit'] },
  { id: 13, brand: 'Genesis',   model: 'G80',        trim: '2.5T AWD',          year: 2021, mileage: 45000,  fuel: 'Бензин',  drive: 'Полный',    power: 304, gearbox: 'Автомат',  body: 'Седаны',     priceKr: 29900, priceRb: 43200, tags: ['top'] },
  { id: 14, brand: 'Hyundai',   model: 'Ioniq 5',    trim: 'Long Range AWD',   year: 2023, mileage: 18000,  fuel: 'Электро', drive: 'Полный',    power: 325, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 27300, priceRb: 39700, tags: ['hit'] },
  { id: 15, brand: 'Kia',       model: 'K5',         trim: 'Prestige 2.0 Hybrid', year: 2022, mileage: 33000, fuel: 'Гибрид', drive: 'Передний',  power: 152, gearbox: 'Автомат',  body: 'Седаны',     priceKr: 15900, priceRb: 25100, tags: [] },
  { id: 16, brand: 'Audi',      model: 'Q5',         trim: '40 TDI quattro',    year: 2020, mileage: 69000,  fuel: 'Дизель',  drive: 'Полный',    power: 190, gearbox: 'Робот',    body: 'Кроссоверы', priceKr: 25200, priceRb: 37400, tags: [] },
  { id: 17, brand: 'BMW',       model: '430i',       trim: 'Gran Coupe',        year: 2021, mileage: 41000,  fuel: 'Бензин',  drive: 'Задний',    power: 258, gearbox: 'Автомат',  body: 'Купе',       priceKr: 28600, priceRb: 41500, tags: [] },
  { id: 18, brand: 'Hyundai',   model: 'Staria',     trim: 'Lounge 2.2D',       year: 2022, mileage: 27000,  fuel: 'Дизель',  drive: 'Передний',  power: 177, gearbox: 'Автомат',  body: 'Минивены',   priceKr: 26400, priceRb: 38900, tags: ['top'] },
  { id: 19, brand: 'Chevrolet', model: 'Trax',       trim: 'Premier 1.4T',      year: 2019, mileage: 71000,  fuel: 'Бензин',  drive: 'Передний',  power: 140, gearbox: 'Механика', body: 'Кроссоверы', priceKr: 7600,  priceRb: 13400, tags: [] },
  { id: 20, brand: 'Cadillac',  model: 'CT5',        trim: 'Sport 2.0T',        year: 2020, mileage: 52000,  fuel: 'Бензин',  drive: 'Задний',    power: 237, gearbox: 'Автомат',  body: 'Седаны',     priceKr: 21800, priceRb: 33000, tags: [] },
  { id: 21, brand: 'Kia',       model: 'Morning',    trim: 'Prestige 1.0',      year: 2018, mileage: 59000,  fuel: 'Бензин',  drive: 'Передний',  power: 76,  gearbox: 'Механика', body: 'Седаны',     priceKr: 4800,  priceRb: 9100,  tags: [] },
  { id: 22, brand: 'Hyundai',   model: 'Tucson',     trim: 'Premium 1.6T Hybrid', year: 2024, mileage: 9000,  fuel: 'Гибрид', drive: 'Полный',    power: 230, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 23500, priceRb: 35300, tags: ['hit'] },
  { id: 23, brand: 'Citroen',   model: 'Berlingo',   trim: 'Feel 1.5D',         year: 2021, mileage: 56000,  fuel: 'Дизель',  drive: 'Передний',  power: 130, gearbox: 'Автомат',  body: 'Минивены',   priceKr: 12900, priceRb: 20700, tags: [] },
  { id: 24, brand: 'Dodge',     model: 'Durango',    trim: 'GT 3.6 AWD',        year: 2019, mileage: 88000,  fuel: 'Бензин',  drive: 'Полный',    power: 295, gearbox: 'Автомат',  body: 'Кроссоверы', priceKr: 20900, priceRb: 31900, tags: [] }
];

// Верхние плитки-категории: фильтр-предикат на каждую
const CATS = [
  { name: 'Седаны',     test: c => c.body === 'Седаны' },
  { name: 'Кроссоверы', test: c => c.body === 'Кроссоверы' },
  { name: 'Минивены',   test: c => c.body === 'Минивены' },
  { name: 'Купе',       test: c => c.body === 'Купе' },
  { name: 'Электро',    test: c => c.fuel === 'Электро' },
  { name: 'Премиум',    test: c => PREMIUM.includes(c.brand) },
  { name: 'До 20 000 $', test: c => c.priceRb <= 20000 }
];
