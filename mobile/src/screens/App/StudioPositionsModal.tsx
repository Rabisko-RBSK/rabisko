import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { appointmentService, AgendaEstudioDTO } from '../../services/api';
import {
  BlocoAgenda,
  Candidato,
  FIM_GRADE_MIN,
  INICIO_GRADE_MIN,
  PASSO_MIN,
  blocosDoDia,
  encaixarNoPasso,
  motivoConflito,
  paraHorario,
  paraMinutos,
} from '../../utils/agendaEstudio';

/**
 * Tela de posições do estúdio (gráfico de Gantt) — aberta pelo ScheduleModal
 * quando o tatuador é vinculado a um estúdio. Linhas = posições, colunas =
 * horário; barras = sessões já reservadas. O tatuador toca num horário livre
 * de uma posição e confirma. O backend revalida a sobreposição no envio.
 *
 * Layout: Figma "Artista / Posições do Estúdio".
 */

const LABEL_W = 72;
const HEAD_H = 40;
const ROW_H = 64;
const BAR_H = 40;
const PX_POR_MIN = 1.6; // 48px a cada 30 min
const GRADE_W = (FIM_GRADE_MIN - INICIO_GRADE_MIN) * PX_POR_MIN;

const C = {
  plum: '#602C66',
  plumTint: '#EFE6F0',
  surface: '#EAE0D5',
  surface2: '#F2EBE0',
  hairline: '#D9D9D9',
  gridSoft: '#EFEFEF',
  error: '#B33A3A',
  success: '#1F7A4D',
};

