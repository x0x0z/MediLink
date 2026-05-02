import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { SkeletonLoader } from "@/components/skeleton-loader";

import { useScheduledDoses } from "@/src/prescription-flow/prescription-store";
import { useAppTheme } from "@/src/theme/theme-provider";

type VitalsSnapshot = {
  id: string;
  label: string;
  value: string;
  observedAt: string;
};

const VITALS_SNAPSHOT: VitalsSnapshot[] = [
  {
    id: "heart-rate",
    label: "Heart Rate",
    value: "72 bpm",
    observedAt: "8m ago",
  },
  {
    id: "blood-pressure",
    label: "Blood Pressure",
    value: "118/76 mmHg",
    observedAt: "1h ago",
  },
  {
    id: "glucose",
    label: "Glucose",
    value: "108 mg/dL",
    observedAt: "3h ago",
  },
];

export default function HealthReportScreen() {
  const { theme } = useAppTheme();
  const doses = useScheduledDoses();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 900);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const reportSummary = useMemo(() => {
    const taken = doses.filter((dose) => dose.status === "Taken").length;
    const missed = doses.filter((dose) => dose.status === "Missed").length;
    const snoozed = doses.filter((dose) => dose.status === "Snoozed").length;
    const total = taken + missed + snoozed;
    const adherence = total === 0 ? 0 : Math.round((taken / total) * 100);

    return {
      taken,
      missed,
      snoozed,
      total,
      adherence,
    };
  }, [doses]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <Card style={{ gap: theme.spacing.xs }}>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.xl,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            Health Report
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
            Preview your shareable PDF with compliance summary and vitals
            snapshot.
          </Text>
        </Card>

        <Card style={{ gap: theme.spacing.md }}>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.primary,
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            PDF preview
          </Text>

          {isInitialLoading ? (
            <View style={{ gap: theme.spacing.sm }}>
              <SkeletonLoader variant="custom" width="100%" height={14} />
              <SkeletonLoader variant="custom" width="100%" height={14} />
              <SkeletonLoader variant="custom" width="100%" height={14} />
              <SkeletonLoader variant="card" height={96} />
              <SkeletonLoader variant="card" height={72} />
            </View>
          ) : (
            <>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceRaised,
                  }}
                >
                  <TableHeader title="Metric" />
                  <TableHeader title="Value" />
                </View>

                <TableRow
                  label="Taken doses"
                  value={`${reportSummary.taken}`}
                />
                <TableRow
                  label="Missed doses"
                  value={`${reportSummary.missed}`}
                />
                <TableRow
                  label="Snoozed doses"
                  value={`${reportSummary.snoozed}`}
                />
                <TableRow
                  label="Adherence"
                  value={`${reportSummary.adherence}%`}
                />
              </View>

              {reportSummary.total === 0 ? (
                <EmptyState
                  heading="No compliance events yet"
                  body="Once doses are logged, the report table will update automatically."
                  icon="document-text-outline"
                />
              ) : null}

              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md,
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
                  Vitals snapshot
                </Text>

                {VITALS_SNAPSHOT.map((vital) => (
                  <View
                    key={vital.id}
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
                          fontFamily: theme.typography.family.primary,
                          fontSize: theme.typography.size.sm,
                          fontWeight: theme.typography.weight.semibold,
                        }}
                      >
                        {vital.label}
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
                        {vital.observedAt}
                      </Text>
                    </View>

                    <Text
                      selectable
                      style={{
                        color: theme.colors.textPrimary,
                        fontFamily: theme.typography.family.primary,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weight.semibold,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {vital.value}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Button label="Share via Email" variant="primary" fullWidth />
          <Button label="Download PDF" variant="secondary" fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

type TableHeaderProps = {
  title: string;
};

function TableHeader({ title }: TableHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
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
        {title}
      </Text>
    </View>
  );
}

type TableRowProps = {
  label: string;
  value: string;
};

function TableRow({ label, value }: TableRowProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
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
          {label}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          alignItems: "flex-end",
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
            fontVariant: ["tabular-nums"],
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
