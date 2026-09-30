import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { SettingsScreen } from '../screens/App/SettingsScreen';
import { StudioEquipeStack } from './studio-equipe.stack';
import { StudioBottomNav } from '../components/common/StudioBottomNav';

/**
 * Abas do fluxo do ESTÚDIO. O `<Router/>` monta estas rotas quando
 * `authStore.role === 'estudio'`.
 *
 * Abas: Equipe · Configurações. Settings é a MESMA tela dos outros fluxos.
 * Agenda e financeiro do estúdio entram aqui quando existirem no backend.
 */
export type StudioRoutesParamList = {
  Team: undefined;
  Settings: undefined;
};

const { Navigator, Screen } = createBottomTabNavigator<StudioRoutesParamList>();

export function StudioRoutes() {
  return (
    <Navigator
      tabBar={(props) => <StudioBottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Screen name="Team" component={StudioEquipeStack} />
      <Screen name="Settings" component={SettingsScreen} />
    </Navigator>
  );
}
