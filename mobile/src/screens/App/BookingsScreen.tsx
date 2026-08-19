import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Header } from '../../components/common/Header';
import { SessionDetailModal } from './SessionDetailModal';
import { appointmentService, SessaoListItemDTO } from '../../services/api';


const PT_MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PT_WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDataCurta(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const wday = PT_WEEKDAYS_SHORT[date.getDay()];
  return `${wday}, ${d} ${PT_MONTHS_SHORT[m - 1]}`;
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


type Tab = 'upcoming' | 'past';

export function BookingsScreen() {
  const [view, setView] = React.useState<Tab>('upcoming');
  const [sessoes, setSessoes] = React.useState<SessaoListItemDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedSessao, setSelectedSessao] = React.useState<SessaoListItemDTO | null>(null);
  const [detalheVisivel, setDetalheVisivel] = React.useState(false);

  React.useEffect(() => {
    appointmentService.listarSessoes()
      .then(setSessoes)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar suas sessões.'))
      .finally(() => setLoading(false));
  }, []);

  const today = todayStr();
  const upcoming = sessoes.filter((s) => s.data >= today && s.status !== 'cancelada' && s.status !== 'no_show');
  const past = sessoes.filter((s) => s.data < today || s.status === 'concluida' || s.status === 'cancelada' || s.status === 'no_show');
  const list = view === 'upcoming' ? upcoming : past;

  function openDetail(s: SessaoListItemDTO) {
    setSelectedSessao(s);
    setDetalheVisivel(true);
  }

  return (
    <View className="flex-1 bg-background">
      <Header title="Sessões" />

      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-aux-bold text-[10px] tracking-widest text-fg-3 mt-2 mb-4">
          MINHA AGENDA
        </Text>

        <View className="flex-row gap-1 p-1 bg-surface rounded-rd-pill mb-5">
          {([['upcoming', 'Próximas'], ['past', 'Histórico']] as const).map(([key, label]) => {
            const active = view === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setView(key)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={`flex-1 py-2.5 rounded-rd-pill items-center ${active ? 'bg-ink' : 'bg-transparent'}`}
              >
                <Text className={`font-body-semibold text-[12px] ${active ? 'text-surface' : 'text-ink'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : list.length === 0 ? (
          <View className="items-center py-10">
            <Text className="font-body text-[13px] text-fg-3">
              Nenhuma sessão por aqui ainda.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {list.map((s, i) => (
              <Animated.View key={s.sessionId} entering={FadeInDown.delay(40 * i).duration(220)}>
                <SessionRow sessao={s} today={today} onOpen={() => openDetail(s)} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <SessionDetailModal
        visible={detalheVisivel}
        onClose={() => setDetalheVisivel(false)}
        sessao={selectedSessao}
      />
    </View>
  );
}


function SessionRow({ sessao, today, onOpen }: { sessao: SessaoListItemDTO; today: string; onOpen: () => void }) {
  const isToday = sessao.data === today;
  const isDone  = sessao.status === 'concluida' || sessao.data < today;

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.85}
      className={`flex-row items-center gap-3 p-4 rounded-rd-lg ${isToday ? 'bg-ink' : 'bg-surface'}`}
      accessibilityRole="button"
      accessibilityLabel={`Sessão com ${sessao.outroNome}`}
    >
      <View className="items-center" style={{ minWidth: 52 }}>
        <Text className={`font-body-bold text-[13px] ${isToday ? 'text-surface' : 'text-ink'}`}>
          {isToday ? 'HOJE' : formatDataCurta(sessao.data).split(', ')[1]}
        </Text>
        <Text className={`font-body text-[11px] mt-0.5 ${isToday ? 'text-surface' : 'text-fg-2'}`} style={{ opacity: 0.8 }}>
          {formatHorario(sessao.horario)}
        </Text>
        {!isToday && (
          <Text className="font-body text-[10px] text-fg-3 mt-0.5">
            {formatDataCurta(sessao.data).split(', ')[0]}
          </Text>
        )}
      </View>

      <View className="w-px self-stretch" style={{ backgroundColor: isToday ? 'rgba(255,255,255,0.2)' : '#E5E0E8' }} />

      <View className="flex-1 min-w-0">
        <Text
          className={`font-body-semibold text-[14px] ${isToday ? 'text-surface' : 'text-ink'}`}
          numberOfLines={1}
        >
          {sessao.outroNome}
        </Text>
        <Text
          className={`font-body text-[11px] mt-0.5 ${isToday ? 'text-surface' : 'text-fg-2'}`}
          style={{ opacity: 0.8 }}
        >
          {formatDuracao(sessao.duracaoMinutos)}
        </Text>
      </View>

      {isDone ? (
        <CheckCircle2 size={20} color={isToday ? '#FFFFFF' : '#602C66'} />
      ) : (
        <ChevronRight size={20} color={isToday ? '#FFFFFF' : '#6B6B6B'} />
      )}
    </TouchableOpacity>
  );
}
