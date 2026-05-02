import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Modal } from "@/components/modal";
import { SectionListHeader } from "@/components/section-list-header";

import {
  dismissAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  type AlertType,
  type NotificationAlert,
  useAlerts,
  useUnreadAlertsCount,
} from "@/src/app-state/app-state-store";
import { useAppTheme } from "@/src/theme/theme-provider";

type AlertFilter = "all" | "unread";

type AlertSection = {
  title: "Today" | "Yesterday" | "Earlier";
  data: NotificationAlert[];
};

export default function AlertsScreen() {
  const { theme } = useAppTheme();

  const [filter, setFilter] = useState<AlertFilter>("all");
  const alerts = useAlerts();
  const unreadCount = useUnreadAlertsCount();
  const [selectedTamperAlert, setSelectedTamperAlert] =
    useState<NotificationAlert | null>(null);
  const [selectedPatternAlert, setSelectedPatternAlert] =
    useState<NotificationAlert | null>(null);
  const [hasConsultedClinician, setHasConsultedClinician] = useState(false);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAlertsAsRead();
  }, []);

  const filteredAlerts = useMemo(() => {
    const sortedAlerts = [...alerts].sort((left, right) => {
      return (
        new Date(right.receivedAt).getTime() -
        new Date(left.receivedAt).getTime()
      );
    });

    if (filter === "unread") {
      return sortedAlerts.filter((alert) => !alert.isRead);
    }

    return sortedAlerts;
  }, [alerts, filter]);

  const sections = useMemo<AlertSection[]>(() => {
    const grouped: Record<AlertSection["title"], NotificationAlert[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    const todayKey = toDateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = toDateKey(yesterdayDate);

    for (const alert of filteredAlerts) {
      const dateKey = toDateKey(new Date(alert.receivedAt));

      if (dateKey === todayKey) {
        grouped.Today.push(alert);
        continue;
      }

      if (dateKey === yesterdayKey) {
        grouped.Yesterday.push(alert);
        continue;
      }

      grouped.Earlier.push(alert);
    }

    return (["Today", "Yesterday", "Earlier"] as const)
      .filter((title) => grouped[title].length > 0)
      .map((title) => ({
        title,
        data: grouped[title],
      }));
  }, [filteredAlerts]);

  const handleDismissAlert = useCallback((alertId: string) => {
    dismissAlert(alertId);
    setSelectedTamperAlert((current) =>
      current?.id === alertId ? null : current
    );
    setSelectedPatternAlert((current) =>
      current?.id === alertId ? null : current
    );
  }, []);

  const handleMarkAlertAsRead = useCallback((alertId: string) => {
    markAlertAsRead(alertId);
  }, []);

  const handleEscalateConfirm = useCallback(() => {
    if (!selectedTamperAlert) {
      return;
    }

    handleMarkAlertAsRead(selectedTamperAlert.id);
    setSelectedTamperAlert(null);
  }, [handleMarkAlertAsRead, selectedTamperAlert]);

  const handleOpenPatternModal = useCallback((alert: NotificationAlert) => {
    setSelectedPatternAlert(alert);
    setHasConsultedClinician(false);
  }, []);

  const handlePatternConfirm = useCallback(() => {
    if (!selectedPatternAlert || !hasConsultedClinician) {
      return;
    }

    handleMarkAlertAsRead(selectedPatternAlert.id);
    setSelectedPatternAlert(null);
    setHasConsultedClinician(false);
  }, [handleMarkAlertAsRead, hasConsultedClinician, selectedPatternAlert]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.xxl,
        }}
        sections={sections}
        stickySectionHeadersEnabled={false}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View
            style={{ gap: theme.spacing.md, marginBottom: theme.spacing.xs }}
          >
            <Card style={{ gap: theme.spacing.sm }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                  Filter
                </Text>

                <Button
                  label="Mark all as read"
                  disabled={unreadCount === 0 || alerts.length === 0}
                  onPress={handleMarkAllAsRead}
                  variant={unreadCount === 0 ? "ghost" : "secondary"}
                  size="sm"
                />
              </View>

              <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
                <Button
                  label="All"
                  onPress={() => setFilter("all")}
                  variant={filter === "all" ? "secondary" : "ghost"}
                  size="sm"
                />
                <Button
                  label={`Unread (${unreadCount})`}
                  onPress={() => setFilter("unread")}
                  variant={filter === "unread" ? "secondary" : "ghost"}
                  size="sm"
                />
              </View>
            </Card>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              marginTop: theme.spacing.xxs,
              marginBottom: theme.spacing.xs,
            }}
          >
            <SectionListHeader label={section.title} />
          </View>
        )}
        renderItem={({ item }) => (
          <Swipeable
            overshootRight={false}
            rightThreshold={32}
            onSwipeableOpen={() => handleDismissAlert(item.id)}
            renderRightActions={() => <SwipeDismissAction />}
          >
            <AlertListItem
              alert={item}
              onPress={() => handleMarkAlertAsRead(item.id)}
              onEscalate={() => setSelectedTamperAlert(item)}
              onReviewSuggestion={() => handleOpenPatternModal(item)}
            />
          </Swipeable>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: theme.spacing.xs }} />
        )}
        SectionSeparatorComponent={() => (
          <View style={{ height: theme.spacing.xs }} />
        )}
        ListEmptyComponent={
          <View style={{ marginTop: theme.spacing.xs }}>
            <EmptyState
              heading={
                filter === "unread" ? "No unread alerts" : "No alerts yet"
              }
              body={
                filter === "unread"
                  ? "New push notifications will appear here."
                  : "Push notifications will populate this feed automatically."
              }
              icon="notifications-outline"
            />
          </View>
        }
      />

      <EscalationConfirmModal
        alert={selectedTamperAlert}
        onClose={() => setSelectedTamperAlert(null)}
        onConfirm={handleEscalateConfirm}
      />

      <PatternSuggestionModal
        alert={selectedPatternAlert}
        hasConsulted={hasConsultedClinician}
        onToggleConsulted={() =>
          setHasConsultedClinician((current) => !current)
        }
        onClose={() => {
          setSelectedPatternAlert(null);
          setHasConsultedClinician(false);
        }}
        onConfirm={handlePatternConfirm}
      />
    </View>
  );

  function SwipeDismissAction() {
    return (
      <View
        style={{
          width: 104,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.alert,
          justifyContent: "center",
          alignItems: "center",
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
          Dismiss
        </Text>
      </View>
    );
  }
}

type AlertListItemProps = {
  alert: NotificationAlert;
  onPress: () => void;
  onEscalate: () => void;
  onReviewSuggestion: () => void;
};

function AlertListItem({
  alert,
  onPress,
  onEscalate,
  onReviewSuggestion,
}: AlertListItemProps) {
  const { theme } = useAppTheme();
  const icon = alertTypeIcon(alert.type, theme.colors);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: alert.isRead
          ? theme.colors.surfaceRaised
          : theme.colors.surface,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: theme.spacing.sm,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginTop: 2,
          }}
        >
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
            }}
          >
            <Text
              selectable
              numberOfLines={1}
              style={{
                flex: 1,
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.family.primary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
              }}
            >
              {alert.title}
            </Text>

            {!alert.isRead ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: theme.colors.alert,
                }}
              />
            ) : null}
          </View>

          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.xs,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            {alert.type} • {formatAlertTimestamp(alert.receivedAt)}
          </Text>

          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.regular,
              lineHeight: 20,
            }}
          >
            {alert.body}
          </Text>
        </View>
      </View>

      {alert.type === "Tamper Detected" ? (
        <Button
          label="Escalate to Emergency Services"
          onPress={onEscalate}
          variant="destructive"
          size="sm"
        />
      ) : null}

      {alert.type === "Pattern Detected" ? (
        <Button
          label="Review Suggestion"
          onPress={onReviewSuggestion}
          variant="ghost"
          size="sm"
        />
      ) : null}
    </Pressable>
  );
}

