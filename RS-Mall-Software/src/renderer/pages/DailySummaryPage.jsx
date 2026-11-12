import { TrendingUpOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";

export default function DailySummaryPage({ summary, money }) {
  const cards = [
    ["Total sales", money(summary?.sales), "blue"],
    ["Number of invoices", summary?.invoices ?? 0, "green"],
    ["Cash sales", money(summary?.payments?.Cash), "purple"],
    ["UPI sales", money(summary?.payments?.UPI), "orange"],
    ["Card sales", money(summary?.payments?.Card), "blue"]
  ];
  return <Box className="stats-grid">{cards.map(([label, value, tint]) => <Paper className="stat-card" key={label} elevation={0}><Box className={`stat-icon ${tint}`}><TrendingUpOutlined /></Box><Box><Typography className="stat-label">{label}</Typography><Typography className={`stat-value ${typeof value === "string" && value.length > 10 ? "stat-subvalue" : ""}`}>{value}</Typography><Typography className="stat-foot">Today's figures</Typography></Box></Paper>)}</Box>;
}
