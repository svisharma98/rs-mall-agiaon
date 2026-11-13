# RS-Mall Billing Software

Phase 1 desktop billing and point-of-sale application. The app is designed to work offline and stores its SQLite database in Electron's per-user application data folder.

## Project layout

```text
electron/
  main.cjs           Electron lifecycle, secure window and IPC handlers
  preload.cjs        Explicit renderer-safe API exposed through contextBridge
  database.cjs       SQLite schema, indexes and default settings
  services.cjs       Validation, authentication, catalog, billing and reports
src/
  renderer/
    components/      Shared layout, invoice, and empty-state components
    pages/           Dashboard, POS, catalog, sales, and settings screens
    utils/           Currency/date formatting
    App.jsx          Phase 1 state and renderer-to-IPC integration
    main.jsx         React entry point and Material UI theme
    styles.css       Application design system and responsive layout
index.html           Renderer document and content security policy
vite.config.js       React development/build configuration
```

## Architecture

React renders the desktop interface and uses Material UI for controls. The renderer cannot access Node.js or SQLite: Electron enables `contextIsolation`, disables `nodeIntegration`, and loads `preload.cjs`, which exposes a fixed allowlist of operations. The main process validates requests through `services.cjs` and executes parameterized SQLite statements. SQLite uses foreign keys and WAL journaling; completing a sale inserts the invoice, item snapshots, payment, and stock deductions in one database transaction.

The database file is `rs-mall.sqlite` inside Electron's `app.getPath("userData")` directory. Administrator passwords are salted and hashed with Node.js `scrypt`; the first launch prompts for an administrator account rather than using a built-in password.

## Build a Windows installer

The installer targets 64-bit Windows 10/11 and includes the app runtime, so the owner does not need Node.js or npm. Build it on a Windows x64 machine. The app uses `better-sqlite3`, a native module that must be compiled for Windows; building on macOS or Linux can produce an installer that fails when it opens the database. The `dist:win` command checks the host OS and stops rather than producing a broken installer.

On that machine, install Node.js 20 or newer and npm, then run these commands from the project folder:

```powershell
npm ci
npm run dist:win
```

The installer will be created in `release/` with a name like `RS-Mall-Billing-Setup-1.0.0-x64.exe`. Give that `.exe` to the owner to install. The installer offers an installation-location choice and creates Start Menu and desktop shortcuts.

Run `npm ci` on the Windows build machine, not by copying `node_modules` from macOS or Linux. Before distributing an installer, install it on a Windows test machine, launch the app, complete first-run admin setup, and verify that product data and a test sale persist after restarting the app.

The application works offline after installation. On first launch, create the administrator username and password shown by the app's first-run setup; there is no shared default password. Sales and settings are stored in the signed-in Windows user's application data folder, not in the installation folder. Uninstalling the app intentionally leaves that data in place. Before replacing or formatting the computer, sign in and use **Settings → Back up data** to save a backup file somewhere safe, such as an external drive or cloud storage. After installing RS-Mall again, sign in and choose **Settings → Restore from backup**. Restoring replaces the current data and administrator account with the selected backup.

The installer is not code-signed. Windows may show a SmartScreen warning when it is first downloaded; code signing with a trusted publisher certificate can reduce that warning for future releases.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
npm test
```

## Phase 1 features

- First-run administrator setup, sign-in, and sign-out.
- Dashboard with live daily totals, recent invoices, inventory/customer counts, and a seven-day sales overview.
- Category and product CRUD, including barcode, pricing, and stock.
- POS cart, manual product search, USB keyboard-wedge scanner entry, optional customer details, discounts, configurable tax, cash/UPI/card payments, and change calculation.
- Atomic sale completion with invoice number, payment record, item snapshots, and stock deduction.
- Invoice lookup/filtering and print or save as PDF using the system print dialog.
- Store details and invoice footer settings; daily sales grouped by payment type.
- Settings actions to back up all store data to a file and restore a validated backup.

This version is scoped to Phase 1. Product images, multiple split tenders, customer management, advanced inventory workflows, and other later-phase functionality are not included.