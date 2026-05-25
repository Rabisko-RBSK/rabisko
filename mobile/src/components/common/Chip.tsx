import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

/**
 * The three chip variants from the design system (DESIGN.md §8.5 — Chip.jsx).
 *  - FilterChip: pill, cream → ink fill when active; optional leading icon. (Home filters.)
 *  - PrefChip:   pill multi-select; outline-ink (não selecionado) → fill-plum (selecionado).
 *    A versão "ink → plum" original (ambos escuros) era difícil de distinguir num grid de
 *    multi-select: o usuário marcava várias mas parecia que só uma ficava ativa. Outline
 *    vs filled deixa o estado óbvio.
 *  - StatusPill: pill; tone `ink` = cream + ink border, tone `plum` = plum fill. ("Pago", …)
 */

interface FilterChipProps {
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  onPress?: () => void;
}

export function FilterChip({ label, icon: Icon, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      className={`flex-row items-center rounded-rd-pill px-4 py-2 ${active ? 'bg-ink' : 'bg-surface'}`}
    >
      {Icon && <Icon size={14} color={active ? '#FFFFFF' : '#000000'} style={{ marginRight: 8 }} />}
      <Text className={`font-body text-[14px] ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

interface PrefChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function PrefChip({ label, selected, onPress }: PrefChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      className={`rounded-rd-pill px-[18px] py-2.5 border-[1.5px] ${
        selected ? 'bg-plum border-plum' : 'bg-transparent border-ink'
      }`}
    >
      <Text
        className={`font-body-bold text-[13px] uppercase ${selected ? 'text-white' : 'text-ink'}`}
        style={{ letterSpacing: 0.4 }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type StatusTone = 'ink' | 'plum';

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
}

export function StatusPill({ label, tone = 'ink' }: StatusPillProps) {
  const isPlum = tone === 'plum';
  return (
    <View
      className={`rounded-rd-pill px-3.5 py-1.5 ${isPlum ? 'bg-plum' : 'bg-surface border border-ink'}`}
    >
      <Text className={`font-body-bold text-[12px] ${isPlum ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </View>
  );
}
