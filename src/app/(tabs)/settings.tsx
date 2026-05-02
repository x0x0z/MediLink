import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Card } from "@/components/card";

import { type AccountType, useAccountType } from "@/src/account/account-store";
import { useAppTheme } from "@/src/theme/theme-provider";

type SettingDetailSection =
  | "account"
  | "profile"
  | "caregivers"
  | "device"
  | "recordings"
  | "notifications"
  | "appearance"
  | "enterprise"
  | "about";

type QuickLinkItem = {
  id: SettingDetailSection;
  label: string;
  caption: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const accountType = useAccountType();

  const links = useMemo(() => buildQuickLinks(accountType), [accountType]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
      }}
      style={{ backgroundColor: theme.colors.background }}
    >
      <Card
        padding="none"
        style={{
          overflow: "hidden",
        }}
      >
        {links.map((link, index) => {
          const isLast = index === links.length - 1;

          return (
            <Pressable
              key={link.id}
              accessibilityRole="button"
              onPress={() => router.push(`/settings/${link.id}` as Href)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceRaised,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: theme.radius.sm,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={link.icon}
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  selectable
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.family.primary,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.semibold,
                  }}
                >
                  {link.label}
                </Text>
                <Text
                  selectable
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.family.secondary,
                    fontSize: theme.typography.size.xs,
                    fontWeight: theme.typography.weight.regular,
                  }}
                >
                  {link.caption}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          );
        })}
      </Card>
    </ScrollView>
  );
}

function buildQuickLinks(accountType: AccountType): QuickLinkItem[] {
  const links: QuickLinkItem[] = [
    {
      id: "account",
      label: "Account",
      caption: "Display name, account type, and sign out.",
      icon: "person-circle-outline",
    },
    {
      id: "profile",
      label: "Elderly User Profile",
      caption: "View and edit care recipient profile details.",
      icon: "id-card-outline",
    },
    {
      id: "caregivers",
      label: "Caregivers",
      caption: "Manage linked caregivers and invite access.",
      icon: "people-outline",
    },
    {
      id: "device",
      label: "Device",
      caption: "Device pairing, firmware, and retention controls.",
      icon: "hardware-chip-outline",
    },
    {
      id: "recordings",
      label: "Recordings",
      caption: "Access archive and recording retention settings.",
      icon: "videocam-outline",
    },
    {
      id: "notifications",
      label: "Notifications",
      caption: "Configure dose and safety alert toggles.",
      icon: "notifications-outline",
    },
    {
      id: "appearance",
      label: "Appearance",
      caption: "Control light and dark mode preferences.",
      icon: "contrast-outline",
    },
  ];

  if (accountType === "Enterprise") {
    links.push({
      id: "enterprise",
      label: "Enterprise",
      caption: "Manage clinic and pharmacy integrations.",
      icon: "business-outline",
    });
  }

  links.push({
    id: "about",
    label: "About",
    caption: "App version, Terms of Service, and Privacy Policy.",
    icon: "information-circle-outline",
  });

  return links;
}