export interface PosicaoSelecionada {
  posicao: number;
  horario: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (sel: PosicaoSelecionada) => void;
  data: Date;
  duracaoMinutos: number;
  /** Seleção atual da sessão (para reabrir a tela com ela marcada). */
  inicial?: PosicaoSelecionada | null;
  /** Outras sessões desta mesma proposta no mesmo dia (ainda não enviadas). */
  pendentes?: BlocoAgenda[];
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const xDe = (min: number) => (min - INICIO_GRADE_MIN) * PX_POR_MIN;

export function StudioPositionsModal({
  visible, onClose, onConfirm, data, duracaoMinutos, inicial, pendentes = [],
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [agenda, setAgenda] = useState<AgendaEstudioDTO | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  /** Altura do rodapé fixo (resumo + botão), medida no layout. */
  const [alturaRodape, setAlturaRodape] = useState(120);
  // O pai remonta esta tela (via `key`) a cada abertura, então a seleção
  // inicial vem direto das props.
  const [candidato, setCandidato] = useState<Candidato | null>(() =>
    inicial ? { posicao: inicial.posicao, inicioMin: paraMinutos(inicial.horario), duracaoMin: duracaoMinutos } : null,
  );

  const dataIso = isoDate(data);

  const buscar = useCallback((ativo: () => boolean) => {
    appointmentService
      .agendaEstudio(dataIso)
      .then((a) => { if (ativo()) { setAgenda(a); setErro(false); } })
      .catch(() => { if (ativo()) setErro(true); })
      .finally(() => { if (ativo()) setCarregando(false); });
  }, [dataIso]);

  useEffect(() => {
    if (!visible) return;
    let ativo = true;
    buscar(() => ativo);
    return () => { ativo = false; };
  }, [visible, buscar]);

  function tentarDeNovo() {
    setCarregando(true);
    setErro(false);
    buscar(() => true);
  }

  const blocos = useMemo(
    () => [...(agenda ? blocosDoDia(agenda.reservas, dataIso) : []), ...pendentes],
    [agenda, dataIso, pendentes],
  );
  const semPosicaoProprios = blocos.filter((b) => b.posicao === null && b.propria);
  const conflito = candidato ? motivoConflito(candidato, blocos) : null;
  const posicoes = agenda?.posicoes ?? 0;

  // Rola até a seleção (ou à primeira reserva, ou 09:00) quando os dados chegam.
  useEffect(() => {
    if (!agenda) return;
    const foco = candidato?.inicioMin
      ?? blocos.filter((b) => b.posicao !== null).map((b) => b.inicioMin).sort((a, b) => a - b)[0]
      ?? 9 * 60;
    const x = Math.max(0, xDe(Math.max(foco, INICIO_GRADE_MIN)) - 24);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ x, animated: false }));
  }, [agenda]); // eslint-disable-line react-hooks/exhaustive-deps

  function tocarLinha(posicao: number, locationX: number) {
    const minuto = INICIO_GRADE_MIN + locationX / PX_POR_MIN;
    setCandidato({ posicao, inicioMin: encaixarNoPasso(minuto, duracaoMinutos), duracaoMin: duracaoMinutos });
  }

  function confirmar() {
    if (!candidato || conflito) return;
    onConfirm({ posicao: candidato.posicao, horario: paraHorario(candidato.inicioMin) });
  }

  const marcas: number[] = [];
  for (let m = INICIO_GRADE_MIN; m <= FIM_GRADE_MIN; m += PASSO_MIN) marcas.push(m);
  const dataBR = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const podeConfirmar = !!candidato && !conflito;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-6 pt-2 pb-2">
          <View className="w-8 items-start">
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
              <ChevronLeft size={28} color="#000000" />
            </TouchableOpacity>
          </View>
          <Text className="flex-1 text-center font-display text-[32px] text-ink tracking-wide" numberOfLines={1}>
            {agenda?.nomeEstudio?.toUpperCase() ?? 'POSIÇÕES'}
          </Text>
          <View className="w-8" />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: alturaRodape + 16 }}>
          <View className="self-center bg-surface rounded-rd-pill px-[18px] py-2 mb-3">
            <Text className="font-body-semibold text-[14px] text-ink">{dataBR}</Text>
          </View>
          <Text className="font-body text-[13px] text-fg-2 mb-4">
            Toque em um horário livre para selecioná-lo. As barras mostram os horários já reservados em cada posição.
          </Text>

          {carregando && !agenda ? (
            <View className="items-center py-16">
              <ActivityIndicator color={C.plum} />
            </View>
          ) : erro ? (
            <View className="items-center py-12">
              <Text className="font-body text-[14px] text-error text-center mb-3">
                Não foi possível carregar as posições do estúdio.
              </Text>
              <TouchableOpacity onPress={tentarDeNovo} accessibilityRole="button">
                <Text className="font-body-semibold text-[13px] text-plum">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              className="bg-paper rounded-rd-lg overflow-hidden flex-row"
              style={{ borderWidth: 1, borderColor: C.hairline }}
            >
              {/* Coluna fixa com o nome das posições */}
              <View style={{ width: LABEL_W, borderRightWidth: 1, borderRightColor: C.hairline }}>
                <View style={{ height: HEAD_H, backgroundColor: C.surface2 }} className="items-center justify-center">
                  <Text className="font-body-semibold text-[9px] text-fg-3">HORA</Text>
                </View>
                {Array.from({ length: posicoes }, (_, i) => (
                  <View
                    key={i}
                    style={{ height: ROW_H, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.hairline }}
                    className="items-center justify-center"
                  >
                    <Text className="font-display text-[18px] text-ink">POS {i + 1}</Text>
                  </View>
                ))}
              </View>

              {/* Linha do tempo rolável */}
              <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ width: GRADE_W }}>
                  <View style={{ height: HEAD_H, backgroundColor: C.surface2 }}>
                    {marcas.filter((m) => m % 60 === 0 && m < FIM_GRADE_MIN).map((m) => (
                      <Text
                        key={m}
                        className="font-body-medium text-[10px] text-fg-2 absolute"
                        style={{ left: xDe(m) + 4, top: 13 }}
                      >
                        {paraHorario(m)}
                      </Text>
                    ))}
                  </View>

                  {Array.from({ length: posicoes }, (_, i) => {
                    const posicao = i + 1;
                    const sel = candidato?.posicao === posicao ? candidato : null;
                    return (
                      <Pressable
                        key={posicao}
                        onPress={(e) => tocarLinha(posicao, e.nativeEvent.locationX)}
                        accessibilityRole="button"
                        accessibilityLabel={`Posição ${posicao}`}
                        accessibilityHint="Toque no horário em que deseja agendar"
                        style={{ height: ROW_H, borderTopWidth: 1, borderTopColor: C.hairline }}
                      >
                        {marcas.map((m) => (
                          <View
                            key={m}
                            pointerEvents="none"
                            style={{
                              position: 'absolute', left: xDe(m), top: 0, bottom: 0, width: 1,
                              backgroundColor: m % 60 === 0 ? C.hairline : C.gridSoft,
                            }}
                          />
                        ))}

                        {blocos.filter((b) => b.posicao === posicao
                          && b.inicioMin + b.duracaoMin > INICIO_GRADE_MIN
                          && b.inicioMin < FIM_GRADE_MIN).map((b, k) => (
                          <View
                            key={k}
                            pointerEvents="none"
                            className="absolute justify-center px-2 rounded-rd-xs"
                            style={{
                              left: xDe(Math.max(b.inicioMin, INICIO_GRADE_MIN)) + 1,
                              width: Math.max(
                                (Math.min(b.inicioMin + b.duracaoMin, FIM_GRADE_MIN)
                                  - Math.max(b.inicioMin, INICIO_GRADE_MIN)) * PX_POR_MIN - 2, 4,
                              ),
                              top: (ROW_H - BAR_H) / 2,
                              height: BAR_H,
                              backgroundColor: b.pendente ? C.plumTint : C.surface,
                              borderWidth: b.propria ? 1.5 : 0,
                              borderColor: C.plum,
                              borderStyle: b.pendente ? 'dashed' : 'solid',
                            }}
                          >
                            <Text className="font-body-semibold text-[12px] text-ink" numberOfLines={1}>{b.rotulo}</Text>
                          </View>
                        ))}

                        {sel && (
                          <View
                            pointerEvents="none"
                            className="absolute justify-center px-2 rounded-rd-xs"
                            style={{
                              left: xDe(sel.inicioMin) + 1,
                              width: sel.duracaoMin * PX_POR_MIN - 2,
                              top: (ROW_H - BAR_H) / 2,
                              height: BAR_H,
                              backgroundColor: conflito ? 'rgba(179,58,58,0.15)' : C.plum,
                              borderWidth: conflito ? 1.5 : 0,
                              borderColor: C.error,
                            }}
                          >
                            <Text
                              className="font-body-semibold text-[12px]"
                              style={{ color: conflito ? C.error : '#FFFFFF' }}
                              numberOfLines={1}
                            >
                              {conflito ? 'Conflito' : 'Sua sessão'}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {!!agenda && (
            <>
              <View className="flex-row flex-wrap items-center mt-3" style={{ gap: 14 }}>
                <Legenda cor={C.surface} label="Reservado" />
                <Legenda cor={C.plum} label="Sua sessão" />
                <Legenda cor="#FFFFFF" borda label="Livre" />
              </View>
              {semPosicaoProprios.length > 0 && (
                <Text className="font-body text-[12px] text-fg-3 mt-2">
                  Você também tem {semPosicaoProprios.length === 1 ? 'uma sessão' : 'sessões'} sem posição definida
                  neste dia ({semPosicaoProprios.map((b) =>
                    `${paraHorario(Math.max(b.inicioMin, 0))}–${paraHorario(b.inicioMin + b.duracaoMin)}`).join(', ')}).
                  Esses horários também ficam bloqueados.
                </Text>
              )}
            </>
          )}
        </ScrollView>

        {/* Rodapé fixo: resumo da seleção + confirmar. Sobrepõe o gráfico; o
            paddingBottom do ScrollView (altura medida) deixa rolar o conteúdo
            até acima dele. */}
        <View
          className="absolute bottom-0 left-0 right-0 px-6 bg-background"
          style={{
            paddingBottom: insets.bottom + 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: C.hairline,
          }}
          onLayout={(e) => setAlturaRodape(e.nativeEvent.layout.height)}
        >
          {!!agenda && (
            <View className="bg-surface-2 rounded-rd-lg p-4 mb-3" accessibilityLiveRegion="polite">
              <Text className="font-body-semibold text-[11px] text-plum mb-1">SESSÃO SELECIONADA</Text>
              {candidato ? (
                <>
                  <Text className="font-aux-bold text-[20px] text-ink mb-2">
                    Posição {candidato.posicao} · {paraHorario(candidato.inicioMin)} – {paraHorario(candidato.inicioMin + candidato.duracaoMin)}
                  </Text>
                  <View className="flex-row justify-between items-start" style={{ gap: 12 }}>
                    <Text className="font-body text-[14px] text-fg-2">Conflitos com outras reservas</Text>
                    <Text
                      className="font-body-semibold text-[14px] flex-shrink text-right"
                      style={{ color: conflito ? C.error : C.success }}
                    >
                      {conflito ?? 'Nenhum'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="font-body text-[14px] text-fg-2">Duração</Text>
                    <Text className="font-body-semibold text-[14px] text-ink">
                      {duracaoMinutos / 60} {duracaoMinutos === 60 ? 'hora' : 'horas'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text className="font-body text-[14px] text-fg-2">
                  Nenhum horário selecionado. Toque em uma posição no gráfico.
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={confirmar}
            disabled={!podeConfirmar}
            accessibilityRole="button"
            accessibilityState={{ disabled: !podeConfirmar }}
            className="bg-ink rounded-rd-md py-4 items-center"
            style={{ opacity: podeConfirmar ? 1 : 0.4 }}
          >
            <Text className="font-body-bold text-[18px] text-on-ink">Confirmar horário</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Legenda({ cor, label, borda }: { cor: string; label: string; borda?: boolean }) {
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      <View
        style={{
          width: 14, height: 14, borderRadius: 4, backgroundColor: cor,
          borderWidth: borda ? 1 : 0, borderColor: '#9A9A9A',
        }}
      />
      <Text className="font-body text-[12px] text-fg-2">{label}</Text>
    </View>
  );
}
