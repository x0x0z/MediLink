import React, { useEffect, useRef } from "react";
import { Animated, View, type StyleProp, type ViewStyle } from "react-native";

import { withAlpha } from "@/src/theme/color-utils";
import { useAppTheme } from "@/src/theme/theme-provider";

type SkeletonVariant = "text" | "card" | "list-item" | "custom";

type SkeletonLoaderProps = {
  variant?: SkeletonVariant;
  width?: number | `${number}%`;
  height?: number;
  lineCount?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonLoader({
  variant = "text",
  width,
  height,
  lineCount = 1,
  style,
}: SkeletonLoaderProps) {
  const { theme } = useAppTheme();
  const shimmer = useRef(new Animated.Value(-1)).current;
  const baseColor = withAlpha(
    theme.colors.textSecondary,
    theme.mode === "dark" ? 0.16 : 0.08
  );
  const shimmerColor = withAlpha(
    theme.colors.textSecondary,
    theme.mode === "dark" ? 0.28 : 0.16
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmer]);

  const defaults = resolveDefaults(variant);
  const rows = Math.max(1, lineCount);

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {Array.from({ length: rows }, (_, index) => {
        const itemWidth =
          rows > 1 && variant === "text" && index === rows - 1
            ? "65%"
            : width ?? defaults.width;

        return (
          <View
            key={`skeleton-row-${index}`}
            style={[
              {
                width: itemWidth,
                height: height ?? defaults.height,
                borderRadius: defaults.borderRadius,
                backgroundColor: baseColor,
                overflow: "hidden",
              },
              style,
            ]}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "55%",
                backgroundColor: shimmerColor,
                transform: [
                  {
                    translateX: shimmer.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-180, 180],
                    }),
                  },
                ],
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

export function resolveDefaults(variant: SkeletonVariant) {
  if (variant === "card") {
    return {
      width: "100%" as const,
      height: 120,
      borderRadius: 14,
    };
  }

  if (variant === "list-item") {
    return {
      width: "100%" as const,
      height: 56,
      borderRadius: 12,
    };
  }

  if (variant === "custom") {
    return {
      width: "100%" as const,
      height: 14,
      borderRadius: 8,
    };
  }

  return {
    width: "100%" as const,
    height: 12,
    borderRadius: 999,
  };
}
