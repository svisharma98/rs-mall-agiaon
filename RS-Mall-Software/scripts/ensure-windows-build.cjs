if (process.platform !== "win32") {
  console.error(
    "Windows installer builds must run on Windows x64 so native SQLite is packaged for Windows.",
  );
  process.exit(1);
}
