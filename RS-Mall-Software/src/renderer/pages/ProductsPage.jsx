import {
  DeleteOutline,
  EditOutlined,
  Inventory2Outlined,
  Search,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EmptyState from "../components/EmptyState.jsx";

export default function ProductsPage({
  products,
  productQuery,
  setProductQuery,
  setProductDialog,
  deleteItem,
  money,
}) {
  return (
    <Paper className="panel table-panel products-panel" elevation={0}>
      <Box className="products-toolbar">
        <Box className="products-toolbar-copy">
          <Typography className="products-toolbar-title">Product inventory</Typography>
          <Typography className="products-toolbar-description">
            Keep your catalog, pricing, and stock up to date.
          </Typography>
        </Box>
        <Box className="products-toolbar-controls">
          <TextField
            className="products-search"
            size="small"
            placeholder="Search products or scan code…"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Chip
            className="products-count"
            icon={<Inventory2Outlined />}
            label={`${products.length} ${products.length === 1 ? "product" : "products"}`}
            size="small"
          />
        </Box>
      </Box>
      {products.length ? (
        <Table className="products-table">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Product code</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center">Availability</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="products-name-cell">
                  <Box className="product-identity">
                    <Box className="product-avatar"><Inventory2Outlined /></Box>
                    <Box className="product-identity-text">
                      <Typography className="table-strong">{p.name}</Typography>
                      <Typography className="product-purchase">
                        Cost {money(p.purchase_price)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    className="product-category"
                    size="small"
                    label={p.category_name || "Uncategorized"}
                  />
                </TableCell>
                <TableCell className="product-code-cell">
                  <Typography className="product-code">{p.code}</Typography>
                  <Typography className="product-barcode">
                    {p.barcode ? `Barcode · ${p.barcode}` : "No barcode assigned"}
                  </Typography>
                </TableCell>
                <TableCell align="right" className="product-price-cell">
                  <Typography className="product-selling-price">{money(p.selling_price)}</Typography>
                  <Typography className="product-price-label">Selling price</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    className={`product-stock ${p.stock_quantity <= 0 ? "out" : p.stock_quantity < 5 ? "low" : "healthy"}`}
                    size="small"
                    label={p.stock_quantity <= 0 ? "Out of stock" : p.stock_quantity < 5 ? `${p.stock_quantity} left` : `${p.stock_quantity} in stock`}
                  />
                </TableCell>
                <TableCell align="right" className="product-actions">
                  <IconButton
                    className="product-edit-action"
                    title="Edit product"
                    onClick={() => setProductDialog({ ...p })}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    title="Delete product"
                    color="error"
                    onClick={() => deleteItem("product", p)}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title={productQuery ? "No matching products" : "Your inventory is empty"}
          description={productQuery ? "Try a different product name, code, or barcode." : "Add your first product to start building your catalog."}
        />
      )}
    </Paper>
  );
}
