import React from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Pill-less text field per the design system (DESIGN.md §8.4): warm-cream surface, 12px radius,
 * sentence-case label above in `fg-2`, no border at rest, border turns plum on focus.
 * `secure` adds an eye toggle; `trailingIcon` / `onTrailingPress` for any other trailing action.
 *
 * `multiline` muda o layout pra textarea: o container alinha pelo topo (em vez de centralizar)
 * pra que o ícone e o texto fiquem na primeira linha em vez de centralizados verticalmente
 * no meio do bloco crescido.
 */
interface InputProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  onTrailingPress?: () => void;
  error?: string;
  secure?: boolean;
}

const COLOR_REST = '#EAE0D5'; // surface — invisible border at rest
const COLOR_FOCUS = '#602C66'; // plum
const COLOR_ERROR = '#B33A3A';

export function Input({
  label,
  icon: Icon,
  trailingIcon: Trailing,
  onTrailingPress,
  error,
  secure,
  multiline,
  className,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const focused = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderWidth: 1.5,
    borderColor: withTiming(error ? COLOR_ERROR : focused.value === 1 ? COLOR_FOCUS : COLOR_REST, {
      duration: 150,
    }),
  }));

  return (
    <View className={`mb-4 ${className ?? ''}`}>
      {label && <Text className="font-body text-[12px] text-fg-2 mb-1.5 ml-1">{label}</Text>}

      <Animated.View
        style={animatedStyle}
        className={`flex-row bg-surface rounded-rd-md px-[22px] ${
          multiline ? 'items-start py-3' : 'items-center py-4'
        }`}
      >
        {/* No multiline o ícone ganha 2px de marginTop pra alinhar com a linha-de-base
            da primeira linha do TextInput (que tem ~22px de line-height). */}
        {Icon && (
          <Icon
            size={18}
            color="#000"
            style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }}
          />
        )}

        <TextInput
          className="flex-1 font-body text-[16px] text-ink"
          placeholderTextColor="#6B6B6B"
          secureTextEntry={secure && !showPassword}
          multiline={multiline}
          onFocus={(e) => {
            focused.value = 1;
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focused.value = 0;
            onBlur?.(e);
          }}
          {...rest}
        />

        {secure ? (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            {showPassword ? <EyeOff size={18} color="#000" /> : <Eye size={18} color="#000" />}
          </TouchableOpacity>
        ) : Trailing ? (
          <TouchableOpacity onPress={onTrailingPress}>
            <Trailing size={18} color="#000" />
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {error && <Text className="font-body text-[11px] text-error mt-1 ml-1">{error}</Text>}
    </View>
  );
}
