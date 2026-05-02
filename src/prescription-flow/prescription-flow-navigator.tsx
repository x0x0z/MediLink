import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as DocumentPicker from "expo-document-picker";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { withAlpha } from "@/src/theme/color-utils";
import { useAppTheme } from "@/src/theme/theme-provider";

import { addMedicationsToSchedule } from "./prescription-store";
import type {
  DrugInteraction,
  DrugInteractionSeverity,
  EntryContext,
  MedicationFieldKey,
  MedicationType,
  ParsedMedication,
  PrescriptionSource,
  SlotAssignment,
} from "./types";

type PrescriptionFlowNavigatorProps = {
  entryContext: EntryContext;
};

type PrescriptionFlowStackParamList = {
  PrescriptionInput: undefined;
  PrescriptionReview: undefined;
  DrugInteractionWarning: undefined;
  SlotAssignment: undefined;
};

const FlowStack = createNativeStackNavigator<PrescriptionFlowStackParamList>();

const DEFAULT_ANALYZE_MESSAGE = "Analyzing prescription...";

export function PrescriptionFlowNavigator({
  entryContext,
}: PrescriptionFlowNavigatorProps) {
  const router = useRouter();
  const [analysisSource, setAnalysisSource] =
    useState<PrescriptionSource | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState(
    DEFAULT_ANALYZE_MESSAGE
  );
  const [medications, setMedications] = useState<ParsedMedication[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [slots, setSlots] = useState<SlotAssignment[]>([]);

  const syncSlotsToMedications = (medicationsToMap: ParsedMedication[]) => {
    setSlots(buildSlotAssignments(medicationsToMap));
  };

  const runAnalysis = async (source: PrescriptionSource, detail?: string) => {
    setAnalysisSource(source);
    setIsAnalyzing(true);
    setAnalysisMessage(DEFAULT_ANALYZE_MESSAGE);

    if (detail) {
      setAnalysisMessage(`Analyzing prescription... ${detail}`);
    }

    await delay(1400);

    const parsedMeds = buildParsedMedications(source);
    const detectedInteractions = buildDrugInteractions(parsedMeds);

    setMedications(parsedMeds);
    setInteractions(detectedInteractions);
    syncSlotsToMedications(parsedMeds);
    setIsAnalyzing(false);
  };

  const startManualEntry = () => {
    setAnalysisSource("manual");

    const parsedMeds = buildParsedMedications("manual");

    setMedications(parsedMeds);
    setInteractions([]);
    syncSlotsToMedications(parsedMeds);
  };

  const updateFieldValue = (
    medicationId: string,
    field: MedicationFieldKey,
    value: string
  ) => {
    setMedications((current) =>
      current.map((medication) => {
        if (medication.id !== medicationId) {
          return medication;
        }

        const currentField = medication.fields[field];

        return {
          ...medication,
          fields: {
            ...medication.fields,
            [field]: {
              ...currentField,
              value,
              confirmed: currentField.unresolved ? false : true,
            },
          },
        };
      })
    );
  };

  const addMedication = () => {
    setMedications((current) => [...current, createEditableMedication()]);
  };

  const removeMedication = (medicationId: string) => {
    setMedications((current) =>
      current.filter((medication) => medication.id !== medicationId)
    );
  };

  const updateMedicationType = (medicationId: string, type: MedicationType) => {
    setMedications((current) =>
      current.map((medication) => {
        if (medication.id !== medicationId) {
          return medication;
        }

        return {
          ...medication,
          type,
        };
      })
    );
  };

  const toggleSlotConfirmation = (slotId: string) => {
    setSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) {
          return slot;
        }

        return {
          ...slot,
          confirmed: !slot.confirmed,
        };
      })
    );
  };

  const handleBackFromInput = () => {
    if (entryContext === "onboarding") {
      router.back();
      return;
    }

    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSlotCompletion = () => {
    if (hasConflictingSlotAssignments(slots, medications)) {
      return;
    }

    const timestamp = new Date().toISOString();

    const records = slots
      .map((slot) => {
        const medication = medications.find(
          (item) => item.id === slot.medicationId
        );

        if (!medication) {
          return null;
        }

        return {
          id: `${timestamp}-${slot.id}`,
          name: medication.fields.name.value,
          dosage: medication.fields.dosage.value,
          frequency: medication.fields.frequency.value,
          type: medication.type,
          slotLabel: slot.slotLabel,
          source: analysisSource ?? "camera",
          updatedAt: timestamp,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (records.length > 0) {
      addMedicationsToSchedule(records);
    }

    if (entryContext === "onboarding") {
      router.replace("/onboarding/schedule-review");
      return;
    }

    router.replace(
      `/(tabs)/schedule?refreshedAt=${encodeURIComponent(timestamp)}`
    );
  };

  return (
    <FlowStack.Navigator
      initialRouteName="PrescriptionInput"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <FlowStack.Screen name="PrescriptionInput">
        {(screenProps) => (
          <PrescriptionInputScreen
            {...screenProps}
            entryContext={entryContext}
            onBack={handleBackFromInput}
            onCancel={handleCancel}
            runAnalysis={runAnalysis}
            startManualEntry={startManualEntry}
            isAnalyzing={isAnalyzing}
            analysisMessage={analysisMessage}
          />
        )}
      </FlowStack.Screen>
      <FlowStack.Screen name="PrescriptionReview">
        {(screenProps) => (
          <PrescriptionReviewScreen
            {...screenProps}
            entryContext={entryContext}
            onCancel={handleCancel}
            medications={medications}
            onChangeField={updateFieldValue}
            onAddMedication={addMedication}
            onRemoveMedication={removeMedication}
            onChangeMedicationType={updateMedicationType}
            onSyncSlots={() => syncSlotsToMedications(medications)}
            onUpdateInteractions={setInteractions}
          />
        )}
      </FlowStack.Screen>
      <FlowStack.Screen name="DrugInteractionWarning">
        {(screenProps) => (
          <DrugInteractionWarningScreen
            {...screenProps}
            entryContext={entryContext}
            onCancel={handleCancel}
            interactions={interactions}
          />
        )}
      </FlowStack.Screen>
      <FlowStack.Screen name="SlotAssignment">
        {(screenProps) => (
          <SlotAssignmentScreen
            {...screenProps}
            entryContext={entryContext}
            onCancel={handleCancel}
            slots={slots}
            medications={medications}
            onToggleSlot={toggleSlotConfirmation}
            onComplete={handleSlotCompletion}
          />
        )}
      </FlowStack.Screen>
    </FlowStack.Navigator>
  );
}

type PrescriptionInputScreenProps = NativeStackScreenProps<
  PrescriptionFlowStackParamList,
  "PrescriptionInput"
> & {
  entryContext: EntryContext;
  onBack: () => void;
  onCancel: () => void;
  runAnalysis: (source: PrescriptionSource, detail?: string) => Promise<void>;
  startManualEntry: () => void;
  isAnalyzing: boolean;
  analysisMessage: string;
};

function PrescriptionInputScreen({
  navigation,
  entryContext,
  onBack,
  onCancel,
  runAnalysis,
  startManualEntry,
  isAnalyzing,
  analysisMessage,
}: PrescriptionInputScreenProps) {
  const { theme } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedSource, setSelectedSource] =
    useState<PrescriptionSource | null>(null);

  const hasCameraPermission = permission?.granted ?? false;

  const beginCameraAnalysis = async () => {
    setSelectedSource("camera");
    await runAnalysis("camera");
    navigation.navigate("PrescriptionReview");
  };

  const beginFileUploadAnalysis = async () => {
    setSelectedSource("file");

    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const picked = result.assets[0];

    await runAnalysis("file", picked.name);
    navigation.navigate("PrescriptionReview");
  };

  const beginManualEntry = () => {
    setSelectedSource("manual");
    startManualEntry();
    navigation.navigate("PrescriptionReview");
  };

  return (
    <FlowScreenShell
      title="Prescription Input"
      description="Capture with camera or upload a file to extract medication details."
      onBack={onBack}
      entryContext={entryContext}
      onCancel={onCancel}
      loading={isAnalyzing}
      loadingMessage={analysisMessage}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <Text selectable style={sectionTitleStyle(theme)}>
          Choose input method
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={isAnalyzing}
          onPress={() => setSelectedSource("camera")}
          style={optionCardStyle(theme, selectedSource === "camera")}
        >
          <Text selectable style={optionTitleStyle(theme)}>
            Camera Scan
          </Text>
          <Text selectable style={optionDescriptionStyle(theme)}>
            Use the on-device viewfinder to capture the printed prescription.
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isAnalyzing}
          onPress={beginFileUploadAnalysis}
          style={optionCardStyle(theme, selectedSource === "file")}
        >
          <Text selectable style={optionTitleStyle(theme)}>
            File Upload
          </Text>
          <Text selectable style={optionDescriptionStyle(theme)}>
            Upload a PDF or image from your files.
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isAnalyzing}
          onPress={beginManualEntry}
          style={optionCardStyle(theme, selectedSource === "manual")}
        >
          <Text selectable style={optionTitleStyle(theme)}>
            Manual Input
          </Text>
          <Text selectable style={optionDescriptionStyle(theme)}>
            Enter medications manually if you do not want to scan or upload.
          </Text>
        </Pressable>

        {selectedSource === "camera" ? (
          <View
            style={{
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 230,
              overflow: "hidden",
              backgroundColor: theme.colors.surface,
            }}
          >
            {hasCameraPermission ? (
              <CameraView
                style={{ minHeight: 230 }}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            ) : (
              <View
                style={{
                  minHeight: 230,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                }}
              >
                <Text selectable style={optionDescriptionStyle(theme)}>
                  Camera permission is required to open the viewfinder.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={requestPermission}
                  style={outlineButtonStyle(theme)}
                >
                  <Text selectable style={outlineButtonTextStyle(theme)}>
                    Grant Camera Access
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={
            isAnalyzing || selectedSource !== "camera" || !hasCameraPermission
          }
          onPress={beginCameraAnalysis}
          style={primaryButtonStyle(
            theme,
            isAnalyzing || selectedSource !== "camera" || !hasCameraPermission
          )}
        >
          <Text selectable style={primaryButtonTextStyle(theme)}>
            Capture And Analyze
          </Text>
        </Pressable>
      </View>
    </FlowScreenShell>
  );
}

type PrescriptionReviewScreenProps = NativeStackScreenProps<
  PrescriptionFlowStackParamList,
  "PrescriptionReview"
> & {
  entryContext: EntryContext;
  onCancel: () => void;
  medications: ParsedMedication[];
  onChangeField: (
    medicationId: string,
    field: MedicationFieldKey,
    value: string
  ) => void;
  onAddMedication: () => void;
  onRemoveMedication: (medicationId: string) => void;
  onChangeMedicationType: (medicationId: string, type: MedicationType) => void;
  onSyncSlots: () => void;
  onUpdateInteractions: (nextInteractions: DrugInteraction[]) => void;
};

function PrescriptionReviewScreen({
  navigation,
  entryContext,
  onCancel,
  medications,
  onChangeField,
  onAddMedication,
  onRemoveMedication,
  onChangeMedicationType,
  onSyncSlots,
  onUpdateInteractions,
}: PrescriptionReviewScreenProps) {
  const { theme } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const canContinue = medications.length > 0;

  const goNext = () => {
    if (!canContinue) {
      return;
    }

    onSyncSlots();

    const nextInteractions = buildDrugInteractions(medications);
    onUpdateInteractions(nextInteractions);

    if (nextInteractions.length === 0) {
      navigation.navigate("SlotAssignment");
      return;
    }

    navigation.navigate("DrugInteractionWarning");
  };

  return (
    <FlowScreenShell
      title="Prescription Review"
      description="Review and correct parsed medication fields before assignment."
      onBack={() => navigation.goBack()}
      entryContext={entryContext}
      onCancel={onCancel}
      loading={isLoading}
      loadingMessage="Preparing extracted fields..."
      footer={
        <Pressable
          accessibilityRole="button"
          disabled={!canContinue}
          onPress={goNext}
          style={primaryButtonStyle(theme, !canContinue)}
        >
          <Text selectable style={primaryButtonTextStyle(theme)}>
            Continue
          </Text>
        </Pressable>
      }
    >
      {medications.length === 0 ? (
        <View style={{ gap: theme.spacing.sm }}>
          <View style={emptyStateStyle(theme)}>
            <Text selectable style={emptyStateTitleStyle(theme)}>
              No prescriptions added
            </Text>
            <Text selectable style={emptyStateTextStyle(theme)}>
              Add your first medication manually to continue.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onAddMedication}
            style={outlineButtonStyle(theme)}
          >
            <Text selectable style={outlineButtonTextStyle(theme)}>
              Add Prescription
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          <Pressable
            accessibilityRole="button"
            onPress={onAddMedication}
            style={outlineButtonStyle(theme)}
          >
            <Text selectable style={outlineButtonTextStyle(theme)}>
              Add Prescription
            </Text>
          </Pressable>

          {medications.map((medication) => {
            const fieldEntries = Object.values(medication.fields);

            return (
              <View
                key={medication.id}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md,
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
                  <Text selectable style={sectionTitleStyle(theme)}>
                    {medication.fields.name.value || "Unnamed medication"}
                  </Text>

                  {medications.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onRemoveMedication(medication.id)}
                      style={outlineButtonStyle(theme)}
                    >
                      <Text selectable style={outlineButtonTextStyle(theme)}>
                        Remove
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  {(["Pill", "Powder"] as const).map((typeOption) => {
                    const isSelected = medication.type === typeOption;

                    return (
                      <Pressable
                        key={`${medication.id}-${typeOption}`}
                        accessibilityRole="button"
                        onPress={() =>
                          onChangeMedicationType(medication.id, typeOption)
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                          backgroundColor: isSelected
                            ? theme.colors.primaryMuted
                            : theme.colors.surfaceRaised,
                          borderRadius: theme.radius.md,
                          paddingHorizontal: theme.spacing.sm,
                          paddingVertical: theme.spacing.xs,
                        }}
                      >
                        <Text selectable style={supportingTextStyle(theme)}>
                          {typeOption}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {fieldEntries.map((field) => {
                  if (field.key === "dosage") {
                    const dosageValue = field.value.replace(/\s*mg\s*$/, "");

                    return (
                      <View
                        key={field.key}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.md,
                          backgroundColor: theme.colors.surfaceRaised,
                          padding: theme.spacing.sm,
                          gap: theme.spacing.xs,
                        }}
                      >
                        <Text selectable style={labelStyle(theme)}>
                          {field.label}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: theme.spacing.xs,
                            alignItems: "center",
                          }}
                        >
                          <TextInput
                            onChangeText={(value) =>
                              onChangeField(
                                medication.id,
                                "dosage",
                                value ? `${value} mg` : ""
                              )
                            }
                            placeholder="Enter dosage"
                            placeholderTextColor={theme.colors.textSecondary}
                            style={[inputStyle(theme), { flex: 1 }]}
                            keyboardType="numeric"
                            value={dosageValue}
                          />
                          <Text
                            selectable
                            style={{
                              color: theme.colors.textPrimary,
                              fontFamily: theme.typography.family.secondary,
                              fontSize: theme.typography.size.md,
                              fontWeight: theme.typography.weight.medium,
                              paddingRight: theme.spacing.sm,
                            }}
                          >
                            mg
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  if (field.key === "frequency") {
                    return (
                      <View
                        key={field.key}
                        style={{
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.md,
                          backgroundColor: theme.colors.surfaceRaised,
                          padding: theme.spacing.sm,
                          gap: theme.spacing.xs,
                        }}
                      >
                        <Text selectable style={labelStyle(theme)}>
                          {field.label}
                        </Text>
                        <Picker
                          selectedValue={field.value}
                          onValueChange={(value) =>
                            onChangeField(medication.id, "frequency", value)
                          }
                          style={{ color: theme.colors.textPrimary }}
                        >
                          <Picker.Item label="Select frequency" value="" />
                          <Picker.Item label="Once" value="Once" />
                          <Picker.Item label="Twice" value="Twice" />
                          <Picker.Item
                            label="Three times"
                            value="Three times"
                          />
                          <Picker.Item label="Four times" value="Four times" />
                          <Picker.Item label="Five times" value="Five times" />
                        </Picker>
                      </View>
                    );
                  }

                  return (
                    <View
                      key={field.key}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        backgroundColor: theme.colors.surfaceRaised,
                        padding: theme.spacing.sm,
                        gap: theme.spacing.xs,
                      }}
                    >
                      <Text selectable style={labelStyle(theme)}>
                        {field.label}
                      </Text>
                      <TextInput
                        onChangeText={(value) =>
                          onChangeField(medication.id, field.key, value)
                        }
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        placeholderTextColor={theme.colors.textSecondary}
                        style={inputStyle(theme)}
                        value={field.value}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}
    </FlowScreenShell>
  );
}

type DrugInteractionWarningScreenProps = NativeStackScreenProps<
  PrescriptionFlowStackParamList,
  "DrugInteractionWarning"
> & {
  entryContext: EntryContext;
  onCancel: () => void;
  interactions: DrugInteraction[];
};

function DrugInteractionWarningScreen({
  navigation,
  entryContext,
  onCancel,
  interactions,
}: DrugInteractionWarningScreenProps) {
  const { theme } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <FlowScreenShell
      title="Drug Interaction Warning"
      description="Potential interactions were detected. Review each warning before continuing."
      onBack={() => navigation.goBack()}
      entryContext={entryContext}
      onCancel={onCancel}
      loading={isLoading}
      loadingMessage="Checking interaction data..."
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("SlotAssignment")}
          style={primaryButtonStyle(theme, false)}
        >
          <Text selectable style={primaryButtonTextStyle(theme)}>
            Acknowledged, Continue
          </Text>
        </Pressable>
      }
    >
      {interactions.length === 0 ? (
        <View style={emptyStateStyle(theme)}>
          <Text selectable style={emptyStateTitleStyle(theme)}>
            No interactions detected
          </Text>
          <Text selectable style={emptyStateTextStyle(theme)}>
            This screen is normally skipped when no interaction risks are found.
          </Text>
        </View>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {interactions.map((interaction) => (
            <View
              key={interaction.id}
              style={{
                borderWidth: 1,
                borderColor: severityBorderColor(
                  interaction.severity,
                  theme.colors
                ),
                backgroundColor: severityBackgroundColor(
                  interaction.severity,
                  theme.mode,
                  theme.colors
                ),
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text selectable style={sectionTitleStyle(theme)}>
                  {interaction.medicationPair[0]} +{" "}
                  {interaction.medicationPair[1]}
                </Text>
                <SeverityChip severity={interaction.severity} />
              </View>
              <Text selectable style={optionDescriptionStyle(theme)}>
                {interaction.summary}
              </Text>
            </View>
          ))}
        </View>
      )}
    </FlowScreenShell>
  );
}

type SlotAssignmentScreenProps = NativeStackScreenProps<
  PrescriptionFlowStackParamList,
  "SlotAssignment"
> & {
  entryContext: EntryContext;
  onCancel: () => void;
  slots: SlotAssignment[];
  medications: ParsedMedication[];
  onToggleSlot: (slotId: string) => void;
  onComplete: () => void;
};

function SlotAssignmentScreen({
  navigation,
  entryContext,
  onCancel,
  slots,
  medications,
  onToggleSlot,
  onComplete,
}: SlotAssignmentScreenProps) {
  const { theme } = useAppTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const canFinish = slots.length > 0 && slots.every((slot) => slot.confirmed);
  const hasSlotConflict = hasConflictingSlotAssignments(slots, medications);

  return (
    <FlowScreenShell
      title="Slot Assignment"
      description="Confirm each slot loading step before completing this flow."
      onBack={() => navigation.goBack()}
      entryContext={entryContext}
      onCancel={onCancel}
      loading={isLoading}
      loadingMessage="Loading slot map..."
      footer={
        <Pressable
          accessibilityRole="button"
          disabled={!canFinish || hasSlotConflict}
          onPress={onComplete}
          style={primaryButtonStyle(theme, !canFinish || hasSlotConflict)}
        >
          <Text selectable style={primaryButtonTextStyle(theme)}>
            {entryContext === "onboarding"
              ? "Continue To Schedule Review"
              : "Save Medication"}
          </Text>
        </Pressable>
      }
    >
      {slots.length === 0 ? (
        <View style={emptyStateStyle(theme)}>
          <Text selectable style={emptyStateTitleStyle(theme)}>
            No slots generated
          </Text>
          <Text selectable style={emptyStateTextStyle(theme)}>
            Return to review and confirm at least one medication entry.
          </Text>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: theme.spacing.sm,
          }}
        >
          {slots.map((slot) => {
            const medication = medications.find(
              (item) => item.id === slot.medicationId
            );

            return (
              <View
                key={slot.id}
                style={{
                  width: "48%",
                  minWidth: 150,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.sm,
                  gap: theme.spacing.xs,
                }}
              >
                <Text selectable style={labelStyle(theme)}>
                  Slot {slot.slotLabel}
                </Text>
                <Text selectable style={sectionTitleStyle(theme)}>
                  {medication?.fields.name.value ?? "Unassigned medication"}
                </Text>
                <Text selectable style={supportingTextStyle(theme)}>
                  {medication?.type ?? "Unknown type"}
                </Text>

                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: slot.confirmed }}
                  onPress={() => onToggleSlot(slot.id)}
                  style={{
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: slot.confirmed
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: slot.confirmed
                      ? theme.colors.primaryMuted
                      : theme.colors.surfaceRaised,
                    paddingVertical: theme.spacing.xs,
                    alignItems: "center",
                  }}
                >
                  <Text selectable style={supportingTextStyle(theme)}>
                    {slot.confirmed
                      ? "[x] Slot Loaded"
                      : "[ ] Confirm Slot Loaded"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {hasSlotConflict ? (
        <Text
          selectable
          style={{
            color: unresolvedTextColor(theme.mode, theme.colors),
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.medium,
          }}
        >
          Different medication names cannot share the same slot. Please review
          slot assignments.
        </Text>
      ) : null}
    </FlowScreenShell>
  );
}

type FlowScreenShellProps = {
  title: string;
  description: string;
  onBack: () => void;
  entryContext: EntryContext;
  onCancel: () => void;
  loading: boolean;
  loadingMessage: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function FlowScreenShell({
  title,
  description,
  onBack,
  entryContext,
  onCancel,
  loading,
  loadingMessage,
  children,
  footer,
}: FlowScreenShellProps) {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={outlineButtonStyle(theme)}
        >
          <Text selectable style={outlineButtonTextStyle(theme)}>
            Back
          </Text>
        </Pressable>

        {entryContext === "add-medication" ? (
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={outlineButtonStyle(theme)}
          >
            <Text selectable style={outlineButtonTextStyle(theme)}>
              Cancel
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {title}
        </Text>
        <Text selectable style={optionDescriptionStyle(theme)}>
          {description}
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceRaised,
          padding: theme.spacing.md,
          gap: theme.spacing.md,
        }}
      >
        {loading ? (
          <View
            style={{
              minHeight: 180,
              justifyContent: "center",
              alignItems: "center",
              gap: theme.spacing.sm,
            }}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text selectable style={optionDescriptionStyle(theme)}>
              {loadingMessage}
            </Text>
          </View>
        ) : (
          children
        )}

        {!loading && footer ? footer : null}
      </View>
    </ScrollView>
  );
}

function SeverityChip({ severity }: { severity: DrugInteractionSeverity }) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: severityBorderColor(severity, theme.colors),
        backgroundColor: severityBackgroundColor(
          severity,
          theme.mode,
          theme.colors
        ),
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
      }}
    >
      <Text
        selectable
        style={{
          color: severityTextColor(severity, theme.colors),
          fontFamily: theme.typography.family.primary,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.semibold,
        }}
      >
        {severity}
      </Text>
    </View>
  );
}

function optionCardStyle(
  theme: ReturnType<typeof useAppTheme>["theme"],
  active: boolean
) {
  return {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: active ? theme.colors.primary : theme.colors.border,
    backgroundColor: active ? theme.colors.primaryMuted : theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  } as const;
}

function sectionTitleStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  } as const;
}

function optionTitleStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  } as const;
}

function optionDescriptionStyle(
  theme: ReturnType<typeof useAppTheme>["theme"]
) {
  return {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.family.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    lineHeight: 20,
  } as const;
}

function supportingTextStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.family.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  } as const;
}

function labelStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
  } as const;
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

function primaryButtonStyle(
  theme: ReturnType<typeof useAppTheme>["theme"],
  disabled: boolean
) {
  return {
    flex: 1,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    backgroundColor: disabled
      ? theme.colors.primaryMuted
      : theme.colors.primary,
    opacity: disabled ? 0.6 : 1,
  } as const;
}

function primaryButtonTextStyle(
  theme: ReturnType<typeof useAppTheme>["theme"]
) {
  return {
    color: theme.colors.textInverse,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
  } as const;
}

function outlineButtonStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  } as const;
}

