import React from "react";

import { BadgeChip } from "@/components/badge-chip";

type KnownStatus = "Upcoming" | "Taken" | "Missed" | "Snoozed" | "Pending";

type StatusChipProps = {
  status: KnownStatus | string;
};

export function StatusChip({ status }: StatusChipProps) {
  if (status === "Taken") {
    return <BadgeChip label={status} variant="green" />;
  }

  if (status === "Missed") {
    return <BadgeChip label={status} variant="red" />;
  }

  if (status === "Snoozed") {
    return <BadgeChip label={status} variant="amber" />;
  }

  if (status === "Upcoming") {
    return <BadgeChip label={status} variant="teal" />;
  }

  return <BadgeChip label={status} variant="gray" />;
}
