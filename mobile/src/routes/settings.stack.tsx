import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SettingsScreen } from '../screens/App/SettingsScreen';
import { ClienteProfileScreen } from '../screens/App/ClienteProfileScreen';
import { EstudioProfileScreen } from '../screens/App/EstudioProfileScreen';
import { HorariosEstudioScreen } from '../screens/App/HorariosEstudioScreen';
import { ArtistProfileStack } from './artist-profile.stack';

/**
 * Aba Configurações (cliente, tatuador e estúdio) e os perfis abertos a
 * partir dela. O perfil do tatuador é a pilha inteira do perfil (portfólio,
 * convites, contrato, dados cadastrais), aninhada aqui.
 */
export type SettingsStackParamList = {
  SettingsHome: undefined;
  PerfilCliente: undefined;
  PerfilTatuador: undefined;
  PerfilEstudio: undefined;
  HorariosEstudio: undefined;
};

const { Navigator, Screen } = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="SettingsHome" component={SettingsScreen} />
      <Screen name="PerfilCliente" component={ClienteProfileScreen} />
      <Screen name="PerfilTatuador" component={ArtistProfileStack} />
      <Screen name="PerfilEstudio" component={EstudioProfileScreen} />
      <Screen name="HorariosEstudio" component={HorariosEstudioScreen} />
    </Navigator>
  );
}
