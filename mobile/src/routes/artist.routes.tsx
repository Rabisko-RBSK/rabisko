import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ManagementScreen } from '../screens/App/ManagementScreen';
import { ArtistServicosStack } from './servicos.stack';
import { ChatStack } from './chat.stack';
import { ArtistSessionsStack } from './sessions.stack';
import { SettingsStack } from './settings.stack';
import { ArtistBottomNav } from '../components/common/ArtistBottomNav';

/**
 * Abas do fluxo do TATUADOR. O `<Router/>` monta estas rotas (em vez do
 * `AppRoutes` do cliente) quando `authStore.role === 'artista'`.
 *
 * Abas, da esquerda p/ direita: Gestão · Serviços · Mensagens · Agenda ·
 * Configurações. Chat e Settings são as MESMAS telas do fluxo do cliente,
 * reaproveitadas; o perfil do tatuador abre por Configurações → Meu Perfil. A barra (`ArtistBottomNav`) tem o visual da `BottomNav` do
 * cliente, só com os ícones do artista.
 */
export type ArtistRoutesParamList = {
  Management: undefined;
  Servicos: undefined;
  Chat: undefined;
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
      <Screen name="Servicos" component={ArtistServicosStack} />
      <Screen name="Chat" component={ChatStack} />
      <Screen name="Calendar" component={ArtistSessionsStack} />
      <Screen name="Settings" component={SettingsStack} />
    </Navigator>
  );
}
