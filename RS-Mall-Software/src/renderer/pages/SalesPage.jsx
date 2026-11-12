import {
  CalendarMonthOutlined,
  PaymentsOutlined,
  PrintOutlined,
  ReceiptLongOutlined,
  Search,
} from "@mui/icons-material";
import {
  Box,
  Button,
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
import { dateTime } from "../utils/format.js";

export default function SalesPage({
  sales,
  saleQuery,
  setSaleQuery,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  loadSales,
  setInvoice,
  showError,
  money,
}) {
  return (
    <Paper className="panel table-panel sales-panel" elevation={0}>
      <Box className="sales-toolbar">
        <Box className="sales-toolbar-copy">
          <Typography className="sales-toolbar-title">Sales history</Typography>
          <Typography className="sales-toolbar-description">
            Find completed invoices and quickly view or reprint a bill.
          </Typography>
        </Box>
        <Chip
          className="sales-count"
          icon={<ReceiptLongOutlined />}
          label={`${sales.length} ${sales.length === 1 ? "invoice" : "invoices"}`}
          size="small"
        />
      </Box>
      <Box className="sales-filters">
        <TextField
          className="sales-search"
          size="small"
          placeholder="Search invoice number…"
          value={saleQuery}
          onChange={(e) => setSaleQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadSales()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          className="sales-date-filter"
          size="small"
          type="date"
          label="From"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonthOutlined />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          className="sales-date-filter"
          size="small"
          type="date"
          label="To"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonthOutlined />
              </InputAdornment>
            ),
          }}
        />
        <Button className="sales-filter-button" variant="contained" onClick={loadSales}>
          Apply filters
        </Button>
      </Box>
      {sales.length ? (
        <Box className="sales-table-wrap">
          <Table className="sales-table">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Date &amp; time</TableCell>
                <TableCell>Payment method</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="right">Discount</TableCell>
                <TableCell align="right">Total amount</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => {
                const paymentMethod = sale.payment_method || "";
                const paymentClass = ["cash", "upi", "card"].includes(paymentMethod.toLowerCase())
                  ? paymentMethod.toLowerCase()
                  : "other";

                return (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Box className="sales-invoice-identity">
                        <Box className="sales-invoice-icon">
                          <ReceiptLongOutlined />
                        </Box>
                        <Typography className="sales-invoice-number">
                          {sale.invoice_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell className="sales-date-cell">
                      {dateTime(sale.created_at)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        className={`sales-payment sales-payment-${paymentClass}`}
                        icon={<PaymentsOutlined />}
                        size="small"
                        label={paymentMethod || "Not specified"}
                      />
                    </TableCell>
                    <TableCell align="right" className="sales-money-cell">
                      {money(sale.subtotal)}
                    </TableCell>
                    <TableCell align="right" className="sales-discount-cell">
                      {money(sale.discount)}
                    </TableCell>
                    <TableCell align="right" className="sales-total-cell">
                      {money(sale.total)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        className="sales-view-action"
                        title="View / reprint invoice"
                        aria-label={`View or reprint invoice ${sale.invoice_number}`}
                        onClick={() =>
                          window.rsMall
                            .getSale(sale.id)
                            .then(setInvoice)
                            .catch(showError)
                        }
                      >
                        <PrintOutlined fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <EmptyState
          title={saleQuery || fromDate || toDate ? "No matching invoices" : "No invoices yet"}
          description={
            saleQuery || fromDate || toDate
              ? "Try changing the invoice number or date range."
              : "Completed sales will appear here for lookup and reprinting."
          }
        />
      )}
    </Paper>
  );
}
