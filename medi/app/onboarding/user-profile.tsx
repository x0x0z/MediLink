import { useRouter } from "expo-router";
import PhoneInput, {
  type ICountry,
  isValidPhoneNumber,
} from "react-native-international-phone-number";
import React, { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";

import { DatePickerField } from "@/components/date-picker-field";
import { OnboardingStepShell } from "@/components/onboarding-step-shell";
import { setPrimaryCaregiverProfile } from "@/src/app-state/app-state-store";
import { useAppTheme } from "@/src/theme/theme-provider";

const TOTAL_STEPS = 6;

type EmergencyContact = {
  id: string;
  name: string;
  phoneNumber: string;
  selectedCountry: ICountry | null;
};

export default function UserProfileScreen() {
  const router = useRouter();
  const { theme, colorMode } = useAppTheme();
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [healthNotes, setHealthNotes] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >([{ id: "emergency-0", name: "", phoneNumber: "", selectedCountry: null }]);

  const isValid = useMemo(() => {
    const primaryEmergencyContact = emergencyContacts[0];
    const hasValidPrimaryEmergencyContact =
      Boolean(primaryEmergencyContact) &&
      primaryEmergencyContact.name.trim().length > 1 &&
      Boolean(primaryEmergencyContact.selectedCountry) &&
      isValidPhoneNumber(
        primaryEmergencyContact.phoneNumber,
        primaryEmergencyContact.selectedCountry as ICountry
      );

    return (
      fullName.trim().length > 1 &&
      Boolean(dateOfBirth) &&
      hasValidPrimaryEmergencyContact
    );
  }, [dateOfBirth, emergencyContacts, fullName]);

  const updateEmergencyContact = (
    id: string,
    field: "name" | "phoneNumber",
    value: string
  ) => {
    setEmergencyContacts((current) =>
      current.map((contact) => {
        if (contact.id !== id) {
          return contact;
        }

        return {
          ...contact,
          [field]: value,
        };
      })
    );
  };

  const updateEmergencyContactCountry = (
    id: string,
    selectedCountry: ICountry
  ) => {
    setEmergencyContacts((current) =>
      current.map((contact) => {
        if (contact.id !== id) {
          return contact;
        }

        return {
          ...contact,
          selectedCountry,
        };
      })
    );
  };

  const addEmergencyContact = () => {
    setEmergencyContacts((current) => [
      ...current,
      {
        id: `emergency-${Date.now()}-${current.length}`,
        name: "",
        phoneNumber: "",
        selectedCountry: null,
      },
    ]);
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts((current) => {
      const nextContacts = current.filter((contact) => contact.id !== id);

      if (nextContacts.length > 0) {
        return nextContacts;
      }

      return [
        {
          id: `emergency-${Date.now()}`,
          name: "",
          phoneNumber: "",
          selectedCountry: null,
        },
      ];
    });
  };

  const handleContinue = () => {
    const primaryEmergencyContact = emergencyContacts[0];

    if (primaryEmergencyContact) {
      setPrimaryCaregiverProfile({
        name: primaryEmergencyContact.name.trim() || "Primary caregiver",
        contact: formatEmergencyContact(primaryEmergencyContact) || undefined,
      });
    }

    router.push("/onboarding/add-caregivers");
  };

  return (
    <OnboardingStepShell
      step={5}
      totalSteps={TOTAL_STEPS}
      title="Set Up Elderly User Profile"
      description="Provide essential profile and care context for medication reminders and caregiver collaboration."
      onBack={() => router.back()}
      primaryActionLabel="Continue"
      primaryActionDisabled={!isValid}
      onPrimaryAction={handleContinue}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <FieldLabel text="Full Name" />
        <TextInput
          onChangeText={setFullName}
          placeholder="Elderly user's full name"
          placeholderTextColor={theme.colors.textSecondary}
          style={inputStyle(theme)}
          value={fullName}
        />

        <DatePickerField
          label="Date of Birth"
          placeholder="Select date of birth"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          maximumDate={new Date()}
        />

        <FieldLabel text="Health Notes" />
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setHealthNotes}
          placeholder="Allergies, conditions, and medication timing preferences"
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            inputStyle(theme),
            { minHeight: 100, textAlignVertical: "top" },
          ]}
          value={healthNotes}
        />

        <FieldLabel text="Emergency Contacts" />
        <View style={{ gap: theme.spacing.sm }}>
          {emergencyContacts.map((contact, index) => (
            <Card
              key={contact.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md,
                gap: theme.spacing.xs,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: theme.spacing.sm,
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
                  Contact {index + 1}
                </Text>

                <Button
                  label="Remove"
                  onPress={() => removeEmergencyContact(contact.id)}
                  variant="ghost"
                  size="sm"
                />
              </View>

              <TextInput
                onChangeText={(value) =>
                  updateEmergencyContact(contact.id, "name", value)
                }
                placeholder="Contact name"
                placeholderTextColor={theme.colors.textSecondary}
                style={inputStyle(theme)}
                value={contact.name}
              />

              <View style={{ height: theme.spacing.md }} />

              <PhoneInput
                defaultCountry="US"
                value={contact.phoneNumber}
                onChangePhoneNumber={(value) =>
                  updateEmergencyContact(contact.id, "phoneNumber", value)
                }
                selectedCountry={contact.selectedCountry}
                onChangeSelectedCountry={(country) =>
                  updateEmergencyContactCountry(contact.id, country)
                }
                theme={colorMode}
                placeholder="Phone number"
                phoneInputPlaceholderTextColor={theme.colors.textSecondary}
                phoneInputSelectionColor={theme.colors.primary}
                modalType="bottomSheet"
                phoneInputStyles={phoneInputStyles(theme)}
                modalStyles={phoneModalStyles(theme)}
                modalSearchInputPlaceholderTextColor={
                  theme.colors.textSecondary
                }
                modalSearchInputSelectionColor={theme.colors.primary}
              />
            </Card>
          ))}

          <Button
            label="Add Another Emergency Contact"
            onPress={addEmergencyContact}
            variant="ghost"
          />
        </View>
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
    backgroundColor: theme.colors.surfaceRaised,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.secondary,
    fontSize: theme.typography.size.md,
  } as const;
}

