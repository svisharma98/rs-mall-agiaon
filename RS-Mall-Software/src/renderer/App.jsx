import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Add, Remove, QrCodeScannerOutlined, DeleteOutline, EditOutlined,
  Inventory2Outlined, LogoutOutlined, PointOfSaleOutlined, PrintOutlined, Search,
  ShoppingCartOutlined, TrendingUpOutlined
} from "@mui/icons-material";
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, InputAdornment, MenuItem, Paper,
  Snackbar, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography
} from "@mui/material";
import Sidebar from "./components/Sidebar.jsx";
import Modal from "./components/Modal.jsx";
import InvoiceDialogView from "./components/InvoiceDialog.jsx";
import { currency, currencySymbol, dateTime } from "./utils/format.js";
import DashboardView from "./pages/DashboardPage.jsx";
import PosView from "./pages/PosPage.jsx";
import ProductsView from "./pages/ProductsPage.jsx";
import CategoriesView from "./pages/CategoriesPage.jsx";
import SalesView from "./pages/SalesPage.jsx";
import DailySummaryView from "./pages/DailySummaryPage.jsx";
import SettingsView from "./pages/SettingsPage.jsx";

let currencyCode = "INR";
const money = (value) => currency(value, currencyCode);
const emptyProduct = { name: "", code: "", barcode: "", category_id: "", purchase_price: "0", selling_price: "", stock_quantity: "0" };

