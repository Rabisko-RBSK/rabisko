import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { PressableProps } from 'react-native';
import { theme } from '../../theme';

type Props = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'plum' | 'outline' | 'ghost';
  loading?: boolean;
};

/** Ações da ficha: texto quebra em linhas, sem encolher a fonte ou cortar o rótulo. */
export function AnamneseButton({ title, variant = 'primary', loading = false, disabled, style, ...props }: Props) {
  const dark = variant === 'primary' || variant === 'plum';
  const foreground = dark ? theme.colors.onInk : theme.colors.ink;
  const background = variant === 'primary' ? theme.colors.ink
    : variant === 'plum' ? theme.colors.plum
      : variant === 'secondary' ? theme.colors.surface : 'transparent';
  return <Pressable {...props} accessibilityRole={props.accessibilityRole ?? 'button'}
    accessibilityState={{ ...props.accessibilityState, disabled: !!disabled || loading, busy: loading }}
    disabled={disabled || loading}
    style={(state) => [{
      alignItems: 'center', justifyContent: 'center', minHeight: theme.spacing[12],
      paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3],
      borderRadius: theme.radius.md, backgroundColor: background,
      borderWidth: variant === 'outline' ? 2 : 0, borderColor: theme.colors.ink,
      opacity: disabled || loading ? 0.5 : state.pressed ? 0.8 : 1,
    }, typeof style === 'function' ? style(state) : style]}>
    {loading && <ActivityIndicator color={foreground} />}
    <Text className="font-body-bold text-[16px] leading-6 text-center"
      style={{ color: foreground, flexShrink: 1, width: '100%' }}>{title}</Text>
  </Pressable>;
}
