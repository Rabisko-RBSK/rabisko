import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ManagementScreen } from '../screens/App/ManagementScreen';
import { ChatScreen } from '../screens/App/ChatScreen';
import { CalendarScreen } from '../screens/App/CalendarScreen';
import { SettingsScreen } from '../screens/App/SettingsScreen';
import { ArtistProfileStack } from './artist-profile.stack';
import { ArtistBottomNav } from '../components/common/ArtistBottomNav';

/**
 * Abas do fluxo do TATUADOR. O `<Router/>` monta estas rotas (em vez do
 * `AppRoutes` do cliente) quando `authStore.role === 'artista'`.
 *
 * Abas, da esquerda p/ direita: Gestão · Mensagens · Perfil · Agenda ·
 * Configurações. Chat e Settings são as MESMAS telas do fluxo do cliente,
 * reaproveitadas. A barra (`ArtistBottomNav`) tem o visual da `BottomNav` do
 * cliente, só com os ícones do artista.
 */
export type ArtistRoutesParamList = {
  Management: undefined;
  Chat: undefined;
  Profile: undefined;
  Calendar: undefined;
  Settings: undefined;
};

const { Navigator, Screen } = createBottomTabNavigator<ArtistRoutesParamList>();

export function ArtistRoutes() {
  return (
    <Navigator
      tabBar={(props) => <ArtistBottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Screen name="Management" component={ManagementScreen} />
      <Screen name="Chat" component={ChatScreen} />
      <Screen name="Profile" component={ArtistProfileStack} />
      <Screen name="Calendar" component={CalendarScreen} />
      <Screen name="Settings" component={SettingsScreen} />
    </Navigator>
  );
}
