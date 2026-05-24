import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MessageSquare, RotateCw } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { useArtistDashboard } from '../../hooks/useArtistDashboard';

/**
 * Gestão — primeira aba do fluxo do tatuador (DESIGN.md §10 #13 — Dashboard:
 * visão de reservas e faturamento).
 *
 * v1: card único com "Chats abertos" (clientes com conversa ativa). Próximas
 * métricas (novos chats 7d, tempo médio de resposta, mensagens últimos 14d,
 * top clientes) entram aqui, ladeando o card atual.
 *
 * O hook `useArtistDashboard` cuida do fetch, loading e erro — esta tela só
 * decide o layout.
 */
export function ManagementScreen() {
  const { dashboard, loading, error, reload } = useArtistDashboard();

  return (
    <View className="flex-1 bg-background">
      <Header title="GESTÃO" />

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor="#602C66" />
        }
      >
        {/* Estado inicial: spinner centralizado enquanto a primeira request roda. */}
        {loading && !dashboard ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#602C66" />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <View className="gap-4">
            <KpiCard
              icon={<MessageSquare size={22} color="#602C66" />}
              label="Chats abertos"
              value={dashboard?.chatsAbertos ?? 0}
              hint="Clientes com conversa ativa no momento."
            />
            {/* TODO v2: + Novos chats (7d) + Tempo médio de resposta + gráficos */}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------
// Subcomponentes locais — pequenos demais pra virar arquivo separado;
// se outros dashboards reusarem, promover pra components/common.
// ---------------------------------------------------------------------

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}

/**
 * Card de KPI: número grande no topo, label embaixo, hint opcional. Visual
 * segue o design system: surface cream, plum como cor de destaque (única
 * cor de "ativação" permitida — ver tailwind.config.js).
 */
function KpiCard({ icon, label, value, hint }: KpiCardProps) {
  return (
    <View className="bg-surface rounded-r-lg p-5">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-10 h-10 rounded-r-pill bg-paper items-center justify-center">
          {icon}
        </View>
        <Text className="font-body-medium text-[14px] text-fg-2 uppercase tracking-wider">
          {label}
        </Text>
      </View>

      <Text className="font-display text-[56px] text-plum leading-[56px]">
        {value}
      </Text>

      {hint && (
        <Text className="font-body text-[13px] text-fg-3 mt-2">
          {hint}
        </Text>
      )}
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

/**
 * Estado de erro com botão de retry. Usado quando o fetch do dashboard falha
 * (rede offline, JWT expirado, 5xx do backend, etc.). `reload` do hook
 * dispara nova tentativa.
 */
function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="items-center justify-center py-16 px-6">
      <Text className="font-body text-[14px] text-error text-center mb-4">
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className="flex-row items-center gap-2 bg-plum rounded-r-pill px-5 py-3"
        accessibilityRole="button"
        accessibilityLabel="Tentar novamente"
      >
        <RotateCw size={16} color="#FFFFFF" />
        <Text className="font-body-bold text-[14px] text-on-ink">
          Tentar novamente
        </Text>
      </TouchableOpacity>
    </View>
  );
}
