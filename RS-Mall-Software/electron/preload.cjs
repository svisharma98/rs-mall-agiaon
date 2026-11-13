const { contextBridge, ipcRenderer } = require("electron");

const invoke = (channel) => (payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld("rsMall", Object.freeze({
  status: invoke("app:status"),
  setupAdmin: invoke("auth:setup"),
  login: invoke("auth:login"),
  logout: invoke("auth:logout"),
  listCategories: invoke("catalog:categories:list"),
  saveCategory: invoke("catalog:categories:save"),
  deleteCategory: invoke("catalog:categories:delete"),
  listProducts: invoke("catalog:products:list"),
  saveProduct: invoke("catalog:products:save"),
  deleteProduct: invoke("catalog:products:delete"),
  dashboard: invoke("dashboard:summary"),
  completeSale: invoke("sales:complete"),
  listSales: invoke("sales:list"),
  getSale: invoke("sales:get"),
  getSettings: invoke("settings:get"),
  saveSettings: invoke("settings:save"),
  createBackup: invoke("data:backup"),
  restoreBackup: invoke("data:restore")
}));
