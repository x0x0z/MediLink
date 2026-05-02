import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";

import { BadgeChip } from "@/components/badge-chip";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { Modal as ConfirmationModal } from "@/components/modal";
import { SkeletonLoader } from "@/components/skeleton-loader";
import { StatusChip } from "@/components/status-chip";

import {
  addDoseToSchedule,
  proposeDoseTimeChange,
  removeScheduledDose,
  reviewDoseTimeChangeProposal,
  updateScheduledDoseTime,
  usePendingDoseTimeChangeProposals,
  useScheduledDoses,
  useScheduledMedications,
} from "@/src/prescription-flow/prescription-store";
import type {
  CaregiverRole,
  ScheduledDose,
} from "@/src/prescription-flow/types";
import { withAlpha } from "@/src/theme/color-utils";
import { useAppTheme } from "@/src/theme/theme-provider";

type SyncStatus = "synced" | "syncing" | "offline";

export default function ScheduleScreen() {
  const router = useRouter();
  const { theme, colorMode } = useAppTheme();
  const medications = useScheduledMedications();
  const doses = useScheduledDoses();
  const pendingProposals = usePendingDoseTimeChangeProposals();
  const params = useLocalSearchParams<{
    refreshedAt?: string;
    caregiverRole?: CaregiverRole;
  }>();
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date())
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("syncing");
  const [isAddSheetVisible, setIsAddSheetVisible] = useState(false);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [isProposeSheetVisible, setIsProposeSheetVisible] = useState(false);
  const [isProposeConfirmationVisible, setIsProposeConfirmationVisible] =
    useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<
    string | null
  >(null);
  const [draftAddTime, setDraftAddTime] = useState(() => defaultDraftTime());
  const [draftEditTime, setDraftEditTime] = useState(() => defaultDraftTime());
  const [draftProposalTime, setDraftProposalTime] = useState(() =>
    defaultDraftTime()
  );
  const [activeDose, setActiveDose] = useState<ScheduledDose | null>(null);

  const caregiverRole: CaregiverRole =
    params.caregiverRole === "secondary" ? "secondary" : "primary";
  const isPrimaryCaregiver = caregiverRole === "primary";

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
      setSyncStatus("synced");
    }, 950);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const pulseSyncStatus = useCallback(() => {
    setSyncStatus("syncing");

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      setSyncStatus("synced");
      syncTimerRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    if (!params.refreshedAt) {
      return;
    }
    pulseSyncStatus();
  }, [params.refreshedAt, pulseSyncStatus]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (medications.length === 0) {
      setSelectedMedicationId(null);
      return;
    }

    setSelectedMedicationId((current) => {
      if (
        current &&
        medications.some((medication) => medication.id === current)
      ) {
        return current;
      }

      return medications[0]?.id ?? null;
    });
  }, [medications]);

  const currentWeek = useMemo(
    () => buildCurrentWeek(selectedDateKey),
    [selectedDateKey]
  );
  const selectedDateLabel = useMemo(
    () => formatSelectedDateLabel(selectedDateKey),
    [selectedDateKey]
  );

  const dosesForSelectedDate = useMemo(() => {
    return doses
      .filter((dose) => dose.dateKey === selectedDateKey)
      .sort((left, right) => left.time.localeCompare(right.time));
  }, [doses, selectedDateKey]);

  const pendingProposalPreview = useMemo(() => {
    if (pendingProposals.length === 0) {
      return null;
    }

    return pendingProposals[0];
  }, [pendingProposals]);

  const openAddDoseSheet = useCallback(() => {
    setDraftAddTime(defaultDraftTime());
    setIsAddSheetVisible(true);
  }, []);

  const openEditDoseSheet = useCallback(
    (dose: ScheduledDose) => {
      if (!isPrimaryCaregiver) {
        return;
      }

      setActiveDose(dose);
      setDraftEditTime(dateFromTime(dose.time));
      setIsEditSheetVisible(true);
    },
    [isPrimaryCaregiver]
  );

  const openProposalSheet = useCallback(
    (dose: ScheduledDose) => {
      if (isPrimaryCaregiver) {
        return;
      }

      setActiveDose(dose);
      setDraftProposalTime(dateFromTime(dose.time));
      setIsProposeSheetVisible(true);
    },
    [isPrimaryCaregiver]
  );

  const handleAddDose = () => {
    if (!selectedMedicationId) {
      setSyncStatus("offline");
      return;
    }

    const createdDose = addDoseToSchedule({
      medicationId: selectedMedicationId,
      dateKey: selectedDateKey,
      time: formatTimeForStorage(draftAddTime),
    });

    if (!createdDose) {
      setSyncStatus("offline");
      return;
    }

    setIsAddSheetVisible(false);
    pulseSyncStatus();
  };

  const handleEditDoseTime = () => {
    if (!activeDose) {
      return;
    }

    const didUpdate = updateScheduledDoseTime(
      activeDose.id,
      formatTimeForStorage(draftEditTime)
    );

    if (!didUpdate) {
      setSyncStatus("offline");
      return;
    }

    setIsEditSheetVisible(false);
    setActiveDose(null);
    pulseSyncStatus();
  };

  const handleRemoveDose = () => {
    if (!activeDose) {
      return;
    }

    const didRemove = removeScheduledDose(activeDose.id);

    if (!didRemove) {
      setSyncStatus("offline");
      return;
    }

    setIsEditSheetVisible(false);
    setActiveDose(null);
    pulseSyncStatus();
  };

  const handleCreateProposal = () => {
    if (!activeDose) {
      return;
    }

    setIsProposeSheetVisible(false);
    setIsProposeConfirmationVisible(true);
  };

  const confirmProposal = () => {
    if (!activeDose) {
      return;
    }

    const proposed = proposeDoseTimeChange({
      doseId: activeDose.id,
      proposedTime: formatTimeForStorage(draftProposalTime),
      requestedBy: "secondary",
    });

    if (!proposed) {
      setSyncStatus("offline");
      setIsProposeConfirmationVisible(false);
      return;
    }

    setIsProposeConfirmationVisible(false);
    setActiveDose(null);
    pulseSyncStatus();
  };

  const reviewPendingProposal = useCallback(
    (proposalId: string, decision: "approved" | "rejected") => {
      const didReview = reviewDoseTimeChangeProposal({ proposalId, decision });

      if (!didReview) {
        setSyncStatus("offline");
        return;
      }

      pulseSyncStatus();
    },
    [pulseSyncStatus]
  );

  const openPrescriptionInput = () => {
    setIsAddSheetVisible(false);
    router.push("/add-medication");
  };

  const canCreateDose = medications.length > 0 && Boolean(selectedMedicationId);
  const timePickerDisplay =
    process.env.EXPO_OS === "ios" ? "spinner" : "default";
  const pickerTextColor =
    process.env.EXPO_OS === "ios" ? theme.colors.textPrimary : undefined;
  const doseKeyExtractor = useCallback((dose: ScheduledDose) => dose.id, []);
  const pendingBannerBorder = withAlpha(
    theme.colors.warning,
    theme.mode === "dark" ? 0.6 : 0.38
  );
  const pendingBannerBackground = withAlpha(
    theme.colors.warning,
    theme.mode === "dark" ? 0.22 : 0.12
  );

  const renderDoseRow = useCallback(
    ({ item: dose }: { item: ScheduledDose }) => {
      return (
        <DoseRow
          dose={dose}
          isPrimaryCaregiver={isPrimaryCaregiver}
          onEditDose={openEditDoseSheet}
          onProposeDose={openProposalSheet}
        />
      );
    },
    [isPrimaryCaregiver, openEditDoseSheet, openProposalSheet]
  );

  const listHeader = (
    <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: theme.spacing.sm,
        }}
      >
        <View style={{ gap: theme.spacing.xs, flex: 1 }}>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.xl,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Schedule
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
            {isPrimaryCaregiver
              ? "Primary caregiver mode"
              : "Secondary caregiver mode"}
          </Text>
        </View>

        <BadgeChip
          label={
            syncStatus === "synced"
              ? "Synced"
              : syncStatus === "syncing"
              ? "Syncing"
              : "Offline"
          }
          variant={
            syncStatus === "synced"
              ? "green"
              : syncStatus === "syncing"
              ? "teal"
              : "amber"
          }
        />
      </View>

      {isPrimaryCaregiver && pendingProposalPreview ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: pendingBannerBorder,
            backgroundColor: pendingBannerBackground,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            gap: theme.spacing.sm,
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.warning,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Pending caregiver changes ({pendingProposals.length})
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
            {pendingProposalPreview.medicationName} in slot{" "}
            {pendingProposalPreview.slotLabel}:{" "}
            {pendingProposalPreview.currentTime} to{" "}
            {pendingProposalPreview.proposedTime}
          </Text>

          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                reviewPendingProposal(pendingProposalPreview.id, "approved")
              }
              style={{
                flex: 1,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                paddingVertical: theme.spacing.xs,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.textInverse,
                  fontFamily: theme.typography.family.primary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.semibold,
                }}
              >
                Approve
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                reviewPendingProposal(pendingProposalPreview.id, "rejected")
              }
              style={{
                flex: 1,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceRaised,
                alignItems: "center",
                paddingVertical: theme.spacing.xs,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.typography.family.primary,
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.medium,
                }}
              >
                Reject
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.medium,
          }}
        >
          Week view
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            {currentWeek.map((day) => {
              const isActive = day.dateKey === selectedDateKey;

              return (
                <Pressable
                  key={day.dateKey}
                  accessibilityRole="button"
                  onPress={() => setSelectedDateKey(day.dateKey)}
                  style={{
                    borderWidth: 1,
                    borderColor: isActive
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: isActive
                      ? theme.colors.primaryMuted
                      : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    minWidth: 64,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.family.secondary,
                      fontSize: theme.typography.size.xs,
                      fontWeight: theme.typography.weight.medium,
                    }}
                  >
                    {day.shortLabel}
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.family.primary,
                      fontSize: theme.typography.size.sm,
                      fontWeight: theme.typography.weight.semibold,
                    }}
                  >
                    {day.dayOfMonth}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {selectedDateLabel}
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
          {dosesForSelectedDate.length} scheduled dose
          {dosesForSelectedDate.length === 1 ? "" : "s"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {isInitialLoading ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            flexGrow: 1,
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          {listHeader}
          <View style={{ gap: theme.spacing.sm }}>
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonLoader
                key={`skeleton-dose-${index}`}
                variant="card"
                height={68}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={dosesForSelectedDate}
          keyExtractor={doseKeyExtractor}
          renderItem={renderDoseRow}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              heading="No doses for this day"
              body="Use Add Dose Time to schedule a new administration time, or switch to another day."
              icon="calendar-outline"
            />
          }
          ItemSeparatorComponent={() => (
            <View style={{ height: theme.spacing.sm }} />
          )}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl * 3,
          }}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          windowSize={7}
        />
      )}

      <Button
        label="Add Dose Time"
        onPress={openAddDoseSheet}
        variant="primary"
        size="md"
        style={{
          position: "absolute",
          right: theme.spacing.lg,
          bottom: theme.spacing.xl,
        }}
      />

      <BottomSheet
        visible={isAddSheetVisible}
        onClose={() => setIsAddSheetVisible(false)}
      >
        <View style={{ gap: theme.spacing.md }}>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.lg,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Add Dose Time
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
            {formatSelectedDateLabel(selectedDateKey)}
          </Text>

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              selectable
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.family.primary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
              }}
            >
              Medication
            </Text>

            {medications.length === 0 ? (
              <View
                style={{
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: theme.colors.primary,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surfaceRaised,
                  padding: theme.spacing.md,
                  gap: theme.spacing.sm,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  selectable
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.family.secondary,
                    fontSize: theme.typography.size.sm,
                    fontWeight: theme.typography.weight.regular,
                  }}
                >
                  No medications available yet.
                </Text>

                <Button
                  label="Open Prescription Input"
                  onPress={openPrescriptionInput}
                  variant="primary"
                  size="sm"
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: theme.spacing.md,
                  }}
                />
              </View>
            ) : (
              <View style={{ gap: theme.spacing.xs }}>
                {medications.map((medication) => {
                  const isSelected = medication.id === selectedMedicationId;

                  return (
                    <Pressable
                      key={medication.id}
                      accessibilityRole="button"
                      onPress={() => setSelectedMedicationId(medication.id)}
                      style={{
                        borderWidth: 1,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        backgroundColor: isSelected
                          ? theme.colors.primaryMuted
                          : theme.colors.surface,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.sm,
                        gap: 2,
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
                        {medication.name}
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
                        Slot {medication.slotLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              selectable
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.family.primary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
              }}
            >
              Dose time
            </Text>

            <View
              style={{
                minHeight: 260,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceRaised,
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <DateTimePicker
                mode="time"
                display={timePickerDisplay}
                is24Hour
                minuteInterval={1}
                value={draftAddTime}
                themeVariant={colorMode}
                textColor={pickerTextColor}
                accentColor={theme.colors.primary}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setDraftAddTime(selectedDate);
                  }
                }}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Button
              label="Cancel"
              onPress={() => setIsAddSheetVisible(false)}
              variant="ghost"
              fullWidth
            />

            <Button
              label="Save Dose"
              disabled={!canCreateDose}
              onPress={handleAddDose}
              variant="primary"
              fullWidth
            />
          </View>

          {medications.length > 0 ? (
            <Button
              label="Add New Medication"
              onPress={openPrescriptionInput}
              variant="ghost"
              size="sm"
            />
          ) : null}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={isEditSheetVisible}
        onClose={() => {
          setIsEditSheetVisible(false);
          setActiveDose(null);
        }}
      >
        <View style={{ gap: theme.spacing.md }}>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.lg,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Edit Dose Time
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
            {activeDose
              ? `${activeDose.medicationName} • Slot ${activeDose.slotLabel}`
              : ""}
          </Text>

          <View
            style={{
              minHeight: 260,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceRaised,
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <DateTimePicker
              mode="time"
              display={timePickerDisplay}
              is24Hour
              minuteInterval={1}
              value={draftEditTime}
              themeVariant={colorMode}
              textColor={pickerTextColor}
              accentColor={theme.colors.primary}
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setDraftEditTime(selectedDate);
                }
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Button
              label="Cancel"
              onPress={() => {
                setIsEditSheetVisible(false);
                setActiveDose(null);
              }}
              variant="ghost"
              fullWidth
            />

            <Button
              label="Save Time"
              onPress={handleEditDoseTime}
              variant="primary"
              fullWidth
            />
          </View>

          <Button
            label="Remove Dose"
            onPress={handleRemoveDose}
            variant="destructive"
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={isProposeSheetVisible}
        onClose={() => {
          setIsProposeSheetVisible(false);
          setActiveDose(null);
        }}
      >
        <View style={{ gap: theme.spacing.md }}>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.lg,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Propose Dose Change
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
            {activeDose
              ? `${activeDose.medicationName} • Slot ${activeDose.slotLabel}`
              : ""}
          </Text>

          <View
            style={{
              minHeight: 260,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceRaised,
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <DateTimePicker
              mode="time"
              display={timePickerDisplay}
              is24Hour
              minuteInterval={1}
              value={draftProposalTime}
              themeVariant={colorMode}
              textColor={pickerTextColor}
              accentColor={theme.colors.primary}
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setDraftProposalTime(selectedDate);
                }
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Button
              label="Cancel"
              onPress={() => {
                setIsProposeSheetVisible(false);
                setActiveDose(null);
              }}
              variant="ghost"
              fullWidth
            />

            <Button
              label="Review Proposal"
              onPress={handleCreateProposal}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </BottomSheet>

      <ConfirmationModal
        visible={isProposeConfirmationVisible}
        title="Submit change for approval?"
        body="This proposed time change will stay pending until a primary caregiver approves it."
        cancelLabel="Cancel"
        confirmLabel="Submit Proposal"
        onCancel={() => {
          setIsProposeConfirmationVisible(false);
          setActiveDose(null);
        }}
        onConfirm={confirmProposal}
      >
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.medium,
          }}
        >
          Proposed time:{" "}
          {formatDisplayTime(formatTimeForStorage(draftProposalTime))}
        </Text>
      </ConfirmationModal>
    </View>
  );
}

type DoseRowProps = {
  dose: ScheduledDose;
  isPrimaryCaregiver: boolean;
  onEditDose: (dose: ScheduledDose) => void;
  onProposeDose: (dose: ScheduledDose) => void;
};

const DoseRow = React.memo(function DoseRow({
  dose,
  isPrimaryCaregiver,
  onEditDose,
  onProposeDose,
}: DoseRowProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onEditDose(dose)}
      disabled={!isPrimaryCaregiver}
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
        opacity: isPrimaryCaregiver ? 1 : 0.98,
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
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.semibold,
            flex: 1,
          }}
        >
          {dose.medicationName}
        </Text>

        <StatusChip status={dose.status} />
      </View>

      <Text
        selectable
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.family.secondary,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.medium,
        }}
      >
        {formatDisplayTime(dose.time)} • Slot {dose.slotLabel}
      </Text>

      {isPrimaryCaregiver ? (
        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.regular,
          }}
        >
          Tap to edit dose time
        </Text>
      ) : (
        <Button
          label="Propose Change"
          onPress={() => onProposeDose(dose)}
          variant="ghost"
          size="sm"
          style={{ alignSelf: "flex-start" }}
        />
      )}
    </Pressable>
  );
});

function defaultDraftTime() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey
    .split("-")
    .map((value) => Number.parseInt(value, 10));

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function dateFromTime(time: string) {
  const [hours, minutes] = time
    .split(":")
    .map((value) => Number.parseInt(value, 10));

  const now = new Date();
  now.setHours(hours || 0, minutes || 0, 0, 0);
  return now;
}

function formatTimeForStorage(value: Date) {
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDisplayTime(time: string) {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildCurrentWeek(selectedDateKey: string) {
  const selectedDate = fromDateKey(selectedDateKey);
  const dayOfWeek = selectedDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);

    return {
      dateKey: toDateKey(day),
      shortLabel: day.toLocaleDateString([], { weekday: "short" }),
      dayOfMonth: `${day.getDate()}`,
    };
  });
}

function formatSelectedDateLabel(dateKey: string) {
  const date = fromDateKey(dateKey);

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
