import React from 'react';
import { View, Text } from 'react-native';
import { LayoutDashboard } from 'lucide-react-native';

import { Header } from '../../components/common/Header';

/**
 * Gestão — primeira aba do fluxo do tatuador (DESIGN.md §10 #13 — Dashboard:
 * visão de reservas e faturamento). Ainda é um stub: a rota e o ícone na
 * `ArtistBottomNav` já existem; o conteúdo entra depois.
 */
export function ManagementScreen() {
  return (
    <View className="flex-1 bg-background">
      <Header title="GESTÃO" />

      <View className="flex-1 items-center justify-center px-10">
        <View className="w-16 h-16 rounded-r-pill bg-surface items-center justify-center mb-5">
          <LayoutDashboard size={28} color="#602C66" />
        </View>
        <Text className="font-aux-bold text-[20px] text-ink text-center mb-2">
          Sua central de gestão
        </Text>
        <Text className="font-body text-[14px] text-fg-2 text-center leading-[20px]">
          Em breve você acompanha aqui suas reservas, faturamento e o
          desempenho do seu trabalho.
        </Text>
      </View>
    </View>
  );
}
