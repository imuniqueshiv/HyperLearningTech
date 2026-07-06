"use client";

import * as React from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeContextValue {
  theme: Theme | undefined;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme | undefined;
  themes: Theme[];
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

function subscribeToTheme(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function readStoredTheme(defaultTheme: Theme): Theme {
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) || defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const [themeOverride, setThemeOverride] = React.useState<Theme | null>(null);

  const storedTheme = React.useSyncExternalStore(
    subscribeToTheme,
    () => readStoredTheme(defaultTheme),
    () => defaultTheme
  );

  const theme = themeOverride ?? storedTheme;

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeOverride(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme: theme,
      themes: ["light", "dark"] as Theme[],
    }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (!context) {
    return {
      theme: undefined,
      setTheme: () => {},
      resolvedTheme: undefined,
      themes: ["light", "dark"],
    };
  }

  return context;
}
