import { Inventory2Outlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

export default function EmptyState({ title, description }) {
  return (
    <Box className="empty-state">
      <Box className="empty-icon"><Inventory2Outlined /></Box>
      <Typography fontWeight={600}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{description}</Typography>
    </Box>
  );
}
