import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { SessionDetailModal } from './SessionDetailModal';
import { appointmentService, SessaoListItemDTO } from '../../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const GANTT_START  = 8;   // 08:00
const GANTT_END    = 21;  // 21:00
const PX_PER_MIN   = 1.5; // 90px per hour
const ROW_HEIGHT   = 52;
const LABEL_WIDTH  = 52;
const TIME_AXIS_H  = 24;
const GRID_WIDTH   = (GANTT_END - GANTT_START) * 60 * PX_PER_MIN; // 1170px

const PT_MONTHS_SHORT   = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PT_WDAYS_SHORT    = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonday(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  return d;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function formatWeekRange(monday: Date, sunday: Date): string {
  const mDay = monday.getDate();
  const sDay = sunday.getDate();
  const sMonth = PT_MONTHS_SHORT[sunday.getMonth()];
  const sYear = sunday.getFullYear();
  if (monday.getMonth() === sunday.getMonth()) {
    return `${mDay}–${sDay} ${sMonth} ${sYear}`;
  }
  const mMonth = PT_MONTHS_SHORT[monday.getMonth()];
  return `${mDay} ${mMonth} – ${sDay} ${sMonth} ${sYear}`;
}

function toMinutes(horario: string): number {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
}

function formatHorario(h: string): string {
  return h.substring(0, 5);
}

function formatDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatDataHora(dateStr: string, horario: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Number(dateStr.split('-')[0]), m - 1, d);
  return `${PT_WDAYS_SHORT[date.getDay()]} ${d} · ${formatHorario(horario)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CalendarScreen() {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [sessoes, setSessoes] = React.useState<SessaoListItemDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedSessao, setSelectedSessao] = React.useState<SessaoListItemDTO | null>(null);
  const [detalheVisivel, setDetalheVisivel] = React.useState(false);
  const [nowX, setNowX] = React.useState<number | null>(null);

  const monday = React.useMemo(() => getMonday(weekOffset), [weekOffset]);
  const sunday = React.useMemo(() => addDays(monday, 6), [monday]);
  const days   = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  // Fetch sessions for the visible week
  React.useEffect(() => {
    setLoading(true);
    appointmentService
      .listarSessoes({ de: formatDate(monday), ate: formatDate(sunday) })
      .then(setSessoes)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar a agenda.'))
      .finally(() => setLoading(false));
  }, [weekOffset, monday, sunday]);

  // Update "now" line every minute when showing current week
  React.useEffect(() => {
    if (weekOffset !== 0) { setNowX(null); return; }
    function compute() {
      const n = new Date();
      const min = n.getHours() * 60 + n.getMinutes() - GANTT_START * 60;
      setNowX(min >= 0 && min <= (GANTT_END - GANTT_START) * 60 ? min * PX_PER_MIN : null);
    }
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [weekOffset]);

  function openDetail(s: SessaoListItemDTO) {
    setSelectedSessao(s);
    setDetalheVisivel(true);
  }

  const sortedSessoes = React.useMemo(
    () => [...sessoes].sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`)),
    [sessoes],
  );

  const TIME_LABELS = Array.from(
    { length: GANTT_END - GANTT_START + 1 },
    (_, i) => `${String(GANTT_START + i).padStart(2, '0')}:00`,
  );

  const todayStr = formatDate(new Date());

  return (
    <View className="flex-1 bg-background">
      <Header title="AGENDA" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ── Week navigation ──────────────────────────────────── */}
        <View className="flex-row items-center justify-center px-4 py-3" style={{ gap: 16 }}>
          <TouchableOpacity
            onPress={() => setWeekOffset((w) => Math.max(0, w - 1))}
            disabled={weekOffset === 0}
            hitSlop={8}
            style={{ opacity: weekOffset === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={22} color="#1A1A1A" />
          </TouchableOpacity>

          <Text className="font-body-semibold text-[15px] text-ink" style={{ minWidth: 160, textAlign: 'center' }}>
            {formatWeekRange(monday, sunday)}
          </Text>

          <TouchableOpacity onPress={() => setWeekOffset((w) => w + 1)} hitSlop={8}>
            <ChevronRight size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* ── Gantt ────────────────────────────────────────────── */}
        <View className="flex-row" style={{ marginLeft: 8 }}>
          {/* Fixed day labels */}
          <View style={{ width: LABEL_WIDTH }}>
            <View style={{ height: TIME_AXIS_H }} />
            {days.map((d, i) => {
              const isToday = formatDate(d) === todayStr;
              return (
                <View
                  key={i}
                  style={{ height: ROW_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text
                    className={`font-body-bold text-[11px] ${isToday ? 'text-plum' : 'text-ink'}`}
                    style={{ textAlign: 'center' }}
                  >
                    {PT_WDAYS_SHORT[d.getDay()]}
                  </Text>
                  <Text
                    className={`font-body text-[11px] ${isToday ? 'text-plum' : 'text-fg-2'}`}
                    style={{ textAlign: 'center' }}
                  >
                    {d.getDate()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Scrollable time grid */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ width: GRID_WIDTH }}>
              {/* Time axis */}
              <View style={{ height: TIME_AXIS_H, flexDirection: 'row' }}>
                {TIME_LABELS.map((label, i) => (
                  <Text
                    key={label}
                    className="font-body text-[9px] text-fg-3"
                    style={{
                      position: 'absolute',
                      left: i * 60 * PX_PER_MIN - 12,
                      top: 6,
                    }}
                  >
                    {label}
                  </Text>
                ))}
              </View>

              {/* Day rows */}
              {days.map((d, rowIdx) => {
                const daySessoes = sessoes.filter((s) => s.data === formatDate(d));
                const isToday = formatDate(d) === todayStr;
                return (
                  <View
                    key={rowIdx}
                    style={{
                      height: ROW_HEIGHT,
                      borderTopWidth: 1,
                      borderTopColor: isToday ? '#D8C8DC' : '#F0ECF2',
                      backgroundColor: isToday ? '#F9F6FA' : 'transparent',
                      position: 'relative',
                    }}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: GANTT_END - GANTT_START }, (_, i) => (
                      <View
                        key={i}
                        style={{
                          position: 'absolute',
                          left: i * 60 * PX_PER_MIN,
                          top: 0,
                          width: 1,
                          height: ROW_HEIGHT,
                          backgroundColor: '#F0ECF2',
                        }}
                      />
                    ))}

                    {/* "Now" indicator */}
                    {isToday && nowX !== null && (
                      <View
                        style={{
                          position: 'absolute',
                          left: nowX,
                          top: 0,
                          width: 2,
                          height: ROW_HEIGHT,
                          backgroundColor: '#602C66',
                          zIndex: 2,
                        }}
                      />
                    )}

                    {/* Session blocks */}
                    {daySessoes.map((s) => {
                      const startMin = toMinutes(s.horario) - GANTT_START * 60;
                      const blockLeft  = Math.max(0, startMin * PX_PER_MIN);
                      const blockWidth = Math.min(
                        s.duracaoMinutos * PX_PER_MIN,
                        GRID_WIDTH - blockLeft,
                      );
                      if (blockWidth <= 0) return null;
                      return (
                        <TouchableOpacity
                          key={s.sessionId}
                          onPress={() => openDetail(s)}
                          activeOpacity={0.8}
                          style={{
                            position: 'absolute',
                            left: blockLeft,
                            width: blockWidth,
                            top: 8,
                            height: ROW_HEIGHT - 16,
                            backgroundColor: '#602C66',
                            borderRadius: 4,
                            overflow: 'hidden',
                            justifyContent: 'center',
                            paddingHorizontal: 5,
                            zIndex: 1,
                          }}
                        >
                          <Text
                            className="font-body-bold text-[10px] text-white"
                            numberOfLines={1}
                          >
                            {s.outroNome.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── Sessions list ────────────────────────────────────── */}
        <View className="px-5 mt-5">
          <Text className="font-aux-bold text-[10px] tracking-widest text-fg-3 mb-3">
            SESSÕES DA SEMANA
          </Text>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#602C66" />
            </View>
          ) : sortedSessoes.length === 0 ? (
            <View className="items-center py-8">
              <Text className="font-body text-[13px] text-fg-3">
                Nenhuma sessão nesta semana.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {sortedSessoes.map((s) => (
                <TouchableOpacity
                  key={s.sessionId}
                  onPress={() => openDetail(s)}
                  activeOpacity={0.85}
                  className="flex-row items-center bg-surface rounded-rd-lg px-4 py-3"
                  accessibilityRole="button"
                >
                  <View className="flex-1 min-w-0">
                    <Text className="font-body-semibold text-[14px] text-ink" numberOfLines={1}>
                      {s.outroNome}
                    </Text>
                    <Text className="font-body text-[12px] text-fg-2 mt-0.5">
                      {formatDataHora(s.data, s.horario)} · {formatDuracao(s.duracaoMinutos)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SessionDetailModal
        visible={detalheVisivel}
        onClose={() => setDetalheVisivel(false)}
        sessao={selectedSessao}
      />
    </View>
  );
}
