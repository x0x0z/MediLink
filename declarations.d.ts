// Local declarations for expo-router used inside the medi package
import * as React from "react";

declare module "expo-router/entry" {
  const entry: any;
  export default entry;
}

declare module "expo-router" {
  export type TabBarIconProps = {
    color?: string;
    size?: number;
    focused?: boolean;
  };

  export const Tabs: React.ComponentType<
    React.PropsWithChildren<{
      screenOptions?: {
        headerShown?: boolean;
        headerTintColor?: string;
        headerStyle?: any;
        headerTitleStyle?: any;
        tabBarStyle?: any;
        tabBarActiveTintColor?: string;
        tabBarInactiveTintColor?: string;
        tabBarBadge?: number | string | undefined;
        tabBarIcon?: (props: TabBarIconProps) => React.ReactNode;
        tabBarLabel?:
          | React.ReactNode
          | ((props: { focused: boolean; color: string }) => React.ReactNode);
        tabBarItemStyle?: any;
        tabBarLabelStyle?: any;
        tabBarBadgeStyle?: any;
      };
    }>
  > & { Screen: React.ComponentType<any> };

  export const Stack: any;
  export const Link: any;
  export const Redirect: any;

  export function useRouter(): any;
  export function useLocalSearchParams<T = any>(): T;
  export function useSearchParams<T = any>(): T;
  export type Href = any;

  const _default: any;
  export default _default;
}

declare module "expo-linear-gradient" {
  const LinearGradient: any;
  export { LinearGradient };
  export default LinearGradient;
}

declare module "expo-blur" {
  const BlurView: any;
  export { BlurView };
  export default BlurView;
}
