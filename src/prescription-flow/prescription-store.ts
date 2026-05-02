// Prescription Store: Manages medications, scheduled doses, and caregiver change proposals.
// This is the single source of truth for all medication-related data in the app.
// Components subscribe to changes and get notified when data updates.

import { useEffect, useState } from "react";

import {
  getCaregivers,
  logReminderAlert,
  recordDeviceSync,
} from "@/src/app-state/app-state-store";

import type {
  CaregiverRole,
  DoseStatus,
  DoseTimeChangeProposal,
  ScheduledDose,
  ScheduledMedication,
} from "./types";

type MedicationStoreListener = (records: ScheduledMedication[]) => void;
type DoseStoreListener = (records: ScheduledDose[]) => void;
type ProposalStoreListener = (records: DoseTimeChangeProposal[]) => void;

const medicationListeners = new Set<MedicationStoreListener>();
const doseListeners = new Set<DoseStoreListener>();
const proposalListeners = new Set<ProposalStoreListener>();

let medications: ScheduledMedication[] = [];
let scheduledDoses: ScheduledDose[] = [];
let doseTimeChangeProposals: DoseTimeChangeProposal[] = [];

function notifyMedicationStore() {
  const snapshot = [...medications];

  medicationListeners.forEach((listener) => {
    listener(snapshot);
  });
}

function notifyDoseStore() {
  const snapshot = [...scheduledDoses];

  doseListeners.forEach((listener) => {
    listener(snapshot);
  });
}

function notifyProposalStore() {
  const snapshot = [...doseTimeChangeProposals];

  proposalListeners.forEach((listener) => {
    listener(snapshot);
  });
}

export function getScheduledMedications() {
  return [...medications];
}

export function getScheduledDoses() {
  return [...scheduledDoses];
}

export function getDoseTimeChangeProposals() {
  return [...doseTimeChangeProposals];
}

export function getPendingDoseTimeChangeProposals() {
  return doseTimeChangeProposals.filter(
    (proposal) => proposal.status === "pending"
  );
}

export function addMedicationsToSchedule(entries: ScheduledMedication[]) {
  medications = [...entries, ...medications];

  const generatedDoses = entries.flatMap((entry, index) => {
    return buildDosePlanForMedication(entry, index);
  });

  scheduledDoses = [...generatedDoses, ...scheduledDoses];

  notifyMedicationStore();
  notifyDoseStore();
  recordDeviceSync();
}

type AddDosePayload = {
  medicationId: string;
  dateKey: string;
  time: string;
};

