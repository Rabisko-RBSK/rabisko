import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStack } from './home.stack';
import { ChatStack } from './chat.stack';
import { SimuladorScreen } from '../screens/App/SimuladorScreen';
import { BookingsScreen } from '../screens/App/BookingsScreen';
import { SettingsScreen } from '../screens/App/SettingsScreen';
import { BottomNav } from '../components/common/BottomNav';

/**
 * App-side bottom tabs (DESIGN.md §8.2). As cinco abas são Home · Chat · Simulador · Sessões ·
 * Settings — o "Simulador" (Bisko AI, killer feature) fica na posição central pra destaque. A
 * barra visual (surface cream, pílula plum animada, spring scale) vive em
 * `src/components/common/BottomNav.tsx`. Este arquivo só liga rotas a telas.
 *
 * Search/map e a aba Profile foram dropadas — ver IMPLEMENTATION-CHECKLIST.md P3.
 */
export type AppRoutesParamList = {
  Home: undefined;
  Chat: undefined;
  Simulador: undefined;
  Sessoes: undefined;
  Settings: undefined;
};

const { Navigator, Screen } = createBottomTabNavigator<AppRoutesParamList>();

export function AppRoutes() {
  return (
    <Navigator
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Screen name="Home" component={HomeStack} />
      <Screen name="Chat" component={ChatStack} />
      <Screen name="Simulador" component={SimuladorScreen} />
      <Screen name="Sessoes" component={BookingsScreen} />
      <Screen name="Settings" component={SettingsScreen} />
    </Navigator>
  );
}
