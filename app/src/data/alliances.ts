export interface Alliance {
  id: string;
  name: string;
  color: string;
  kind: string;
  members: string[];
  source: string;
  note: string;
}

export const ALLIANCE_REVIEWED = '20/10/2026';
export const ALLIANCES: Alliance[] = [
  {
    id: 'nato', name: 'OTAN', color: '#5da9ff', kind: 'Defensa colectiva',
    members: 'ALB BEL BGR CAN HRV CZE DNK EST FIN FRA DEU GRC HUN ISL ITA LVA LTU LUX MNE NLD MKD NOR POL PRT ROU SVK SVN ESP SWE TUR GBR USA'.split(' '),
    source: 'https://www.nato.int/cps/en/natohq/topics_52044.htm',
    note: '32 miembros, incluidas Finlandia y Suecia. No incluye socios ni candidatos.',
  },
  {
    id: 'brics', name: 'BRICS', color: '#f1a958', kind: 'Cooperación política y económica',
    members: 'BRA RUS IND CHN ZAF EGY ETH IRN ARE IDN SAU'.split(' '),
    source: 'https://brics.br/en/news/brics-summit-will-be-held-in-rio-de-janeiro-on-july-6-7',
    note: '11 países según la presidencia brasileña, incluida Arabia Saudí. No incluye países socios; el estatus saudí ha recibido interpretaciones distintas.',
  },
  {
    id: 'eu', name: 'UE', color: '#8c8dff', kind: 'Unión política y económica',
    members: 'AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE'.split(' '),
    source: 'https://european-union.europa.eu/principles-countries-history/eu-countries_en',
    note: '27 Estados miembros. Reino Unido y países candidatos no incluidos.',
  },
  {
    id: 'g7', name: 'G7', color: '#5ddbb5', kind: 'Foro económico',
    members: 'CAN FRA DEU ITA JPN GBR USA'.split(' '),
    source: 'https://www.international.gc.ca/world-monde/international_relations-relations_internationales/g7/index.aspx?lang=eng',
    note: '7 países. La UE también participa en el G7; esa representación no convierte a sus 27 Estados en miembros nacionales del foro.',
  },
  {
    id: 'asean', name: 'ASEAN', color: '#eb8bb7', kind: 'Asociación regional',
    members: 'BRN KHM IDN LAO MYS MMR PHL SGP THA VNM TLS'.split(' '),
    source: 'https://asean.org/secretary-general-of-asean-holds-a-pull-aside-meeting-with-the-minister-of-transports-and-communication-of-timor-leste/',
    note: '11 miembros. Timor-Leste se incorporó el 26 de octubre de 2025.',
  },
];

export function countryAlliances(iso3: string): Alliance[] {
  return ALLIANCES.filter((alliance) => alliance.members.includes(iso3));
}

export function allianceColors(selected: string[]): unknown {
  const active = ALLIANCES.filter((alliance) => selected.includes(alliance.id));
  if (!active.length) return '#253340';
  const checks = active.map((alliance) => ['in', ['get', 'iso3'], ['literal', alliance.members]]);
  const expression: unknown[] = ['case'];
  if (checks.length > 1) {
    expression.push(['>', ['+', ...checks.map((check) => ['case', check, 1, 0])], 1], '#e8d5a4');
  }
  active.forEach((alliance, index) => expression.push(checks[index], alliance.color));
  expression.push('#253340');
  return expression;
}
