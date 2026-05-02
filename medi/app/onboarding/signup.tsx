import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { DatePickerField } from "@/components/date-picker-field";
import { OnboardingStepShell } from "@/components/onboarding-step-shell";
import { useAppTheme } from "@/src/theme/theme-provider";

const TOTAL_STEPS = 6;

export default function SignupScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState<Date | null>(null);

  const isValid = useMemo(() => {
    const hasCoreFields = username.trim().length > 1 && Boolean(birthday);
    const hasValidEmail = /^\S+@\S+\.\S+$/.test(email.trim());

    return hasCoreFields && hasValidEmail;
  }, [birthday, email, username]);

  return (
    <OnboardingStepShell
      step={3}
      totalSteps={TOTAL_STEPS}
      title="Create Sign Up Details"
      description="Add your account information to secure your household and caregiver access."
      onBack={() => router.back()}
      primaryActionLabel="Continue"
      primaryActionDisabled={!isValid}
      onPrimaryAction={() => router.push("/onboarding/device-pairing")}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <FieldLabel text="Username" />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setUsername}
          placeholder="yourname"
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyle(theme)}
          value={username}
        />

        <FieldLabel text="Email" />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="name@example.com"
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyle(theme)}
          value={email}
        />

        <DatePickerField
          label="Birthday"
          placeholder="Select date of birth"
          value={birthday}
          onChange={setBirthday}
          maximumDate={new Date()}
        />

        <Text
          selectable
          style={{
            color: theme.colors.alert,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.regular,
            minHeight: 20,
            opacity: isValid ? 0 : 1,
          }}
        >
          Please provide a valid username, email, and birthday before
          continuing.
        </Text>
      </View>
    </OnboardingStepShell>
  );
}

type FieldLabelProps = {
  text: string;
};

function FieldLabel({ text }: FieldLabelProps) {
  const { theme } = useAppTheme();

  return (
    <Text
      selectable
      style={{
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.family.primary,
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
      }}
    >
      {text}
    </Text>
  );
}

function inputStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.secondary,
    fontSize: theme.typography.size.md,
  } as const;
}
