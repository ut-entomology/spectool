import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import 'source-map-support/register';

import appPrefsApi from './backend/api/app_prefs_api';
import databaseApi from './backend/api/database_api';
import dialogApi from './backend/api/dialog_api';
import firstNamesApi from './backend/api/first_names_api';
import { AppKernel } from './kernel/app_kernel';

let mainWindow: BrowserWindow | null;

function createWindow() {
  // Without this handler, electron was not reporting all exceptions.
  process.on('uncaughtException', function (error) {
    console.log(error);
    app.exit(1);
  });

  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const inDevMode = process.env.NODE_ENV === 'development';
  const url = inDevMode
    ? // in dev, target the host and port of the local rollup web server
      'http://localhost:5000'
    : // in production, use the statically build version of our application
      `file://${path.join(__dirname, '../public/index.html')}`;
  mainWindow.loadURL(url).catch((_err) => {
    // TODO: log the error somewhere
    app.quit();
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function configure() {
  const kernel = new AppKernel();
  const ipcHandlerSets = [
    appPrefsApi(kernel), // multiline
    databaseApi(kernel),
    dialogApi(kernel),
    firstNamesApi(kernel)
  ];
  ipcHandlerSets.forEach((handlerSet) => {
    handlerSet.forEach((handler) => {
      handler.register(ipcMain);
    });
  });

  // Must follow initializing IPC handlers.
  app.on('ready', createWindow);

  // Implement expected Mac OS behavior.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });

  await kernel.init();
}

configure()
  .then(() => {})
  .catch((err) => {
    console.log(err);
  });
