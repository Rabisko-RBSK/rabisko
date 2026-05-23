import React from 'react';
import { View, Text } from 'react-native';
import { CalendarDays } from 'lucide-react-native';

import { Header } from '../../components/common/Header';

/**
 * Agenda — quarta aba do fluxo do tatuador (DESIGN.md §10 #09 — Calendar:
 * próximas sessões). Ainda é um stub: a rota e o ícone na `ArtistBottomNav`
 * já existem; a lista de sessões entra depois.
 */
export function CalendarScreen() {
  return (
    <View className="flex-1 bg-background">
      <Header title="AGENDA" />

      <View className="flex-1 items-center justify-center px-10">
        <View className="w-16 h-16 rounded-r-pill bg-surface items-center justify-center mb-5">
          <CalendarDays size={28} color="#602C66" />
        </View>
        <Text className="font-aux-bold text-[20px] text-ink text-center mb-2">
          Sua agenda de sessões
        </Text>
        <Text className="font-body text-[14px] text-fg-2 text-center leading-[20px]">
          Em breve você visualiza aqui seus horários e as próximas sessões
          confirmadas com clientes.
        </Text>
      </View>
    </View>
  );
}
