import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Settings, Users, type LucideIcon } from 'lucide-react-native';

import { BottomNav } from './BottomNav';

/**
 * Barra inferior do fluxo do ESTÚDIO. Mesmo visual da `BottomNav` do cliente,
 * só com as abas do estúdio. Plugada via `tabBar` em `studio.routes.tsx`.
 *
 * Os nomes das chaves batem com os route names de `StudioRoutesParamList`.
 */

const STUDIO_ICONS: Record<string, LucideIcon> = {
  Team: Users,
  Settings,
};

const STUDIO_LABELS: Record<string, string> = {
  Team: 'Equipe',
  Settings: 'Configurações',
};

export function StudioBottomNav(props: BottomTabBarProps) {
  return <BottomNav {...props} icons={STUDIO_ICONS} labels={STUDIO_LABELS} />;
}
