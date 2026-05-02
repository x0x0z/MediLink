export type RecordingItem = {
  id: string;
  medicationName: string;
  capturedAt: string;
  slotLabel: string;
  doseEventLabel: string;
  caregiverName: string;
  reviewed: boolean;
  retentionDays: number;
};

export const RECORDINGS: RecordingItem[] = [
  {
    id: "rec-0417-0810",
    medicationName: "Metformin 500 mg",
    capturedAt: "2026-04-17T08:10:00.000Z",
    slotLabel: "Morning",
    doseEventLabel: "Dose Taken",
    caregiverName: "Ana Rivera",
    reviewed: false,
    retentionDays: 30,
  },
  {
    id: "rec-0417-1350",
    medicationName: "Lisinopril 10 mg",
    capturedAt: "2026-04-17T13:50:00.000Z",
    slotLabel: "Afternoon",
    doseEventLabel: "Snooze Triggered",
    caregiverName: "Ana Rivera",
    reviewed: true,
    retentionDays: 30,
  },
  {
    id: "rec-0416-2015",
    medicationName: "Atorvastatin 20 mg",
    capturedAt: "2026-04-16T20:15:00.000Z",
    slotLabel: "Evening",
    doseEventLabel: "Dose Missed",
    caregiverName: "Marcus Lee",
    reviewed: false,
    retentionDays: 30,
  },
  {
    id: "rec-0415-0740",
    medicationName: "Metformin 500 mg",
    capturedAt: "2026-04-15T07:40:00.000Z",
    slotLabel: "Morning",
    doseEventLabel: "Dose Taken",
    caregiverName: "Ana Rivera",
    reviewed: true,
    retentionDays: 30,
  },
  {
    id: "rec-0413-2105",
    medicationName: "Melatonin 3 mg",
    capturedAt: "2026-04-13T21:05:00.000Z",
    slotLabel: "Night",
    doseEventLabel: "Dose Taken",
    caregiverName: "Marcus Lee",
    reviewed: true,
    retentionDays: 30,
  },
];

export function getSortedRecordings(): RecordingItem[] {
  return [...RECORDINGS].sort((left, right) => {
    return (
      new Date(right.capturedAt).getTime() - new Date(left.capturedAt).getTime()
    );
  });
}

export function getRecordingById(recordingId: string) {
  return RECORDINGS.find((recording) => recording.id === recordingId) ?? null;
}

export function formatRecordingTime(capturedAt: string) {
  return new Date(capturedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRecordingDate(capturedAt: string) {
  return new Date(capturedAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type RecordingGroup = {
  title: string;
  items: RecordingItem[];
};

export function groupRecordingsByDate(
  now: Date = new Date()
): RecordingGroup[] {
  const today = startOfDay(now).getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const groups = new Map<string, RecordingItem[]>();

  for (const recording of getSortedRecordings()) {
    const recordedAt = new Date(recording.capturedAt);
    const recordedDay = startOfDay(recordedAt).getTime();

    let groupTitle = formatRecordingDate(recording.capturedAt);

    if (recordedDay === today) {
      groupTitle = "Today";
    } else if (recordedDay === yesterday) {
      groupTitle = "Yesterday";
    }

    const existing = groups.get(groupTitle) ?? [];
    existing.push(recording);
    groups.set(groupTitle, existing);
  }

  return Array.from(groups.entries()).map(([title, items]) => ({
    title,
    items,
  }));
}

function startOfDay(value: Date) {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
}
