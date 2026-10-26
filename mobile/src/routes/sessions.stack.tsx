import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingsScreen } from '../screens/App/BookingsScreen';
import { CalendarScreen } from '../screens/App/CalendarScreen';
import { AnamneseScreen } from '../screens/App/AnamneseScreen';
import type { SessaoAnamnese } from '../services/anamneseFlow';

export type SessionsStackParamList = {
  SessionsHome: undefined;
  Anamnese: { sessao: SessaoAnamnese };
};

const Stack = createNativeStackNavigator<SessionsStackParamList>();

function SessionsStack({ artist }: { artist: boolean }) {
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SessionsHome" component={artist ? CalendarScreen : BookingsScreen} />
    <Stack.Screen name="Anamnese" component={AnamneseScreen} getId={({ params }) => params.sessao.sessionId} />
  </Stack.Navigator>;
}

export function ClientSessionsStack() { return <SessionsStack artist={false} />; }
export function ArtistSessionsStack() { return <SessionsStack artist />; }
