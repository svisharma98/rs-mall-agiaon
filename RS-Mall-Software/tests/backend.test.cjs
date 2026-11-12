const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { initializeDatabase } = require("../electron/database.cjs");
const { createServices } = require("../electron/services.cjs");

test("admin setup, catalog, settings, and atomic sale lifecycle", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rs-mall-test-"));
  const db = initializeDatabase(directory);
  t.after(() => {
    db.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const services = createServices(db);

  assert.deepEqual(services.auth.status(), { needsSetup: true });
  services.auth.setup({ username: "admin", password: "secure-password" });
  assert.equal(services.auth.status().needsSetup, false);
  assert.equal(services.auth.login({ username: "admin", password: "secure-password" }).username, "admin");
  assert.throws(() => services.auth.login({ username: "admin", password: "wrong-password" }), /Incorrect username/);
  assert.notEqual(db.prepare("SELECT password_hash FROM users").get().password_hash, "secure-password");

  services.catalog.saveCategory({ name: "Drinks" });
  const category = services.catalog.listCategories()[0];
  services.catalog.saveProduct({
    name: "Water", code: "W-01", barcode: "890123", category_id: category.id,
    purchase_price: 5, selling_price: 10, stock_quantity: 10
  });
  const product = services.catalog.listProducts()[0];
  assert.equal(product.category_name, "Drinks");
  services.settings.save({ tax_rate: 10, currency: "USD", shop_address: "" });
  assert.equal(services.settings.get().currency, "USD");
  assert.equal(services.settings.get().shop_address, "");

  const completed = services.sales.complete({
    items: [{ id: product.id, quantity: 2 }],
    discount: 1,
    payment_method: "Cash",
    amount_received: 25,
    customer_name: "Patel",
    customer_phone: "9876543210"
  });
  assert.equal(completed.subtotal, 20);
  assert.equal(completed.tax, 1.9);
  assert.equal(completed.total, 20.9);
  assert.equal(completed.change, 4.1);
  const invoice = services.sales.get(completed.id);
  assert.equal(invoice.items[0].quantity, 2);
  assert.equal(invoice.payment_method, "Cash");
  assert.equal(invoice.customer_name, "Patel");
  assert.equal(invoice.customer_phone, "9876543210");
  assert.equal(db.prepare("SELECT stock_quantity FROM products WHERE id=?").get(product.id).stock_quantity, 8);

  assert.throws(() => services.sales.complete({
    items: [{ id: product.id, quantity: 9 }],
    discount: 0,
    payment_method: "UPI",
    amount_received: 0
  }), /Insufficient stock/);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM sales").get().count, 1);
  assert.equal(db.prepare("SELECT stock_quantity FROM products WHERE id=?").get(product.id).stock_quantity, 8);
  const summary = services.sales.dashboard();
  assert.equal(summary.invoices, 1);
  assert.equal(summary.customers, 1);
  assert.equal(summary.payments.Cash, 20.9);
  assert.equal(services.sales.list({ search: completed.invoice_number }).length, 1);
});
