import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import React from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";

import { OnboardingStepShell } from "@/components/onboarding-step-shell";
import {
  hasElderlyProfileInfo,
  recordDeviceSync,
  setDevicePaired,
} from "@/src/app-state/app-state-store";
import { useAppTheme } from "@/src/theme/theme-provider";

const TOTAL_STEPS = 6;

export default function DevicePairingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { theme } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const hasPermission = permission?.granted ?? false;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const shouldReturnToDeviceSettings = returnTo === "settings-device";

  const handleContinue = () => {
    setDevicePaired(true);
    recordDeviceSync();

    if (shouldReturnToDeviceSettings && hasElderlyProfileInfo()) {
      router.replace("/settings/device");
      return;
    }

    router.push("/onboarding/user-profile");
  };

  return (
    <OnboardingStepShell
      step={4}
      totalSteps={TOTAL_STEPS}
      title="Pair Your Device"
      description="Scan the dispenser QR code and then proceed to Bluetooth setup (UI preview only)."
      onBack={() => router.back()}
      primaryActionLabel="Continue"
      onPrimaryAction={handleContinue}
    >
      <View style={{ gap: theme.spacing.md }}>
        <View
          style={{
            overflow: "hidden",
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            minHeight: 220,
          }}
        >
          {hasPermission ? (
            <CameraView
              style={{ flex: 1, minHeight: 220 }}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
          ) : (
            <View
              style={{
                padding: theme.spacing.md,
                minHeight: 220,
                justifyContent: "center",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
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
                Camera access is required to scan your dispenser QR code.
              </Text>
              <Button
                label="Grant Camera Permission"
                onPress={requestPermission}
                variant="primary"
              />
            </View>
          )}
        </View>

        <Card
          style={{
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            gap: theme.spacing.sm,
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Bluetooth Pairing (UI Preview)
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.regular,
              lineHeight: 20,
            }}
          >
            Device discovery and connection state will appear here. BLE logic
            can be integrated next.
          </Text>
          <Button label="Scan Nearby Devices" variant="ghost" />
        </Card>
      </View>
    </OnboardingStepShell>
  );
}
