import * as packageJson from '../package.json';

export type DirectionOption = {
  label: string;
  value: string;
};

export type OrderOption = {
  label: string;
  value: string;
  directions: DirectionOption[];
};

export const mediaPluginVersion = packageJson.version;
