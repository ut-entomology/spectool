export const northAmericaAdjacencies = {
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
