import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ArtistProfileScreen } from '../screens/App/ArtistProfileScreen';
import { ConvitesScreen } from '../screens/App/ConvitesScreen';
import { EditarHorarioScreen } from '../screens/App/EditarHorarioScreen';
import { EditarPerfilScreen } from '../screens/App/EditarPerfilScreen';
import { MeuContratoScreen } from '../screens/App/MeuContratoScreen';
import { PortfolioScreen } from '../screens/App/PortfolioScreen';
import { PortfolioImage } from '../services/api/artistService';

/**
 * Stack da aba "Perfil" do fluxo do tatuador. `ArtistProfile` é a raiz (a
 * própria aba, sem voltar); `Portfolio` é empilhado em cima quando o tatuador
 * toca em "Ver Todos"; `Convites` quando toca no cartão de convites de estúdio;
 * `MeuContrato` pelo cartão do estúdio vinculado; `EditarPerfil` pelo cartão
 * de dados cadastrais; `EditarHorario` pelo cartão de horário de funcionamento.
 *
 * O perfil do tatuador na visão do CLIENTE é outra tela: EstablishmentProfile,
 * registrada no HomeStack.
 */
export type ArtistProfileStackParamList = {
  /** Sem `tatuadorId` => perfil do próprio tatuador logado. */
  ArtistProfile: { tatuadorId?: string } | undefined;
  Portfolio: { artistName: string; images: PortfolioImage[] };
  Convites: undefined;
  MeuContrato: { estudioId: string; nomeEstudio: string };
  EditarPerfil: undefined;
  EditarHorario: undefined;
};

const { Navigator, Screen } =
  createNativeStackNavigator<ArtistProfileStackParamList>();

export function ArtistProfileStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="ArtistProfile" component={ArtistProfileScreen} />
      <Screen name="Portfolio" component={PortfolioScreen} />
      <Screen name="Convites" component={ConvitesScreen} />
      <Screen name="MeuContrato" component={MeuContratoScreen} />
      <Screen name="EditarPerfil" component={EditarPerfilScreen} />
      <Screen name="EditarHorario" component={EditarHorarioScreen} />
    </Navigator>
  );
}
