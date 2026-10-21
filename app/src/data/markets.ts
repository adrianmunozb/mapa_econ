export interface StockMarket {
  id: string;
  name: string;
  shortName: string;
  city: string;
  countryIso3: string;
  flag: string;
  coordinates: [number, number]; // [lon, lat]
  timezone: string;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  currency: string;
  indexName: string;
}

export const MAJOR_MARKETS: StockMarket[] = [
  {
    id: 'tse',
    name: 'Tokyo Stock Exchange',
    shortName: 'TSE',
    city: 'Tokyo',
    countryIso3: 'JPN',
    flag: '🇯🇵',
    coordinates: [139.7745, 35.6812],
    timezone: 'Asia/Tokyo',
    openTime: '09:00',
    closeTime: '15:30',
    currency: 'JPY',
    indexName: 'Nikkei 225',
  },
  {
    id: 'sse',
    name: 'Shanghai Stock Exchange',
    shortName: 'SSE',
    city: 'Shanghai',
    countryIso3: 'CHN',
    flag: '🇨🇳',
    coordinates: [121.5057, 31.2386],
    timezone: 'Asia/Shanghai',
    openTime: '09:30',
    closeTime: '15:00',
    currency: 'CNY',
    indexName: 'SSE Composite',
  },
  {
    id: 'hkex',
    name: 'Hong Kong Exchanges',
    shortName: 'HKEX',
    city: 'Hong Kong',
    countryIso3: 'HKG',
    flag: '🇭🇰',
    coordinates: [114.1588, 22.2849],
    timezone: 'Asia/Hong_Kong',
    openTime: '09:30',
    closeTime: '16:00',
    currency: 'HKD',
    indexName: 'Hang Seng',
  },
  {
    id: 'lse',
    name: 'London Stock Exchange',
    shortName: 'LSE',
    city: 'London',
    countryIso3: 'GBR',
    flag: '🇬🇧',
    coordinates: [-0.0989, 51.5154],
    timezone: 'Europe/London',
    openTime: '08:00',
    closeTime: '16:30',
    currency: 'GBP',
    indexName: 'FTSE 100',
  },
  {
    id: 'xetra',
    name: 'Frankfurt Stock Exchange (Xetra)',
    shortName: 'FWB',
    city: 'Frankfurt',
    countryIso3: 'DEU',
    flag: '🇩🇪',
    coordinates: [8.6755, 50.1153],
    timezone: 'Europe/Berlin',
    openTime: '09:00',
    closeTime: '17:30',
    currency: 'EUR',
    indexName: 'DAX 40',
  },
  {
    id: 'bme',
    name: 'Bolsa de Madrid (BME)',
    shortName: 'BME',
    city: 'Madrid',
    countryIso3: 'ESP',
    flag: '🇪🇸',
    coordinates: [-3.6917, 40.4172],
    timezone: 'Europe/Madrid',
    openTime: '09:00',
    closeTime: '17:30',
    currency: 'EUR',
    indexName: 'IBEX 35',
  },
  {
    id: 'nyse',
    name: 'New York Stock Exchange / NASDAQ',
    shortName: 'NYSE',
    city: 'New York',
    countryIso3: 'USA',
    flag: '🇺🇸',
    coordinates: [-74.009, 40.7069],
    timezone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    currency: 'USD',
    indexName: 'S&P 500 / NASDAQ',
  },
  {
    id: 'tsx',
    name: 'Toronto Stock Exchange',
    shortName: 'TSX',
    city: 'Toronto',
    countryIso3: 'CAN',
    flag: '🇨🇦',
    coordinates: [-79.3811, 43.6481],
    timezone: 'America/Toronto',
    openTime: '09:30',
    closeTime: '16:00',
    currency: 'CAD',
    indexName: 'S&P/TSX',
  },
  {
    id: 'b3',
    name: 'B3 Brasil Bolsa Balcão',
    shortName: 'B3',
    city: 'São Paulo',
    countryIso3: 'BRA',
    flag: '🇧🇷',
    coordinates: [-46.6356, -23.5484],
    timezone: 'America/Sao_Paulo',
    openTime: '10:00',
    closeTime: '17:55',
    currency: 'BRL',
    indexName: 'Ibovespa',
  },
  {
    id: 'asx',
    name: 'Australian Securities Exchange',
    shortName: 'ASX',
    city: 'Sydney',
    countryIso3: 'AUS',
    flag: '🇦🇺',
    coordinates: [151.2093, -33.8688],
    timezone: 'Australia/Sydney',
    openTime: '10:00',
    closeTime: '16:00',
    currency: 'AUD',
    indexName: 'S&P/ASX 200',
  },
  {
    id: 'bse',
    name: 'Bombay Stock Exchange',
    shortName: 'BSE',
    city: 'Mumbai',
    countryIso3: 'IND',
    flag: '🇮🇳',
    coordinates: [72.8335, 18.9298],
    timezone: 'Asia/Kolkata',
    openTime: '09:15',
    closeTime: '15:30',
    currency: 'INR',
    indexName: 'BSE SENSEX',
  },
];

export interface MarketStatus {
  isOpen: boolean;
  localTimeStr: string;
  statusText: string;
  isWeekend: boolean;
}

