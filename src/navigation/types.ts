export type MainTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Logs: undefined;
  Alerts: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  QuickAddModal: undefined;
  AlertDetails: {
    alertId?: string;
  };
};
