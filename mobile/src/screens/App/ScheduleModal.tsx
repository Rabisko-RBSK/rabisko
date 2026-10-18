import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, X } from 'lucide-react-native';

import { appointmentService, BusySlotDTO } from '../../services/api';
import { BlocoAgenda, paraHorario, paraMinutos } from '../../utils/agendaEstudio';
import { PosicaoSelecionada, StudioPositionsModal } from './StudioPositionsModal';


interface Session {
  data: Date;
  horario: string | null;
  duracaoMinutos: number;
  /** Posição do estúdio; só usada quando o tatuador é vinculado a um estúdio. */
  posicao: number | null;
}

/** Estúdio do tatuador (null = tatuador independente, usa a grade de horários). */
interface EstudioInfo {
  nome: string | null;
  posicoes: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  outroNome: string;
  onSent: () => void;
}


const FIXED_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

const DURATIONS_H = [1, 2, 3, 4, 5, 6];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Retorna os primeiros 28 dias a partir de hoje. */
function generateDays(): Date[] {
  const days: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 28; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAYS = generateDays();
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function formatBRL(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('pt-BR');
}


export function ScheduleModal({ visible, onClose, chatId, outroNome, onSent }: Props) {
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date>(DAYS[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [valorTotal, setValorTotal] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [busySlots, setBusySlots] = useState<BusySlotDTO[]>([]);
  const [estudio, setEstudio] = useState<EstudioInfo | null>(null);
  const [selectedPosicao, setSelectedPosicao] = useState<number | null>(null);
  const [posicoesVisible, setPosicoesVisible] = useState(false);
  /** Incrementa a cada abertura: remonta a tela de posições com a seleção atual. */
  const [aberturaPosicoes, setAberturaPosicoes] = useState(0);

  const [customTimeActive, setCustomTimeActive] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const customTimeRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    appointmentService
      .busySlots(formatDate(selectedDate))
      .then(setBusySlots)
      .catch(() => setBusySlots([]));
  }, [selectedDate, selectedDuration, visible]);

  // Tatuador de estúdio escolhe horário + posição na tela de posições.
  useEffect(() => {
    if (!visible) return;
    appointmentService
      .agendaEstudio(formatDate(DAYS[0]))
      .then((a) => setEstudio(a.vinculadoEstudio ? { nome: a.nomeEstudio, posicoes: a.posicoes } : null))
      .catch(() => setEstudio(null));
  }, [visible]);

  useEffect(() => {
    if (sessions.length === 0 || activeIdx >= sessions.length) return;
    const s = sessions[activeIdx];
    setSelectedDate(s.data);
    setSelectedTime(s.horario);
    setSelectedPosicao(s.posicao);
    setSelectedDuration(s.duracaoMinutos / 60);
    if (s.horario && !FIXED_SLOTS.includes(s.horario)) {
      setCustomTimeActive(true);
      setCustomTimeInput(s.horario);
    } else {
      setCustomTimeActive(false);
      setCustomTimeInput('');
    }
  }, [activeIdx]);

  const updateActive = useCallback(
    (patch: Partial<Session>) => {
      setSessions((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((s, i) => (i === activeIdx ? { ...s, ...patch } : s));
      });
    },
    [activeIdx],
  );

  function handleDateSelect(day: Date) {
    setSelectedDate(day);
    setSelectedTime(null);
    setSelectedPosicao(null);
    updateActive({ data: day, horario: null, posicao: null });
  }

  function handlePosicaoConfirm(sel: PosicaoSelecionada) {
    setSelectedTime(sel.horario);
    setSelectedPosicao(sel.posicao);
    updateActive({ horario: sel.horario, posicao: sel.posicao });
    setPosicoesVisible(false);
  }

  /** Outras sessões desta proposta no mesmo dia — bloqueiam o horário na tela de posições. */
  const pendentesNoDia: BlocoAgenda[] = sessions.flatMap((s, i) =>
    i !== activeIdx && s.horario && s.posicao && sameDay(s.data, selectedDate)
      ? [{
          posicao: s.posicao,
          inicioMin: paraMinutos(s.horario),
          duracaoMin: s.duracaoMinutos,
          propria: true,
          pendente: true,
          rotulo: `Sessão ${i + 1}`,
        }]
      : [],
  );

  function handleTimeSelect(slot: string) {
    setSelectedTime(slot);
    setCustomTimeActive(false);
    setCustomTimeInput('');
    updateActive({ horario: slot });
  }

  function handleDurationSelect(h: number) {
    setSelectedDuration(h);
    if (estudio) {
      // A nova duração pode colidir com outra reserva: escolhe o horário de novo.
      setSelectedTime(null);
      setSelectedPosicao(null);
      updateActive({ duracaoMinutos: h * 60, horario: null, posicao: null });
    } else {
      updateActive({ duracaoMinutos: h * 60 });
    }
  }

  function handleCustomTimeActivate() {
    setCustomTimeActive(true);
    setSelectedTime(null);
    setTimeout(() => customTimeRef.current?.focus(), 50);
  }

  function handleCustomTimeBlur() {
    const cleaned = customTimeInput.replace(/[^0-9:]/g, '');
    const match = cleaned.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (match) {
      const normalized = `${match[1].padStart(2, '0')}:${match[2]}`;
      if (FIXED_SLOTS.includes(normalized)) {
        setCustomTimeActive(false);
        setCustomTimeInput('');
        setSelectedTime(normalized);
        updateActive({ horario: normalized });
      } else {
        setSelectedTime(normalized);
        updateActive({ horario: normalized });
      }
    } else {
      setCustomTimeInput('');
      setCustomTimeActive(false);
    }
  }

  function isSlotBlocked(slot: string): boolean {
    const slotMin = toMinutes(slot);
    const durMin = selectedDuration * 60;
    return busySlots.some((b) => {
      const bMin = toMinutes(b.horario);
      return slotMin < bMin + b.duracaoMinutos && slotMin + durMin > bMin;
    });
  }

  function addSession() {
    const newSession: Session = {
      data: DAYS[0],
      horario: null,
      duracaoMinutos: 60,
      posicao: null,
    };
    setSessions((prev) => {
      const next = [...prev, newSession];
      setActiveIdx(next.length - 1);
      return next;
    });
    setSelectedDate(DAYS[0]);
    setSelectedTime(null);
    setSelectedPosicao(null);
    setSelectedDuration(1);
  }

  function removeSession(idx: number) {
    setSessions((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setActiveIdx(Math.min(activeIdx, next.length - 1));
      return next;
    });
  }

  async function handleEnviar() {
    const valorNum = parseFloat(valorTotal.replace(/\./g, '').replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Valor inválido', 'Informe o valor total da tatuagem.');
      return;
    }
    const incomplete = sessions.some((s) => !s.horario || (estudio && !s.posicao));
    if (incomplete) {
      Alert.alert(
        'Sessão incompleta',
        estudio
          ? 'Escolha o horário e a posição do estúdio para todas as sessões.'
          : 'Selecione data e horário para todas as sessões.',
      );
      return;
    }
    setEnviando(true);
    try {
      await appointmentService.criar({
        chatId,
        sessoes: sessions.map((s) => ({
          data: formatDate(s.data),
          horario: s.horario!,
          duracaoMinutos: s.duracaoMinutos,
          ...(estudio && s.posicao ? { posicao: s.posicao } : {}),
        })),
        valorTotal: valorNum,
      });
      onSent();
    } catch (e: any) {
      // 409/400 trazem o motivo (ex.: posição ocupada por outro tatuador nesse meio tempo).
      const mensagem: string | undefined = e?.response?.data?.mensagem;
      Alert.alert(
        mensagem ? 'Horário indisponível' : 'Erro',
        mensagem ?? 'Não foi possível criar o agendamento. Tente novamente.',
      );
      console.log(e);
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => {
    if (!visible) {
      setSessions([]);
      setActiveIdx(0);
      setSelectedDate(DAYS[0]);
      setSelectedTime(null);
      setSelectedDuration(1);
      setValorTotal('');
      setBusySlots([]);
      setSelectedPosicao(null);
      setPosicoesVisible(false);
      setCustomTimeActive(false);
      setCustomTimeInput('');
    }
  }, [visible]);

  const canSend =
    sessions.length > 0 &&
    sessions.every((s) => s.horario !== null && (!estudio || s.posicao !== null)) &&
    valorTotal.length > 0 &&
    !enviando;

  const totalNum = parseFloat(valorTotal.replace(/\./g, '').replace(',', '.')) || 0;

  const secaoDuracao = (
    <Section label="DURAÇÃO ESTIMADA">
      <View className="flex-row flex-wrap gap-2">
        {DURATIONS_H.map((h) => {
          const active = selectedDuration === h;
          return (
            <TouchableOpacity
              key={h}
              onPress={() => handleDurationSelect(h)}
              className={`px-4 py-2 rounded-rd-xs ${active ? 'bg-plum' : 'bg-surface'}`}
            >
              <Text className={`font-body text-[13px] ${active ? 'text-white' : 'text-ink'}`}>
                {h}h
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Section>
  );

  const fimSelecionado = selectedTime
    ? paraHorario(paraMinutos(selectedTime) + selectedDuration * 60)
    : null;

  const secaoHorarioEstudio = (
    <Section label="HORÁRIO E POSIÇÃO">
      <TouchableOpacity
        onPress={() => {
          setAberturaPosicoes((n) => n + 1);
          setPosicoesVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Escolher horário e posição no estúdio"
        className="flex-row items-center bg-surface rounded-rd-md px-4 py-4"
      >
        <View className="flex-1">
          {selectedTime && selectedPosicao ? (
            <>
              <Text className="font-aux-bold text-[18px] text-ink">
                {selectedTime} – {fimSelecionado} · Posição {selectedPosicao}
              </Text>
              <Text className="font-body text-[12px] text-fg-2 mt-0.5">Toque para trocar</Text>
            </>
          ) : (
            <>
              <Text className="font-body-semibold text-[15px] text-ink">Escolher horário e posição</Text>
              <Text className="font-body text-[12px] text-fg-2 mt-0.5">
                Veja as reservas das {estudio?.posicoes ?? 0} posições
                {estudio?.nome ? ` do ${estudio.nome}` : ' do estúdio'}
              </Text>
            </>
          )}
        </View>
        <ChevronRight size={22} color="#602C66" />
      </TouchableOpacity>
    </Section>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>

        <View className="flex-row items-start px-6 pt-2 pb-4">
          <View className="w-8 items-start pt-1">
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar">
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center">
            <Text className="font-display text-[28px] text-ink tracking-wide">AGENDAR PARA</Text>
            <Text className="font-body text-[14px] text-fg-2 mt-0.5">{outroNome}</Text>
          </View>
          <View className="w-8" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >

          <Section label="SESSÕES">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {sessions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setActiveIdx(i)}
                  className={`flex-row items-center mr-2 px-3 py-1.5 rounded-rd-xs border ${
                    i === activeIdx ? 'bg-plum border-plum' : 'bg-surface border-surface'
                  }`}
                >
                  <Text className={`font-body text-[13px] ${i === activeIdx ? 'text-white' : 'text-ink'}`}>
                    {`${i + 1}. `}
                    {s.horario
                      ? `${s.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${s.horario}${
                          estudio && s.posicao ? ` · P${s.posicao}` : ''}`
                      : 'Pendente'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeSession(i)}
                    hitSlop={6}
                    className="ml-2"
                    accessibilityLabel={`Remover sessão ${i + 1}`}
                  >
                    <X size={12} color={i === activeIdx ? '#ffffff' : '#602C66'} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={addSession}
              className="self-start bg-plum px-4 py-2 rounded-rd-xs"
            >
              <Text className="font-body text-[13px] text-white">+ Adicionar sessão</Text>
            </TouchableOpacity>
          </Section>

          {sessions.length > 0 && (
            <>
              <Section label="DATA">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {DAYS.map((day, i) => {
                    const active = sameDay(day, selectedDate);
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleDateSelect(day)}
                        className={`items-center mr-2 px-3 py-2 rounded-rd-xs ${
                          active ? 'bg-ink' : 'bg-surface'
                        }`}
                      >
                        <Text className={`font-body text-[11px] ${active ? 'text-background' : 'text-fg-2'}`}>
                          {DAY_NAMES[day.getDay()]}
                        </Text>
                        <Text className={`font-display text-[20px] ${active ? 'text-background' : 'text-ink'}`}>
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Section>

              {estudio ? (
                <>
                  {secaoDuracao}
                  {secaoHorarioEstudio}
                </>
              ) : (
              <Section label="HORÁRIO">
                <View className="flex-row flex-wrap gap-2">
                  {FIXED_SLOTS.map((slot) => {
                    const blocked = isSlotBlocked(slot);
                    const active = selectedTime === slot && !customTimeActive;
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => !blocked && handleTimeSelect(slot)}
                        disabled={blocked}
                        className={`px-4 py-2 rounded-rd-xs ${
                          active ? 'bg-plum' : 'bg-surface'
                        }`}
                        style={{ opacity: blocked ? 0.3 : 1 }}
                      >
                        <Text className={`font-body text-[13px] ${active ? 'text-white' : 'text-ink'}`}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {customTimeActive ? (
                    <View className="flex-row items-center bg-plum px-3 py-2 rounded-rd-xs">
                      <TextInput
                        ref={customTimeRef}
                        value={customTimeInput}
                        onChangeText={(t) => {
                          const digits = t.replace(/[^0-9]/g, '').slice(0, 4);
                          const formatted =
                            digits.length > 2
                              ? `${digits.slice(0, 2)}:${digits.slice(2)}`
                              : digits;
                          setCustomTimeInput(formatted);
                        }}
                        onBlur={handleCustomTimeBlur}
                        placeholder="HH:MM"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        keyboardType="numeric"
                        maxLength={5}
                        className="font-body text-[13px] text-white w-14"
                        style={{ padding: 0 }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleCustomTimeActivate}
                      className={`px-4 py-2 rounded-rd-xs ${
                        customTimeInput ? 'bg-plum' : 'bg-surface'
                      }`}
                    >
                      <Text className={`font-body text-[13px] ${customTimeInput ? 'text-white' : 'text-ink'}`}>
                        {customTimeInput || 'Outro'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Section>
              )}

              {!estudio && secaoDuracao}
            </>
          )}

          <Section label="VALOR TOTAL DA TATUAGEM">
            <View className="flex-row items-center bg-surface rounded-rd-xs px-4 py-3">
              <Text className="font-body text-[14px] text-fg-2 mr-1">R$</Text>
              <TextInput
                value={valorTotal}
                onChangeText={(t) => setValorTotal(formatBRL(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
                className="flex-1 font-body text-[14px] text-ink"
                style={{ padding: 0 }}
              />
            </View>
          </Section>

          {sessions.length > 0 && totalNum > 0 && (
            <View className="bg-ink rounded-rd-md px-4 py-3 mt-2">
              <Text className="font-body text-[14px] text-background">
                {sessions.length} {sessions.length > 1 ? 'sessões' : 'sessão'} · R${' '}
                {totalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} total
              </Text>
            </View>
          )}

        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 px-6 bg-background"
          style={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
        >
          <TouchableOpacity
            onPress={handleEnviar}
            disabled={!canSend}
            className="bg-plum rounded-rd-md py-4 items-center"
            style={{ opacity: canSend ? 1 : 0.4 }}
          >
            <Text className="font-display text-[16px] text-white tracking-wide">
              {enviando ? 'ENVIANDO...' : 'CONFIRMAR AGENDAMENTO'}
            </Text>
          </TouchableOpacity>
        </View>

        {estudio && (
          <StudioPositionsModal
            key={aberturaPosicoes}
            visible={posicoesVisible}
            onClose={() => setPosicoesVisible(false)}
            onConfirm={handlePosicaoConfirm}
            data={selectedDate}
            duracaoMinutos={selectedDuration * 60}
            inicial={selectedTime && selectedPosicao ? { horario: selectedTime, posicao: selectedPosicao } : null}
            pendentes={pendentesNoDia}
          />
        )}
      </View>
    </Modal>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="font-display text-[12px] text-fg-2 tracking-widest mb-3">{label}</Text>
      {children}
    </View>
  );
}
