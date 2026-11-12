import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App.jsx";
import "./styles.css";

const theme = createTheme({
  palette: {
    primary: { main: "#183b66", dark: "#102a49" },
    secondary: { main: "#3478d4" },
    success: { main: "#16865a" },
    warning: { main: "#d98622" },
    error: { main: "#cb4b4b" },
    background: { default: "#f4f6fa", paper: "#ffffff" }
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    button: { textTransform: "none", fontWeight: 600 }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, minHeight: 40 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: "#fff" } } }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
