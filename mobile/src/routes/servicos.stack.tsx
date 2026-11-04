import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ArtistServicosScreen } from '../screens/App/ServicosScreen';
import { ChatThreadScreen } from '../screens/App/ChatThreadScreen';
import { ServicoScreen } from '../screens/App/ServicoScreen';

/**
 * Aba Serviços do TATUADOR: o Kanban e o chat aberto a partir dos cards de
 * mensagens não lidas. Fica nesta pilha para o "voltar" retornar ao Kanban.
 */
export type ServicosStackParamList = {
  ServicosHome: undefined;
  ChatThread: { chatId: string; outroNome: string; outroUsuarioId: string };
  /** Serviço aberto pelo card: edição, sessões (detalhes/QR/marcar) e finalizar. */
  Servico: { servicoId: string; clienteNome: string; chatId?: string | null; clienteAuthId?: string | null };
};

const Stack = createNativeStackNavigator<ServicosStackParamList>();

export function ArtistServicosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicosHome" component={ArtistServicosScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
      <Stack.Screen name="Servico" component={ServicoScreen} />
    </Stack.Navigator>
  );
}
