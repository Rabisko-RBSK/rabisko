import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { User, Brush, Store, LucideIcon } from 'lucide-react-native';
import type { UserRoleId } from '../../store/authStore';

/**
 * Cliente / Artista / Estúdio segmented control.
 *
 * This is the CANONICAL CURVATURE ANCHOR of the design system: a cream container at
 * `rounded-rd-md` (12px) with 4px padding, holding three inner buttons at `rounded-rd-xs`
 * (8px = 12 − 4). Selected = ink fill + white text. Match this curvature beat for any
 * other segmented control. (DESIGN.md §5 / §8.9.)
 */
export type RoleOption = { id: UserRoleId; label: string; icon: LucideIcon };

export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'cliente', label: 'Cliente', icon: User },
  { id: 'artista', label: 'Artista', icon: Brush },
  { id: 'estudio', label: 'Estúdio', icon: Store },
];

interface RoleSwitchProps {
  value: UserRoleId;
  onChange: (role: UserRoleId) => void;
  className?: string;
}

export function RoleSwitch({ value, onChange, className }: RoleSwitchProps) {
  return (
    <View className={`flex-row bg-surface rounded-rd-md p-1 ${className ?? ''}`}>
      {ROLE_OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onChange(id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-rd-xs ${active ? 'bg-ink' : 'bg-transparent'}`}
          >
            <Icon size={14} color={active ? '#FFFFFF' : '#000000'} style={{ marginRight: 6 }} />
            <Text className={`font-body-semibold text-[12px] ${active ? 'text-white' : 'text-ink'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
