import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  MessageCircle,
  User,
  CalendarDays,
  Settings,
  type LucideIcon,
} from 'lucide-react-native';

import { BottomNav } from './BottomNav';

/**
 * Barra inferior do fluxo do TATUADOR. Mesmo visual da `BottomNav` do cliente
 * (superfície cream, pílula plum animada, spring scale) — só troca os ícones
 * e labels para as telas do artista. Plugada via `tabBar` em `artist.routes.tsx`.
 *
 * Abas, da esquerda p/ direita: Gestão · Mensagens · Perfil · Agenda · Configurações.
 * Os nomes das chaves batem com os route names de `ArtistRoutesParamList`.
 */

const ARTIST_ICONS: Record<string, LucideIcon> = {
  Management: LayoutDashboard,
  Chat: MessageCircle,
  Profile: User,
  Calendar: CalendarDays,
  Settings,
};

const ARTIST_LABELS: Record<string, string> = {
  Management: 'Gestão',
  Chat: 'Mensagens',
  Profile: 'Perfil',
  Calendar: 'Agenda',
  Settings: 'Configurações',
};

export function ArtistBottomNav(props: BottomTabBarProps) {
  return <BottomNav {...props} icons={ARTIST_ICONS} labels={ARTIST_LABELS} />;
}
