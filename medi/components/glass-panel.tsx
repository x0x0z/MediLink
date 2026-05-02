// GlassPanel: A reusable frosted glass component with blur and gradient effects.
// Used throughout the app to create modern "liquid glass" surfaces that look great in dark mode.
// The component gracefully falls back if blur/gradient packages aren't available.

import React from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";

import { useAppTheme } from "@/src/theme/theme-provider";
// Note: some environments may not have the expo packages installed; declare them as any to avoid type issues
let LinearGradient: any = null;
let BlurView: any = null;
/*
  The runtime requires are intentional so the package remains optional.
  Disable the linter rules that forbid require() and importing after other statements
  for this small, guarded block.
*/
/* eslint-disable @typescript-eslint/no-require-imports */
try {
  const lg = require("expo-linear-gradient");
  LinearGradient = lg?.LinearGradient ?? lg;

  const bb = require("expo-blur");
  BlurView = bb?.BlurView ?? bb;
} catch {
  LinearGradient = null;
  BlurView = null;
}
/* eslint-enable @typescript-eslint/no-require-imports */

type GlassPanelProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: string;
  stops?: string[];
  intensity?: number;
};

function GlassPanel({
  children,
  style,
  tint,
  stops,
  intensity = 40,
}: GlassPanelProps) {
  const { theme } = useAppTheme();
  const gradientStops = stops ?? [
    theme.colors.glassTint ?? "rgba(255,255,255,0.04)",
    "transparent",
  ];
  const blurTint = tint ?? (theme.mode === "dark" ? "dark" : "light");

  const glowStyle: ViewStyle = {
    shadowColor:
      theme.mode === "dark" ? theme.colors.primary : theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  };

  if (BlurView && LinearGradient) {
    return (
      <BlurView
        intensity={intensity}
        tint={blurTint}
        style={[{ overflow: "hidden" }, glowStyle, style]}
      >
        <LinearGradient
          colors={gradientStops}
          pointerEvents="none"
          style={{ position: "absolute", inset: 0 }}
        />
        <View style={{ flex: 1 }}>{children}</View>
      </BlurView>
    );
  }

  // Fallback: no native blur/gradient available — render a tinted view with glass color
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.glass ?? "transparent",
          overflow: "hidden",
        },
        glowStyle,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: gradientStops[0],
        }}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export default GlassPanel;
