import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, X } from 'lucide-react-native';

import type { HorarioDTO } from '../../services/api/artistService';
import { PosicaoSelecionada, StudioPositionsModal } from '../../screens/App/StudioPositionsModal';
import { BlocoAgenda, paraHorario, paraMinutos } from '../../utils/agendaEstudio';
import { intervalosDoDia } from '../../utils/horario';

/** Data, horário, duração e posição de uma sessão. */
export interface DadosSessao {
  /** "yyyy-MM-dd". */
  data: string;
  /** "HH:mm". */
  horario: string;
  duracaoMinutos: number;
  posicao: number;
}

interface Props {
  visible: boolean;
  titulo: string;
  /** Sessão sendo remarcada; null = sessão nova. */
  inicial: DadosSessao | null;
  /** Reservas gravadas deste serviço: no lugar delas valem as posições de `outras`. */
  ignorarSessionIds: string[];
  /** Outras sessões deste serviço, como estão na edição: bloqueiam o horário. */
  outras: (DadosSessao & { rotulo: string })[];
  horarios: HorarioDTO[];
  posicoesEstudio: number;
  nomeEstudio: string | null;
  onConfirm: (dados: DadosSessao) => void;
  onClose: () => void;
}

const DURACOES_H = [1, 2, 3, 4, 5, 6];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function proximosDias(): Date[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 28 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function deIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Escolhe dia, duração, horário e posição de uma sessão — o mesmo fluxo do
 * agendamento pelo chat (ScheduleModal), para uma sessão só. Usado na tela do
 * serviço para remarcar uma sessão ou adicionar outra.
 */
export function SessaoEditorModal(props: Props) {
  // Remonta a cada abertura: o estado nasce da sessão escolhida.
  if (!props.visible) return null;
  return <Editor {...props} />;
}

function Editor({
  titulo, inicial, ignorarSessionIds, outras, horarios, posicoesEstudio, nomeEstudio, onConfirm, onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [dias] = useState(proximosDias);

  const diaAberto = (d: Date) => horarios.length === 0 || intervalosDoDia(horarios, d).length > 0;

  const [data, setData] = useState<Date>(() =>
    inicial ? deIso(inicial.data) : dias.find(diaAberto) ?? dias[0],
  );
  const [duracaoMin, setDuracaoMin] = useState(inicial?.duracaoMinutos ?? 60);
  const [horario, setHorario] = useState<string | null>(inicial?.horario ?? null);
  const [posicao, setPosicao] = useState<number | null>(inicial?.posicao ?? null);
  const [posicoesVisible, setPosicoesVisible] = useState(false);
  const [abertura, setAbertura] = useState(0);

  const dataIso = isoDate(data);
  const duracoes = DURACOES_H.map((h) => h * 60).includes(duracaoMin)
    ? DURACOES_H.map((h) => h * 60)
    : [...DURACOES_H.map((h) => h * 60), duracaoMin].sort((a, b) => a - b);

  const pendentes: BlocoAgenda[] = outras
    .filter((o) => o.data === dataIso)
    .map((o) => ({
      posicao: o.posicao,
      inicioMin: paraMinutos(o.horario),
      duracaoMin: o.duracaoMinutos,
      propria: true,
      pendente: true,
      rotulo: o.rotulo,
    }));

  // Trocar dia ou duração pode gerar conflito: escolhe o horário de novo.
  const limparHorario = () => {
    setHorario(null);
    setPosicao(null);
  };

  const intervalosHoje = intervalosDoDia(horarios, data);
  const pronto = !!horario && !!posicao;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-6 pt-2 pb-4">
          <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar">
            <X size={24} color="#000000" />
          </TouchableOpacity>
          <Text className="flex-1 font-display text-[26px] text-ink tracking-wide text-center mr-6">{titulo}</Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          <Secao label="DATA">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dias.map((dia) => {
                const ativo = isoDate(dia) === dataIso;
                const fechado = !diaAberto(dia);
                return (
                  <TouchableOpacity
                    key={dia.toISOString()}
                    onPress={() => {
                      setData(dia);
                      limparHorario();
                    }}
                    disabled={fechado}
                    className={`items-center mr-2 px-3 py-2 rounded-rd-xs ${ativo ? 'bg-ink' : 'bg-surface'}`}
                    style={{ opacity: fechado ? 0.3 : 1 }}
                    accessibilityState={{ disabled: fechado, selected: ativo }}
                  >
                    <Text className={`font-body text-[11px] ${ativo ? 'text-background' : 'text-fg-2'}`}>
                      {DAY_NAMES[dia.getDay()]}
                    </Text>
                    <Text className={`font-display text-[20px] ${ativo ? 'text-background' : 'text-ink'}`}>
                      {dia.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {horarios.length > 0 && (
              <Text className="font-body text-[12px] text-fg-2 mt-2">
                {intervalosHoje.length > 0
                  ? `Horário do estúdio neste dia: ${intervalosHoje.map((h) => `${h.abre}–${h.fecha}`).join(', ')}`
                  : 'O estúdio não atende neste dia.'}
              </Text>
            )}
          </Secao>

          <Secao label="DURAÇÃO ESTIMADA">
            <View className="flex-row flex-wrap gap-2">
              {duracoes.map((min) => {
                const ativo = duracaoMin === min;
                return (
                  <TouchableOpacity
                    key={min}
                    onPress={() => {
                      setDuracaoMin(min);
                      limparHorario();
                    }}
                    className={`px-4 py-2 rounded-rd-xs ${ativo ? 'bg-plum' : 'bg-surface'}`}
                  >
                    <Text className={`font-body text-[13px] ${ativo ? 'text-white' : 'text-ink'}`}>
                      {min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h${min % 60}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Secao>

          <Secao label="HORÁRIO E POSIÇÃO">
            <TouchableOpacity
              onPress={() => {
                setAbertura((n) => n + 1);
                setPosicoesVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Escolher horário e posição no estúdio"
              className="flex-row items-center bg-surface rounded-rd-md px-4 py-4"
            >
              <View className="flex-1">
                {pronto ? (
                  <>
                    <Text className="font-aux-bold text-[18px] text-ink">
                      {horario} – {paraHorario(paraMinutos(horario!) + duracaoMin)}
                      {posicoesEstudio > 1 ? ` · Posição ${posicao}` : ''}
                    </Text>
                    <Text className="font-body text-[12px] text-fg-2 mt-0.5">Toque para trocar</Text>
                  </>
                ) : (
                  <>
                    <Text className="font-body-semibold text-[15px] text-ink">
                      {posicoesEstudio > 1 ? 'Escolher horário e posição' : 'Escolher horário'}
                    </Text>
                    <Text className="font-body text-[12px] text-fg-2 mt-0.5">
                      Veja as reservas{nomeEstudio ? ` do ${nomeEstudio}` : ' do estúdio'}
                    </Text>
                  </>
                )}
              </View>
              <ChevronRight size={22} color="#602C66" />
            </TouchableOpacity>
          </Secao>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 px-6 bg-background"
          style={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
        >
          <TouchableOpacity
            onPress={() => pronto && onConfirm({ data: dataIso, horario: horario!, duracaoMinutos: duracaoMin, posicao: posicao! })}
            disabled={!pronto}
            className="bg-plum rounded-rd-md py-4 items-center"
            style={{ opacity: pronto ? 1 : 0.4 }}
            accessibilityRole="button"
          >
            <Text className="font-display text-[16px] text-white tracking-wide">CONFIRMAR</Text>
          </TouchableOpacity>
        </View>

        <StudioPositionsModal
          key={abertura}
          visible={posicoesVisible}
          onClose={() => setPosicoesVisible(false)}
          onConfirm={(sel: PosicaoSelecionada) => {
            setHorario(sel.horario);
            setPosicao(sel.posicao);
            setPosicoesVisible(false);
          }}
          data={data}
          duracaoMinutos={duracaoMin}
          inicial={horario && posicao ? { horario, posicao } : null}
          pendentes={pendentes}
          ignorarSessionIds={ignorarSessionIds}
          horarios={horarios}
        />
      </View>
    </Modal>
  );
}

function Secao({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="font-display text-[12px] text-fg-2 tracking-widest mb-3">{label}</Text>
      {children}
    </View>
  );
}
