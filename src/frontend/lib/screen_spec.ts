export interface ScreenSpec {
  // Electron also defines 'Screen'
  title: string;
  targetName: string;
  params: { [key: string]: any };
}
