import { useLocalSearchParams } from "expo-router";

import { ScreenShell } from "@/components/screen-shell";

export default function AlertDetailsScreen() {
  const params = useLocalSearchParams<{ alertId?: string }>();

  return (
    <ScreenShell
      title="Alert Details"
      description={`Full-screen alert investigation view for alert ID: ${
        params.alertId ?? "pending"
      }.`}
    />
  );
}
