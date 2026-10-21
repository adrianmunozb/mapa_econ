export { CHOKEPOINTS, type MaritimeChokepoint } from './chokepoints';

export interface SubmarineCable {
  id: string;
  name: string;
  lengthKm: number;
  owners: string;
  points: [number, number][]; // LineString coords [lon, lat]
}

/** Principales cables submarinos transoceánicos para la capa de telecomunicaciones */
export const SUBMARINE_CABLES: SubmarineCable[] = [
  {
    id: 'marea',
    name: 'MAREA (Bilbao - Virginia Beach)',
    lengthKm: 6605,
    owners: 'Microsoft, Meta, Telxius',
    points: [
      [-2.95, 43.34],
      [-15.0, 41.0],
      [-35.0, 39.5],
      [-55.0, 38.0],
      [-75.97, 36.85],
    ],
  },
  {
    id: 'dunant',
    name: 'Dunant (Francia - EE.UU.)',
    lengthKm: 6400,
    owners: 'Google',
    points: [
      [-1.2, 46.7],
      [-20.0, 45.0],
      [-45.0, 42.0],
      [-65.0, 39.0],
      [-75.0, 38.8],
    ],
  },
  {
    id: 'grace_hopper',
    name: 'Grace Hopper (Reino Unido / España - EE.UU.)',
    lengthKm: 6250,
    owners: 'Google',
    points: [
      [-5.05, 50.15],
      [-8.5, 43.5],
      [-30.0, 42.0],
      [-55.0, 41.0],
      [-74.0, 40.4],
    ],
  },
  {
    id: 'two_africa',
    name: '2Africa (Circunnavegación África - Europa)',
    lengthKm: 45000,
    owners: 'Meta, Vodafone, Orange, China Mobile',
    points: [
      [-5.6, 36.1],
      [-9.3, 38.7],
      [-17.4, 14.7],
      [-13.6, 9.5],
      [-0.2, 5.5],
      [3.4, 6.4],
      [9.4, 0.4],
      [13.2, -8.8],
      [18.4, -33.9],
      [31.0, -29.8],
      [39.7, -4.0],
      [45.3, 2.0],
      [43.1, 12.6],
      [32.5, 29.9],
      [32.3, 31.2],
      [14.5, 35.9],
      [5.4, 43.3],
    ],
  },
  {
    id: 'aae1',
    name: 'AAE-1 (Asia-África-Europa 1)',
    lengthKm: 25000,
    owners: 'China Unicom, Telecom Egypt, PCCW, Ooredoo',
    points: [
      [114.2, 22.3],
      [106.8, 10.8],
      [103.8, 1.3],
      [100.1, 5.4],
      [80.2, 13.0],
      [72.8, 18.9],
      [58.5, 23.6],
      [43.1, 12.6],
      [32.5, 29.9],
      [32.3, 31.2],
      [23.7, 37.9],
      [14.5, 35.9],
      [5.4, 43.3],
    ],
  },
  {
    id: 'seamewe3',
    name: 'SEA-ME-WE 3 (Europa - Sudeste Asiático - Australia)',
    lengthKm: 39000,
    owners: 'Consorcio Internacional (Orange, Singtel, etc.)',
    points: [
      [-4.5, 48.4],
      [-9.2, 38.7],
      [-5.6, 36.0],
      [14.5, 35.9],
      [32.3, 31.2],
      [32.5, 29.9],
      [43.1, 12.6],
      [58.5, 23.6],
      [72.8, 18.9],
      [80.2, 13.0],
      [98.3, 7.9],
      [103.8, 1.3],
      [115.1, -8.7],
      [115.7, -31.9],
    ],
  },
  {
    id: 'ellalink',
    name: 'EllaLink (Sines/Madrid - Fortaleza/São Paulo)',
    lengthKm: 9300,
    owners: 'EllaLink Group',
    points: [
      [-8.87, 37.95],
      [-17.0, 28.0],
      [-25.0, 15.0],
      [-38.5, -3.7],
      [-46.6, -23.5],
    ],
  },
  {
    id: 'monet',
    name: 'Monet (Florida - Fortaleza - Santos)',
    lengthKm: 10556,
    owners: 'Google, Antel, Algar Telecom, Angola Cables',
    points: [
      [-80.1, 26.3],
      [-65.0, 20.0],
      [-48.0, 0.0],
      [-38.5, -3.7],
      [-46.3, -23.9],
    ],
  },
  {
    id: 'curie',
    name: 'Curie (California - Panamá - Valparaíso)',
    lengthKm: 10500,
    owners: 'Google',
    points: [
      [-118.2, 33.7],
      [-105.0, 18.0],
      [-79.5, 8.9],
      [-75.0, -10.0],
      [-71.6, -33.0],
    ],
  },
  {
    id: 'peace',
    name: 'PEACE Cable (Pakistán - Kenia - Egipto - Francia)',
    lengthKm: 15000,
    owners: 'PCCW Global, Hengtong',
    points: [
      [5.4, 43.3],
      [18.0, 34.0],
      [32.3, 31.2],
      [43.1, 12.6],
      [39.7, -4.0],
      [66.9, 24.8],
    ],
  },
  // Transpacífico Segmento Este (hacia el borde este del mapa)
  {
    id: 'faster_east',
    name: 'FASTER Transpacific (Oregón ➔ Pacífico Oeste)',
    lengthKm: 6000,
    owners: 'Google, China Mobile, KDDI, Singtel',
    points: [
      [-124.0, 45.6],
      [-145.0, 43.0],
      [-165.0, 41.5],
      [-179.99, 40.5],
    ],
  },
  // Transpacífico Segmento Oeste (desde el borde oeste del mapa hacia Japón y Taiwán)
  {
    id: 'faster_west',
    name: 'FASTER Transpacific (Pacífico Este ➔ Japón / Asia)',
    lengthKm: 5629,
    owners: 'Google, China Mobile, KDDI, Singtel',
    points: [
      [179.99, 40.5],
      [160.0, 38.5],
      [141.0, 35.7],
      [121.5, 25.0],
    ],
  },
  // Trans-Pacific Express Segmento Este
  {
    id: 'tpe_east',
    name: 'TPE Trans-Pacific (California ➔ Pacífico)',
    lengthKm: 9000,
    owners: 'AT&T, China Telecom, Verizon',
    points: [
      [-123.9, 38.9],
      [-150.0, 35.0],
      [-170.0, 32.5],
      [-179.99, 31.0],
    ],
  },
  // Trans-Pacific Express Segmento Oeste
  {
    id: 'tpe_west',
    name: 'TPE Trans-Pacific (Pacífico ➔ Shanghái / Seúl)',
    lengthKm: 9000,
    owners: 'AT&T, China Telecom, Verizon',
    points: [
      [179.99, 31.0],
      [155.0, 32.0],
      [139.7, 35.4],
      [129.0, 35.1],
      [121.5, 31.4],
    ],
  },
];