function formatEmergencyContact(contact: EmergencyContact) {
  const phoneNumber = contact.phoneNumber.trim();

  if (!phoneNumber || !contact.selectedCountry) {
    return "";
  }

  const root = contact.selectedCountry.idd.root ?? "";
  const suffix = contact.selectedCountry.idd.suffixes?.[0] ?? "";
  const callingCode = `${root}${suffix}`.trim();

  return callingCode ? `${callingCode} ${phoneNumber}` : phoneNumber;
}

function phoneInputStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    container: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceRaised,
    },
    flagContainer: {
      borderRightWidth: 1,
      borderColor: theme.colors.border,
      borderTopLeftRadius: theme.radius.md,
      borderBottomLeftRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceRaised,
    },
    divider: {
      backgroundColor: theme.colors.border,
      width: 0,
      marginLeft: 0,
      marginRight: 0,
    },
    callingCode: {
      width: 0,
      fontSize: 0,
      opacity: 0,
    },
    input: {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.family.secondary,
      fontSize: theme.typography.size.md,
      paddingVertical: theme.spacing.sm,
    },
    caret: {
      color: theme.colors.textSecondary,
    },
  } as const;
}

function phoneModalStyles(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    backdrop: {
      backgroundColor: theme.colors.overlay,
    },
    content: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
    },
    dragHandleIndicator: {
      backgroundColor: theme.colors.border,
    },
    searchContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceRaised,
    },
    searchInput: {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.family.secondary,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.regular,
    },
    sectionTitle: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.family.secondary,
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.medium,
    },
    countryItem: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    callingCode: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.family.secondary,
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.medium,
    },
    countryName: {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.family.secondary,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.medium,
    },
    countryNotFoundMessage: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.family.secondary,
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.regular,
    },
  } as const;
}
