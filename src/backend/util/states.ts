export const US_STATE_ABBREVS: Record<string, string> = {
  // States
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
  // Territories (Specify treats these as countries, not states)
  // AS: 'American Samoa',
  // GU: 'Guam',
  // MP: 'Nothern Mariana Islands',
  // PR: 'Puerto Rico',
  // VI: 'Virgin Islands',
  // UM: 'Minor Outlying Islands',
  // FM: 'Federated States of Micronesia',
  // MH: 'Marshall Islands',
  // PW: 'Palau'
};

export const CANADA_PROVINCE_ABBREVS: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NT: 'Northwest Territories',
  NS: 'Nova Scotia',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon'
};

export const MEXICAN_STATE_ABBREVS: Record<string, string> = {
  AG: 'Aguascalientes',
  BC: 'Baja California',
  BS: 'Baja California Sur',
  CH: 'Chihuahua',
  CL: 'Colima',
  CM: 'Campeche',
  CO: 'Coahuila',
  CS: 'Chiapas',
  DF: 'Distrito Federal',
  DG: 'Durango',
  GR: 'Guerrero',
  GT: 'Guanajuato',
  HG: 'Hidalgo',
  JA: 'Jalisco',
  ME: 'México',
  MI: 'Michoacán',
  MO: 'Morelos',
  NA: 'Nayarit',
  NL: 'Nuevo León',
  OA: 'Oaxaca',
  PB: 'Puebla',
  QE: 'Querétaro',
  QR: 'Quintana Roo',
  SI: 'Sinaloa',
  SL: 'San Luis Potosí',
  SO: 'Sonora',
  TB: 'Tabasco',
  TL: 'Tlaxcala',
  TM: 'Tamaulipas',
  VE: 'Veracruz',
  YU: 'Yucatán',
  ZA: 'Zacatecas'
};

export function toStateNameFromAbbrev(stateAbbrev: string): string | null {
  let name: string;
  if (stateAbbrev[0] == 'm') {
    name = MEXICAN_STATE_ABBREVS[stateAbbrev.substring(1)];
  } else {
    name = US_STATE_ABBREVS[stateAbbrev];
    if (name == undefined) {
      name = CANADA_PROVINCE_ABBREVS[stateAbbrev];
    }
  }
  return name ? name : null;
}
