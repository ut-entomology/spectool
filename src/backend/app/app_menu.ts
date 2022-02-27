import { app, Menu, MenuItemConstructorOptions } from 'electron';

import { APP_NAME } from './app_name';
import { connectionPub } from './connectionPub';
import { devMode } from './dev_mode';
import type { MainWindow } from '../../backend/api/window_apis';

connectionPub.subscribe((connection) => {
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const connectItem = menu.getMenuItemById('connect_database');
    const disconnectItem = menu.getMenuItemById('disconnect_database');
    if (connectItem && disconnectItem) {
      if (connection.isConfigured) {
        if (connection.username) {
          connectItem.visible = false;
          disconnectItem.visible = true;
          disconnectItem.enabled = true;
        } else {
          connectItem.visible = true;
          connectItem.enabled = true;
          disconnectItem.visible = false;
        }
      } else {
        connectItem.visible = true;
        connectItem.enabled = false;
        disconnectItem.visible = false;
      }
    }
  }
});

export function createAppMenu(mainWindow: MainWindow) {
  // Electron automatically adds the associated labels and key shortcuts.

  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        {
          role: 'undo'
        },
        {
          role: 'redo'
        },
        { type: 'separator' },
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          role: 'paste'
        },
        {
          role: 'selectAll'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          role: 'reload'
        },
        {
          role: 'forceReload'
        },
        {
          role: 'toggleDevTools'
        },
        {
          type: 'separator'
        },
        {
          role: 'resetZoom'
        },
        {
          role: 'zoomIn'
        },
        {
          role: 'zoomOut'
        },
        {
          type: 'separator'
        },
        {
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Database',
      submenu: [
        {
          label: 'Configure',
          click: (_item, _focusedWindow, _event) => {
            mainWindow.apis.appEventApi.configureDatabase();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Connect',
          id: 'connect_database',
          enabled: false,
          click: (_item, _focusedWindow, _event) => {
            mainWindow.apis.appEventApi.connectDatabase();
          }
        },
        {
          label: 'Disconnect',
          id: 'disconnect_database',
          visible: false,
          click: (_item, _focusedWindow, _event) => {
            mainWindow.apis.appEventApi.disconnectDatabase();
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          role: 'zoom'
        },
        { type: 'separator' },
        {
          role: 'front'
        },
        { type: 'separator' },
        {
          role: 'close'
        }
      ]
    }
  ];

  if (process.platform == 'darwin') {
    let submenu: Electron.MenuItemConstructorOptions[] = [
      {
        label: `About ${APP_NAME}`,
        role: 'about'
      },
      { type: 'separator' },
      {
        label: 'Preferences...',
        accelerator: 'CommandOrControl+,',
        click: (_item, _focusedWindow, _event) => {
          mainWindow.apis.appEventApi.setPreferences();
        }
      }
    ];
    if (devMode()) {
      submenu.push({
        label: 'Clear Local Storage',
        click: (_item, _focusedWindow, _event) => {
          mainWindow.apis.appEventApi.clearLocalStorage();
        }
      });
    }
    submenu = submenu.concat([
      { type: 'separator' },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      { type: 'separator' },
      {
        label: `Hide ${APP_NAME}`,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Alt+H',
        role: 'hideOthers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      { type: 'separator' },
      {
        label: `Quit ${APP_NAME}`,
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        }
      }
    ]);
    menuTemplate.unshift({
      label: APP_NAME,
      submenu
    });
  } else {
    let submenu: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Preferences',
        accelerator: 'CommandOrControl+,',
        click: (_item, _focusedWindow, _event) => {
          mainWindow.apis.appEventApi.setPreferences();
        }
      }
    ];
    if (devMode()) {
      submenu.push({
        label: 'Clear Local Storage',
        click: (_item, _focusedWindow, _event) => {
          mainWindow.apis.appEventApi.clearLocalStorage();
        }
      });
    }
    menuTemplate.unshift({
      label: 'File',
      id: 'file-menu',
      visible: false,
      submenu
    });
  }

  return Menu.buildFromTemplate(menuTemplate);
}
