const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function initializeDatabase(userDataPath) {
  fs.mkdirSync(userDataPath, { recursive: true });
  const db = new Database(path.join(userDataPath, "rs-mall.sqlite"));
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      barcode TEXT UNIQUE,
      category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
      purchase_price REAL NOT NULL DEFAULT 0 CHECK(purchase_price >= 0),
      selling_price REAL NOT NULL CHECK(selling_price >= 0),
      stock_quantity REAL NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      unit_price REAL NOT NULL CHECK(unit_price >= 0),
      line_total REAL NOT NULL CHECK(line_total >= 0)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      method TEXT NOT NULL CHECK(method IN ('Cash','UPI','Card')),
      amount REAL NOT NULL CHECK(amount >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    INSERT OR IGNORE INTO settings(key,value) VALUES
      ('shop_name','RS-Mall'),('shop_address',''),('contact_number',''),
      ('gstin',''),('invoice_footer','Thank you for shopping with us!'),
      ('currency','INR'),('tax_rate','0');
  `);
  return db;
}

const restoreOrder = ["categories", "customers", "users", "settings", "products", "sales", "sale_items", "payments"];
const clearOrder = ["sale_items", "payments", "sales", "products", "customers", "categories", "settings", "users"];
const expectedColumns = {
  users: ["id", "username", "password_hash", "created_at"],
  categories: ["id", "name", "created_at"],
  products: ["id", "name", "code", "barcode", "category_id", "purchase_price", "selling_price", "stock_quantity", "created_at"],
  customers: ["id", "name", "phone", "created_at"],
  sales: ["id", "invoice_number", "customer_id", "subtotal", "discount", "tax", "total", "created_at"],
  sale_items: ["id", "sale_id", "product_id", "product_name", "product_code", "quantity", "unit_price", "line_total"],
  payments: ["id", "sale_id", "method", "amount", "created_at"],
  settings: ["key", "value"]
};

async function createBackup(db, destination) {
  await db.backup(destination);
}

function restoreBackup(db, sourcePath, currentDatabasePath) {
  const resolvedSource = fs.realpathSync(sourcePath);
  const resolvedCurrent = fs.realpathSync(currentDatabasePath);
  if (resolvedSource === resolvedCurrent) throw new Error("Choose a backup file, not the database currently in use.");

  const source = new Database(resolvedSource, { readonly: true, fileMustExist: true });
  try {
    const integrity = source.pragma("integrity_check");
    if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") {
      throw new Error("This backup file is damaged and cannot be restored.");
    }
    for (const [table, columns] of Object.entries(expectedColumns)) {
      const actualColumns = source.pragma(`table_info(${table})`).map(({ name }) => name);
      if (actualColumns.length !== columns.length || actualColumns.some((name, index) => name !== columns[index])) {
        throw new Error("This file is not a compatible RS-Mall backup.");
      }
    }
  } finally {
    source.close();
  }

  db.prepare("ATTACH DATABASE ? AS restore_source").run(resolvedSource);
  try {
    db.transaction(() => {
      for (const table of clearOrder) db.exec(`DELETE FROM main.${table}`);
      for (const table of restoreOrder) db.exec(`INSERT INTO main.${table} SELECT * FROM restore_source.${table}`);
    })();
  } finally {
    db.exec("DETACH DATABASE restore_source");
  }
}

module.exports = { initializeDatabase, createBackup, restoreBackup };
