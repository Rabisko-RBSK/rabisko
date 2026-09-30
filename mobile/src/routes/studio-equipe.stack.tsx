import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EquipeScreen } from '../screens/App/EquipeScreen';
import { ConvidarTatuadorScreen } from '../screens/App/ConvidarTatuadorScreen';

/**
 * Stack da aba "Equipe" do fluxo do estúdio. `Equipe` é a raiz (colaboradores
 * e convites enviados); `ConvidarTatuador` é empilhada pelo botão do header.
 */
export type StudioEquipeStackParamList = {
  Equipe: undefined;
  ConvidarTatuador: undefined;
};

const { Navigator, Screen } =
  createNativeStackNavigator<StudioEquipeStackParamList>();

export function StudioEquipeStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="Equipe" component={EquipeScreen} />
      <Screen name="ConvidarTatuador" component={ConvidarTatuadorScreen} />
    </Navigator>
  );
}
