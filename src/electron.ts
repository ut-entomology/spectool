import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'

import * as dbtest from './backend/dbtest'

let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    },
  })

  const inDevMode = process.env.NODE_ENV === "development"
  const url = inDevMode
    // in dev, target the host and port of the local rollup web server
    ? "http://localhost:5000"
    // in production, use the statically build version of our application
    : `file://${path.join(__dirname, "../public/index.html")}`
  mainWindow.loadURL(url).catch((_err) => {
    // TODO: log the error somewhere
    app.quit()
  })
  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.on("ready", createWindow)

// those two events completely optional to subscrbe to, but that's a common way to get the
// user experience people expect to have on macOS: do not quit the application directly
// after the user close the last window, instead wait for Command + Q (or equivalent).
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
app.on("activate", () => {
  if (mainWindow === null) createWindow()
})

interface FirstNamesRequest {
  username: string
  password: string
  lastName: string
}

ipcMain.on("get-first-names", (_event, args: FirstNamesRequest) => {
  dbtest.getFirstNames(args.username, args.password, args.lastName,
    (err, firstNames) => {
      if (err)
        mainWindow?.webContents.send("app-error", err.message)
      else
        mainWindow?.webContents.send("first-names", firstNames)
    })
})
