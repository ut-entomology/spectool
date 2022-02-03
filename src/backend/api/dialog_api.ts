import { dialog } from 'electron';

export class DialogApi {
  async openDirectoryDialog(dialogTitle: string) {
    const selections = dialog.showOpenDialogSync({
      title: dialogTitle,
      properties: [
        'openDirectory',
        'createDirectory',
        'promptToCreate',
        'dontAddToRecent'
      ]
    });
    if (!selections) return null;
    return selections[0];
  }

  async openFileDialog(dialogTitle: string, validExtensions: string[] = ['*']) {
    const selections = dialog.showOpenDialogSync({
      title: dialogTitle,
      properties: ['openFile', 'createDirectory', 'promptToCreate', 'dontAddToRecent'],
      filters: [
        {
          name: 'File Types',
          extensions: validExtensions
        }
      ]
    });
    if (!selections) return null;
    return selections[0];
  }
}
