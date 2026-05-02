import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/button";
import { ReminderBottomSheet } from "@/components/reminder-bottom-sheet";

import { withAlpha } from "@/src/theme/color-utils";
import { useAppTheme } from "@/src/theme/theme-provider";

export default function LiveCameraScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [isReminderSheetVisible, setIsReminderSheetVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceRaised,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.alert,
            backgroundColor: withAlpha(theme.colors.alert, 0.2),
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 6,
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.alert,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.xs,
              fontWeight: theme.typography.weight.bold,
              letterSpacing: 0.5,
            }}
          >
            LIVE
          </Text>
        </View>

        <Ionicons name="videocam" size={54} color={theme.colors.primary} />

        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
            textAlign: "center",
          }}
        >
          Live camera feed placeholder
        </Text>
      </View>

      <View
        style={{
          position: "absolute",
          top: theme.spacing.xl,
          left: theme.spacing.md,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.overlay,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      <View
        style={{
          position: "absolute",
          left: theme.spacing.lg,
          right: theme.spacing.lg,
          bottom: theme.spacing.xxl + 72,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.overlay,
          padding: theme.spacing.md,
          gap: 4,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          Caregiver: Ana Rivera
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.regular,
            fontVariant: ["tabular-nums"],
          }}
        >
          Apr 17, 2026 · 8:10 AM
        </Text>
      </View>

      <Button
        label="Send Reminder"
        onPress={() => setIsReminderSheetVisible(true)}
        variant="primary"
        style={{
          position: "absolute",
          right: theme.spacing.lg,
          bottom: theme.spacing.xl,
        }}
      />

      <ReminderBottomSheet
        visible={isReminderSheetVisible}
        onClose={() => setIsReminderSheetVisible(false)}
        elderlyName="Marina Rivera"
        caregiverName="Alicia Rivera"
      />
    </View>
  );
}
