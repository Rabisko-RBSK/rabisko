import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * Checkbox (DESIGN.md §8 — controle de input simples). Caixa 22×22 com `rounded-rd-xs`
 * (8px) que troca de outline-ink pra fill-plum quando marcada. Plum é a única cor
 * de seleção/ativação do app (CLAUDE.md), por isso o accent fica nele.
 *
 * O tick (✓) anima com spring (escala 0→1 + opacity) — a cor da caixa muda no toque
 * sem animação (mais barato que interpolateColor; o spring no tick já dá a sensação
 * de feedback). Toda a área (caixa + label) é tappable; `hitSlop` adiciona +6px.
 *
 * Usado em: RegisterScreen (aceite de Termos de Uso, obrigatório pros 3 roles).
 */

const SPRING = { damping: 18, stiffness: 240 } as const;

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Conteúdo livre à direita da caixa (geralmente um <Text>). */
  label?: React.ReactNode;
  accessibilityLabel?: string;
}

export function Checkbox({ checked, onChange, label, accessibilityLabel }: CheckboxProps) {
  const progress = useDerivedValue(() => withSpring(checked ? 1 : 0, SPRING));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => onChange(!checked)}
      activeOpacity={0.8}
      className="flex-row items-start"
      style={{ gap: 10 }}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        className={`rounded-rd-xs items-center justify-center ${
          checked ? 'bg-plum border-plum' : 'bg-transparent border-ink'
        }`}
        style={{ width: 22, height: 22, borderWidth: 1.5 }}
      >
        <Animated.View style={tickStyle}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </View>
      {/* `marginTop: 2` alinha opticamente o texto com a caixa (corpo da letra fica ~2px abaixo do topo). */}
      {label && <View className="flex-1" style={{ marginTop: 2 }}>{label}</View>}
    </TouchableOpacity>
  );
}
