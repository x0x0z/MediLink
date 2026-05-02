import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

import { useUnreadAlertsCount } from "@/src/app-state/app-state-store";
import { useAppTheme } from "@/src/theme/theme-provider";

export default function TabLayout() {
  const { theme } = useAppTheme();
  const unreadAlertsCount = useUnreadAlertsCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTintColor: theme.colors.textPrimary,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTitleStyle: {
          color: theme.colors.textPrimary,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
          fontFamily: theme.typography.family.primary,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceRaised,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          borderRadius: theme.radius.md,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.family.primary,
          fontWeight: theme.typography.weight.medium,
          fontSize: theme.typography.size.xs,
        },
        tabBarBadgeStyle: {
          backgroundColor: theme.colors.alert,
          color: theme.colors.textInverse,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }: { color?: string; size?: number }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarLabel: "Schedule",
          tabBarIcon: ({ color, size }: { color?: string; size?: number }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: "Logs",
          tabBarLabel: "Logs",
          tabBarIcon: ({ color, size }: { color?: string; size?: number }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarLabel: "Alerts",
          tabBarBadge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
          tabBarIcon: ({ color, size }: { color?: string; size?: number }) => (
            <Ionicons name="warning-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }: { color?: string; size?: number }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