function App() {
  const [booting, setBooting] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("Dashboard");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [settings, setSettings] = useState({});
  const [sales, setSales] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const [saleQuery, setSaleQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryDialog, setCategoryDialog] = useState(null);
  const [productDialog, setProductDialog] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [received, setReceived] = useState("");
  const [posQuery, setPosQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [auth, setAuth] = useState({ username: "", password: "" });
  const [settingsDraft, setSettingsDraft] = useState({});
  const barcodeRef = useRef(null);

  const showError = (reason) => setError(reason?.message || "Something went wrong. Please try again.");
  const loadCatalog = useCallback(async (query = "") => {
    const [categoryRows, productRows] = await Promise.all([
      window.rsMall.listCategories(), window.rsMall.listProducts(query)
    ]);
    setCategories(categoryRows);
    setProducts(productRows);
  }, []);
  const loadDashboard = useCallback(async () => {
    setSummary(await window.rsMall.dashboard());
  }, []);
  const loadSettings = useCallback(async () => {
    const values = await window.rsMall.getSettings();
    currencyCode = values.currency || "INR";
    setSettings(values);
    setSettingsDraft(values);
  }, []);

  useEffect(() => {
    window.rsMall.status().then(({ needsSetup, user: activeUser }) => {
      setAuthMode(needsSetup ? "setup" : "login");
      if (activeUser) setUser(activeUser);
    })
      .catch(showError).finally(() => setBooting(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    loadCatalog().catch(showError);
    loadDashboard().catch(showError);
    loadSettings().catch(showError);
  }, [user, loadCatalog, loadDashboard, loadSettings]);
  useEffect(() => {
    if (page === "Sales history") loadSales().catch(showError);
    if (page === "Point of Sale") {
      window.rsMall.listProducts("").then(setProducts).catch(showError);
      setTimeout(() => barcodeRef.current?.focus(), 50);
    }
  }, [page]);
  useEffect(() => {
    if (page !== "Products") return undefined;
    const timer = setTimeout(() => window.rsMall.listProducts(productQuery).then(setProducts).catch(showError), 180);
    return () => clearTimeout(timer);
  }, [page, productQuery]);

  async function loadSales() {
    setSales(await window.rsMall.listSales({ search: saleQuery, from: fromDate, to: toDate }));
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (authMode === "setup") {
        await window.rsMall.setupAdmin(auth);
        setNotice("Administrator account created. You can now sign in.");
        setAuthMode("login");
        setAuth({ username: auth.username, password: "" });
      } else {
        setUser(await window.rsMall.login(auth));
      }
    } catch (reason) { showError(reason); }
    finally { setBusy(false); }
  }

  function addToCart(product) {
    if (Number(product.stock_quantity) <= 0) {
      setError(`${product.name} is out of stock.`);
      return;
    }
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found && found.quantity >= product.stock_quantity) {
        setError(`Only ${product.stock_quantity} ${product.name} available in stock.`);
        return current;
      }
      return found
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
    setPosQuery("");
  }

  function handleBarcode(event) {
    if (event.key !== "Enter") return;
    const code = posQuery.trim();
    if (!code) return;
    const found = products.find((item) => item.barcode === code || item.code.toLowerCase() === code.toLowerCase());
    if (found) addToCart(found);
    else setError(`No product found for barcode “${code}”.`);
    setPosQuery("");
    event.preventDefault();
  }

  function updateQuantity(id, next) {
    if (next <= 0) {
      setCart((items) => items.filter((item) => item.id !== id));
      return;
    }
    const product = products.find((item) => item.id === id);
    if (next > Number(product?.stock_quantity || 0)) {
      setError(`Only ${product?.stock_quantity ?? 0} available in stock.`);
      return;
    }
    setCart((items) => items.map((item) => item.id === id ? { ...item, quantity: next } : item));
  }

  const subtotal = useMemo(() => Math.round(cart.reduce((sum, item) => sum + Math.round(item.selling_price * item.quantity * 100) / 100, 0) * 100) / 100, [cart]);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxRate = Number(settings.tax_rate || 0);
  const tax = Math.round(Math.max(0, subtotal - discountAmount) * taxRate) / 100;
  const total = Math.round(Math.max(0, subtotal - discountAmount + tax) * 100) / 100;
  const change = Math.max(0, (Number(received) || 0) - total);
  const filteredPos = (posQuery
    ? products.filter((p) => `${p.name} ${p.code} ${p.barcode || ""}`.toLowerCase().includes(posQuery.toLowerCase()))
    : products).slice(0, 24);

  function clearCurrentBill() {
    setCart([]);
    setDiscount("0");
    setReceived("");
    setCustomerName("");
    setCustomerPhone("");
  }

  async function finishSale() {
    setBusy(true);
    try {
      const result = await window.rsMall.completeSale({
        items: cart.map(({ id, quantity }) => ({ id, quantity })),
        discount: discountAmount,
        payment_method: paymentMethod,
        amount_received: paymentMethod === "Cash" ? Number(received || 0) : total,
        customer_name: customerName,
        customer_phone: customerPhone
      });
      const detail = await window.rsMall.getSale(result.id);
      setInvoice(detail);
      setCart([]);
      setDiscount("0");
      setReceived("");
      setCustomerName("");
      setCustomerPhone("");
      setNotice(`Sale completed · ${result.invoice_number}`);
      Promise.all([loadCatalog(), loadDashboard()]).catch(showError);
    } catch (reason) { showError(reason); }
    finally { setBusy(false); }
  }

  async function saveProduct() {
    if (!productDialog?.name?.trim() || !productDialog?.code?.trim() || Number(productDialog.selling_price) < 0) {
      setError("Enter a product name, product code, and valid selling price.");
      return;
    }
    try {
      await window.rsMall.saveProduct(productDialog);
      await loadCatalog(productQuery);
      setProductDialog(null);
      setNotice("Product saved successfully.");
    } catch (reason) { showError(reason); }
  }

  async function saveCategory() {
    if (!categoryDialog?.name?.trim()) return setError("Category name is required.");
    try {
      await window.rsMall.saveCategory(categoryDialog);
      await loadCatalog(productQuery);
      setCategoryDialog(null);
      setNotice("Category saved successfully.");
    } catch (reason) { showError(reason); }
  }

  async function saveShopSettings() {
    try {
      const values = await window.rsMall.saveSettings(settingsDraft);
      currencyCode = values.currency || "INR";
      setSettings(values);
      setSettingsDraft(values);
      setNotice("Settings saved.");
    } catch (reason) { showError(reason); }
  }

  async function createDataBackup() {
    setBusy(true);
    try {
      const result = await window.rsMall.createBackup();
      if (!result.canceled) setNotice("Backup saved successfully.");
    } catch (reason) { showError(reason); }
    finally { setBusy(false); }
  }

  async function restoreDataBackup() {
    setBusy(true);
    try {
      const result = await window.rsMall.restoreBackup();
      if (result.canceled) return;
      await Promise.all([loadCatalog(productQuery), loadDashboard(), loadSettings(), loadSales()]);
      setCart([]);
      setDiscount("0");
      setReceived("");
      setCustomerName("");
      setCustomerPhone("");
      setNotice("Backup restored successfully.");
    } catch (reason) { showError(reason); }
    finally { setBusy(false); }
  }

  async function deleteItem(kind, item) {
    if (!window.confirm(`Delete ${kind === "product" ? item.name : item.name}? This cannot be undone.`)) return;
    try {
      if (kind === "product") await window.rsMall.deleteProduct(item.id);
      else await window.rsMall.deleteCategory(item.id);
      await loadCatalog(productQuery);
      setNotice(`${kind === "product" ? "Product" : "Category"} deleted.`);
    } catch (reason) { showError(reason); }
  }

  if (booting) return <Box className="center-screen"><CircularProgress /></Box>;
  if (!user) return (
    <Box className="auth-screen">
      <Paper className="auth-card" elevation={0}>
        <Box className="brand auth-brand"><Box className="brand-mark"><Inventory2Outlined /></Box><Box><Typography className="brand-name">RS-Mall</Typography><Typography className="brand-caption">BILLING SOFTWARE</Typography></Box></Box>
        <Typography variant="h4" className="auth-title">{authMode === "setup" ? "Set up your store" : "Welcome back"}</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{authMode === "setup" ? "Create your administrator account to get started." : "Sign in to continue to your billing workspace."}</Typography>
        <form onSubmit={handleAuth} className="form-stack">
          <TextField label="Username" autoComplete="username" value={auth.username} onChange={(e) => setAuth({ ...auth, username: e.target.value })} required autoFocus />
          <TextField label="Password" type="password" autoComplete={authMode === "setup" ? "new-password" : "current-password"} value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} required inputProps={{ minLength: authMode === "setup" ? 8 : undefined }} helperText={authMode === "setup" ? "Use at least 8 characters." : ""} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={busy}>{busy ? "Please wait…" : authMode === "setup" ? "Create administrator" : "Sign in"}</Button>
        </form>
        <Typography className="auth-note">Your store data stays on this device.</Typography>
      </Paper>
    </Box>
  );

  const pageTitles = {
    Dashboard: ["Dashboard", "Here’s what’s happening at your store today."],
    "Point of Sale": ["Point of Sale", "Scan, build a cart, and complete a sale."],
    Products: ["Products", "Manage your products, prices, barcodes, and stock."],
    Categories: ["Categories", "Organize your products for faster checkout."],
    "Sales history": ["Sales history", "Find invoices and reprint customer receipts."],
    "Daily summary": ["Daily sales summary", "Review today's sales by payment method."],
    Settings: ["Store settings", "Manage the details printed on your invoices."]
  };

  return (
    <Box className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <Box component="main" className="main-area">
        <Box className="topbar">
          <Box><Typography className="breadcrumb">RS-MALL <span>/</span> {page.toUpperCase()}</Typography><Typography className="topbar-date">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Typography></Box>
          <Box className="user-chip"><Avatar sx={{ width: 34, height: 34, bgcolor: "#e8eff8", color: "primary.main", fontSize: 14 }}>{user.username.slice(0, 1).toUpperCase()}</Avatar><Box><Typography className="user-name">{user.username}</Typography><Typography className="user-role">Administrator</Typography></Box><IconButton size="small" title="Sign out" onClick={() => { window.rsMall.logout().catch(showError); setUser(null); setPage("Dashboard"); }}><LogoutOutlined fontSize="small" /></IconButton></Box>
        </Box>
        <Box className="page-content">
          <Box className="page-heading"><Box><Typography variant="h4">{pageTitles[page][0]}</Typography><Typography color="text.secondary">{pageTitles[page][1]}</Typography></Box>
            {page === "Products" && <Button variant="contained" startIcon={<Add />} onClick={() => setProductDialog({ ...emptyProduct })}>Add product</Button>}
            {page === "Categories" && <Button variant="contained" startIcon={<Add />} onClick={() => setCategoryDialog({ name: "" })}>Add category</Button>}
          </Box>

          {page === "Dashboard" && <DashboardView summary={summary} onNewSale={() => setPage("Point of Sale")} money={money} />}
          {page === "Point of Sale" && <PosView {...{ products, filteredPos, cart, subtotal, discount, discountAmount, setDiscount, tax, taxRate, total, paymentMethod, setPaymentMethod, received, setReceived, change, addToCart, updateQuantity, finishSale, busy, posQuery, setPosQuery, handleBarcode, barcodeRef, setPage, clearCart: clearCurrentBill, customerName, setCustomerName, customerPhone, setCustomerPhone, money, currencySymbol: currencySymbol(currencyCode) }} />}
          {page === "Products" && <ProductsView {...{ products, productQuery, setProductQuery, setProductDialog, deleteItem, money }} />}
          {page === "Categories" && <CategoriesView {...{ categories, setCategoryDialog, deleteItem }} />}
          {page === "Sales history" && <SalesView {...{ sales, saleQuery, setSaleQuery, fromDate, setFromDate, toDate, setToDate, loadSales, setInvoice, showError, money }} />}
          {page === "Daily summary" && <DailySummaryView summary={summary} money={money} />}
          {page === "Settings" && <SettingsView settingsDraft={settingsDraft} setSettingsDraft={setSettingsDraft} saveShopSettings={saveShopSettings} createBackup={createDataBackup} restoreBackup={restoreDataBackup} busy={busy} />}
        </Box>
      </Box>
      <Modal open={Boolean(categoryDialog)} title={categoryDialog?.id ? "Edit category" : "Add category"} onClose={() => setCategoryDialog(null)} onSubmit={saveCategory}>
        <TextField fullWidth label="Category name" autoFocus value={categoryDialog?.name || ""} onChange={(e) => setCategoryDialog({ ...categoryDialog, name: e.target.value })} />
      </Modal>
      <Modal open={Boolean(productDialog)} title={productDialog?.id ? "Edit product" : "Add product"} onClose={() => setProductDialog(null)} onSubmit={saveProduct}>
        {productDialog && <Box className="form-grid">
          <TextField label="Product name" value={productDialog.name} onChange={(e) => setProductDialog({ ...productDialog, name: e.target.value })} required />
          <TextField label="Product code" value={productDialog.code} onChange={(e) => setProductDialog({ ...productDialog, code: e.target.value })} required />
          <TextField label="Barcode number" value={productDialog.barcode || ""} onChange={(e) => setProductDialog({ ...productDialog, barcode: e.target.value })} />
          <TextField select label="Category" value={productDialog.category_id || ""} onChange={(e) => setProductDialog({ ...productDialog, category_id: e.target.value || null })}><MenuItem value="">Uncategorized</MenuItem>{categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField>
          <TextField type="number" label={`Purchase price (${currencySymbol(currencyCode)})`} value={productDialog.purchase_price} onChange={(e) => setProductDialog({ ...productDialog, purchase_price: e.target.value })} inputProps={{ min: 0, step: "0.01" }} />
          <TextField type="number" label={`Selling price (${currencySymbol(currencyCode)})`} value={productDialog.selling_price} onChange={(e) => setProductDialog({ ...productDialog, selling_price: e.target.value })} inputProps={{ min: 0, step: "0.01" }} />
          <TextField type="number" label="Stock quantity" value={productDialog.stock_quantity} onChange={(e) => setProductDialog({ ...productDialog, stock_quantity: e.target.value })} inputProps={{ min: 0, step: "any" }} />
        </Box>}
      </Modal>
      <InvoiceDialogView invoice={invoice} settings={settings} onClose={() => setInvoice(null)} money={money} />
      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}><Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert></Snackbar>
      <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError("")} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}><Alert severity="error" onClose={() => setError("")}>{error}</Alert></Snackbar>
    </Box>
  );
}

