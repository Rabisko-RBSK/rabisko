import React from 'react';
import {
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Primary CTA per the design system (DESIGN.md §8.3): a 12px-radius rectangle (NOT a pill),
 * Inter 700 / 20px label, 18×40 padding, scale .97 on press. plum is the only "accent" variant.
 * Width is left to the parent (RN columns stretch children; rows don't), so this matches the
 * old component's layout behaviour.
 */
type Variant = 'primary' | 'secondary' | 'plum' | 'outline' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: Variant;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-ink',
  secondary: 'bg-surface',
  plum: 'bg-plum',
  outline: 'bg-transparent border-2 border-ink',
  ghost: 'bg-transparent',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-on-ink',
  secondary: 'text-ink',
  plum: 'text-white',
  outline: 'text-ink',
  ghost: 'text-ink',
};

const SPINNER_LIGHT: Variant[] = ['primary', 'plum'];

export function Button({
  title,
  loading,
  variant = 'primary',
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = !!disabled || !!loading;

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={animatedStyle}
      className={`flex-row items-center justify-center rounded-r-md px-10 py-[18px] ${CONTAINER[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER_LIGHT.includes(variant) ? '#fff' : '#000'} />
      ) : (
        <Text
          className={`font-body-bold text-[20px] ${LABEL[variant]}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >{title}</Text>
      )}
    </AnimatedTouchable>
  );
}
