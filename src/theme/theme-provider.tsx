// Theme Provider: Manages the app's color scheme (light/dark mode) and provides
// theme colors and typography to all components through React Context.
// This ensures consistent styling across the entire app.

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from "@react-navigation/native";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, type ColorSchemeName } from "react-native";

import { buildTheme, type AppTheme, type ColorMode } from "@/src/theme/theme";

type AppThemeContextValue = {
  colorMode: ColorMode;
  setColorMode: React.Dispatch<React.SetStateAction<ColorMode>>;
  theme: AppTheme;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function getColorMode(scheme: ColorSchemeName): ColorMode {
  return scheme === "dark" ? "dark" : "light";
}

function buildNavigationTheme(theme: AppTheme): Theme {
  const baseTheme = theme.mode === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surfaceRaised,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.alert,
    },
  };
}

type ProviderProps = {
  children: React.ReactNode;
};

export function AppThemeProvider({ children }: ProviderProps) {
  const [colorMode, setColorMode] = useState<ColorMode>(
    getColorMode(Appearance.getColorScheme())
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorMode(getColorMode(colorScheme));
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const theme = useMemo(() => buildTheme(colorMode), [colorMode]);
  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);
  const value = useMemo(
    () => ({ colorMode, setColorMode, theme }),
    [colorMode, theme]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>
        {children}
      </NavigationThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider.");
  }

  return context;
}
