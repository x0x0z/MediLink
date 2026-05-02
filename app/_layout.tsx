// Main app entry point that sets up navigation and theming for the entire app.
// This file defines the root navigation structure and ensures all screens use a consistent theme.

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AppThemeProvider, useAppTheme } from "@/src/theme/theme-provider";

export const unstable_settings = {
  anchor: "onboarding",
};

function RootNavigation() {
  const { colorMode, theme } = useAppTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerTintColor: theme.colors.textPrimary,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
            fontFamily: theme.typography.family.primary,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-medication"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="quick-add-modal"
          options={{ presentation: "modal", title: "Quick Add" }}
        />
        <Stack.Screen
          name="alert-details"
          options={{ presentation: "fullScreenModal", title: "Alert Details" }}
        />
        <Stack.Screen
          name="live-camera"
          options={{
            title: "Live Camera",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="recordings"
          options={{
            title: "Recordings",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="recordings/[recordingId]"
          options={{
            title: "Recording Detail",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="send-reminder"
          options={{
            title: "Send Reminder",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="health-report"
          options={{
            title: "Health Report",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="settings/[section]"
          options={{
            headerBackButtonDisplayMode: "minimal",
          }}
        />
      </Stack>
      <StatusBar style={colorMode === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <RootNavigation />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
