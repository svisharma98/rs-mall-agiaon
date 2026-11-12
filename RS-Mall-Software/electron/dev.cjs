const { spawn } = require("node:child_process");
const path = require("node:path");
const { createServer } = require("vite");

async function startDevelopmentApp() {
  const vite = await createServer({
    configFile: path.join(__dirname, "../vite.config.js"),
    server: { host: "127.0.0.1", port: 5174, strictPort: true }
  });
  await vite.listen();

  const electron = spawn(require("electron"), [path.join(__dirname, "..")], {
    stdio: "inherit",
    env: { ...process.env, RS_MALL_DEV_URL: "http://127.0.0.1:5174" }
  });

  const closeServer = () => vite.close().catch((error) => console.error("Could not close Vite server:", error));
  process.once("SIGINT", () => {
    closeServer();
    electron.kill();
  });
  process.once("SIGTERM", () => {
    closeServer();
    electron.kill();
  });
  electron.once("error", (error) => {
    console.error("Could not start Electron:", error);
    closeServer();
    process.exitCode = 1;
  });
  electron.once("exit", (code) => {
    closeServer();
    process.exitCode = code ?? 1;
  });
}

startDevelopmentApp().catch((error) => {
  console.error("Could not start the RS-Mall development server:", error.message);
  process.exitCode = 1;
});
