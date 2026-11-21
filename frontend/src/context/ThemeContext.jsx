import { createContext, useContext, useState, useEffect } from "react";

const DARK = {
  bg:             "#09090f",
  sidebar:        "#0c0c14",
  card:           "#101018",
  inner:          "#0d0d16",
  border:         "#1a1a28",
  borderInput:    "#1e1e30",
  text:           "#e8e8f4",
  textSec:        "#525270",
  textMuted:      "#3a3a55",
  btnPrimary:     "#3b82f6",
  btnPrimaryText: "#ffffff",
  accent:         "#3b82f6",
  accentDim:      "rgba(59,130,246,0.08)",
  success:        "#10b981",
  warning:        "#f59e0b",
  danger:         "#ef4444",
  tooltipBg:      "#101018",
  tooltipBorder:  "#1a1a28",
  tableHead:      "#0d0d16",
  name:           "dark",
};

const LIGHT = {
  bg:             "#f5f4f0",
  sidebar:        "#edebe5",
  card:           "#ffffff",
  inner:          "#f5f4f0",
  border:         "#e0ddd6",
  borderInput:    "#d4d0c9",
  text:           "#0d0d0a",
  textSec:        "#706d68",
  textMuted:      "#a5a29d",
  btnPrimary:     "#0d0d0a",
  btnPrimaryText: "#ffffff",
  accent:         "#2563eb",
  accentDim:      "rgba(37,99,235,0.08)",
  success:        "#16a34a",
  warning:        "#d97706",
  danger:         "#dc2626",
  tooltipBg:      "#ffffff",
  tooltipBorder:  "#e0ddd6",
  tableHead:      "#f5f4f0",
  name:           "light",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("pg-theme");
    return saved ? saved === "dark" : true; // default dark
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem("pg-theme", next ? "dark" : "light");
      return next;
    });
  };

  const C = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ C, isDark, toggleTheme }}>
      <div style={{ background: C.bg, minHeight: "100vh", transition: "background 0.2s" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
