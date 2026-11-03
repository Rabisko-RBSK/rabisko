import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { StudioDashboardScreen, StudioFinanceiroScreen } from '../screens/App/StudioDashboardScreen';

/** Qual parte dos resultados financeiros a análise abre mostrando. */
export type FiltroFinanceiro = 'todos' | 'receber' | 'pagar';

/**
 * Stack da aba "Dashboard" do fluxo do estúdio. `Dashboard` é a raiz;
 * `Financeiro` (análise por profissional) é empilhada ao tocar num card de
 * resultados financeiros. Os dados vêm do StudioDashboardProvider, que envolve
 * as abas, então as duas telas usam o mesmo período.
 */
export type StudioDashboardStackParamList = {
  Dashboard: undefined;
  Financeiro: { filtro: FiltroFinanceiro };
};

const { Navigator, Screen } = createNativeStackNavigator<StudioDashboardStackParamList>();

export function StudioDashboardStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="Dashboard" component={StudioDashboardScreen} />
      <Screen name="Financeiro" component={StudioFinanceiroScreen} />
    </Navigator>
  );
}
