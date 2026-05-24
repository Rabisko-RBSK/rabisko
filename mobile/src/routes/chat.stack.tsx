import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatScreen } from '../screens/App/ChatScreen';
import { ChatThreadScreen } from '../screens/App/ChatThreadScreen';

export type ChatStackParamList = {
  ChatList: undefined;
  ChatThread: { chatId: string; outroNome: string; outroUsuarioId: string };
};

const { Navigator, Screen } = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="ChatList" component={ChatScreen} />
      <Screen name="ChatThread" component={ChatThreadScreen} />
    </Navigator>
  );
}
