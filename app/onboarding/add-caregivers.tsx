import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { BadgeChip } from "@/components/badge-chip";
import { Button } from "@/components/button";
import { Card } from "@/components/card";

import { OnboardingStepShell } from "@/components/onboarding-step-shell";
import {
  addCaregiver,
  removeCaregiver,
  useCaregivers,
} from "@/src/app-state/app-state-store";
import { useAppTheme } from "@/src/theme/theme-provider";

const TOTAL_STEPS = 6;

type DraftCaregiver = {
  id: string;
  contact: string;
};

export default function AddCaregiversScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const glowStyle = {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  } as const;
  const caregivers = useCaregivers();
  const [draftCaregivers, setDraftCaregivers] = useState<DraftCaregiver[]>([
    {
      id: "draft-caregiver-0",
      contact: "",
    },
  ]);
  const primaryCaregiver =
    caregivers.find((caregiver) => caregiver.role === "Primary") ?? null;
  const invitedCaregivers = caregivers.filter(
    (caregiver) => caregiver.role === "Secondary"
  );

  const updateDraftCaregiver = (id: string, contact: string) => {
    setDraftCaregivers((current) =>
      current.map((caregiver) => {
        if (caregiver.id !== id) {
          return caregiver;
        }

        return {
          ...caregiver,
          contact,
        };
      })
    );
  };

  const inviteDraftCaregiver = (id: string) => {
    const draft = draftCaregivers.find((caregiver) => caregiver.id === id);

    if (!draft || draft.contact.trim().length <= 3) {
      return;
    }

    const cleanedContact = draft.contact.trim();

    addCaregiver({
      name: cleanedContact,
      contact: cleanedContact,
      role: "Secondary",
    });

    setDraftCaregivers((current) =>
      current.map((caregiver) => {
        if (caregiver.id !== id) {
          return caregiver;
        }

        return {
          ...caregiver,
          contact: "",
        };
      })
    );
  };

  const addAdditionalCaregiver = () => {
    setDraftCaregivers((current) => [
      ...current,
      {
        id: `draft-caregiver-${Date.now()}-${current.length}`,
        contact: "",
      },
    ]);
  };

  const removeDraftCaregiver = (id: string) => {
    setDraftCaregivers((current) => {
      const nextDrafts = current.filter((caregiver) => caregiver.id !== id);

      if (nextDrafts.length > 0) {
        return nextDrafts;
      }

      return [
        {
          id: `draft-caregiver-${Date.now()}`,
          contact: "",
        },
      ];
    });
  };

  const removeInvitedCaregiver = (id: string) => {
    removeCaregiver(id);
  };

  return (
    <OnboardingStepShell
      step={6}
      totalSteps={TOTAL_STEPS}
      title="Add Caregivers"
      description="Invite caregivers by email or phone number and assign collaboration roles."
      onBack={() => router.back()}
      primaryActionLabel="Continue To Prescription"
      onPrimaryAction={() => router.push("/onboarding/prescription-flow")}
      postAction={
        <Button
          label="Finish Setup Without Prescription"
          onPress={() => router.replace("/(tabs)")}
          variant="ghost"
          style={glowStyle}
        />
      }
    >
      <View style={{ gap: theme.spacing.sm }}>
        {draftCaregivers.map((caregiver, index) => {
          const canInvite = caregiver.contact.trim().length > 3;

          return (
            <Card
              key={caregiver.id}
              style={{
                backgroundColor: theme.colors.surface,
                gap: theme.spacing.sm,
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
                  Caregiver Contact {index + 1}
                </Text>

                {draftCaregivers.length > 1 ? (
                  <Button
                    label="Remove"
                    onPress={() => removeDraftCaregiver(caregiver.id)}
                    variant="ghost"
                    size="sm"
                  />
                ) : null}
              </View>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                onChangeText={(value) =>
                  updateDraftCaregiver(caregiver.id, value)
                }
                placeholder="email or phone number"
                placeholderTextColor={theme.colors.textSecondary}
                style={inputStyle(theme)}
                value={caregiver.contact}
              />

              <Button
                label="Invite Caregiver"
                disabled={!canInvite}
                onPress={() => inviteDraftCaregiver(caregiver.id)}
                variant="ghost"
              />
            </Card>
          );
        })}

        <Button
          label="Add Additional Caregiver"
          onPress={addAdditionalCaregiver}
          variant="ghost"
          style={glowStyle}
        />

        <View style={{ gap: theme.spacing.xs }}>
          {primaryCaregiver ? (
            <Card
              style={{
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                padding: theme.spacing.sm,
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
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    selectable
                    style={{
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.family.secondary,
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.medium,
                    }}
                  >
                    {primaryCaregiver.name}
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
                    {primaryCaregiver.contact
                      ? `Emergency contact: ${primaryCaregiver.contact}`
                      : "Emergency contact is not set yet."}
                  </Text>
                </View>

                <BadgeChip
                  label="Primary"
                  variant="teal"
                  style={{ alignSelf: "center" }}
                />
              </View>
            </Card>
          ) : null}

          {invitedCaregivers.length === 0 ? (
            <Text
              selectable
              style={{
                color: theme.colors.textSecondary,
                fontFamily: theme.typography.family.secondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.regular,
              }}
            >
              No secondary caregivers invited yet.
            </Text>
          ) : null}

          {invitedCaregivers.map((invite) => (
            <Card
              key={invite.id}
              style={{
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                padding: theme.spacing.sm,
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
                    fontFamily: theme.typography.family.secondary,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.medium,
                  }}
                >
                  {invite.contact ?? invite.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.xs,
                  }}
                >
                  <BadgeChip
                    label={invite.role}
                    variant={invite.role === "Primary" ? "teal" : "gray"}
                    style={{ alignSelf: "center" }}
                  />

                  <Button
                    label="Remove"
                    onPress={() => removeInvitedCaregiver(invite.id)}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </OnboardingStepShell>
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
