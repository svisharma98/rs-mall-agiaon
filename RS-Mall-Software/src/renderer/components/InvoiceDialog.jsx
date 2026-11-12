import { CheckCircleOutline, PrintOutlined, StorefrontOutlined } from "@mui/icons-material";
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Table,
  TableBody, TableCell, TableHead, TableRow, Typography
} from "@mui/material";
import { dateTime } from "../utils/format.js";

export default function InvoiceDialog({ invoice, settings, onClose, money }) {
  if (!invoice) return null;

  function printInvoice() {
    const content = document.getElementById("invoice-print");
    const printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow || !content) return;
    printWindow.document.write(`<html><head><title>${invoice.invoice_number}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#24364d;background:#f4f6fa}
      .invoice-paper{max-width:720px;margin:auto;padding:34px;background:#fff;border:1px solid #e3e9f1;border-radius:12px}
      .invoice-brand{display:flex;gap:12px;align-items:center;padding-bottom:22px;border-bottom:1px solid #e9edf3}
      .invoice-brand-icon{display:grid;place-items:center;width:44px;height:44px;background:#eaf2fe;color:#3478d4;border-radius:12px;font-size:24px;font-weight:bold}
      .invoice-brand h2{margin:0;color:#183b66;font-size:20px}.invoice-brand p{margin:4px 0 0;color:#748399;font-size:11px}
      .invoice-status{margin-left:auto;padding:7px 10px;border-radius:20px;background:#e9f6ef;color:#218357;font-size:10px;font-weight:bold}
      .invoice-number{margin:22px 0 14px;padding:15px 17px;border-radius:9px;background:#f5f8fc}
      .invoice-number small,.invoice-details small{display:block;color:#7e8da1;font-size:9px;text-transform:uppercase;letter-spacing:1px}
      .invoice-number strong{display:block;margin-top:5px;color:#1b416b;font-size:20px;letter-spacing:1px}
      .invoice-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
      .invoice-meta>div{padding:9px 11px;border:1px solid #edf0f4;border-radius:7px}
      .invoice-meta p{margin:0;color:#8a97a8;font-size:8px;font-weight:bold;letter-spacing:.5px}
      .invoice-meta strong{display:block;margin-top:5px;color:#263a53;font-size:11px}
      .invoice-customer{margin:0 0 16px;padding:11px 13px;border:1px solid #e8edf4;border-radius:8px;font-size:11px}
      table{width:100%;border-collapse:collapse}th{background:#f5f8fc;color:#62738a;font-size:9px;text-transform:uppercase;letter-spacing:.5px}
      th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #edf0f4;font-size:11px}
      td:last-child,th:last-child{text-align:right}.invoice-code{display:block;margin-top:3px;color:#8794a5;font-size:9px}
      .invoice-totals{width:270px;margin:18px 0 0 auto;font-size:11px}
      .invoice-totals div{display:flex;justify-content:space-between;padding:6px 0}
      .invoice-grand{margin-top:5px;padding-top:12px!important;border-top:1px dashed #cbd6e3;font-size:16px;font-weight:bold;color:#183b66}
      .invoice-payment{margin-top:10px;padding:10px 12px;border-radius:7px;background:#f5f8fc;color:#52647a}
      .invoice-shop-name{margin:0;color:#183b66;font-size:18px;font-weight:bold}
      .invoice-shop-contact{margin:4px 0 0;color:#748399;font-size:10px}
      .invoice-number-card{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding:13px 15px;border:1px solid #e5edf8;border-radius:8px;background:#f4f8fe}
      .invoice-number-card p{color:#8492a4;font-size:9px;font-weight:bold;letter-spacing:1px}
      .invoice-number-card strong{color:#1e4d7f;font-size:14px;letter-spacing:.4px}
      .invoice-table-wrap{overflow:hidden;border:1px solid #e9edf3;border-radius:8px}
      .invoice-footer{margin:24px 0 0;padding-top:15px;border-top:1px solid #e9edf3;text-align:center;color:#718197;font-size:11px}
      @media print{body{padding:0;background:#fff}.invoice-paper{border:0;border-radius:0;padding:0;max-width:none}}
    </style></head><body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const items = invoice.items || [];
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="invoice-dialog-title">
        <Box><Typography className="invoice-modal-title">Invoice details</Typography><Typography className="invoice-modal-subtitle">Review your completed transaction</Typography></Box>
        <Chip className="invoice-modal-number" label={invoice.invoice_number} size="small" />
      </DialogTitle>
      <DialogContent dividers>
        <Box id="invoice-print" className="invoice-paper">
          <Box className="invoice-brand">
            <Box className="invoice-brand-icon"><StorefrontOutlined /></Box>
            <Box className="invoice-brand-copy">
              <Typography className="invoice-shop-name">{settings.shop_name || "RS-Mall"}</Typography>
              <Typography className="invoice-shop-contact">{settings.shop_address || "Thank you for shopping with us"}</Typography>
              {(settings.contact_number || settings.gstin) && <Typography className="invoice-shop-contact">{[settings.contact_number, settings.gstin && `GSTIN ${settings.gstin}`].filter(Boolean).join(" · ")}</Typography>}
            </Box>
            <Chip className="invoice-paid-chip" icon={<CheckCircleOutline />} label="Completed" size="small" />
          </Box>
          <Box className="invoice-number-card"><Typography>INVOICE NUMBER</Typography><strong>{invoice.invoice_number}</strong></Box>
          <Box className="invoice-meta">
            <Box><Typography>ISSUED ON</Typography><strong>{dateTime(invoice.created_at)}</strong></Box>
            <Box><Typography>PAYMENT METHOD</Typography><strong>{invoice.payment_method}</strong></Box>
          </Box>
          {invoice.customer_name && <Box className="invoice-customer"><Typography>CUSTOMER</Typography><strong>{invoice.customer_name}</strong>{invoice.customer_phone && <span> · {invoice.customer_phone}</span>}</Box>}
          <Box className="invoice-table-wrap"><Table size="small" className="invoice-table">
            <TableHead><TableRow><TableCell>Item description</TableCell><TableCell align="center">Qty</TableCell><TableCell align="right">Unit price</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
            <TableBody>{items.map((item, index) => (
              <TableRow key={`${item.product_code}-${index}`}>
                <TableCell><strong>{item.product_name}</strong><Typography variant="caption" display="block">{item.product_code}</Typography></TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">{money(item.unit_price)}</TableCell>
                <TableCell align="right" className="invoice-item-total">{money(item.line_total)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></Box>
          <Box className="invoice-totals">
            <Box><span>Subtotal</span><span>{money(invoice.subtotal)}</span></Box>
            {Number(invoice.discount) > 0 && <Box><span>Discount</span><span>− {money(invoice.discount)}</span></Box>}
            <Box><span>Tax</span><span>{money(invoice.tax)}</span></Box>
            <Box className="invoice-grand"><span>Total paid</span><span>{money(invoice.total)}</span></Box>
          </Box>
          <Typography className="invoice-footer">{settings.invoice_footer || "Thank you for shopping with us!"}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Close</Button>
        <Button onClick={printInvoice} variant="contained" startIcon={<PrintOutlined />}>Print / Save PDF</Button>
      </DialogActions>
    </Dialog>
  );
}
