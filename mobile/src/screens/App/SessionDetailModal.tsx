import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { X, CalendarDays, Clock, Banknote, UserCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessaoListItemDTO } from '../../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PT_WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const PT_MONTHS   = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatDataLonga(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${PT_WEEKDAYS[date.getDay()]}, ${d} ${PT_MONTHS[m - 1]} ${y}`;
}

function formatHorario(horario: string): string {
  return horario.substring(0, 5);
}

function formatDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABELS: Record<string, string> = {
  confirmada:   'Confirmada',
  agendada:     'Agendada',
  em_andamento: 'Em andamento',
  concluida:    'Concluída',
  cancelada:    'Cancelada',
  no_show:      'Não compareceu',
};

function statusBadgeColors(status: string): { bg: string; text: string } {
  switch (status) {
    case 'confirmada':
    case 'agendada':
      return { bg: '#602C66', text: '#FFFFFF' };
    case 'em_andamento':
      return { bg: '#F59E0B', text: '#FFFFFF' };
    case 'concluida':
      return { bg: '#10B981', text: '#FFFFFF' };
    default:
      return { bg: '#9CA3AF', text: '#FFFFFF' };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  sessao: SessaoListItemDTO | null;
}

export function SessionDetailModal({ visible, onClose, sessao }: Props) {
  if (!sessao) return null;

  const badgeColors = statusBadgeColors(sessao.status);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-surface">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            DETALHES DA SESSÃO
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} className="absolute right-4">
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 28, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View className="items-center mb-5">
            {sessao.outroFotoUrl ? (
              <Image
                source={{ uri: sessao.outroFotoUrl }}
                style={{ width: 84, height: 84, borderRadius: 42 }}
                contentFit="cover"
              />
            ) : (
              <View
                className="bg-background items-center justify-center"
                style={{ width: 84, height: 84, borderRadius: 42 }}
              >
                <UserCircle2 size={52} color="#9CA3AF" />
              </View>
            )}
            <Text className="font-display text-[24px] text-ink tracking-widest mt-3">
              {sessao.outroNome.toUpperCase()}
            </Text>
          </View>

          {/* Divider */}
          <View className="h-px bg-surface mb-5" style={{ backgroundColor: '#E5E0E8' }} />

          {/* Detail rows */}
          <View style={{ gap: 16 }}>
            <DetailRow icon={<CalendarDays size={18} color="#602C66" />} label={formatDataLonga(sessao.data)} />
            <DetailRow
              icon={<Clock size={18} color="#602C66" />}
              label={`${formatHorario(sessao.horario)} · ${formatDuracao(sessao.duracaoMinutos)}`}
            />
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View style={{ width: 18, alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: badgeColors.bg }} />
              </View>
              <View
                className="rounded-rd-pill px-3 py-1"
                style={{ backgroundColor: badgeColors.bg }}
              >
                <Text className="font-body-semibold text-[12px]" style={{ color: badgeColors.text }}>
                  {STATUS_LABELS[sessao.status] ?? sessao.status}
                </Text>
              </View>
            </View>
            <DetailRow icon={<Banknote size={18} color="#602C66" />} label={formatPreco(sessao.valorTotal)} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <View style={{ width: 18, alignItems: 'center' }}>{icon}</View>
      <Text className="font-body text-[15px] text-ink flex-1">{label}</Text>
    </View>
  );
}
