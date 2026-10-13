import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManagementScreen } from '../screens/App/ManagementScreen';
import { AnamneseScreen } from '../screens/App/AnamneseScreen';

export type ManagementStackParamList = {
  ManagementHome: undefined;
  Anamnese: undefined;
};

const Stack = createNativeStackNavigator<ManagementStackParamList>();

export function ManagementStack() {
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ManagementHome" component={ManagementScreen} />
    <Stack.Screen name="Anamnese" component={AnamneseScreen} />
  </Stack.Navigator>;
}
