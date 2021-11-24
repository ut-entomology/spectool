import type { Prerequisite } from './prerequisite';

export interface Activity {
  title: string;
  targetName: string;
  description: string;
  requiresLogin: boolean;
  prerequisites: Prerequisite[];
}
