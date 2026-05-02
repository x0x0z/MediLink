import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import GlassPanel from "@/components/glass-panel";
import { useAppTheme } from "@/src/theme/theme-provider";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  contentStyle,
}: BottomSheetProps) {
  const { theme } = useAppTheme();
  const translateY = useRef(new Animated.Value(300)).current;
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
      }).start();

      return;
    }

    Animated.timing(translateY, {
      toValue: 320,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsMounted(false);
    });
  }, [translateY, visible]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal animationType="none" transparent visible onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: theme.colors.overlay,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={{ flex: 1 }}
        />

        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "88%",
              transform: [{ translateY }],
            },
            contentStyle,
          ]}
        >
          <GlassPanel
            style={{
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: theme.colors.glassBorder ?? theme.colors.border,
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
            }}
            stops={
              theme.mode === "dark"
                ? [theme.colors.glassTint, "transparent"]
                : [theme.colors.glassTint, "transparent"]
            }
          >
            <View
              style={{
                width: 42,
                height: 5,
                borderRadius: 999,
                backgroundColor: theme.colors.border,
                alignSelf: "center",
              }}
            />
            {children}
          </GlassPanel>
        </Animated.View>
      </View>
    </Modal>
  );
}