export function addDoseToSchedule({
  medicationId,
  dateKey,
  time,
}: AddDosePayload) {
  const medication = medications.find((entry) => entry.id === medicationId);

  if (!medication) {
    return null;
  }

  const now = new Date().toISOString();
  const record: ScheduledDose = {
    id: `dose-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    medicationId: medication.id,
    medicationName: medication.name,
    slotLabel: medication.slotLabel,
    dateKey,
    time,
    status: inferDoseStatus(dateKey, time, 0),
    source: "manual",
    updatedAt: now,
  };

  scheduledDoses = [record, ...scheduledDoses];
  notifyDoseStore();
  recordDeviceSync(record.updatedAt);

  return record;
}

export function updateScheduledDoseTime(
  doseId: string,
  time: string,
  status?: DoseStatus
) {
  const now = new Date().toISOString();

  let didUpdate = false;

  scheduledDoses = scheduledDoses.map((dose) => {
    if (dose.id !== doseId) {
      return dose;
    }

    didUpdate = true;

    return {
      ...dose,
      time,
      status: status ?? inferDoseStatus(dose.dateKey, time, 0),
      updatedAt: now,
      source: "manual",
    };
  });

  if (!didUpdate) {
    return false;
  }

  notifyDoseStore();
  recordDeviceSync(now);
  return true;
}

export function removeScheduledDose(doseId: string) {
  const previousCount = scheduledDoses.length;

  scheduledDoses = scheduledDoses.filter((dose) => dose.id !== doseId);
  doseTimeChangeProposals = doseTimeChangeProposals.filter(
    (proposal) => proposal.doseId !== doseId
  );

  const didRemove = scheduledDoses.length < previousCount;

  if (!didRemove) {
    return false;
  }

  notifyDoseStore();
  notifyProposalStore();
  recordDeviceSync();
  return true;
}

type SendDoseReminderPayload = {
  doseId: string;
  caregiverName?: string;
};

export function sendDoseReminder({
  doseId,
  caregiverName,
}: SendDoseReminderPayload) {
  const dose = scheduledDoses.find((entry) => entry.id === doseId);

  if (!dose) {
    return null;
  }

  const sentAt = new Date().toISOString();
  const actor = resolveReminderActor(caregiverName);
  let didUpdate = false;

  scheduledDoses = scheduledDoses.map((entry) => {
    if (entry.id !== doseId) {
      return entry;
    }

    didUpdate = true;

    return {
      ...entry,
      lastReminderSentAt: sentAt,
      lastReminderSentBy: actor,
      reminderCount: (entry.reminderCount ?? 0) + 1,
      updatedAt: sentAt,
    };
  });

  const updatedDose =
    scheduledDoses.find((entry) => entry.id === doseId) ?? null;

  if (!didUpdate || !updatedDose) {
    return null;
  }

  notifyDoseStore();
  logReminderAlert({
    caregiverName: actor,
    sentAt,
    medicationName: updatedDose.medicationName,
    scheduledTime: updatedDose.time,
    slotLabel: updatedDose.slotLabel,
  });
  recordDeviceSync(sentAt);

  return updatedDose;
}

type SendGeneralReminderPayload = {
  caregiverName?: string;
};

export function sendGeneralReminder({
  caregiverName,
}: SendGeneralReminderPayload = {}) {
  const sentAt = new Date().toISOString();
  const actor = resolveReminderActor(caregiverName);

  logReminderAlert({
    caregiverName: actor,
    sentAt,
  });
  recordDeviceSync(sentAt);

  return sentAt;
}

type ProposeDoseChangePayload = {
  doseId: string;
  proposedTime: string;
  requestedBy: CaregiverRole;
};

export function proposeDoseTimeChange({
  doseId,
  proposedTime,
  requestedBy,
}: ProposeDoseChangePayload) {
  const dose = scheduledDoses.find((entry) => entry.id === doseId);

  if (!dose) {
    return null;
  }

  const proposal: DoseTimeChangeProposal = {
    id: `proposal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    doseId,
    medicationName: dose.medicationName,
    slotLabel: dose.slotLabel,
    dateKey: dose.dateKey,
    currentTime: dose.time,
    proposedTime,
    requestedBy,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  doseTimeChangeProposals = [proposal, ...doseTimeChangeProposals];
  notifyProposalStore();

  return proposal;
}

type ReviewProposalPayload = {
  proposalId: string;
  decision: "approved" | "rejected";
};

export function reviewDoseTimeChangeProposal({
  proposalId,
  decision,
}: ReviewProposalPayload) {
  const proposal = doseTimeChangeProposals.find(
    (entry) => entry.id === proposalId
  );

  if (!proposal || proposal.status !== "pending") {
    return false;
  }

  doseTimeChangeProposals = doseTimeChangeProposals.map((entry) => {
    if (entry.id !== proposalId) {
      return entry;
    }

    return {
      ...entry,
      status: decision,
    };
  });

  if (decision === "approved") {
    const now = new Date().toISOString();

    scheduledDoses = scheduledDoses.map((dose) => {
      if (dose.id !== proposal.doseId) {
        return dose;
      }

      return {
        ...dose,
        time: proposal.proposedTime,
        status: inferDoseStatus(dose.dateKey, proposal.proposedTime, 0),
        source: "proposal-approved",
        updatedAt: now,
      };
    });
    notifyDoseStore();
    recordDeviceSync(now);
  }

  notifyProposalStore();
  return true;
}

export function subscribeScheduledMedications(
  listener: MedicationStoreListener
) {
  medicationListeners.add(listener);

  return () => {
    medicationListeners.delete(listener);
  };
}

export function subscribeScheduledDoses(listener: DoseStoreListener) {
  doseListeners.add(listener);

  return () => {
    doseListeners.delete(listener);
  };
}

export function subscribeDoseTimeChangeProposals(
  listener: ProposalStoreListener
) {
  proposalListeners.add(listener);

  return () => {
    proposalListeners.delete(listener);
  };
}

export function useScheduledMedications() {
  const [records, setRecords] = useState<ScheduledMedication[]>(() =>
    getScheduledMedications()
  );

  useEffect(() => {
    return subscribeScheduledMedications(setRecords);
  }, []);

  return records;
}

export function useScheduledDoses() {
  const [records, setRecords] = useState<ScheduledDose[]>(() =>
    getScheduledDoses()
  );

  useEffect(() => {
    return subscribeScheduledDoses(setRecords);
  }, []);

  return records;
}

export function usePendingDoseTimeChangeProposals() {
  const [records, setRecords] = useState<DoseTimeChangeProposal[]>(() =>
    getPendingDoseTimeChangeProposals()
  );

  useEffect(() => {
    return subscribeDoseTimeChangeProposals((nextRecords) => {
      setRecords(
        nextRecords.filter((proposal) => proposal.status === "pending")
      );
    });
  }, []);

  return records;
}

function buildDosePlanForMedication(
  medication: ScheduledMedication,
  seed: number
) {
  const times = buildTimesFromFrequency(medication.frequency);
  const today = new Date();
  const dayOffsets = [0, 1, 2, 3, 4, 5, 6];

  return dayOffsets.flatMap((offset, offsetIndex) => {
    const date = addDays(today, offset);
    const dateKey = toDateKey(date);

    return times.map((time, timeIndex) => {
      return {
        id: `dose-${medication.id}-${dateKey}-${timeIndex}`,
        medicationId: medication.id,
        medicationName: medication.name,
        slotLabel: medication.slotLabel,
        dateKey,
        time,
        status: inferDoseStatus(dateKey, time, seed + offsetIndex + timeIndex),
        source: "system",
        updatedAt: medication.updatedAt,
      } satisfies ScheduledDose;
    });
  });
}

function buildTimesFromFrequency(frequency: string) {
  const normalized = frequency.toLowerCase();

  if (normalized.includes("three") || normalized.includes("3")) {
    return ["08:00", "14:00", "20:00"];
  }

  if (normalized.includes("twice") || normalized.includes("2")) {
    return ["08:00", "20:00"];
  }

  return ["09:00"];
}

function inferDoseStatus(
  dateKey: string,
  time: string,
  seed: number
): DoseStatus {
  const today = toDateKey(new Date());

  if (dateKey !== today) {
    return "Upcoming";
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = parseTimeToMinutes(time);
  const delta = targetMinutes - nowMinutes;

  if (delta > 30) {
    return "Upcoming";
  }

  if (delta >= -30) {
    return "Snoozed";
  }

  if (delta < -180) {
    return seed % 2 === 0 ? "Missed" : "Taken";
  }

  return "Taken";
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value
    .split(":")
    .map((part) => Number.parseInt(part, 10));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function addDays(base: Date, offset: number) {
  const next = new Date(base);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + offset);
  return next;
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function resolveReminderActor(caregiverName?: string) {
  const trimmedCaregiverName = caregiverName?.trim();

  if (trimmedCaregiverName) {
    return trimmedCaregiverName;
  }

  const primaryCaregiver = getCaregivers().find(
    (caregiver) => caregiver.role === "Primary"
  );
  return primaryCaregiver?.name ?? "Primary caregiver";
}