function outlineButtonTextStyle(
  theme: ReturnType<typeof useAppTheme>["theme"]
) {
  return {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  } as const;
}

function emptyStateStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    borderWidth: 1,
    borderStyle: "dashed" as const,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  };
}

function emptyStateTitleStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.family.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  } as const;
}

function emptyStateTextStyle(theme: ReturnType<typeof useAppTheme>["theme"]) {
  return {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.family.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    lineHeight: 20,
  } as const;
}

function severityBorderColor(
  severity: DrugInteractionSeverity,
  colors: { alert: string; warning: string; info: string }
) {
  if (severity === "High") {
    return colors.alert;
  }

  if (severity === "Moderate") {
    return colors.warning;
  }

  return colors.info;
}

function severityBackgroundColor(
  severity: DrugInteractionSeverity,
  mode: "light" | "dark",
  colors: { alert: string; warning: string; info: string }
) {
  if (severity === "High") {
    return withAlpha(colors.alert, mode === "dark" ? 0.22 : 0.12);
  }

  if (severity === "Moderate") {
    return withAlpha(colors.warning, mode === "dark" ? 0.22 : 0.12);
  }

  return withAlpha(colors.info, mode === "dark" ? 0.22 : 0.12);
}

function severityTextColor(
  severity: DrugInteractionSeverity,
  colors: { alert: string; warning: string; info: string }
) {
  if (severity === "High") {
    return colors.alert;
  }

  if (severity === "Moderate") {
    return colors.warning;
  }

  return colors.info;
}


