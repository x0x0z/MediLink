export type EntryContext = "onboarding" | "add-medication";

export type CaregiverRole = "primary" | "secondary";

export type PrescriptionSource = "camera" | "file" | "manual";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type MedicationType = "Pill" | "Powder";

export type MedicationFieldKey = "name" | "dosage" | "frequency";

export type MedicationField = {
  key: MedicationFieldKey;
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  unresolved: boolean;
  confirmed: boolean;
};

export type ParsedMedication = {
  id: string;
  type: MedicationType;
  fields: {
    name: MedicationField;
    dosage: MedicationField;
    frequency: MedicationField;
  };
};

export type DrugInteractionSeverity = "High" | "Moderate" | "Low";

export type DrugInteraction = {
  id: string;
  medicationPair: [string, string];
  severity: DrugInteractionSeverity;
  summary: string;
};

export type SlotAssignment = {
  id: string;
  slotLabel: string;
  medicationId: string;
  confirmed: boolean;
};

export type ScheduledMedication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  type: MedicationType;
  slotLabel: string;
  source: PrescriptionSource;
  updatedAt: string;
};

export type DoseStatus = "Upcoming" | "Taken" | "Missed" | "Snoozed";

export type ScheduledDose = {
  id: string;
  medicationId: string;
  medicationName: string;
  slotLabel: string;
  dateKey: string;
  time: string;
  status: DoseStatus;
  source: "system" | "manual" | "proposal-approved";
  updatedAt: string;
  lastReminderSentAt?: string;
  lastReminderSentBy?: string;
  reminderCount?: number;
};

export type DoseTimeChangeProposal = {
  id: string;
  doseId: string;
  medicationName: string;
  slotLabel: string;
  dateKey: string;
  currentTime: string;
  proposedTime: string;
  requestedBy: CaregiverRole;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};
