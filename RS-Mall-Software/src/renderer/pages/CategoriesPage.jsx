import {
  CategoryOutlined,
  DeleteOutline,
  EditOutlined,
  Inventory2Outlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EmptyState from "../components/EmptyState.jsx";

export default function CategoriesPage({
  categories,
  setCategoryDialog,
  deleteItem,
}) {
  return (
    <Paper className="panel categories-panel" elevation={0}>
      <Box className="categories-toolbar">
        <Box>
          <Typography className="categories-toolbar-title">Product categories</Typography>
          <Typography className="categories-toolbar-description">
            Group products into clear, easy-to-manage collections.
          </Typography>
        </Box>
        <Chip
          className="categories-count"
          icon={<CategoryOutlined />}
          label={`${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
          size="small"
        />
      </Box>
      {categories.length ? (
        <Box className="categories-table-wrap">
          <Table className="categories-table">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Products in category</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Box className="category-identity">
                      <Box className={`category-row-icon category-tone-${index % 4}`}>
                        <CategoryOutlined />
                      </Box>
                      <Box>
                        <Typography className="category-row-name">{category.name}</Typography>
                        <Typography className="category-row-caption">Product category</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className={`category-row-count ${category.product_count ? "has-products" : ""}`}
                      icon={<Inventory2Outlined />}
                      label={`${category.product_count} ${category.product_count === 1 ? "product" : "products"}`}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box className="category-row-actions">
                      <Button
                        className="category-edit-button"
                        size="small"
                        startIcon={<EditOutlined />}
                        onClick={() => setCategoryDialog({ id: category.id, name: category.name })}
                      >
                        Edit
                      </Button>
                      <IconButton
                        className="category-delete-button"
                        title="Delete category"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => deleteItem("category", category)}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <EmptyState title="No categories yet" description="Create categories to keep your products organized." />
      )}
    </Paper>
  );
}
