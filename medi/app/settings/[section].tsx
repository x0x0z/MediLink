import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";

import { BadgeChip } from "@/components/badge-chip";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Modal as ConfirmationModal } from "@/components/modal";

import {
  addCaregiver,
  removeCaregiver,
  setDevicePaired,
  setNotificationSetting,
  setRetentionDays as setSharedRetentionDays,
  useCaregivers,
  useDeviceProfile,
  useNotificationSettings,
  useRetentionDays,
} from "@/src/app-state/app-state-store";
import { type AccountType, useAccountType } from "@/src/account/account-store";
import { useAppTheme } from "@/src/theme/theme-provider";

type CaregiverRole = "Primary" | "Secondary";

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

type NotificationType =
  | "Dose Taken"
  | "Missed Dose"
  | "Snooze"
  | "Tamper"
  | "Refill"
  | "Power";

type Integration = {
  id: string;
  name: string;
};

type ThemeShape = ReturnType<typeof useAppTheme>["theme"];

const NOTIFICATION_TYPES: NotificationType[] = [
  "Dose Taken",
  "Missed Dose",
  "Snooze",
  "Tamper",
  "Refill",
  "Power",
];

const RETENTION_OPTIONS = [7, 14, 30, 60, 90] as const;
const TERMS_URL = "https://medi.example.com/terms";
const PRIVACY_URL = "https://medi.example.com/privacy";

const SECTION_TITLES: Record<SettingDetailSection, string> = {
  account: "Account",
  profile: "Elderly User Profile",
  caregivers: "Caregivers",
  device: "Device",
  recordings: "Recordings",
  notifications: "Notification",
  appearance: "Appearance",
  enterprise: "Enterprise",
  about: "About",
};

const VALID_SECTIONS = Object.keys(SECTION_TITLES) as SettingDetailSection[];

