import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import * as log from 'electron-log';
import 'source-map-support/register';

import { APP_NAME } from './backend/app/app_name';
import { Platform } from './util/platform';
import { MainWindow, bindMainWindowApis } from './backend/api/window_apis';
import { createAppMenu } from './backend/app/app_menu';
import { installMainApis } from './backend/api/main_apis';
import { AppKernel } from './backend/app/app_kernel';
import { Connection } from './shared/shared_connection';
import { DatabaseConfig } from './shared/shared_db_config';
import { connectionPub } from './backend/app/connectionPub';
import { devMode } from './backend/app/dev_mode';

let mainWindow: MainWindow | null = null;

// Without this handler, electron was not reporting all exceptions.

process.on('uncaughtException', function (error) {
  // TODO: gracefully handle mysql2-timeout-additions.TimeoutError
  log.error(error);
  app.exit(1);
});

// Select the source of initial page as a function of dev mode.

devMode(process.env.NODE_ENV === 'development');
const initialPageURL = devMode()
  ? // in dev, target the host and port of the local rollup web server
    'http://localhost:5000'
  : // in production, use the statically built version of the application
    `file://${path.join(__dirname, '../public/index.html')}`;

// Start the application.

app
  .whenReady()
  .then(async () => {
    // Initialize application.

    const platform = new Platform(APP_NAME, APP_NAME);
    const kernel = new AppKernel(platform, new DatabaseConfig());
    installMainApis(kernel);
    await kernel.init();

    connectionPub.set(
      new Connection(
        kernel.databaseConfig.isReady(),
        kernel.databaseCreds.get()?.username
      )
    );

    // Open the main window.

    openMainWindow();
    app.on('window-all-closed', () => {
      // Closing windows doesn't close the app on Mac.
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    app.on('activate', () => {
      if (mainWindow === null) {
        openMainWindow();
      }
    });
  })
  .catch((err) => {
    log.error(err.message);
    app.quit();
  });

function openMainWindow() {
  // Can be called from a menu item event, so assign global window here.

  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../node_modules/electron-affinity/preload.js')
    }
  }) as MainWindow;

  mainWindow
    .loadURL(initialPageURL)
    .then(async () => {
      await bindMainWindowApis(mainWindow!);
      mainWindow!.apis.appEventApi.setAppMode(process.env.NODE_ENV);
      log.info('started application');
    })
    .catch((err) => {
      log.error('loadURL failed:', err.message);
      app.quit();
    });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  Menu.setApplicationMenu(createAppMenu(mainWindow));
}
