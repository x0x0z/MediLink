import React from "react";
import {
  Pressable,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/src/theme/theme-provider";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

type Palette = {
  background: string;
  border: string;
  text: string;
  borderWidth: number;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  leftAdornment,
  rightAdornment,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useAppTheme();
  const palette = resolvePalette(variant, theme.colors);
  const dimensions = resolveDimensions(size);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: dimensions.minHeight,
          borderRadius: theme.radius.md,
          borderWidth: palette.borderWidth,
          borderColor: palette.border,
          backgroundColor: palette.background,
          paddingHorizontal: dimensions.paddingHorizontal,
          paddingVertical: dimensions.paddingVertical,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: theme.spacing.xs,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
          flex: fullWidth ? 1 : undefined,
        },
        style,
      ]}
    >
      {leftAdornment}
      <Text
        selectable
        style={[
          {
            color: palette.text,
            fontFamily: theme.typography.family.primary,
            fontSize: dimensions.fontSize,
            fontWeight: theme.typography.weight.medium,
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
      {rightAdornment}
    </Pressable>
  );
}

function resolvePalette(
  variant: ButtonVariant,
  colors: {
    primary: string;
    primaryMuted: string;
    border: string;
    glassBorder?: string;
    textPrimary: string;
    textSecondary: string;
    textInverse: string;
    alert: string;
  }
): Palette {
  if (variant === "secondary") {
    return {
      background: "transparent",
      border: colors.glassBorder ?? colors.border,
      text: colors.textPrimary,
      borderWidth: 1,
    };
  }

  if (variant === "ghost") {
    return {
      background: "transparent",
      border: "transparent",
      text: colors.textPrimary,
      borderWidth: 0,
    };
  }

  if (variant === "destructive") {
    return {
      background: colors.alert,
      border: colors.alert,
      text: colors.primary,
      borderWidth: 0,
    };
  }

  return {
    background: colors.primary,
    border: colors.primary,
    text: colors.textInverse,
    borderWidth: 0,
  };
}

function resolveDimensions(size: ButtonSize) {
  if (size === "sm") {
    return {
      minHeight: 42,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
    };
  }

  if (size === "lg") {
    return {
      minHeight: 60,
      paddingHorizontal: 24,
      paddingVertical: 16,
      fontSize: 16,
    };
  }

  return {
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
  };
}
