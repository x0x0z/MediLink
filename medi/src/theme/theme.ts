export type ColorMode = "light" | "dark";

type ColorTokens = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  glass: string;
  glassBorder: string;
  glassTint: string;
  primary: string;
  primaryMuted: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  alert: string;
  success: string;
  warning: string;
  info: string;
  overlay: string;
  overlayStrong: string;
};

type SpacingTokens = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

type RadiusTokens = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

type TypographyTokens = {
  family: {
    primary: string;
    secondary: string;
    mono: string;
  };
  size: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  weight: {
    regular: "400";
    medium: "500";
    semibold: "600";
    bold: "700";
  };
};

export type AppTheme = {
  mode: ColorMode;
  colors: ColorTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  typography: TypographyTokens;
};

const spacing: SpacingTokens = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
};

const radius: RadiusTokens = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
};

const typography: TypographyTokens = {
  family: {
    primary: "ui-sans-serif",
    secondary: "ui-sans-serif",
    mono: "ui-monospace",
  },
  size: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 32,
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

const lightColors: ColorTokens = {
  background: "#F5F8FF",
  surface: "#F8FBFF",
  surfaceRaised: "#FFFFFF",
  border: "#D8E1F2",
  glass: "rgba(255,255,255,0.72)",
  glassBorder: "rgba(15,23,42,0.06)",
  glassTint: "rgba(29,78,216,0.06)",
  primary: "#0F172A",
  primaryMuted: "#E3E8FF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textInverse: "#FFFFFF",
  alert: "#E11D48",
  success: "#0F9D7A",
  warning: "#C97713",
  info: "#2563EB",
  overlay: "rgba(255,255,255,0.8)",
  overlayStrong: "rgba(255,255,255,0.96)",
};

const darkColors: ColorTokens = {
  background: "#0a0a0a",
  surface: "rgba(10,10,10,0.6)",
  surfaceRaised: "rgba(255,255,255,0.02)",
  border: "#1b1b1f",
  glass: "rgba(255,255,255,0.03)",
  glassBorder: "rgba(255,255,255,0.05)",
  glassTint: "rgba(29,78,216,0.06)",
  primary: "#ffffff",
  primaryMuted: "#27272a",
  textPrimary: "#ffffff",
  textSecondary: "#d1d5db",
  textInverse: "#0a0a0a",
  alert: "#f43f5e",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#1d4ed8",
  overlay: "rgba(0, 0, 0, 0.28)",
  overlayStrong: "rgba(0, 0, 0, 0.6)",
};

export function buildTheme(mode: ColorMode): AppTheme {
  return {
    mode,
    colors: mode === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    typography,
  };
}
