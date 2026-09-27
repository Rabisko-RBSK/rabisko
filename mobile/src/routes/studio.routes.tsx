import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react-native';

import { BottomNav } from '../components/common/BottomNav';
import { StudioDashboardProvider } from '../hooks/useStudioDashboard';
import { StudioAgendaScreen, StudioDashboardScreen, StudioTeamScreen } from '../screens/App/StudioDashboardScreen';
import { SettingsScreen } from '../screens/App/SettingsScreen';

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
        <Screen name="Team" component={StudioTeamScreen} />
        <Screen name="Agenda" component={StudioAgendaScreen} />
        <Screen name="Settings" component={SettingsScreen} />
      </Navigator>
    </StudioDashboardProvider>
  );
}
