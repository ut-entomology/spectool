import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';

import { APP_NAME } from './app_name';
import { connectionPub } from './connectionPub';

connectionPub.subscribe((connection) => {
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const connectItem = menu.getMenuItemById('connect_database');
    const disconnectItem = menu.getMenuItemById('disconnect_database');
    if (connectItem && disconnectItem) {
      if (connection.configured) {
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

export function createAppMenu(mainWindow: BrowserWindow) {
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
            mainWindow.webContents.send('configure_database');
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
            mainWindow.webContents.send('connect_database');
          }
        },
        {
          label: 'Disconnect',
          id: 'disconnect_database',
          visible: false,
          click: (_item, _focusedWindow, _event) => {
            mainWindow.webContents.send('disconnect_database');
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
    menuTemplate.unshift({
      label: APP_NAME,
      submenu: [
        {
          label: `About ${APP_NAME}`,
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CommandOrControl+,',
          click: (_item, _focusedWindow, _event) => {
            mainWindow.webContents.send('set_preferences');
          }
        },
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
      ]
    });
  } else {
    menuTemplate.unshift({
      label: 'File',
      id: 'file-menu',
      visible: false,
      submenu: [
        {
          label: 'Preferences',
          accelerator: 'CommandOrControl+,',
          click: (_item, _focusedWindow, _event) => {
            mainWindow.webContents.send('set_preferences');
          }
        }
      ]
    });
  }

  return Menu.buildFromTemplate(menuTemplate);
}