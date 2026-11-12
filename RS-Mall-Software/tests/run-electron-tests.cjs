const { spawnSync } = require("node:child_process");
const electron = require("electron");
const path = require("node:path");

const result = spawnSync(electron, ["--test", path.join(__dirname, "backend.test.cjs")], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }
});

if (result.error) {
  console.error(result.error);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
