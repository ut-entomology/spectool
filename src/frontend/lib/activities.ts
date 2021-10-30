import type { Activity } from './activity';
import FirstNames from '../pages/FirstNames.svelte';

export const activities: Activity[] = [
  {
    title: 'Query for first names',
    component: FirstNames,
    description: 'Returns all first names for a given last name.',
    preClose: async () => {}
  }
];
