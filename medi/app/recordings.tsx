import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Pressable, SectionList, Text, View } from "react-native";

import { BadgeChip } from "@/components/badge-chip";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { SectionListHeader } from "@/components/section-list-header";

import {
  formatRecordingTime,
  groupRecordingsByDate,
  type RecordingItem,
} from "@/src/recordings/recording-library";
import { useAppTheme } from "@/src/theme/theme-provider";

export default function RecordingsListScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const recordingGroups = useMemo(() => groupRecordingsByDate(), []);
  const sections = useMemo(
    () =>
      recordingGroups.map((group) => ({
        title: group.title,
        data: group.items,
      })),
    [recordingGroups]
  );

  const keyExtractor = useCallback((item: RecordingItem) => item.id, []);

  const renderRecordingItem = useCallback(
    ({ item }: { item: RecordingItem }) => (
      <RecordingRow
        recording={item}
        onPress={() =>
          router.push({
            pathname: "/recordings/[recordingId]",
            params: { recordingId: item.id },
          })
        }
      />
    ),
    [router]
  );

  const listHeader = (
    <Card style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
      <Text
        selectable
        style={{
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.family.primary,
          fontSize: theme.typography.size.lg,
          fontWeight: theme.typography.weight.semibold,
        }}
      >
        Recordings
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
        Browse dose event recordings by date, then open a clip to review
        details.
      </Text>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderRecordingItem}
        renderSectionHeader={({ section }) => (
          <SectionListHeader label={section.title} />
        )}
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
        }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            heading="No recordings yet"
            body="Dose event recordings will appear here once captures are available."
            icon="videocam-outline"
          />
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: theme.spacing.sm }} />
        )}
        SectionSeparatorComponent={() => (
          <View style={{ height: theme.spacing.md }} />
        )}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
      />
    </View>
  );
}

type RecordingRowProps = {
  recording: RecordingItem;
  onPress: () => void;
};

const RecordingRow = React.memo(function RecordingRow({
  recording,
  onPress,
}: RecordingRowProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        flexDirection: "row",
        gap: theme.spacing.sm,
      }}
    >
      <View
        style={{
          width: 92,
          height: 68,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Ionicons name="play" size={18} color={theme.colors.primary} />
        <Text
          selectable
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.xs,
            fontWeight: theme.typography.weight.medium,
          }}
        >
          Thumbnail
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
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
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatRecordingTime(recording.capturedAt)}
          </Text>

          {!recording.reviewed ? (
            <BadgeChip label="Review" variant="amber" />
          ) : null}
        </View>

        <Text
          selectable
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.family.primary,
            fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold,
          }}
        >
          {recording.doseEventLabel}
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
          {recording.medicationName}
        </Text>
      </View>
    </Pressable>
  );
});
