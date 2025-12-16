import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeIn({ children, duration = 250, style }: FadeInProps): JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [duration, opacity]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

interface SlideUpProps extends FadeInProps {
  distance?: number;
}

export function SlideUp({ children, duration = 250, distance = 8, style }: SlideUpProps): JSX.Element {
  const translate = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, { toValue: 0, duration, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
    ]).start();
  }, [distance, duration, opacity, translate]);

  return <Animated.View style={[style, { transform: [{ translateY: translate }], opacity }]}>{children}</Animated.View>;
}
