import type { ElectronMainApi } from 'electron-affinity/main';

export class LogApi implements ElectronMainApi<LogApi> {
  async log(line: string) {
    console.log(line);
  }
}
