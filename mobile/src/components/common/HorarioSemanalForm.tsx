import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';

import { Checkbox } from './Checkbox';
import { FilterChip } from './Chip';
import type { HorarioDTO } from '../../services/api/artistService';
import { DIAS_LONGOS, OPCOES_HORARIO, deMinutos, paraMinutos } from '../../utils/horario';

const PADRAO_ABRE = '09:00';
const PADRAO_FECHA = '18:00';

interface Props {
  /** Um intervalo por dia aberto; dia ausente = fechado. Lista vazia = sem restrição. */
  value: HorarioDTO[];
  onChange: (horarios: HorarioDTO[]) => void;
  disabled?: boolean;
}

type Editando = { dia: number; campo: 'abre' | 'fecha' } | null;

/**
 * Grade semanal do tatuador: liga/desliga cada dia e escolhe abertura e
 * fechamento de 30 em 30 minutos. As opções oferecidas já garantem
 * fechamento depois da abertura. Componente controlado.
 */
export function HorarioSemanalForm({ value, onChange, disabled }: Props) {
  const [editando, setEditando] = useState<Editando>(null);

  const doDia = (dia: number) => value.find((h) => h.diaSemana === dia);

  const ordenar = (lista: HorarioDTO[]) => [...lista].sort((a, b) => a.diaSemana - b.diaSemana);

  const alternarDia = (dia: number, aberto: boolean) => {
    if (aberto) {
      // Novo dia copia o horário do último dia aberto (ou o padrão).
      const referencia = ordenar(value).at(-1);
      onChange(
        ordenar([
          ...value,
          { diaSemana: dia, abre: referencia?.abre ?? PADRAO_ABRE, fecha: referencia?.fecha ?? PADRAO_FECHA },
        ]),
      );
    } else {
      onChange(value.filter((h) => h.diaSemana !== dia));
    }
  };

  const definirHora = (dia: number, campo: 'abre' | 'fecha', hora: string) => {
    onChange(value.map((h) => (h.diaSemana === dia ? { ...h, [campo]: hora } : h)));
    setEditando(null);
  };

  const copiarParaTodos = () => {
    const base = ordenar(value)[0];
    if (!base) return;
    onChange(value.map((h) => ({ ...h, abre: base.abre, fecha: base.fecha })));
  };

  // Opções válidas para o campo em edição: abertura antes do fechamento e vice-versa.
  const atual = editando ? doDia(editando.dia) : undefined;
  const opcoes = !atual
    ? []
    : editando!.campo === 'abre'
      ? OPCOES_HORARIO.filter((o) => paraMinutos(o) < paraMinutos(atual.fecha))
      : [...OPCOES_HORARIO.filter((o) => paraMinutos(o) > paraMinutos(atual.abre)), deMinutos(24 * 60 - 1)];

  return (
    <View>
      <View className="bg-surface rounded-rd-lg px-4 py-2 mb-3">
        {[1, 2, 3, 4, 5, 6, 7].map((dia, i) => {
          const h = doDia(dia);
          return (
            <View
              key={dia}
              className="flex-row items-center py-2.5"
              style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(0,0,0,0.06)', minHeight: 48 }}
            >
              <View className="flex-1">
                <Checkbox
                  checked={!!h}
                  onChange={(marcado) => !disabled && alternarDia(dia, marcado)}
                  accessibilityLabel={`Atende ${DIAS_LONGOS[dia]}`}
                  label={<Text className="font-body text-[14px] text-ink">{DIAS_LONGOS[dia]}</Text>}
                />
              </View>
              {h ? (
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <BotaoHora
                    hora={h.abre}
                    disabled={disabled}
                    accessibilityLabel={`Abertura de ${DIAS_LONGOS[dia]}`}
                    onPress={() => setEditando({ dia, campo: 'abre' })}
                  />
                  <Text className="font-body text-[12px] text-fg-3">às</Text>
                  <BotaoHora
                    hora={h.fecha}
                    disabled={disabled}
                    accessibilityLabel={`Fechamento de ${DIAS_LONGOS[dia]}`}
                    onPress={() => setEditando({ dia, campo: 'fecha' })}
                  />
                </View>
              ) : (
                <Text className="font-body text-[12px] text-fg-3">Fechado</Text>
              )}
            </View>
          );
        })}
      </View>

      {value.length > 1 && (
        <TouchableOpacity onPress={copiarParaTodos} disabled={disabled} hitSlop={8} className="self-start mb-4 ml-1">
          <Text className="font-body-semibold text-[12px] text-plum">
            Usar o horário de {DIAS_LONGOS[ordenar(value)[0].diaSemana].toLowerCase()} em todos os dias
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={editando !== null} transparent animationType="fade" onRequestClose={() => setEditando(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View className="bg-background rounded-t-rd-lg px-6 pt-4 pb-8" style={{ maxHeight: '60%' }}>
            <View className="flex-row items-center mb-3">
              <Text className="flex-1 font-aux-bold text-[16px] text-ink">
                {editando
                  ? `${editando.campo === 'abre' ? 'Abertura' : 'Fechamento'} · ${DIAS_LONGOS[editando.dia]}`
                  : ''}
              </Text>
              <TouchableOpacity onPress={() => setEditando(null)} hitSlop={8} accessibilityLabel="Fechar">
                <X size={22} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {opcoes.map((o) => (
                  <FilterChip
                    key={o}
                    label={o}
                    active={atual?.[editando!.campo] === o}
                    onPress={() => editando && definirHora(editando.dia, editando.campo, o)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BotaoHora({
  hora,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  hora: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className="bg-background rounded-rd-xs px-3 py-1.5"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text className="font-body-semibold text-[13px] text-ink">{hora}</Text>
    </TouchableOpacity>
  );
}
