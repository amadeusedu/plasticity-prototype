// Minimal ambient module shims to allow typechecking without installed React Native packages.

declare namespace JSX {
  interface Element {}
  interface ElementClass {
    render?: any;
  }
  interface ElementAttributesProperty {
    props?: any;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface IntrinsicAttributes {
    key?: any;
  }
}

declare namespace React {
  type ReactNode = any;
  type ComponentType<P = any> = any;
  type FC<P = any> = (props: P) => JSX.Element | null;
  interface PropsWithChildren<P = unknown> {
    children?: ReactNode;
  }
  interface ErrorInfo {
    componentStack?: string;
  }
  class Component<P = any, S = any> {
    constructor(props: P);
    props: P;
    state: S;
    setState(state: Partial<S> | ((prev: S) => Partial<S>), callback?: () => void): void;
    render(): any;
  }
  function createElement(...args: any[]): any;
  function createContext<T>(defaultValue: T): any;
  function useContext<T>(context: any): T;
  function useState<T = any>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  function useEffect(...args: any[]): void;
  function useMemo<T>(factory: () => T, deps?: any[]): T;
  function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T;
  function useRef<T>(value: T): { current: T };
}

declare const React: any;

declare module 'react' {
  export = React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-native' {
  export type ViewStyle = any;
  export type TextStyle = any;
  export type StyleProp<T> = any;
  export type AppStateStatus = any;
  export const AppState: any;
  export const View: any;
  export const Text: any;
  export const TextInput: any;
  export const StyleSheet: { create: (styles: any) => any };
  export const ScrollView: any;
  export const Pressable: any;
  export const Animated: any;
  export const SafeAreaView: any;
}

declare module '@react-navigation/native' {
  export const NavigationContainer: any;
  export function useNavigation<T = any>(): T;
  export type NavigationProp<T = any> = any;
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator<T = any>(): any;
  export type NativeStackScreenProps<T, R extends keyof T = keyof T> = any;
}

declare module '@react-navigation/drawer';

declare module '@react-navigation/bottom-tabs';

declare module 'expo-status-bar' {
  export const StatusBar: any;
}

declare module 'expo' {
  export const LinearGradient: any;
}

declare module 'expo-linear-gradient' {
  export const LinearGradient: any;
}

declare module 'react-native-reanimated' {
  const Reanimated: any;
  export default Reanimated;
  export const Easing: any;
  export const FadeIn: any;
  export const FadeInUp: any;
  export const FadeOut: any;
  export const FadeOutDown: any;
  export const Layout: any;
}

declare module 'react-native-svg' {
  const Svg: any;
  export default Svg;
}

declare module 'react-native-svg/lib/typescript/ReactNativeSVG' {
  const Svg: any;
  export default Svg;
}

declare module 'react-native/Libraries/NewAppScreen' {
  export const Colors: any;
}

declare module 'vitest/config' {
  export const defineConfig: any;
}

declare module 'vitest' {
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const vi: any;
  export const beforeEach: any;
  export const afterEach: any;
}

declare module 'zod' {
  export namespace z {
    type infer<T> = any;
  }
  export const z: any;
}

declare module 'uuid' {
  export function v4(): string;
}

declare module '@supabase/supabase-js' {
  export type SupabaseClient<T = any> = any;
  export function createClient<T = any>(...args: any[]): SupabaseClient<T>;
}
