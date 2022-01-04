/**
 * Adjacencies among North American countries, excluding the Caribbean.
 */

export const countryAdjacencies = {
  Canada: ['USA'],
  USA: ['Canada', 'Mexico'],
  Mexico: ['USA', 'Guatemala', 'Belize'],
  Guatemala: ['Mexico', 'Belize', 'El Salvador', 'Honduras'],
  Belize: ['Mexico', 'Guatemala'],
  'El Salvador': ['Guatemala', 'Honduras'],
  Honduras: ['Guatemala', 'El Salvador', 'Nicaragua'],
  Nicaruagua: ['Honduras', 'Costa Rica'],
  'Costa Rica': ['Nicaragua', 'Panama'],
  Panama: ['Costa Rica']
};

/**
 * Adjacent states and provinces in North America, by abbreviation.
 * U.S. and Canadian states, provinces, and territories are given by their
 * 2-letter abbreviations. Mexican States are given by their 2-letter
 * abbreviations prefixed with the letter 'm'.
 */

export const stateAdjacencies: Record<string, string[]> = {
  // U.S. States
  AL: ['TN', 'GA', 'FL', 'MS'],
  AK: ['YT', 'BC'],
  AR: ['MO', 'TN', 'MS', 'LA', 'TX', 'OK'],
  AZ: ['UT', 'CO', 'NM', 'CA', 'NV', 'mSO'],
  CA: ['OR', 'NV', 'AZ', 'mBC'],
  CO: ['WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT'],
  CT: ['MA', 'RI', 'NY'],
  DC: ['MD', 'VA'],
  DE: ['PA', 'NJ', 'MD'],
  FL: ['GA', 'AL'],
  GA: ['NC', 'SC', 'FL', 'AL', 'TN'],
  HI: [],
  IA: ['MN', 'WI', 'IL', 'MO', 'NE', 'SD'],
  ID: ['MT', 'WY', 'UT', 'NV', 'OR', 'WA', 'BC'],
  IL: ['WI', 'IN', 'KY', 'MO', 'IA', 'MI'],
  IN: ['MI', 'OH', 'KY', 'IL'],
  KS: ['NE', 'MO', 'OK', 'CO'],
  KY: ['OH', 'WV', 'VA', 'TN', 'MO', 'IL', 'IN'],
  LA: ['AR', 'MS', 'TX'],
  MA: ['NH', 'RI', 'CT', 'NY', 'VT'],
  MD: ['PA', 'DE', 'DC', 'VA', 'WV'],
  ME: ['NH', 'QC', 'NB', 'NS'],
  MI: ['OH', 'IN', 'WI', 'IL', 'MN', 'ON'],
  MN: ['WI', 'IA', 'SD', 'ND', 'MI', 'MB', 'ON'],
  MO: ['IA', 'IL', 'KY', 'TN', 'AR', 'OK', 'KS', 'NE'],
  MS: ['TN', 'AL', 'LA', 'AR'],
  MT: ['ND', 'SD', 'WY', 'ID', 'BC', 'AB', 'SK'],
  NC: ['VA', 'SC', 'GA', 'TN'],
  ND: ['MN', 'SD', 'MT', 'SK', 'MB'],
  NE: ['SD', 'IA', 'MO', 'KS', 'CO', 'WY'],
  NH: ['ME', 'MA', 'VT', 'QC'],
  NJ: ['NY', 'DE', 'PA'],
  NM: ['CO', 'OK', 'TX', 'AZ', 'UT', 'mCH', 'mSO'],
  NV: ['ID', 'UT', 'AZ', 'CA', 'OR'],
  NY: ['VT', 'MA', 'CT', 'NJ', 'PA', 'RI', 'ON', 'QC'],
  OH: ['PA', 'WV', 'KY', 'IN', 'MI', 'ON'],
  OK: ['KS', 'MO', 'AR', 'TX', 'NM', 'CO'],
  OR: ['WA', 'ID', 'NV', 'CA'],
  PA: ['NY', 'NJ', 'DE', 'MD', 'WV', 'OH', 'ON'],
  RI: ['MA', 'CT', 'NY'],
  SC: ['NC', 'GA'],
  SD: ['ND', 'MN', 'IA', 'NE', 'WY', 'MT'],
  TN: ['KY', 'VA', 'NC', 'GA', 'AL', 'MS', 'AR', 'MO'],
  TX: ['OK', 'AR', 'LA', 'NM', 'mCH', 'mCO', 'mNL', 'mTM'],
  UT: ['ID', 'WY', 'CO', 'NM', 'AZ', 'NV'],
  VA: ['MD', 'DC', 'NC', 'TN', 'KY', 'WV'],
  VT: ['NH', 'MA', 'NY', 'QC'],
  WA: ['ID', 'OR', 'BC'],
  WI: ['MI', 'IL', 'IA', 'MN'],
  WV: ['PA', 'MD', 'VA', 'KY', 'OH'],
  WY: ['MT', 'SD', 'NE', 'CO', 'UT', 'ID'],
  // U.S. Territories
  AS: [],
  FM: ['GU', 'MP', 'MH'],
  GU: ['MP', 'FM'],
  MH: ['FM'],
  MP: ['GU', 'FM'],
  PR: ['VI'],
  PW: [],
  VI: ['PR'],
  // Canadian Provinces and Territories
  AB: ['BC', 'NT', 'SK', 'MT'],
  BC: ['YT', 'NT', 'AB', 'AK', 'WA', 'ID', 'MT'],
  MB: ['SK', 'NU', 'ON', 'ND', 'MN'],
  NB: ['QC', 'PE', 'NS', 'ME'],
  NL: ['QC', 'NS'],
  NT: ['YT', 'BC', 'AB', 'SK', 'NU'],
  NS: ['NB', 'PE', 'NL', 'ME'],
  NU: ['NT', 'MB', 'ON', 'QC'],
  ON: ['MB', 'NU', 'QC', 'MN', 'MI', 'OH', 'PA', 'NY'],
  PE: ['NB', 'NS', 'QC'],
  QC: ['NU', 'ON', 'NB', 'PE', 'NL', 'NY', 'VT', 'NH', 'ME'],
  SK: ['AB', 'NT', 'MB', 'MT', 'ND'],
  YT: ['NT', 'BC', 'AK'],
  // Mexican States and Districts
  mAG: ['mZA', 'mJA'],
  mBC: ['mBS', 'mSO', 'CA'],
  mBS: ['mBC', 'mSO', 'mSI'],
  mCH: ['mSO', 'mSI', 'mDG', 'mCO', 'NM', 'TX'],
  mCL: ['mJA', 'mMI'],
  mCM: ['mTB', 'mYU', 'mQR'],
  mCO: ['mCH', 'mDG', 'mZA', 'mSL', 'mNL', 'mTM', 'TX'],
  mCS: ['mOA', 'mVE', 'mTB'],
  mDF: ['mME', 'mMO'],
  mDG: ['mSI', 'mCH', 'mCO', 'mZA', 'mNA'],
  mGR: ['mMI', 'mME', 'mMO', 'mPB', 'mOA'],
  mGT: ['mJA', 'mZA', 'mSL', 'mQE', 'mMI'],
  mHG: ['mQE', 'mSL', 'mVE', 'mPB', 'mTL', 'mME'],
  mJA: ['mNA', 'mZA', 'mAG', 'mSL', 'mGT', 'mCL', 'mMI'],
  mME: ['mMI', 'mQE', 'mHG', 'mTL', 'mPB', 'mMO', 'mGR', 'mDF'],
  mMI: ['mCL', 'mJA', 'mGT', 'mQE', 'mME', 'mGR'],
  mMO: ['mGR', 'mME', 'mPB', 'mDF'],
  mNA: ['mSI', 'mDG', 'mZA', 'mJA'],
  mNL: ['mCO', 'mTM', 'mZA', 'mSL', 'TX'],
  mOA: ['mGR', 'mPB', 'mVE', 'mCS'],
  mPB: ['mMO', 'mME', 'mTL', 'mHG', 'mVE', 'mOA', 'mGR'],
  mQE: ['mGT', 'mSL', 'mHG', 'mME', 'mMI'],
  mQR: ['mCM', 'mYU'],
  mSI: ['mBS', 'mSO', 'mCH', 'mDG', 'mNA'],
  mSL: ['mZA', 'mCO', 'mNL', 'mTM', 'mVE', 'mJA', 'mGT', 'mQE', 'mHG'],
  mSO: ['mBC', 'mBS', 'mCH', 'mSI', 'AZ', 'NM'],
  mTB: ['mVE', 'mCS', 'mCM'],
  mTL: ['mME', 'mPB', 'mHG'],
  mTM: ['mCO', 'mNL', 'mSL', 'mVE', 'TX'],
  mVE: ['mTM', 'mSL', 'mHG', 'mPB', 'mOA', 'mTB', 'mCS'],
  mYU: ['mCM', 'mQR'],
  mZA: ['mDG', 'mCO', 'mNL', 'mSL', 'mNA', 'mJA', 'mAG', 'mGT']
};

