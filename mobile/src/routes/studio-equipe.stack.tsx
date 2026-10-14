import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EquipeScreen } from '../screens/App/EquipeScreen';
import { ConvidarTatuadorScreen } from '../screens/App/ConvidarTatuadorScreen';
import { ColaboradorContratosScreen } from '../screens/App/ColaboradorContratosScreen';

/**
 * Stack da aba "Equipe" do fluxo do estúdio. `Equipe` é a raiz (colaboradores
 * e convites enviados); `ConvidarTatuador` é empilhada pelo botão do header;
 * `ColaboradorContratos` ao tocar num colaborador.
 */
export type StudioEquipeStackParamList = {
  Equipe: undefined;
  ConvidarTatuador: undefined;
  ColaboradorContratos: { tatuadorId: string; nome: string };
};

const { Navigator, Screen } =
  createNativeStackNavigator<StudioEquipeStackParamList>();

export function StudioEquipeStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="Equipe" component={EquipeScreen} />
      <Screen name="ConvidarTatuador" component={ConvidarTatuadorScreen} />
      <Screen name="ColaboradorContratos" component={ColaboradorContratosScreen} />
    </Navigator>
  );
}
