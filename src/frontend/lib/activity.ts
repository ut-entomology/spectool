import type { ScreenSpec } from './screen_spec';
import type { Prerequisite } from './prerequisite';

export interface Activity {
  screenSpec: ScreenSpec;
  description: string;
  requiresLogin: boolean;
  prerequisites: Prerequisite[];
}
