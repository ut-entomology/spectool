import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as log from 'electron-log';
import 'source-map-support/register';

import { APP_NAME } from './app/app_name';
import { Platform } from './app-util/platform';
import { createAppMenu } from './app/app_menu';
import { installServerApis, exposeServerApis } from './backend/server_apis';
import databaseConfigApi from './backend/api/db_config_api';
import userApi from './backend/api/user_api';
import dialogApi from './backend/api/dialog_api';
import geographyApi from './backend/api/geography_api';
import firstNamesApi from './backend/api/first_names_api';
import { AppKernel } from './kernel/app_kernel';
import { Connection } from './shared/shared_connection';
import { DatabaseConfig } from './shared/shared_db_config';
import { connectionPub } from './app/connectionPub';
import { devMode } from './app/dev_mode';

// Without this handler, electron was not reporting all exceptions.
process.on('uncaughtException', function (error) {
  // TODO: gracefully handle mysql2-timeout-additions.TimeoutError
  log.error(error);
  app.exit(1);
});

let mainWindow: BrowserWindow | null;

function createMainWindow() {
  // Can be called from a menu item event, so assign global window here.

  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, './app/preload.js')
    }
  });

  devMode(process.env.NODE_ENV === 'development');
  const url = devMode()
    ? // in dev, target the host and port of the local rollup web server
      'http://localhost:5000'
    : // in production, use the statically build version of our application
      `file://${path.join(__dirname, '../public/index.html')}`;

  mainWindow
    .loadURL(url)
    .then(() => {
      exposeServerApis(mainWindow!);
      mainWindow!.webContents.send('set_app_mode', process.env.NODE_ENV);
      log.info('started application');
    })
    .catch((err) => {
      log.error('loadURL failed:', err.message);
      app.quit();
    });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app
  .whenReady()
  .then(async () => {
    const platform = new Platform(APP_NAME, APP_NAME);
    const kernel = new AppKernel(platform, new DatabaseConfig());
    installServerApis(kernel);
    const ipcHandlerSets = [
      databaseConfigApi(kernel),
      userApi(kernel),
      dialogApi(kernel),
      geographyApi(kernel),
      firstNamesApi(kernel)
    ];
    ipcHandlerSets.forEach((handlerSet) => {
      handlerSet.forEach((handler) => {
        handler.register(ipcMain);
      });
    });
    await kernel.init();

    // Must follow initializing IPC handlers.
    createMainWindow();
    Menu.setApplicationMenu(createAppMenu(mainWindow!));

    // Must follow setting application menu.
    connectionPub.set(
      new Connection(
        kernel.databaseConfig.isReady(),
        kernel.databaseCreds.get()?.username
      )
    );

    // Implement expected Mac OS behavior.
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    app.on('activate', () => {
      if (mainWindow === null) {
        createMainWindow();
      }
    });
  })
  .catch((err) => {
    log.error(err.message);
    app.quit();
  });
