import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/App/HomeScreen';
import { EstablishmentProfileScreen } from '../screens/App/EstablishmentProfileScreen';
import { BookingScreen } from '../screens/App/BookingScreen';
import { PaymentScreen } from '../screens/App/PaymentScreen';
import { ConfirmedScreen } from '../screens/App/ConfirmedScreen';
import { ChatThreadScreen } from '../screens/App/ChatThreadScreen';

export type HomeStackParamList = {
  HomeList: undefined;
  EstablishmentProfile: { id: string };
  BookingFlow: { id: string };
  Payment: { bookingId: string };
  Confirmed: { artistName?: string; dateTime?: string; total?: string } | undefined;
  ChatThread: { chatId: string; outroNome: string; outroUsuarioId: string };
};

const { Navigator, Screen } = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="HomeList" component={HomeScreen} />
      <Screen name="EstablishmentProfile" component={EstablishmentProfileScreen} />
      <Screen name="BookingFlow" component={BookingScreen} />
      <Screen name="Payment" component={PaymentScreen} />
      <Screen
        name="Confirmed"
        component={ConfirmedScreen}
        options={{ gestureEnabled: false }}
      />
      <Screen name="ChatThread" component={ChatThreadScreen} />
    </Navigator>
  );
}
