import { Add, DeleteOutline, QrCodeScannerOutlined, Remove, Search, ShoppingCartOutlined, PointOfSaleOutlined, PersonOutline, PaymentsOutlined, Inventory2Outlined } from "@mui/icons-material";
import { Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import EmptyState from "../components/EmptyState.jsx";
import ProductTile from "../components/ProductTile.jsx";

export default function PosPage(props) {
  const {
    products, filteredPos, cart, subtotal, discount, setDiscount, discountAmount, tax, taxRate, total,
    paymentMethod, setPaymentMethod, received, setReceived, change, addToCart, updateQuantity,
    finishSale, busy, posQuery, setPosQuery, handleBarcode, barcodeRef, setPage, clearCart, customerName,
    setCustomerName, customerPhone, setCustomerPhone, money, currencySymbol
  } = props;
  return <Box className="pos-grid">
    <Paper className="panel pos-products" elevation={0}>
      <Box className="catalog-heading">
        <Box><Typography className="catalog-title">Product catalog</Typography><Typography className="catalog-description">Select a product or scan its barcode to add it to the bill.</Typography></Box>
        <Chip className="catalog-count" label={`${products.length} items`} size="small" />
      </Box>
      <Box className="pos-search">
        <TextField fullWidth placeholder="Search name, product code or scan barcode…" value={posQuery} onChange={(e) => setPosQuery(e.target.value)} onKeyDown={handleBarcode} inputRef={barcodeRef} InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>, endAdornment: <InputAdornment position="end"><QrCodeScannerOutlined color="primary" /></InputAdornment> }} />
        <Box className="scan-hint"><QrCodeScannerOutlined /><Typography variant="caption">Barcode scanner ready <span>·</span> Scan or type, then press Enter</Typography></Box>
      </Box>
      {filteredPos.length > 0 && <Typography className="catalog-result-count">{posQuery ? `${filteredPos.length} matching products` : `Showing ${filteredPos.length}${products.length > filteredPos.length ? ` of ${products.length}` : ""} products`}</Typography>}
      {filteredPos.length ? <Box className="product-results">{filteredPos.map((product) => <ProductTile key={product.id} product={product} money={money} onClick={() => addToCart(product)} />)}</Box>
        : <Box className="pos-empty"><Box className="empty-icon"><ShoppingCartOutlined /></Box><Typography variant="h6">{posQuery ? "No products match your search" : "Your catalog is empty"}</Typography><Typography color="text.secondary">{posQuery ? "Try another name, product code, or barcode." : "Add products to your catalog to start billing."}</Typography><Button sx={{ mt: 1.5 }} onClick={() => posQuery ? setPosQuery("") : setPage("Products")}>{posQuery ? "Clear search" : "Add your first product"}</Button></Box>}
    </Paper>
    <Paper className="panel cart-panel" elevation={0}>
      <Box className="cart-heading">
        <Box className="cart-heading-icon"><PointOfSaleOutlined /></Box>
        <Box className="cart-heading-copy">
          <Typography variant="h6">Current bill</Typography>
          <Typography color="text.secondary" variant="body2">{cart.reduce((sum, item) => sum + item.quantity, 0)} items · {cart.length} products</Typography>
        </Box>
        <Button className="clear-cart" disabled={!cart.length} onClick={clearCart}>Clear bill</Button>
      </Box>
      <Box className="cart-items">
        {cart.length ? cart.map((item) => (
          <Box className="cart-item" key={item.id}>
            <Box className="cart-item-icon"><Inventory2Outlined /></Box>
            <Box className="cart-item-content">
              <Box className="cart-item-info">
                <Box className="cart-item-top">
                  <Box className="cart-item-name">
                    <Typography className="table-strong">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Code <span>{item.code}</span></Typography>
                  </Box>
                  <Typography className="cart-line-total">{money(item.selling_price * item.quantity)}</Typography>
                </Box>
                <Box className="cart-item-bottom">
                  <Typography className="cart-unit-price">{money(item.selling_price)} <span>per item</span></Typography>
                  <Box className="quantity-control">
                    <IconButton size="small" aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Remove fontSize="small" /></IconButton>
                    <TextField size="small" value={item.quantity} type="number" onChange={(e) => updateQuantity(item.id, Number(e.target.value))} inputProps={{ min: 1, max: item.stock_quantity, "aria-label": `Quantity of ${item.name}` }} />
                    <IconButton size="small" aria-label="Increase quantity" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Add fontSize="small" /></IconButton>
                  </Box>
                  <IconButton className="remove-item" size="small" aria-label={`Remove ${item.name}`} onClick={() => updateQuantity(item.id, 0)}><DeleteOutline fontSize="small" /></IconButton>
                </Box>
              </Box>
            </Box>
          </Box>
        )) : <Box className="cart-empty"><Box className="cart-empty-icon"><ShoppingCartOutlined /></Box><Typography className="cart-empty-title">Your bill is waiting</Typography><Typography variant="caption">Add products from the catalog and they’ll appear here.</Typography></Box>}
      </Box>
      <Box className="bill-totals">
        <Typography className="bill-section-title">Bill summary</Typography>
        <Box className="bill-total-row"><Typography>Subtotal</Typography><Typography>{money(subtotal)}</Typography></Box>
        <Box className="bill-total-row discount-row"><Typography>Discount</Typography><TextField type="number" size="small" value={discount} onChange={(e) => setDiscount(e.target.value)} inputProps={{ min: 0, step: "0.01", "aria-label": "Bill discount" }} /></Box>
        <Box className="bill-total-row"><Typography>Tax <span>({taxRate}%)</span></Typography><Typography>{money(tax)}</Typography></Box>
        <Box className="total-row"><Box><Typography>Total to pay</Typography><Typography className="total-note">Includes taxes</Typography></Box><Typography>{money(total)}</Typography></Box>
      </Box>
      <Box className="payment-fields">
        <Box className="checkout-section-heading"><PersonOutline /><Typography>Customer <span>· optional</span></Typography></Box>
        <Box className="customer-fields">
          <TextField fullWidth size="small" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} inputProps={{ "aria-label": "Customer name, optional" }} />
          <TextField fullWidth size="small" placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputProps={{ "aria-label": "Customer phone, optional" }} />
        </Box>
        <Box className="checkout-section-heading payment-heading"><PaymentsOutlined /><Typography>Payment method</Typography></Box>
        <ToggleButtonGroup className="payment-methods" exclusive fullWidth size="small" value={paymentMethod} onChange={(_event, value) => value && setPaymentMethod(value)} aria-label="Payment method">
          {["Cash", "UPI", "Card"].map((method) => <ToggleButton key={method} value={method}>{method}</ToggleButton>)}
        </ToggleButtonGroup>
        {paymentMethod === "Cash" && <>
          <TextField fullWidth size="small" label={`Amount received (${currencySymbol})`} value={received} onChange={(e) => setReceived(e.target.value)} type="number" inputProps={{ min: 0, step: "0.01" }} />
          <Box className={`change-row ${change > 0 ? "has-change" : ""}`}><Typography>{change > 0 ? "Change to return" : "Change"}</Typography><Typography>{money(change)}</Typography></Box>
        </>}
      </Box>
      {discountAmount > subtotal && <Typography color="error" variant="caption" sx={{ px: 2.5, pb: 1 }}>Discount cannot exceed subtotal.</Typography>}
      <Button className="complete-sale-button" fullWidth size="large" variant="contained" disabled={!cart.length || busy || discountAmount > subtotal || (paymentMethod === "Cash" && Number(received) < total)} onClick={finishSale}>{busy ? "Completing sale…" : `Complete sale · ${money(total)}`}</Button>
    </Paper>
  </Box>;
}
