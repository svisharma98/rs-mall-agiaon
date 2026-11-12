import {
  AssessmentOutlined, CategoryOutlined, DashboardOutlined, Inventory2Outlined,
  PointOfSaleOutlined, ReceiptLongOutlined, SettingsOutlined, StorefrontOutlined
} from "@mui/icons-material";
import { Box, Button, Divider, Typography } from "@mui/material";

const links = [
  ["Dashboard", DashboardOutlined],
  ["Daily summary", AssessmentOutlined],
  ["Point of Sale", PointOfSaleOutlined],
  ["Products", Inventory2Outlined],
  ["Categories", CategoryOutlined],
  ["Sales history", ReceiptLongOutlined],
  ["Settings", SettingsOutlined]
];

export default function Sidebar({ page, setPage }) {
  return (
    <Box className="sidebar">
      <Box className="brand">
        <Box className="brand-mark"><StorefrontOutlined /></Box>
        <Box>
          <Typography className="brand-name">RS-Mall</Typography>
          <Typography className="brand-caption">BILLING SOFTWARE</Typography>
        </Box>
      </Box>
      <Typography className="nav-caption">WORKSPACE</Typography>
      <Box className="nav-list">
        {links.map(([label, Icon]) => (
          <Button
            key={label}
            className={`nav-item ${page === label ? "selected" : ""}`}
            onClick={() => setPage(label)}
            startIcon={<Icon />}
            fullWidth
          >
            {label}
            {label === "Point of Sale" && <span className="nav-shortcut">F2</span>}
          </Button>
        ))}
      </Box>
      <Box className="sidebar-bottom">
        <Divider sx={{ borderColor: "rgba(255,255,255,.1)", mb: 2 }} />
        <Box className="store-status"><span className="status-dot" /> Offline ready</Box>
        <Typography className="sidebar-version">Phase 1 · Local database</Typography>
      </Box>
    </Box>
  );
}
