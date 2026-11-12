import { Inventory2Outlined, PointOfSaleOutlined, ShoppingCartOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import EmptyState from "../components/EmptyState.jsx";
import { dateTime } from "../utils/format.js";

export default function DashboardPage({ summary, onNewSale, money }) {
  const stats = [
    { title: "Today's sales", value: money(summary?.sales), icon: TrendingUpOutlined, tint: "blue" },
    { title: "Invoices today", value: summary?.invoices ?? "—", icon: PointOfSaleOutlined, tint: "green" },
    { title: "Products", value: summary?.products ?? "—", icon: Inventory2Outlined, tint: "purple" },
    { title: "Customers", value: summary?.customers ?? "—", icon: ShoppingCartOutlined, tint: "orange" }
  ];
  return <>
    <Box className="stats-grid">{stats.map(({ title, value, icon: Icon, tint }) => <Paper className="stat-card" key={title} elevation={0}><Box className={`stat-icon ${tint}`}><Icon /></Box><Box><Typography className="stat-label">{title}</Typography><Typography className="stat-value">{value}</Typography><Typography className="stat-foot">Live store data</Typography></Box></Paper>)}</Box>
    <Box className="dashboard-grid">
      <Paper className="panel sales-overview" elevation={0}>
        <Box className="panel-heading"><Box><Typography variant="h6">Sales overview</Typography><Typography color="text.secondary" variant="body2">Last 7 days</Typography></Box><Chip size="small" label="This week" variant="outlined" /></Box>
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