function unresolvedTextColor(
  mode: "light" | "dark",
  colors: { warning: string }
) {
  return mode === "dark" ? withAlpha(colors.warning, 0.95) : colors.warning;
}

function createEditableMedication(): ParsedMedication {
  const id = `manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    id,
    type: "Pill",
    fields: {
      name: {
        key: "name",
        label: "Medication Name",
        value: "",
        confidence: "Low",
        unresolved: true,
        confirmed: false,
      },
      dosage: {
        key: "dosage",
        label: "Dosage",
        value: "",
        confidence: "Low",
        unresolved: true,
        confirmed: false,
      },
      frequency: {
        key: "frequency",
        label: "Frequency",
        value: "",
        confidence: "Low",
        unresolved: true,
        confirmed: false,
      },
    },
  };
}

function buildParsedMedications(
  source: PrescriptionSource
): ParsedMedication[] {
  if (source === "manual") {
    return [createEditableMedication()];
  }

  if (source === "camera") {
    return [
      {
        id: "med-1",
        type: "Pill",
        fields: {
          name: {
            key: "name",
            label: "Medication Name",
            value: "Warfarin",
            confidence: "High",
            unresolved: false,
            confirmed: true,
          },
          dosage: {
            key: "dosage",
            label: "Dosage",
            value: "5 mg",
            confidence: "Medium",
            unresolved: true,
            confirmed: false,
          },
          frequency: {
            key: "frequency",
            label: "Frequency",
            value: "Once daily",
            confidence: "High",
            unresolved: false,
            confirmed: true,
          },
        },
      },
      {
        id: "med-2",
        type: "Pill",
        fields: {
          name: {
            key: "name",
            label: "Medication Name",
            value: "Aspirin",
            confidence: "High",
            unresolved: false,
            confirmed: true,
          },
          dosage: {
            key: "dosage",
            label: "Dosage",
            value: "81 mg",
            confidence: "High",
            unresolved: false,
            confirmed: true,
          },
          frequency: {
            key: "frequency",
            label: "Frequency",
            value: "Once daily",
            confidence: "Medium",
            unresolved: true,
            confirmed: false,
          },
        },
      },
    ];
  }

  return [
    {
      id: "med-1",
      type: "Powder",
      fields: {
        name: {
          key: "name",
          label: "Medication Name",
          value: "Metformin",
          confidence: "Medium",
          unresolved: true,
          confirmed: false,
        },
        dosage: {
          key: "dosage",
          label: "Dosage",
          value: "500 mg",
          confidence: "Low",
          unresolved: true,
          confirmed: false,
        },
        frequency: {
          key: "frequency",
          label: "Frequency",
          value: "Twice daily",
          confidence: "Medium",
          unresolved: false,
          confirmed: true,
        },
      },
    },
  ];
}

function buildDrugInteractions(medications: ParsedMedication[]) {
  const names = medications.map((medication) =>
    medication.fields.name.value.toLowerCase()
  );

  const hasWarfarin = names.some((name) => name.includes("warfarin"));
  const hasAspirin = names.some((name) => name.includes("aspirin"));

  if (hasWarfarin && hasAspirin) {
    return [
      {
        id: "interaction-1",
        medicationPair: ["Warfarin", "Aspirin"],
        severity: "High",
        summary:
          "Concurrent use increases bleeding risk. Confirm with prescribing clinician before administration.",
      },
    ] satisfies DrugInteraction[];
  }

  if (medications.length > 1) {
    return [
      {
        id: "interaction-2",
        medicationPair: [
          medications[0].fields.name.value,
          medications[1].fields.name.value,
        ],
        severity: "Moderate",
        summary:
          "Interaction requires timing separation. Consider staggered schedule and clinician verification.",
      },
    ] satisfies DrugInteraction[];
  }

  return [];
}

function buildSlotAssignments(medications: ParsedMedication[]) {
  const slotLabels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const usedSlotLabels = new Set<string>();

  return medications.map((medication, index) => {
    let slotIndex = index;
    let slotLabel = slotLabels[slotIndex] ?? `X${slotIndex + 1}`;

    while (usedSlotLabels.has(slotLabel)) {
      slotIndex += 1;
      slotLabel = slotLabels[slotIndex] ?? `X${slotIndex + 1}`;
    }

    usedSlotLabels.add(slotLabel);

    return {
      id: `slot-${slotLabel}`,
      slotLabel,
      medicationId: medication.id,
      confirmed: false,
    };
  });
}

function hasConflictingSlotAssignments(
  slots: SlotAssignment[],
  medications: ParsedMedication[]
) {
  const nameBySlot = new Map<string, string>();

  for (const slot of slots) {
    const medication = medications.find(
      (item) => item.id === slot.medicationId
    );

    if (!medication) {
      continue;
    }

    const medicationName = medication.fields.name.value.trim().toLowerCase();

    if (medicationName.length === 0) {
      continue;
    }

    const previousName = nameBySlot.get(slot.slotLabel);

    if (previousName && previousName !== medicationName) {
      return true;
    }

    nameBySlot.set(slot.slotLabel, medicationName);
  }

  return false;
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}
