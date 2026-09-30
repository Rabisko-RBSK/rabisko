import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react-native';

import { BottomNav } from '../components/common/BottomNav';
import { StudioDashboardProvider } from '../hooks/useStudioDashboard';
import { StudioAgendaScreen, StudioDashboardScreen } from '../screens/App/StudioDashboardScreen';
import { SettingsScreen } from '../screens/App/SettingsScreen';
import { StudioEquipeStack } from './studio-equipe.stack';

/**
 * Abas do fluxo do ESTÚDIO. O `<Router/>` monta estas rotas quando
 * `authStore.role === 'estudio'`.
 *
 * Team é a gestão real da equipe (colaboradores + convites, via
 * StudioEquipeStack); Dashboard e Agenda ainda usam dados de demonstração.
 */
export type StudioRoutesParamList = {
  Dashboard: undefined;
  Team: undefined;
  Agenda: undefined;
  Settings: undefined;
};

const icons: Record<string, LucideIcon> = { Dashboard: LayoutDashboard, Team: Users, Agenda: CalendarDays, Settings };
const labels = { Dashboard: 'Dashboard', Team: 'Equipe', Agenda: 'Agenda', Settings: 'Configurações' };
const { Navigator, Screen } = createBottomTabNavigator<StudioRoutesParamList>();

export function StudioRoutes() {
  return (
    <StudioDashboardProvider>
      <Navigator tabBar={(props) => <BottomNav {...props} icons={icons} labels={labels} />}
        screenOptions={{ headerShown: false }}>
        <Screen name="Dashboard" component={StudioDashboardScreen} />
        <Screen name="Team" component={StudioEquipeStack} />
        <Screen name="Agenda" component={StudioAgendaScreen} />
        <Screen name="Settings" component={SettingsScreen} />
      </Navigator>
    </StudioDashboardProvider>
  );
}
