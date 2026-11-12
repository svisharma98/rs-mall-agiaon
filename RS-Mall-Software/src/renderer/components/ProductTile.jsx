import { AddShoppingCartOutlined, Inventory2Outlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";

export default function ProductTile({ product, onClick, money }) {
  const stock = Number(product.stock_quantity);
  return (
    <Button className="product-tile" onClick={onClick} disabled={!product.stock_quantity}>
      <Box className="tile-topline">
        <Box className="tile-symbol"><Inventory2Outlined /></Box>
        <Chip size="small" className={`tile-stock ${stock < 5 ? "low" : ""}`} label={stock ? `${stock} left` : "Out of stock"} />
      </Box>
      <Box className="tile-copy">
        <Typography className="tile-name">{product.name}</Typography>
        <Typography className="tile-code">{product.code}{product.category_name ? ` · ${product.category_name}` : ""}</Typography>
      </Box>
      <Box className="tile-bottom">
        <Typography className="tile-price">{money(product.selling_price)}</Typography>
        <span className="tile-add"><AddShoppingCartOutlined /> Add item</span>
      </Box>
    </Button>
  );
}
