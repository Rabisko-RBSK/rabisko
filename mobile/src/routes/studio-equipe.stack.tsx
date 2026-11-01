import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EquipeScreen } from '../screens/App/EquipeScreen';
import { ConvidarTatuadorScreen } from '../screens/App/ConvidarTatuadorScreen';
import { ColaboradorContratosScreen } from '../screens/App/ColaboradorContratosScreen';
import { HorariosEstudioScreen } from '../screens/App/HorariosEstudioScreen';

/**
 * Stack da aba "Equipe" do fluxo do estúdio. `Equipe` é a raiz (colaboradores
 * e convites enviados); `ConvidarTatuador` é empilhada pelo botão do header;
 * `ColaboradorContratos` ao tocar num colaborador; `HorariosEstudio` pelo
 * card de horário de atendimento.
 */
export type StudioEquipeStackParamList = {
  Equipe: undefined;
  ConvidarTatuador: undefined;
  ColaboradorContratos: { tatuadorId: string; nome: string };
  HorariosEstudio: undefined;
};

const { Navigator, Screen } =
  createNativeStackNavigator<StudioEquipeStackParamList>();

export function StudioEquipeStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="Equipe" component={EquipeScreen} />
      <Screen name="ConvidarTatuador" component={ConvidarTatuadorScreen} />
      <Screen name="ColaboradorContratos" component={ColaboradorContratosScreen} />
      <Screen name="HorariosEstudio" component={HorariosEstudioScreen} />
    </Navigator>
  );
}
