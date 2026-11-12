const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { initializeDatabase } = require("./database.cjs");
const { createServices } = require("./services.cjs");

let database;
let authenticated = false;
let authenticatedUser = null;

function registerHandler(channel, handler) {
  ipcMain.handle(channel, async (_event, payload) => {
    try {
      return await handler(payload);
    } catch (error) {
      console.error(`IPC ${channel} failed:`, error.message);
      throw new Error(error.message || "The requested operation failed.");
    }
  });
}

function registerIpc(services) {
  registerHandler("app:status", () => ({ ...services.auth.status(), user: authenticatedUser }));
  registerHandler("auth:setup", (data) => services.auth.setup(data));
  registerHandler("auth:login", (data) => {
    const user = services.auth.login(data);
    authenticated = true;
    authenticatedUser = user;
    return user;
  });
  registerHandler("auth:logout", () => {
    authenticated = false;
    authenticatedUser = null;
    return { success: true };
  });
  const protectedHandler = (channel, handler) => registerHandler(channel, (payload) => {
    if (!authenticated) throw new Error("Please sign in to continue.");
    return handler(payload);
  });
  protectedHandler("catalog:categories:list", () => services.catalog.listCategories());
  protectedHandler("catalog:categories:save", (data) => services.catalog.saveCategory(data));
  protectedHandler("catalog:categories:delete", (id) => services.catalog.deleteCategory(id));
  protectedHandler("catalog:products:list", (query) => services.catalog.listProducts(query));
  protectedHandler("catalog:products:save", (data) => services.catalog.saveProduct(data));
  protectedHandler("catalog:products:delete", (id) => services.catalog.deleteProduct(id));
  protectedHandler("dashboard:summary", () => services.sales.dashboard());
  protectedHandler("sales:complete", (data) => services.sales.complete(data));
  protectedHandler("sales:list", (query) => services.sales.list(query));
  protectedHandler("sales:get", (id) => services.sales.get(id));
  protectedHandler("settings:get", () => services.settings.get());
  protectedHandler("settings:save", (data) => services.settings.save(data));
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1120,
    minHeight: 700,
    backgroundColor: "#f4f6fa",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });
  window.once("ready-to-show", () => window.show());
  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    window.loadURL(process.env.RS_MALL_DEV_URL || "http://127.0.0.1:5174");
  }
}

app.whenReady().then(() => {
  database = initializeDatabase(app.getPath("userData"));
  registerIpc(createServices(database));
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (database && database.open) database.close();
});