/**
 * U.S. Counties adjacent to Mexican states and Canadian provinces.
 */

export const usaAdjacencies = {
  AK: {
    'North Slope Borough': ['Yukon'],
    'Yukon-Koyukuk Census Area': ['Yukon'],
    'Southeast Fairbanks Census Area': ['Yukon'],
    'Valdez-Cordova Census Area': ['Yukon'],
    'Yakutat City and Borough': ['Yukon', 'British Columbia'],
    'Haines Borough': ['British Columbia'],
    'Skagway Municipality': ['British Columbia'],
    'Juneau City and Borough': ['British Columbia'],
    'Hoonah-Angoon Census Area': ['British Columbia'],
    'Petersburg Census Area': ['British Columbia'],
    'Wrangell City and Borough': ['British Columbia'],
    'Ketchikan Gateway Borough': ['British Columbia'],
    'Prince of Wales-Hyder Census Area': ['British Columbia']
  },
  AZ: {
    'Yuma County': ['Sonora'],
    'Pima County': ['Sonora'],
    'Santa Cruz County': ['Sonora'],
    'Cochise County': ['Sonora']
  },
  CA: {
    'San Diego County': ['Baja California'],
    'Imperial County': ['Baja California']
  },
  ID: {
    'Boundary County': ['British Columbia']
  },
  ME: {
    'Oxford County': ['Quebec'],
    'Franklin County': ['Quebec'],
    'Somerset County': ['Quebec'],
    'Aroostook County': ['Quebec', 'New Brunswick'],
    'Washington County': ['New Brunswick', 'Nova Scotia']
  },
  MI: {
    'Keweenaw County': ['Ontario'],
    'Chippewa County': ['Ontario'],
    'St. Clair County': ['Ontario'],
    'Macomb County': ['Ontario'],
    'Wayne County': ['Ontario'],
    'Monroe County': ['Ontario']
  },
  MN: {
    'Kittson County': ['Manitoba'],
    'Roseau County': ['Manitoba'],
    'Lake of the Woods County': ['Manitoba', 'Ontario'],
    'Koochiching County': ['Ontario'],
    'St. Louis County': ['Ontario'],
    'Lake County': ['Ontario'],
    'Cook County': ['Ontario']
  },
  MT: {
    'Lincoln County': ['British Columbia'],
    'Flathead County': ['British Columbia', 'Alberta'],
    'Glacier County': ['British Columbia', 'Alberta'],
    'Toole County': ['Alberta'],
    'Liberty County': ['Alberta'],
    'Hill County': ['Alberta', 'Saskatchewan'],
    'Blaine County': ['Alberta', 'Saskatchewan'],
    'Phillips County': ['Saskatchewan'],
    'Valley County': ['Saskatchewan'],
    'Daniels County': ['Saskatchewan'],
    'Sheridan County': ['Saskatchewan']
  },
  NH: {
    'Coos County': ['Quebec']
  },
  ND: {
    'Divide County': ['Saskatchewan'],
    'Burke County': ['Saskatchewan'],
    'Renville County': ['Saskatchewan', 'Manitoba'],
    'Bottineau County': ['Saskatchewan', 'Manitoba'],
    'Rolette County': ['Manitoba'],
    'Towner County': ['Manitoba'],
    'Cavalier County': ['Manitoba'],
    'Pembina County': ['Manitoba']
  },
  NM: {
    'Hidalgo County': ['Sonora', 'Chihuahua'],
    'Luna County': ['Chihuahua'],
    'Doña Ana County': ['Chihuahua']
  },
  NY: {
    'Erie County': ['Ontario'],
    'Wyoming County': ['Ontario'],
    'Jefferson County': ['Ontario'],
    'St. Lawrence County': ['Ontario'],
    'Franklin County': ['Ontario', 'Quebec'],
    'Clinton County': ['Quebec']
  },
  TX: {
    'El Paso County': ['Chihuahua'],
    'Hudspeth County': ['Chihuahua'],
    'Jeff Davis County': ['Chihuahua'],
    'Presidio County': ['Chihuahua'],
    'Brewster County': ['Chihuahua', 'Coahuila'],
    'Terrell County': ['Coahuila'],
    'Val Verde County': ['Coahuila'],
    'Kinney County': ['Coahuila'],
    'Maverick County': ['Coahuila'],
    'Webb County': ['Coahuila', 'Nuevo León', 'Tamaulipas'],
    'Zapata County': ['Tamaulipas'],
    'Starr County': ['Tamaulipas'],
    'Hidalgo County': ['Tamaulipas'],
    'Cameron County': ['Tamaulipas']
  },
  VT: {
    'Grand Isle County': ['Quebec'],
    'Franklin County': ['Quebec'],
    'Orleans County': ['Quebec'],
    'Essex County': ['Quebec']
  },
  WA: {
    'Clallam County': ['British Columbia'],
    'Island County': ['British Columbia'],
    'San Juan County': ['British Columbia'],
    'Snohomish County': ['British Columbia'],
    'Skagit County': ['British Columbia'],
    'Whatcom County': ['British Columbia'],
    'Okanogan County': ['British Columbia'],
    'Ferry County': ['British Columbia'],
    'Stevens County': ['British Columbia'],
    'Pend Oreille County': ['British Columbia']
  }
};