function DashboardPage({ summary, onNewSale }) {
  const stats = [
    { title: "Today's sales", value: money(summary?.sales), icon: TrendingUpOutlined, tint: "blue" },
    { title: "Invoices today", value: summary?.invoices ?? "—", icon: PointOfSaleOutlined, tint: "green" },
    { title: "Products", value: summary?.products ?? "—", icon: Inventory2Outlined, tint: "purple" },
    { title: "Customers", value: summary?.customers ?? "—", icon: ShoppingCartOutlined, tint: "orange" }
  ];
  return <>
    <Box className="stats-grid">{stats.map(({ title, value, icon: Icon, tint }) => <Paper className="stat-card" key={title} elevation={0}><Box className={`stat-icon ${tint}`}><Icon /></Box><Box><Typography className="stat-label">{title}</Typography><Typography className="stat-value">{value}</Typography><Typography className="stat-foot">Live store data</Typography></Box></Paper>)}</Box>
    <Box className="dashboard-grid">
      <Paper className="panel sales-overview" elevation={0}><Box className="panel-heading"><Box><Typography variant="h6">Sales overview</Typography><Typography color="text.secondary" variant="body2">Last 7 days</Typography></Box><Chip size="small" label="This week" variant="outlined" /></Box>
        {summary?.overview?.length ? <Box className="chart-area">{summary.overview.map((day) => {
          const max = Math.max(...summary.overview.map((entry) => entry.total), 1);
          return <Box className="chart-column" key={day.day}><Typography className="chart-amount">{day.total ? money(day.total) : ""}</Typography><Box className="chart-track"><Box className="chart-bar" style={{ height: `${Math.max(4, day.total / max * 100)}%` }} /></Box><Typography className="chart-label">{new Date(`${day.day}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" })}</Typography></Box>;
        })}</Box> : <EmptyState title="No sales yet" description="Your sales activity will appear here once you complete your first bill." />}
      </Paper>
      <Paper className="panel" elevation={0}><Box className="panel-heading"><Box><Typography variant="h6">Quick actions</Typography><Typography color="text.secondary" variant="body2">Get started faster</Typography></Box></Box><Box className="quick-actions"><Button variant="contained" startIcon={<PointOfSaleOutlined />} onClick={onNewSale}>Start a new sale</Button><Typography variant="body2" color="text.secondary">Your data is saved locally and works offline.</Typography></Box></Paper>
    </Box>
    <Paper className="panel recent-panel" elevation={0}><Box className="panel-heading"><Box><Typography variant="h6">Recent transactions</Typography><Typography color="text.secondary" variant="body2">The latest invoices from your store</Typography></Box></Box>
      {summary?.recent?.length ? <Table size="small"><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date & time</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{summary.recent.map((sale) => <TableRow key={sale.id}><TableCell className="table-strong">{sale.invoice_number}</TableCell><TableCell>{dateTime(sale.created_at)}</TableCell><TableCell align="right">{money(sale.total)}</TableCell><TableCell><Chip size="small" label="Completed" color="success" variant="outlined" /></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No transactions to show" description="Completed invoices will appear here." />}
    </Paper>
  </>;
}

function PosPage(props) {
  const { products, filteredPos, cart, subtotal, discount, setDiscount, tax, taxRate, total, paymentMethod, setPaymentMethod, received, setReceived, change, addToCart, updateQuantity, finishSale, busy, posQuery, setPosQuery, handleBarcode, barcodeRef, setPage, customerName, setCustomerName, customerPhone, setCustomerPhone } = props;
  return <Box className="pos-grid">
    <Paper className="panel pos-products" elevation={0}>
      <Box className="pos-search">
        <TextField fullWidth placeholder="Search by name, code, or scan barcode…" value={posQuery} onChange={(e) => setPosQuery(e.target.value)} onKeyDown={handleBarcode} inputRef={barcodeRef} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>, endAdornment: <InputAdornment position="end"><QrCodeScannerOutlined color="action" /></InputAdornment> }} />
        <Typography variant="caption" color="text.secondary">USB scanners work as keyboard input — scan into this field and press Enter.</Typography>
      </Box>
      {posQuery && filteredPos.length ? <Box className="product-results">{filteredPos.map((product) => <ProductTile key={product.id} product={product} onClick={() => addToCart(product)} />)}</Box>
        : posQuery ? <EmptyState title="No matching products" description="Check the product name or barcode and try again." />
          : <Box className="pos-empty"><Box className="empty-icon"><ShoppingCartOutlined /></Box><Typography variant="h6">Ready for your next sale?</Typography><Typography color="text.secondary">Search for a product or scan a barcode to add it to the bill.</Typography><Button sx={{ mt: 2 }} onClick={() => setPage("Products")}>Manage products</Button></Box>}
    </Paper>
    <Paper className="panel cart-panel" elevation={0}>
      <Box className="cart-heading"><Box><Typography variant="h6">Current bill</Typography><Typography color="text.secondary" variant="body2">{cart.length} {cart.length === 1 ? "item" : "items"}</Typography></Box><Chip label="New sale" size="small" color="primary" variant="outlined" /></Box>
      <Box className="cart-items">{cart.length ? cart.map((item) => <Box className="cart-item" key={item.id}><Box className="cart-item-info"><Typography className="table-strong">{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.code} · {money(item.selling_price)} each</Typography><Box className="quantity-control"><IconButton size="small" aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Remove fontSize="small" /></IconButton><TextField size="small" value={item.quantity} type="number" onChange={(e) => updateQuantity(item.id, Number(e.target.value))} inputProps={{ min: 1, max: item.stock_quantity }} /><IconButton size="small" aria-label="Increase quantity" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Add fontSize="small" /></IconButton><IconButton size="small" color="error" aria-label="Remove item" onClick={() => updateQuantity(item.id, 0)}><DeleteOutline fontSize="small" /></IconButton></Box></Box><Typography className="table-strong">{money(item.selling_price * item.quantity)}</Typography></Box>) : <EmptyState title="Your cart is empty" description="Items you add will appear here." />}</Box>
      <Divider />
      <Box className="bill-totals"><Box><Typography>Subtotal</Typography><Typography>{money(subtotal)}</Typography></Box><Box className="discount-row"><Typography>Discount</Typography><TextField type="number" size="small" value={discount} onChange={(e) => setDiscount(e.target.value)} inputProps={{ min: 0, step: "0.01" }} /></Box><Box><Typography>Tax ({taxRate}%)</Typography><Typography>{money(tax)}</Typography></Box><Box className="total-row"><Typography>Total due</Typography><Typography>{money(total)}</Typography></Box></Box>
      <Box className="payment-fields"><TextField fullWidth size="small" label="Customer name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /><TextField fullWidth size="small" label="Customer phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /><TextField select fullWidth size="small" label="Payment method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>{["Cash", "UPI", "Card"].map((method) => <MenuItem key={method} value={method}>{method}</MenuItem>)}</TextField>{paymentMethod === "Cash" && <><TextField fullWidth size="small" type="number" label="Amount received (₹)" value={received} onChange={(e) => setReceived(e.target.value)} inputProps={{ min: 0, step: "0.01" }} /><Box className="change-row"><Typography>Change</Typography><Typography>{money(change)}</Typography></Box></>}</Box>
      {discountAmount > subtotal && <Typography color="error" variant="caption" sx={{ px: 2.5, pb: 1 }}>Discount cannot exceed subtotal.</Typography>}
      <Button fullWidth size="large" variant="contained" disabled={!cart.length || busy || discountAmount > subtotal || (paymentMethod === "Cash" && Number(received) < total)} onClick={finishSale}>{busy ? "Completing sale…" : `Complete sale · ${money(total)}`}</Button>
    </Paper>
  </Box>;
}

function ProductTile({ product, onClick }) {
  return <Button className="product-tile" onClick={onClick} disabled={!product.stock_quantity}><Box className="tile-symbol"><Inventory2Outlined /></Box><Box className="tile-copy"><Typography>{product.name}</Typography><Typography variant="caption">{product.code} · {product.stock_quantity} in stock</Typography></Box><Typography className="tile-price">{money(product.selling_price)}</Typography></Button>;
}

function ProductsPage({ products, productQuery, setProductQuery, categories, setProductDialog, deleteItem }) {
  return <Paper className="panel table-panel" elevation={0}><Box className="table-toolbar"><TextField size="small" placeholder="Search products, codes, barcodes…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /><Typography variant="body2" color="text.secondary">{products.length} products</Typography></Box>
    {products.length ? <Table><TableHead><TableRow><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell>Code / barcode</TableCell><TableCell align="right">Purchase</TableCell><TableCell align="right">Selling</TableCell><TableCell align="right">Stock</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{products.map((p) => <TableRow key={p.id}><TableCell><Typography className="table-strong">{p.name}</Typography></TableCell><TableCell>{p.category_name || "—"}</TableCell><TableCell><Typography variant="body2">{p.code}</Typography><Typography variant="caption" color="text.secondary">{p.barcode || "No barcode"}</Typography></TableCell><TableCell align="right">{money(p.purchase_price)}</TableCell><TableCell align="right">{money(p.selling_price)}</TableCell><TableCell align="right"><Chip size="small" label={p.stock_quantity} color={p.stock_quantity < 5 ? "warning" : "default"} /></TableCell><TableCell align="right"><IconButton title="Edit product" onClick={() => setProductDialog({ ...p })}><EditOutlined fontSize="small" /></IconButton><IconButton title="Delete product" color="error" onClick={() => deleteItem("product", p)}><DeleteOutline fontSize="small" /></IconButton></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No products found" description="Add a product to start building your inventory." />}</Paper>;
}

function CategoriesPage({ categories, setCategoryDialog, deleteItem }) {
  return <Paper className="panel table-panel" elevation={0}>{categories.length ? <Table><TableHead><TableRow><TableCell>Category</TableCell><TableCell>Products</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{categories.map((category) => <TableRow key={category.id}><TableCell className="table-strong">{category.name}</TableCell><TableCell>{category.product_count}</TableCell><TableCell align="right"><IconButton title="Edit category" onClick={() => setCategoryDialog({ id: category.id, name: category.name })}><EditOutlined fontSize="small" /></IconButton><IconButton title="Delete category" color="error" onClick={() => deleteItem("category", category)}><DeleteOutline fontSize="small" /></IconButton></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No categories yet" description="Create categories to keep your products organized." />}</Paper>;
}

function SalesPage({ sales, saleQuery, setSaleQuery, fromDate, setFromDate, toDate, setToDate, loadSales, setInvoice }) {
  return <Paper className="panel table-panel" elevation={0}><Box className="table-toolbar filters"><TextField size="small" placeholder="Search invoice…" value={saleQuery} onChange={(e) => setSaleQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadSales()} /><TextField size="small" type="date" label="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} /><TextField size="small" type="date" label="To" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} /><Button variant="contained" onClick={loadSales}>Apply filters</Button></Box>
    {sales.length ? <Table><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date & time</TableCell><TableCell>Payment</TableCell><TableCell align="right">Subtotal</TableCell><TableCell align="right">Discount</TableCell><TableCell align="right">Total</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>{sales.map((sale) => <TableRow key={sale.id}><TableCell className="table-strong">{sale.invoice_number}</TableCell><TableCell>{dateTime(sale.created_at)}</TableCell><TableCell><Chip size="small" label={sale.payment_method || "—"} variant="outlined" /></TableCell><TableCell align="right">{money(sale.subtotal)}</TableCell><TableCell align="right">{money(sale.discount)}</TableCell><TableCell align="right" className="table-strong">{money(sale.total)}</TableCell><TableCell align="right"><IconButton title="View / reprint invoice" onClick={() => window.rsMall.getSale(sale.id).then(setInvoice).catch(showError)}><PrintOutlined fontSize="small" /></IconButton></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No invoices found" description="Completed sales will be saved here for lookup and reprinting." />}</Paper>;
}

function DailySummaryPage({ summary }) {
  return <Box className="stats-grid">{[
    ["Total sales", money(summary?.sales), "blue"],
    ["Number of invoices", summary?.invoices ?? 0, "green"],
    ["Cash sales", money(summary?.payments?.Cash), "purple"],
    ["UPI sales", money(summary?.payments?.UPI), "orange"],
    ["Card sales", money(summary?.payments?.Card), "blue"]
  ].map(([label, value, tint]) => <Paper className="stat-card" key={label} elevation={0}><Box className={`stat-icon ${tint}`}><TrendingUpOutlined /></Box><Box><Typography className="stat-label">{label}</Typography><Typography className={`stat-value ${typeof value === "string" && value.length > 10 ? "stat-subvalue" : ""}`}>{value}</Typography><Typography className="stat-foot">Today's figures</Typography></Box></Paper>)}</Box>;
}

function SettingsPage({ settingsDraft, setSettingsDraft, saveShopSettings }) {
  const fields = [["shop_name", "Shop name"], ["shop_address", "Shop address"], ["contact_number", "Contact number"], ["gstin", "GSTIN (optional)"], ["tax_rate", "Tax rate (%)"], ["invoice_footer", "Invoice footer"]];
  return <Paper className="panel settings-panel" elevation={0}><Typography variant="h6">Invoice details</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>These details are shown on printed invoices and receipts.</Typography><Box className="settings-grid">{fields.map(([key, label]) => <TextField key={key} label={label} value={settingsDraft[key] || ""} multiline={key === "shop_address" || key === "invoice_footer"} minRows={key === "shop_address" || key === "invoice_footer" ? 2 : 1} type={key === "tax_rate" ? "number" : "text"} inputProps={key === "tax_rate" ? { min: 0, max: 100, step: "0.01" } : undefined} onChange={(e) => setSettingsDraft({ ...settingsDraft, [key]: e.target.value })} />)}<TextField select label="Currency" value={settingsDraft.currency || "INR"} onChange={(e) => setSettingsDraft({ ...settingsDraft, currency: e.target.value })}>{["INR", "USD", "EUR", "GBP"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Box><Button sx={{ mt: 3 }} variant="contained" onClick={saveShopSettings}>Save settings</Button></Paper>;
}

function InvoiceDialog({ invoice, settings, onClose }) {
  if (!invoice) return null;
  function printInvoice() {
    const content = document.getElementById("invoice-print");
    const printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow || !content) return;
    printWindow.document.write(`<html><head><title>${invoice.invoice_number}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#17263a}h1{text-align:center;margin:0}p{text-align:center}.meta{display:flex;justify-content:space-between;margin:24px 0}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #ddd}td:last-child,th:last-child{text-align:right}.totals{margin:20px 0 0 auto;width:260px}.totals div{display:flex;justify-content:space-between;padding:5px}.grand{font-weight:bold;font-size:18px;border-top:1px solid #333}.footer{text-align:center;margin-top:30px}</style></head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
  const items = invoice.items || [];
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm"><DialogTitle className="invoice-dialog-title">Invoice <span>{invoice.invoice_number}</span></DialogTitle><DialogContent dividers><Box id="invoice-print" className="invoice-paper"><Typography variant="h5" align="center" fontWeight={700}>{settings.shop_name || "RS-Mall"}</Typography><Typography align="center" color="text.secondary">{settings.shop_address}</Typography><Typography align="center" color="text.secondary">{settings.contact_number}{settings.gstin ? ` · GSTIN: ${settings.gstin}` : ""}</Typography><Box className="invoice-meta"><Typography>Invoice: <strong>{invoice.invoice_number}</strong></Typography><Typography>{dateTime(invoice.created_at)}</Typography></Box>{invoice.customer_name && <Typography sx={{ mb: 1, fontSize: 11 }}>Customer: {invoice.customer_name}{invoice.customer_phone ? ` · ${invoice.customer_phone}` : ""}</Typography>}<Table size="small"><TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead><TableBody>{items.map((item, index) => <TableRow key={`${item.product_code}-${index}`}><TableCell>{item.product_name}<Typography variant="caption" display="block">{item.product_code}</Typography></TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{money(item.unit_price)}</TableCell><TableCell align="right">{money(item.line_total)}</TableCell></TableRow>)}</TableBody></Table><Box className="invoice-totals"><Box><span>Subtotal</span><span>{money(invoice.subtotal)}</span></Box><Box><span>Discount</span><span>− {money(invoice.discount)}</span></Box><Box><span>Tax</span><span>{money(invoice.tax)}</span></Box><Box className="invoice-grand"><span>Total</span><span>{money(invoice.total)}</span></Box><Box><span>Payment method</span><span>{invoice.payment_method}</span></Box></Box><Typography className="invoice-footer">{settings.invoice_footer || "Thank you for shopping with us!"}</Typography></Box></DialogContent><DialogActions><Button onClick={onClose} color="inherit">Close</Button><Button onClick={printInvoice} variant="contained" startIcon={<PrintOutlined />}>Print / Save PDF</Button></DialogActions></Dialog>;
}

function EmptyState({ title, description }) {
  return <Box className="empty-state"><Box className="empty-icon"><Inventory2Outlined /></Box><Typography fontWeight={600}>{title}</Typography><Typography variant="body2" color="text.secondary">{description}</Typography></Box>;
}

export default App;
