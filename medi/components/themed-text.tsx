import { StyleSheet, Text, type TextProps } from "react-native";

import { useAppTheme } from "@/src/theme/theme-provider";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const { theme, colorMode } = useAppTheme();
  const overrideColor = colorMode === "dark" ? darkColor : lightColor;
  const baseColor = overrideColor ?? theme.colors.textPrimary;
  const secondaryColor = overrideColor ?? theme.colors.textSecondary;
  const linkColor = overrideColor ?? theme.colors.primary;
  const resolvedColor =
    type === "link"
      ? linkColor
      : type === "subtitle"
      ? secondaryColor
      : baseColor;

  return (
    <Text
      style={[
        { color: resolvedColor },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
    lineHeight: 22,
  },
  defaultSemiBold: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
});