export default function SettingsDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const { theme, colorMode, setColorMode } = useAppTheme();
  const accountType = useAccountType();

  const sectionParam = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  const section =
    sectionParam &&
    VALID_SECTIONS.includes(sectionParam as SettingDetailSection)
      ? (sectionParam as SettingDetailSection)
      : null;

  const caregivers = useCaregivers();
  const deviceProfile = useDeviceProfile();
  const retentionDays = useRetentionDays();
  const notificationSettings = useNotificationSettings();

  const deviceName = deviceProfile.name;
  const firmwareVersion = deviceProfile.firmwareVersion;
  const isDevicePaired = deviceProfile.isPaired;

  const displayName = "Alicia Rivera";
  const elderlyName = "Marina Rivera";
  const elderlyAge = 82;
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const [isRetentionPickerVisible, setIsRetentionPickerVisible] =
    useState(false);
  const [isUnpairModalVisible, setIsUnpairModalVisible] = useState(false);

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "integration-1", name: "Northside Family Clinic" },
    { id: "integration-2", name: "Blue Oak Pharmacy" },
  ]);

  const sectionTitle = useMemo(
    () => (section ? SECTION_TITLES[section] : "Settings Detail"),
    [section]
  );

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Signed out",
            "You have been signed out from this device."
          );
        },
      },
    ]);
  };

  const removeSecondaryCaregiver = (id: string) => {
    removeCaregiver(id);
  };

  const inviteNewCaregiver = () => {
    addCaregiver({
      name: `Caregiver ${caregivers.length + 1}`,
      role: "Secondary",
    });
  };

  const confirmUnpairDevice = () => {
    setDevicePaired(false);
    setIsUnpairModalVisible(false);
  };

  const toggleNotification = (type: NotificationType, enabled: boolean) => {
    setNotificationSetting(type, enabled);
  };

  const removeIntegration = (id: string) => {
    setIntegrations((current) =>
      current.filter((integration) => integration.id !== id)
    );
  };

  const addIntegration = () => {
    setIntegrations((current) => [
      ...current,
      {
        id: `integration-${Date.now()}`,
        name: `Integration ${current.length + 1}`,
      },
    ]);
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Unable to open link", "Please try again later.");
    });
  };

  const renderBody = () => {
    if (!section) {
      return (
        <SectionCard theme={theme}>
          <Text selectable style={valueLabelStyle(theme)}>
            This settings page is unavailable.
          </Text>
          <ActionButton
            label="Back to Settings"
            onPress={() => router.replace("/(tabs)/settings")}
            theme={theme}
            variant="outline"
          />
        </SectionCard>
      );
    }

    if (section === "enterprise" && accountType !== "Enterprise") {
      return (
        <SectionCard theme={theme}>
          <Text selectable style={valueLabelStyle(theme)}>
            Enterprise settings are only available for Enterprise accounts.
          </Text>
          <ActionButton
            label="Back to Settings"
            onPress={() => router.replace("/(tabs)/settings")}
            theme={theme}
            variant="outline"
          />
        </SectionCard>
      );
    }

    if (section === "account") {
      return (
        <SectionCard theme={theme}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text selectable style={valueLabelStyle(theme)}>
              {displayName}
            </Text>
            <Text selectable style={valueSubtleStyle(theme)}>
              Signed in account
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text selectable style={rowLabelStyle(theme)}>
              Account Type
            </Text>
            <RoleBadge theme={theme} role={accountType} />
          </View>

          <View style={{ height: theme.spacing.xxl + theme.spacing.lg }} />

          <ActionButton
            label="Sign Out"
            onPress={handleSignOut}
            theme={theme}
            variant="destructive"
          />
        </SectionCard>
      );
    }

    if (section === "profile") {
      return (
        <SectionCard theme={theme}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text selectable style={valueLabelStyle(theme)}>
              {elderlyName}
            </Text>
            <Text selectable style={valueSubtleStyle(theme)}>
              {elderlyAge} years old
            </Text>
          </View>

          <ActionButton
            label="Edit Profile"
            onPress={() => router.push("/onboarding/user-profile")}
            theme={theme}
            variant="outline"
          />
        </SectionCard>
      );
    }

    if (section === "caregivers") {
      return (
        <SectionCard theme={theme}>
          <View style={{ gap: theme.spacing.sm }}>
            {caregivers.map((caregiver) => (
              <View
                key={caregiver.id}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.sm,
                  gap: theme.spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text selectable style={rowLabelStyle(theme)}>
                    {caregiver.name}
                  </Text>
                  <RoleBadge theme={theme} role={caregiver.role} />
                </View>

                {caregiver.role === "Secondary" ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => removeSecondaryCaregiver(caregiver.id)}
                    style={{
                      alignSelf: "flex-start",
                      borderRadius: theme.radius.sm,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xxs,
                    }}
                  >
                    <Text selectable style={valueSubtleStyle(theme)}>
                      Remove
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          <ActionButton
            label="Invite New Caregiver"
            onPress={inviteNewCaregiver}
            theme={theme}
            variant="outline"
          />
        </SectionCard>
      );
    }

    if (section === "device") {
      return (
        <SectionCard theme={theme}>
          <SettingRow theme={theme} label="Device Name" value={deviceName} />
          <SettingRow
            theme={theme}
            label="Firmware Version"
            value={firmwareVersion}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setIsRetentionPickerVisible(true)}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.sm,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text selectable style={rowLabelStyle(theme)}>
              Recordings Retention
            </Text>
            <Text selectable style={rowValueStyle(theme)}>
              {retentionDays} days
            </Text>
          </Pressable>

          <ActionButton
            label="Unpair Device"
            onPress={() => setIsUnpairModalVisible(true)}
            theme={theme}
            variant="destructive"
            disabled={!isDevicePaired}
          />

          {isDevicePaired ? null : (
            <View style={{ gap: theme.spacing.sm }}>
              <Text selectable style={valueSubtleStyle(theme)}>
                Device is currently unpaired.
              </Text>

              <ActionButton
                label="Pair Device"
                onPress={() =>
                  router.push({
                    pathname: "/onboarding/device-pairing",
                    params: { returnTo: "settings-device" },
                  })
                }
                theme={theme}
                variant="primary"
              />
            </View>
          )}
        </SectionCard>
      );
    }

    if (section === "recordings") {
      return (
        <SectionCard theme={theme}>
          <Text selectable style={valueSubtleStyle(theme)}>
            Open retained dose recordings and detailed playback reviews.
          </Text>

          <SettingRow
            theme={theme}
            label="Retention Duration"
            value={`${retentionDays} days`}
          />

          <ActionButton
            label="Open Recordings"
            onPress={() => router.push("/recordings")}
            theme={theme}
            variant="primary"
          />
        </SectionCard>
      );
    }

    if (section === "notifications") {
      return (
        <SectionCard theme={theme}>
          {NOTIFICATION_TYPES.map((type) => (
            <View
              key={type}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
              }}
            >
              <Text selectable style={rowLabelStyle(theme)}>
                {type}
              </Text>
              <Switch
                value={notificationSettings[type]}
                onValueChange={(value) => toggleNotification(type, value)}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primaryMuted,
                }}
              />
            </View>
          ))}
        </SectionCard>
      );
    }

    if (section === "appearance") {
      return (
        <SectionCard theme={theme}>
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ gap: theme.spacing.xxs }}>
              <Text selectable style={rowLabelStyle(theme)}>
                Dark Mode
              </Text>
              <Text selectable style={valueSubtleStyle(theme)}>
                {colorMode === "dark" ? "Enabled" : "Disabled"}
              </Text>
            </View>
            <Switch
              value={colorMode === "dark"}
              onValueChange={(value) => setColorMode(value ? "dark" : "light")}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryMuted,
              }}
            />
          </View>
        </SectionCard>
      );
    }

    if (section === "enterprise") {
      return (
        <SectionCard theme={theme}>
          {integrations.length === 0 ? (
            <Text selectable style={valueSubtleStyle(theme)}>
              No clinics or pharmacies connected.
            </Text>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {integrations.map((integration) => (
                <View
                  key={integration.id}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.surface,
                    padding: theme.spacing.sm,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                  }}
                >
                  <Text selectable style={rowLabelStyle(theme)}>
                    {integration.name}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => removeIntegration(integration.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.sm,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xxs,
                    }}
                  >
                    <Text selectable style={valueSubtleStyle(theme)}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <ActionButton
            label="Add Integration"
            onPress={addIntegration}
            theme={theme}
            variant="outline"
          />
        </SectionCard>
      );
    }

    return (
      <SectionCard theme={theme}>
        <SettingRow theme={theme} label="App Version" value={appVersion} />

        <Pressable
          accessibilityRole="button"
          onPress={() => openExternalLink(TERMS_URL)}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text selectable style={rowLabelStyle(theme)}>
            Terms of Service
          </Text>
          <Text selectable style={rowValueStyle(theme)}>
            Open
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => openExternalLink(PRIVACY_URL)}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text selectable style={rowLabelStyle(theme)}>
            Privacy Policy
          </Text>
          <Text selectable style={rowValueStyle(theme)}>
            Open
          </Text>
        </Pressable>
      </SectionCard>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: sectionTitle,
          headerBackButtonDisplayMode: "minimal",
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            color: theme.colors.textPrimary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
            fontFamily: theme.typography.family.primary,
          },
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
          backgroundColor: theme.colors.background,
        }}
      >
        {renderBody()}
      </ScrollView>

      <ConfirmationModal
        visible={isUnpairModalVisible}
        title="Unpair Device?"
        body="This will disconnect the current medication dispenser from this account."
        cancelLabel="Cancel"
        confirmLabel="Unpair"
        onCancel={() => setIsUnpairModalVisible(false)}
        onConfirm={confirmUnpairDevice}
        destructive
      />

      <ConfirmationModal
        visible={isRetentionPickerVisible}
        title="Recording Retention Duration"
        body="Choose how long recordings are stored before automatic deletion."
        cancelLabel="Close"
        confirmLabel="Done"
        onCancel={() => setIsRetentionPickerVisible(false)}
        onConfirm={() => setIsRetentionPickerVisible(false)}
      >
        <View style={{ gap: theme.spacing.xs }}>
          {RETENTION_OPTIONS.map((days) => {
            const isSelected = days === retentionDays;

            return (
              <Button
                key={days}
                label={`${days} days`}
                onPress={() => setSharedRetentionDays(days)}
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
              />
            );
          })}
        </View>
      </ConfirmationModal>
    </>
  );
}

