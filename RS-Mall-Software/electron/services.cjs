const crypto = require("node:crypto");

const text = (value, label, max = 120) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new Error(`${label} is required and must be at most ${max} characters.`);
  }
  return value.trim();
};
const number = (value, label, min = 0) => {
  const result = Number(value);
  if (!Number.isFinite(result) || result < min) throw new Error(`${label} must be a valid number.`);
  return result;
};
const passwordHash = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};
const verifyPassword = (password, encoded) => {
  const [salt, expectedHex] = encoded.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

function createServices(db) {
  const auth = {
    status() {
      return { needsSetup: db.prepare("SELECT COUNT(*) AS count FROM users").get().count === 0 };
    },
    setup({ username, password } = {}) {
      username = text(username, "Username", 40);
      if (typeof password !== "string" || password.length < 8 || password.length > 200) {
        throw new Error("Password must contain at least 8 characters.");
      }
      if (!this.status().needsSetup) throw new Error("Administrator setup has already been completed.");
      db.prepare("INSERT INTO users(username,password_hash) VALUES(?,?)").run(username, passwordHash(password));
      return { username };
    },
    login({ username, password } = {}) {
      username = text(username, "Username", 40);
      if (typeof password !== "string") throw new Error("Password is required.");
      const user = db.prepare("SELECT id,username,password_hash FROM users WHERE username=?").get(username);
      if (!user || !verifyPassword(password, user.password_hash)) throw new Error("Incorrect username or password.");
      return { id: user.id, username: user.username };
    }
  };

  const catalog = {
    listCategories() {
      return db.prepare(`SELECT c.id,c.name,COUNT(p.id) AS product_count FROM categories c
        LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.name`).all();
    },
    saveCategory({ id, name } = {}) {
      name = text(name, "Category name", 80);
      if (id) db.prepare("UPDATE categories SET name=? WHERE id=?").run(name, number(id, "Category id", 1));
      else db.prepare("INSERT INTO categories(name) VALUES(?)").run(name);
      return { success: true };
    },
    deleteCategory(id) {
      db.prepare("DELETE FROM categories WHERE id=?").run(number(id, "Category id", 1));
      return { success: true };
    },
    listProducts(query = "") {
      const term = typeof query === "string" ? query.trim().slice(0, 100) : "";
      return db.prepare(`SELECT p.*,c.name AS category_name FROM products p
        LEFT JOIN categories c ON c.id=p.category_id
        WHERE (?='' OR p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ?)
        ORDER BY p.name COLLATE NOCASE`).all(term, `%${term}%`, `%${term}%`, `%${term}%`);
    },
    saveProduct(data = {}) {
      const id = data.id ? number(data.id, "Product id", 1) : null;
      const name = text(data.name, "Product name", 120);
      const code = text(data.code, "Product code", 60);
      const barcode = typeof data.barcode === "string" && data.barcode.trim() ? data.barcode.trim().slice(0, 80) : null;
      const categoryId = data.category_id ? number(data.category_id, "Category", 1) : null;
      const purchase = number(data.purchase_price, "Purchase price");
      const selling = number(data.selling_price, "Selling price");
      const stock = number(data.stock_quantity, "Stock quantity");
      if (id) {
        db.prepare(`UPDATE products SET name=?,code=?,barcode=?,category_id=?,purchase_price=?,
          selling_price=?,stock_quantity=? WHERE id=?`).run(name, code, barcode, categoryId, purchase, selling, stock, id);
      } else {
        db.prepare(`INSERT INTO products(name,code,barcode,category_id,purchase_price,selling_price,stock_quantity)
          VALUES(?,?,?,?,?,?,?)`).run(name, code, barcode, categoryId, purchase, selling, stock);
      }
      return { success: true };
    },
    deleteProduct(id) {
      db.prepare("DELETE FROM products WHERE id=?").run(number(id, "Product id", 1));
      return { success: true };
    }
  };

  const settings = {
    get() {
      return Object.fromEntries(db.prepare("SELECT key,value FROM settings").all().map(({ key, value }) => [key, value]));
    },
    save(values = {}) {
      const allowed = ["shop_name", "shop_address", "contact_number", "gstin", "invoice_footer", "currency", "tax_rate"];
      const save = db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
      const transaction = db.transaction(() => {
        for (const key of allowed) {
          if (values[key] === undefined) continue;
          const value = key === "tax_rate"
            ? String(number(values[key], "Tax rate"))
            : key === "currency"
              ? values[key]
              : typeof values[key] === "string" && values[key].length <= 300
                ? values[key].trim()
                : (() => { throw new Error(`${key.replaceAll("_", " ")} must be at most 300 characters.`); })();
          if (key === "tax_rate" && Number(value) > 100) throw new Error("Tax rate cannot exceed 100%.");
          if (key === "currency" && !["INR", "USD", "EUR", "GBP"].includes(value)) throw new Error("Select a supported currency.");
          save.run(key, value);
        }
      });
      transaction();
      return this.get();
    }
  };

  const sales = {
    dashboard() {
      const today = db.prepare(`SELECT COALESCE(SUM(total),0) AS sales,COUNT(*) AS invoices
        FROM sales WHERE date(created_at)=date('now','localtime')`).get();
      const products = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
      const customers = db.prepare("SELECT COUNT(*) AS count FROM customers").get().count;
      const recent = db.prepare("SELECT id,invoice_number,total,created_at FROM sales ORDER BY id DESC LIMIT 8").all();
      const payments = db.prepare(`SELECT p.method,COALESCE(SUM(p.amount),0) AS total FROM payments p
        JOIN sales s ON s.id=p.sale_id WHERE date(s.created_at)=date('now','localtime') GROUP BY p.method`).all();
      const overview = db.prepare(`SELECT date(created_at) AS day,COALESCE(SUM(total),0) AS total
        FROM sales WHERE created_at >= datetime('now','localtime','-6 days')
        GROUP BY date(created_at) ORDER BY day`).all();
      return { ...today, products, customers, recent, overview, payments: Object.fromEntries(payments.map(({ method, total }) => [method, total])) };
    },
    complete(data = {}) {
      if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 500) throw new Error("Add at least one product to the bill.");
      const discount = number(data.discount || 0, "Discount");
      const method = data.payment_method;
      if (!["Cash", "UPI", "Card"].includes(method)) throw new Error("Select a valid payment method.");
      const customerName = typeof data.customer_name === "string" && data.customer_name.trim()
        ? text(data.customer_name, "Customer name", 120)
        : null;
      const customerPhone = typeof data.customer_phone === "string" && data.customer_phone.trim()
        ? text(data.customer_phone, "Customer phone", 32)
        : null;
      if (customerPhone && !customerName) throw new Error("Enter a customer name when providing a phone number.");
      const quantities = new Map();
      for (const item of data.items) {
        const id = number(item.id, "Product", 1);
        const quantity = number(item.quantity, "Quantity", 0.001);
        quantities.set(id, (quantities.get(id) || 0) + quantity);
      }
      const rows = [...quantities].map(([id, quantity]) => ({ id, quantity }));
      const result = db.transaction(() => {
        let customerId = null;
        if (customerName) {
          if (customerPhone) {
            const existing = db.prepare("SELECT id FROM customers WHERE phone=?").get(customerPhone);
            if (existing) {
              db.prepare("UPDATE customers SET name=? WHERE id=?").run(customerName, existing.id);
              customerId = existing.id;
            } else {
              customerId = db.prepare("INSERT INTO customers(name,phone) VALUES(?,?)").run(customerName, customerPhone).lastInsertRowid;
            }
          } else {
            customerId = db.prepare("INSERT INTO customers(name) VALUES(?)").run(customerName).lastInsertRowid;
          }
        }
        const getProduct = db.prepare("SELECT id,name,code,selling_price,stock_quantity FROM products WHERE id=?");
        const prepared = rows.map((item) => {
          const product = getProduct.get(item.id);
          if (!product) throw new Error("A product in this bill no longer exists.");
          if (product.stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}.`);
          return { ...product, quantity: item.quantity, line_total: Math.round(product.selling_price * item.quantity * 100) / 100 };
        });
        const subtotal = Math.round(prepared.reduce((sum, item) => sum + item.line_total, 0) * 100) / 100;
        if (discount > subtotal) throw new Error("Discount cannot exceed the subtotal.");
        const taxRate = Number(settings.get().tax_rate || 0);
        const tax = Math.round((subtotal - discount) * taxRate) / 100;
        const total = Math.round((subtotal - discount + tax) * 100) / 100;
        const received = number(data.amount_received, "Amount received");
        if (method === "Cash" && received < total) throw new Error("Amount received is less than the bill total.");
        const timestamp = new Date();
        const datePart = [
          timestamp.getFullYear(),
          String(timestamp.getMonth() + 1).padStart(2, "0"),
          String(timestamp.getDate()).padStart(2, "0")
        ].join("");
        const timePart = timestamp.toTimeString().slice(0, 8).replaceAll(":", "");
        const invoice = `RSM-${datePart}-${timePart}`//-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const sale = db.prepare("INSERT INTO sales(invoice_number,customer_id,subtotal,discount,tax,total) VALUES(?,?,?,?,?,?)")
          .run(invoice, customerId, subtotal, discount, tax, total);
        const addItem = db.prepare(`INSERT INTO sale_items(sale_id,product_id,product_name,product_code,quantity,unit_price,line_total)
          VALUES(?,?,?,?,?,?,?)`);
        const deduct = db.prepare("UPDATE products SET stock_quantity=stock_quantity-? WHERE id=?");
        for (const item of prepared) {
          addItem.run(sale.lastInsertRowid, item.id, item.name, item.code, item.quantity, item.selling_price, item.line_total);
          deduct.run(item.quantity, item.id);
        }
        db.prepare("INSERT INTO payments(sale_id,method,amount) VALUES(?,?,?)").run(sale.lastInsertRowid, method, total);
        return {
          id: sale.lastInsertRowid,
          invoice_number: invoice,
          subtotal,
          discount,
          tax,
          total,
          change: method === "Cash" ? Math.round((received - total) * 100) / 100 : 0
        };
      })();
      return result;
    },
    list({ search = "", from = "", to = "" } = {}) {
      const term = typeof search === "string" ? search.trim().slice(0, 100) : "";
      const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : "";
      const toDate = /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : "";
      return db.prepare(`SELECT s.*,p.method AS payment_method FROM sales s
        LEFT JOIN payments p ON p.sale_id=s.id
        WHERE (?='' OR s.invoice_number LIKE ?) AND (?='' OR date(s.created_at)>=?)
          AND (?='' OR date(s.created_at)<=?)
        ORDER BY s.id DESC LIMIT 500`).all(term, `%${term}%`, fromDate, fromDate, toDate, toDate);
    },
    get(id) {
      const sale = db.prepare(`SELECT s.*,p.method AS payment_method,c.name AS customer_name,c.phone AS customer_phone FROM sales s
        LEFT JOIN payments p ON p.sale_id=s.id LEFT JOIN customers c ON c.id=s.customer_id WHERE s.id=?`)
        .get(number(id, "Sale id", 1));
      if (!sale) throw new Error("Invoice not found.");
      sale.items = db.prepare("SELECT product_name,product_code,quantity,unit_price,line_total FROM sale_items WHERE sale_id=?").all(sale.id);
      return sale;
    }
  };

  return { auth, catalog, sales, settings };
}

module.exports = { createServices };
