import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

export default function Modal({ open, onClose, title, children, onSubmit, submitLabel = "Save", busy = false }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={busy}>{submitLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
