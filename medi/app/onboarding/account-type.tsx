import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Modal } from "@/components/modal";

import { OnboardingStepShell } from "@/components/onboarding-step-shell";
import {
  getAccountType,
  setAccountType,
  type AccountType,
} from "@/src/account/account-store";
import { useAppTheme } from "@/src/theme/theme-provider";

const TOTAL_STEPS = 6;

export default function AccountTypeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [selectedType, setSelectedType] = useState<AccountType>(() =>
    getAccountType()
  );
  const [enterpriseSerial, setEnterpriseSerial] = useState("");
  const [isEnterpriseSerialVerified, setIsEnterpriseSerialVerified] =
    useState(false);
  const [isSerialModalVisible, setIsSerialModalVisible] = useState(false);

  const isEnterpriseSerialValid = /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/.test(
    enterpriseSerial
  );

  return (
    <OnboardingStepShell
      step={2}
      totalSteps={TOTAL_STEPS}
      title="Choose Account Type"
      description="Select the account mode that best matches how you plan to manage medication schedules."
      onBack={() => router.back()}
      primaryActionLabel="Continue"
      onPrimaryAction={() => {
        if (selectedType === "Enterprise" && !isEnterpriseSerialVerified) {
          setIsSerialModalVisible(true);
          return;
        }

        setAccountType(selectedType);
        router.push("/onboarding/signup");
      }}
    >
      <View style={{ gap: theme.spacing.sm }}>
        {(["Personal", "Enterprise"] as const).map((option) => {
          const isSelected = option === selectedType;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => {
                if (option === "Enterprise") {
                  setSelectedType("Enterprise");
                  setAccountType("Enterprise");
                  setIsSerialModalVisible(true);
                  return;
                }

                setSelectedType("Personal");
                setAccountType("Personal");
                setIsEnterpriseSerialVerified(false);
              }}
              style={{
                borderWidth: 1,
                borderColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: isSelected
                  ? theme.colors.primaryMuted
                  : theme.colors.surface,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
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
                {option}
              </Text>
              <Text
                selectable
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.family.secondary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.regular,
                }}
              >
                {option === "Personal"
                  ? "Ideal for one household and a single medication dispenser."
                  : "Best for care teams managing multiple patients and devices."}
              </Text>
            </Pressable>
          );
        })}

        {selectedType === "Enterprise" ? (
          <Text
            selectable
            style={{
              color: isEnterpriseSerialVerified
                ? theme.colors.primary
                : theme.colors.alert,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            {isEnterpriseSerialVerified
              ? `Serial verified: ${enterpriseSerial}`
              : "Enterprise setup requires a valid serial number before continuing."}
          </Text>
        ) : null}
      </View>

      <Modal
        visible={isSerialModalVisible}
        title="Enter Enterprise Serial Number"
        body="Format: XXXX-XXXX-XXXX-XXXX"
        cancelLabel="Cancel"
        confirmLabel="Verify Serial"
        confirmDisabled={!isEnterpriseSerialValid}
        onCancel={() => setIsSerialModalVisible(false)}
        onConfirm={() => {
          setIsEnterpriseSerialVerified(true);
          setAccountType("Enterprise");
          setIsSerialModalVisible(false);
        }}
      >
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          maxLength={19}
          onChangeText={(value) => {
            setEnterpriseSerial(formatEnterpriseSerial(value));
            setIsEnterpriseSerialVerified(false);
          }}
          placeholder="AB12-CD34-EF56-GH78"
          placeholderTextColor={theme.colors.textSecondary}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.mono,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.medium,
          }}
          value={enterpriseSerial}
        />
      </Modal>
    </OnboardingStepShell>
  );
}

function formatEnterpriseSerial(rawValue: string) {
  const normalized = rawValue
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
  const chunks = normalized.match(/.{1,4}/g) ?? [];
  return chunks.join("-");
}
