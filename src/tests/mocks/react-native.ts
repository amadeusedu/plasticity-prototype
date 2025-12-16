// Minimal React Native mock so Vitest/Vite never parses real RN internals (Flow).
// Add exports only when tests complain.

export const View = "View";
export const Text = "Text";
export const Pressable = "Pressable";
export const TouchableOpacity = "TouchableOpacity";

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T) => styles,
};

export const Platform = {
  OS: "test",
  select: (obj: any) => obj?.default ?? obj,
};

export const Dimensions = {
  get: () => ({ width: 375, height: 812, scale: 2, fontScale: 2 }),
};

export const Animated = {
  Value: class {
    constructor(public v: any) {}
  },
  timing: () => ({ start: (cb?: any) => cb?.() }),
};