type SectionCardProps = {
  theme: ThemeShape;
  children: React.ReactNode;
};

function SectionCard({ theme: _theme, children }: SectionCardProps) {
  return <Card>{children}</Card>;
}

type RoleBadgeProps = {
  theme: ThemeShape;
  role: AccountType | CaregiverRole;
};

function RoleBadge({ theme: _theme, role }: RoleBadgeProps) {
  const isPrimaryStyle = role === "Primary" || role === "Enterprise";

  return <BadgeChip label={role} variant={isPrimaryStyle ? "teal" : "gray"} />;
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  theme: ThemeShape;
  variant: "primary" | "outline" | "destructive";
  disabled?: boolean;
  fullWidth?: boolean;
};

function ActionButton({
  label,
  onPress,
  theme: _theme,
  variant,
  disabled = false,
  fullWidth = false,
}: ActionButtonProps) {
  const mappedVariant =
    variant === "outline"
      ? "ghost"
      : variant === "destructive"
      ? "destructive"
      : "primary";

  return (
    <Button
      label={label}
      onPress={onPress}
      variant={mappedVariant}
      disabled={disabled}
      fullWidth={fullWidth}
    />
  );
}

type SettingRowProps = {
  theme: ThemeShape;
  label: string;
  value: string;
};

function SettingRow({ theme, label, value }: SettingRowProps) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.sm,
      }}
    >
      <Text selectable style={rowLabelStyle(theme)}>
        {label}
      </Text>
      <Text selectable style={rowValueStyle(theme)}>
        {value}
      </Text>
    </View>
  );
}

function rowLabelStyle(theme: ThemeShape) {
  return {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
  } as const;
}

function rowValueStyle(theme: ThemeShape) {
  return {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.family.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  } as const;
}

function valueLabelStyle(theme: ThemeShape) {
  return {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  } as const;
}

function valueSubtleStyle(theme: ThemeShape) {
  return {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.family.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
  } as const;
}
