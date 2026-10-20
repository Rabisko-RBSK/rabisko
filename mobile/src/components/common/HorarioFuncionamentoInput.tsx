import React, { useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

import { TimePickerModal } from './TimePickerModal';
import { DIAS, SemanaForm, aplicarATodosAbertos } from '../../utils/horarios';

/**
 * Horário de funcionamento semanal (cadastro do artista e tela de edição).
 *
 * No topo, "Todos os dias" escolhe um horário e o botão o aplica aos dias
 * ABERTOS (dias fechados continuam fechados). Cada dia pode ser ajustado ou
 * fechado individualmente pelo switch.
 */

interface HorarioFuncionamentoInputProps {
  value: SemanaForm;
  onChange: (semana: SemanaForm) => void;
  disabled?: boolean;
  /** Rótulo acima do campo; omitido na tela de edição, que já tem título. */
  label?: string;
}

/** 'todos' = bloco do topo; número = índice do dia em `value`. */
type Alvo = 'todos' | number;

const PLUM = '#602C66';
const HAIRLINE = '#D9D9D9';

export function HorarioFuncionamentoInput({ value, onChange, disabled, label }: HorarioFuncionamentoInputProps) {
  const [todos, setTodos] = useState({ abre: '10:00', fecha: '22:00' });
  const [alvo, setAlvo] = useState<Alvo | null>(null);

  const emEdicao = alvo === 'todos' ? todos : alvo !== null ? value[alvo] : null;
  const tituloSeletor =
    alvo === 'todos' ? 'Todos os dias' : alvo !== null ? DIAS[value[alvo].diaSemana - 1].nomeLongo : '';

  const confirmar = (abre: string, fecha: string) => {
    if (alvo === 'todos') setTodos({ abre, fecha });
    else if (alvo !== null) onChange(value.map((d, i) => (i === alvo ? { ...d, abre, fecha } : d)));
  };

  const alternarDia = (indice: number, aberto: boolean) =>
    onChange(value.map((d, i) => (i === indice ? { ...d, aberto } : d)));

  return (
    <View className="mb-4">
      {label ? <Text className="font-body text-[12px] text-fg-2 mb-2 ml-1">{label}</Text> : null}

      <View className="bg-paper border border-hairline rounded-rd-md overflow-hidden">
        <View className="bg-surface-2 p-4">
          <View className="flex-row items-center mb-3" style={{ gap: 10 }}>
            <Text className="font-body-semibold text-[14px] text-ink flex-1">Todos os dias</Text>
            <FaixaHorario
              abre={todos.abre}
              fecha={todos.fecha}
              rotulo="todos os dias"
              fundoClaro
              disabled={disabled}
              onPress={() => setAlvo('todos')}
            />
          </View>
          <TouchableOpacity
            onPress={() => onChange(aplicarATodosAbertos(value, todos.abre, todos.fecha))}
            disabled={disabled}
            activeOpacity={0.85}
            className={`bg-ink rounded-rd-md py-3 items-center ${disabled ? 'opacity-50' : ''}`}
            accessibilityRole="button"
            accessibilityLabel={`Definir ${todos.abre} às ${todos.fecha} para todos os dias abertos`}
          >
            <Text className="font-body-semibold text-[14px] text-on-ink">Definir horário para todos os dias</Text>
          </TouchableOpacity>
        </View>

        {value.map((dia, i) => {
          const nome = DIAS[dia.diaSemana - 1].nome;
          return (
            <View
              key={dia.diaSemana}
              className="flex-row items-center px-4 py-3 border-t border-hairline"
              style={{ gap: 10 }}
            >
              <Text className="font-body-medium text-[14px] text-ink flex-1">{nome}</Text>
              {dia.aberto ? (
                <FaixaHorario
                  abre={dia.abre}
                  fecha={dia.fecha}
                  rotulo={nome}
                  disabled={disabled}
                  onPress={() => setAlvo(i)}
                />
              ) : (
                <Text className="font-body text-[14px] text-fg-3">Fechado</Text>
              )}
              <Switch
                value={dia.aberto}
                onValueChange={(aberto) => alternarDia(i, aberto)}
                disabled={disabled}
                trackColor={{ false: HAIRLINE, true: PLUM }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={HAIRLINE}
                accessibilityLabel={`${nome}: ${dia.aberto ? 'aberto' : 'fechado'}`}
              />
            </View>
          );
        })}
      </View>

      <TimePickerModal
        visible={alvo !== null}
        titulo={tituloSeletor}
        abre={emEdicao?.abre ?? todos.abre}
        fecha={emEdicao?.fecha ?? todos.fecha}
        onConfirm={confirmar}
        onClose={() => setAlvo(null)}
      />
    </View>
  );
}

/**
 * Dígitos de largura fixa: "09:00" e "10:00" ocupam o mesmo espaço, então as
 * pílulas ficam alinhadas sem precisar de largura fixa (que quebrava a linha).
 */
const HORA_ESTILO = { fontVariant: ['tabular-nums' as const] };

/** Par de pílulas "10:00 – 22:00"; tocar abre o seletor. */
function FaixaHorario({
  abre,
  fecha,
  rotulo,
  fundoClaro,
  disabled,
  onPress,
}: {
  abre: string;
  fecha: string;
  rotulo: string;
  /** Pílula branca com borda (sobre o fundo creme do bloco "Todos os dias"). */
  fundoClaro?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const pilula = `rounded-rd-xs px-2.5 py-1.5 ${fundoClaro ? 'bg-paper border border-hairline' : 'bg-surface-2'}`;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className="flex-row items-center"
      style={{ gap: 6 }}
      accessibilityRole="button"
      accessibilityLabel={`Alterar horário de ${rotulo}: ${abre} às ${fecha}`}
    >
      <View className={pilula}>
        <Text className="font-body-medium text-[14px] text-ink" style={HORA_ESTILO} numberOfLines={1}>
          {abre}
        </Text>
      </View>
      <Text className="font-body text-[14px] text-fg-3">–</Text>
      <View className={pilula}>
        <Text className="font-body-medium text-[14px] text-ink" style={HORA_ESTILO} numberOfLines={1}>
          {fecha}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
