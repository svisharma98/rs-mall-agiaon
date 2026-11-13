import { Box, Button, MenuItem, Paper, TextField, Typography } from "@mui/material";

export default function SettingsPage({ settingsDraft, setSettingsDraft, saveShopSettings, createBackup, restoreBackup, busy }) {
  const fields = [["shop_name", "Shop name"], ["shop_address", "Shop address"], ["contact_number", "Contact number"], ["gstin", "GSTIN (optional)"], ["tax_rate", "Tax rate (%)"], ["invoice_footer", "Invoice footer"]];
  return (
    <Box className="settings-sections">
      <Paper className="panel settings-panel" elevation={0}>
        <Typography variant="h6">Invoice details</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>These details are shown on printed invoices and receipts.</Typography>
        <Box className="settings-grid">
          {fields.map(([key, label]) => <TextField key={key} label={label} value={settingsDraft[key] || ""} multiline={key === "shop_address" || key === "invoice_footer"} minRows={key === "shop_address" || key === "invoice_footer" ? 2 : 1} type={key === "tax_rate" ? "number" : "text"} inputProps={key === "tax_rate" ? { min: 0, max: 100, step: "0.01" } : undefined} onChange={(e) => setSettingsDraft({ ...settingsDraft, [key]: e.target.value })} />)}
          <TextField select label="Currency" value={settingsDraft.currency || "INR"} onChange={(e) => setSettingsDraft({ ...settingsDraft, currency: e.target.value })}>{["INR", "USD", "EUR", "GBP"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
        </Box>
        <Button sx={{ mt: 3 }} variant="contained" onClick={saveShopSettings}>Save settings</Button>
      </Paper>
      <Paper className="panel settings-panel backup-panel" elevation={0}>
        <Typography variant="h6">Data backup and restore</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Save a backup file somewhere safe, such as an external drive or cloud storage. After reinstalling RS-Mall, use that file to restore your products, stock, sales, customers, and settings.
        </Typography>
        <Box className="backup-actions">
          <Button variant="contained" onClick={createBackup} disabled={busy}>Back up data</Button>
          <Button variant="outlined" color="error" onClick={restoreBackup} disabled={busy}>Restore from backup</Button>
        </Box>
      </Paper>
    </Box>
  );
}