type EscalationConfirmModalProps = {
  alert: NotificationAlert | null;
  onClose: () => void;
  onConfirm: () => void;
};

function EscalationConfirmModal({
  alert,
  onClose,
  onConfirm,
}: EscalationConfirmModalProps) {
  const { theme } = useAppTheme();

  if (!alert) {
    return null;
  }

  return (
    <Modal
      visible={Boolean(alert)}
      title="Confirm escalation"
      body="You are about to escalate this tamper alert to emergency services. Continue only for an active safety risk."
      cancelLabel="Cancel"
      confirmLabel="Proceed"
      onCancel={onClose}
      onConfirm={onConfirm}
      destructive
    >
      <Card padding="sm" style={{ backgroundColor: theme.colors.surface }}>
        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {alert.title}
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
          {formatAlertTimestamp(alert.receivedAt)}
        </Text>
      </Card>
    </Modal>
  );
}

type PatternSuggestionModalProps = {
  alert: NotificationAlert | null;
  hasConsulted: boolean;
  onToggleConsulted: () => void;
  onClose: () => void;
  onConfirm: () => void;
};

function PatternSuggestionModal({
  alert,
  hasConsulted,
  onToggleConsulted,
  onClose,
  onConfirm,
}: PatternSuggestionModalProps) {
  const { theme } = useAppTheme();

  if (!alert) {
    return null;
  }

  return (
    <Modal
      visible={Boolean(alert)}
      title="Pattern suggestion"
      body="Review this recommendation before applying any schedule change."
      cancelLabel="Cancel"
      confirmLabel="Confirm"
      onCancel={onClose}
      onConfirm={onConfirm}
      confirmDisabled={!hasConsulted}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <Card padding="sm" style={{ gap: theme.spacing.xs }}>
          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.xs,
            }}
          >
            Detected pattern
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {alert.patternSummary ?? "No pattern details available."}
          </Text>
        </Card>

        <Card padding="sm" style={{ gap: theme.spacing.xs }}>
          <Text
            selectable
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.xs,
            }}
          >
            Suggested schedule change
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
            }}
          >
            {alert.suggestion ?? "No suggestion available."}
          </Text>
        </Card>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hasConsulted }}
          onPress={onToggleConsulted}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: theme.radius.sm,
              borderWidth: 1,
              borderColor: hasConsulted
                ? theme.colors.primary
                : theme.colors.border,
              backgroundColor: hasConsulted
                ? theme.colors.primaryMuted
                : theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasConsulted ? (
              <Ionicons
                name="checkmark"
                size={14}
                color={theme.colors.textPrimary}
              />
            ) : null}
          </View>

          <Text
            selectable
            style={{
              flex: 1,
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.family.secondary,
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            I have consulted a doctor or pharmacist
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function alertTypeIcon(
  type: AlertType,
  colors: {
    alert: string;
    warning: string;
    info: string;
  }
) {
  if (type === "Dose Taken") {
    return {
      name: "checkmark-done-circle-outline" as const,
      color: colors.info,
    };
  }

  if (type === "Dose Missed") {
    return {
      name: "close-circle-outline" as const,
      color: colors.alert,
    };
  }

  if (type === "Snooze Triggered") {
    return {
      name: "timer-outline" as const,
      color: colors.warning,
    };
  }

  if (type === "Tamper Detected") {
    return {
      name: "alert-circle-outline" as const,
      color: colors.alert,
    };
  }

  if (type === "Refill Low") {
    return {
      name: "medical-outline" as const,
      color: colors.warning,
    };
  }

  if (type === "Power Outage") {
    return {
      name: "flash-off-outline" as const,
      color: colors.warning,
    };
  }

  if (type === "Reminder Sent") {
    return {
      name: "notifications-outline" as const,
      color: colors.info,
    };
  }

  return {
    name: "analytics-outline" as const,
    color: colors.info,
  };
}

function formatAlertTimestamp(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
