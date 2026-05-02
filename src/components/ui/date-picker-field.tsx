import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

import { Button } from "@/components/button";
import GlassPanel from "@/components/glass-panel";
import { useAppTheme } from "@/src/theme/theme-provider";

type DatePickerFieldProps = {
  label: string;
  placeholder: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

const DEFAULT_DATE = new Date(1950, 0, 1);

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function DatePickerField({
  label,
  placeholder,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const { theme, colorMode } = useAppTheme();
  const [isAndroidPickerVisible, setIsAndroidPickerVisible] = useState(false);
  const [isIOSModalVisible, setIsIOSModalVisible] = useState(false);
  const [draftValue, setDraftValue] = useState<Date>(value ?? DEFAULT_DATE);

  const displayValue = useMemo(() => {
    if (!value) {
      return placeholder;
    }

    return formatDate(value);
  }, [placeholder, value]);

  const openPicker = () => {
    if (Platform.OS === "ios") {
      setDraftValue(value ?? DEFAULT_DATE);
      setIsIOSModalVisible(true);
      return;
    }

    setIsAndroidPickerVisible(true);
  };

  const onAndroidChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setIsAndroidPickerVisible(false);

    if (event.type === "set" && selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
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
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Text
          selectable
          style={{
            color: value
              ? theme.colors.textPrimary
              : theme.colors.textSecondary,
            fontFamily: theme.typography.family.secondary,
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.regular,
          }}
        >
          {displayValue}
        </Text>
      </Pressable>

      {Platform.OS === "android" && isAndroidPickerVisible ? (
        <DateTimePicker
          mode="date"
          display="default"
          value={value ?? DEFAULT_DATE}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onAndroidChange}
          themeVariant={colorMode}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal animationType="slide" transparent visible={isIOSModalVisible}>
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: theme.colors.overlayStrong,
            }}
          >
            <GlassPanel
              intensity={56}
              style={{
                width: "100%",
                borderTopLeftRadius: theme.radius.lg,
                borderTopRightRadius: theme.radius.lg,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: theme.colors.glassBorder ?? theme.colors.border,
                padding: theme.spacing.lg,
                paddingBottom: theme.spacing.xl,
                gap: theme.spacing.sm,
                minHeight: 320,
              }}
              stops={
                theme.mode === "dark"
                  ? [theme.colors.glassTint, "rgba(10,10,10,0.45)"]
                  : [theme.colors.glassTint, "rgba(255,255,255,0.88)"]
              }
            >
              <View
                style={{
                  minHeight: 220,
                  height: 220,
                  borderRadius: theme.radius.md,
                  overflow: "hidden",
                  backgroundColor: theme.colors.surfaceRaised,
                  justifyContent: "center",
                }}
              >
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  style={{ flex: 1, width: "100%" }}
                  value={draftValue}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  themeVariant={colorMode}
                  textColor={theme.colors.textPrimary}
                  accentColor={theme.colors.primary}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setDraftValue(selectedDate);
                    }
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  gap: theme.spacing.sm,
                  marginTop: theme.spacing.xs,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsIOSModalVisible(false)}
                  style={{
                    flex: 1,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    alignItems: "center",
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
                    Cancel
                  </Text>
                </Pressable>
                <Button
                  label="Done"
                  onPress={() => {
                    onChange(draftValue);
                    setIsIOSModalVisible(false);
                  }}
                  variant="primary"
                  fullWidth
                />
              </View>
            </GlassPanel>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
