import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ArtistServicosScreen } from '../screens/App/ServicosScreen';
import { ChatThreadScreen } from '../screens/App/ChatThreadScreen';

/**
 * Aba Serviços do TATUADOR: o Kanban e o chat aberto a partir dos cards de
 * mensagens não lidas. Fica nesta pilha para o "voltar" retornar ao Kanban.
 */
export type ServicosStackParamList = {
  ServicosHome: undefined;
  ChatThread: { chatId: string; outroNome: string; outroUsuarioId: string };
};

const Stack = createNativeStackNavigator<ServicosStackParamList>();

export function ArtistServicosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicosHome" component={ArtistServicosScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
    </Stack.Navigator>
  );
}