// Reuse expensive Intl formatters, never timestamp-dependent results. Bound the
// cache even if callers supply additional timezones in future datasets.
const formatters = new Map<string, Intl.DateTimeFormat>();
function cachedFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify([locale, options]);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    if (formatters.size >= 64) formatters.delete(formatters.keys().next().value!);
    formatters.set(key, formatter);
  }
  return formatter;
}

/** Determines if a market is currently trading based on its local timezone. */
export function getMarketStatus(market: StockMarket, now: Date = new Date()): MarketStatus {
  try {
    const formatter = cachedFormatter('en-US', {
      timeZone: market.timezone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const weekdayPart = parts.find((p) => p.type === 'weekday')?.value;
    const hourPart = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minutePart = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

    const isWeekend = weekdayPart === 'Sat' || weekdayPart === 'Sun';

    const [openH, openM] = market.openTime.split(':').map(Number);
    const [closeH, closeM] = market.closeTime.split(':').map(Number);

    const currentMins = hourPart * 60 + minutePart;
    const openMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;

    const isOpen = !isWeekend && currentMins >= openMins && currentMins < closeMins;

    const timeFormatter = cachedFormatter('es-ES', {
      timeZone: market.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const localTimeStr = timeFormatter.format(now);

    let statusText = 'Cerrado';
    if (isOpen) {
      statusText = 'Abierto';
    } else if (isWeekend) {
      statusText = 'Fin de semana';
    } else if (currentMins < openMins) {
      statusText = `Abre ${market.openTime}`;
    } else {
      statusText = `Cerró ${market.closeTime}`;
    }

    return {
      isOpen,
      localTimeStr,
      statusText,
      isWeekend,
    };
  } catch {
    return {
      isOpen: false,
      localTimeStr: '--:--',
      statusText: 'Cerrado',
      isWeekend: false,
    };
  }
}

/** Get country's local time given its primary IANA timezone or ISO3 */
const ISO3_TIMEZONE_MAP: Record<string, { tz: string; capital: string; market?: StockMarket }> = {
  ESP: { tz: 'Europe/Madrid', capital: 'Madrid' },
  USA: { tz: 'America/New_York', capital: 'Washington / NY' },
  GBR: { tz: 'Europe/London', capital: 'Londres' },
  DEU: { tz: 'Europe/Berlin', capital: 'Berlín' },
  FRA: { tz: 'Europe/Paris', capital: 'París' },
  ITA: { tz: 'Europe/Rome', capital: 'Roma' },
  CHN: { tz: 'Asia/Shanghai', capital: 'Pekín' },
  JPN: { tz: 'Asia/Tokyo', capital: 'Tokio' },
  IND: { tz: 'Asia/Kolkata', capital: 'Nueva Delhi' },
  BRA: { tz: 'America/Sao_Paulo', capital: 'Brasilia' },
  CAN: { tz: 'America/Toronto', capital: 'Ottawa' },
  AUS: { tz: 'Australia/Sydney', capital: 'Canberra' },
  RUS: { tz: 'Europe/Moscow', capital: 'Moscú' },
  MEX: { tz: 'America/Mexico_City', capital: 'Ciudad de México' },
  KOR: { tz: 'Asia/Seoul', capital: 'Seúl' },
  ARG: { tz: 'America/Argentina/Buenos_Aires', capital: 'Buenos Aires' },
  ZAF: { tz: 'Africa/Johannesburg', capital: 'Pretoria' },
  SAU: { tz: 'Asia/Riyadh', capital: 'Riad' },
  TUR: { tz: 'Europe/Istanbul', capital: 'Ankara' },
  CHE: { tz: 'Europe/Zurich', capital: 'Berna' },
  SWE: { tz: 'Europe/Stockholm', capital: 'Estocolmo' },
  NLD: { tz: 'Europe/Amsterdam', capital: 'Ámsterdam' },
  POL: { tz: 'Europe/Warsaw', capital: 'Varsovia' },
  SGP: { tz: 'Asia/Singapore', capital: 'Singapur' },
  NOR: { tz: 'Europe/Oslo', capital: 'Oslo' },
  DNK: { tz: 'Europe/Copenhagen', capital: 'Copenhague' },
  COL: { tz: 'America/Bogota', capital: 'Bogotá' },
  CHL: { tz: 'America/Santiago', capital: 'Santiago' },
  PER: { tz: 'America/Lima', capital: 'Lima' },
  IDN: { tz: 'Asia/Jakarta', capital: 'Yakarta' },
  EGY: { tz: 'Africa/Cairo', capital: 'El Cairo' },
  NGA: { tz: 'Africa/Lagos', capital: 'Abuya' },
};

export function getCountryTimeInfo(iso3: string, now: Date = new Date()) {
  const info = ISO3_TIMEZONE_MAP[iso3];
  if (!info) return null;

  try {
    const formatter = cachedFormatter('es-ES', {
      timeZone: info.tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour12: false,
    });
    const localTime = formatter.format(now);
    const market = MAJOR_MARKETS.find((m) => m.countryIso3 === iso3);
    const marketStatus = market ? getMarketStatus(market, now) : null;

    return {
      capital: info.capital,
      timezone: info.tz,
      localTime,
      market,
      marketStatus,
    };
  } catch {
    return null;
  }
}
