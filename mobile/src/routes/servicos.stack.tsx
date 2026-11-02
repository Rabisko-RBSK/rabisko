import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ArtistServicosScreen } from '../screens/App/ServicosScreen';
import { ChatThreadScreen } from '../screens/App/ChatThreadScreen';
import { AnamneseScreen } from '../screens/App/AnamneseScreen';
import type { SessaoAnamnese } from '../services/anamneseFlow';

/**
 * Aba Serviços do TATUADOR: o Kanban e as telas abertas a partir dos cards —
 * o chat (cards de mensagens não lidas) e a anamnese (pelo modal de detalhes
 * da sessão). Ficam nesta pilha para o "voltar" retornar ao Kanban.
 */
export type ServicosStackParamList = {
  ServicosHome: undefined;
  ChatThread: { chatId: string; outroNome: string; outroUsuarioId: string };
  Anamnese: { sessao: SessaoAnamnese };
};

const Stack = createNativeStackNavigator<ServicosStackParamList>();

export function ArtistServicosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicosHome" component={ArtistServicosScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
      <Stack.Screen name="Anamnese" component={AnamneseScreen} getId={({ params }) => params.sessao.sessionId} />
    </Stack.Navigator>
  );
}
