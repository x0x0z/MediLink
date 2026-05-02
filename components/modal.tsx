import React from "react";
import { Modal as NativeModal, Pressable, Text, View } from "react-native";

import { Button } from "@/components/button";
import GlassPanel from "@/components/glass-panel";
import { useAppTheme } from "@/src/theme/theme-provider";

type ModalProps = {
  visible: boolean;
  title: string;
  body: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  destructive?: boolean;
  children?: React.ReactNode;
};

export function Modal({
  visible,
  title,
  body,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
  confirmDisabled = false,
  destructive = false,
  children,
}: ModalProps) {
  const { theme } = useAppTheme();

  if (!visible) {
    return null;
  }

  return (
    <NativeModal
      animationType="fade"
      transparent
      visible
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: theme.colors.overlay,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onCancel}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />

        <GlassPanel
          style={{
            borderWidth: 1,
            borderColor: theme.colors.glassBorder ?? theme.colors.border,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
          stops={
            theme.mode === "dark"
              ? [theme.colors.glassTint, "transparent"]
              : [theme.colors.glassTint, "transparent"]
          }
        >
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.lg,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {title}
          </Text>

          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.regular,
              lineHeight: 21,
            }}
          >
            {body}
          </Text>

          {children}

          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Button
              label={cancelLabel}
              onPress={onCancel}
              variant="ghost"
              fullWidth
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? "destructive" : "primary"}
              disabled={confirmDisabled}
              fullWidth
            />
          </View>
        </GlassPanel>
      </View>
    </NativeModal>
  );
}
