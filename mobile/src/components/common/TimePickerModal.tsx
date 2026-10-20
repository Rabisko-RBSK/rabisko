import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './Button';
import { OPCOES_HORARIO } from '../../utils/horarios';

/**
 * Bottom sheet para escolher abertura e fechamento (passos de 30 min).
 * Usado pelo HorarioFuncionamentoInput, no cadastro e na edição do horário.
 */

const ITEM_H = 44;
const VISIVEIS = 5;

interface TimePickerModalProps {
  visible: boolean;
  /** Ex.: "Segunda-feira" ou "Todos os dias". */
  titulo: string;
  abre: string;
  fecha: string;
  onConfirm: (abre: string, fecha: string) => void;
  onClose: () => void;
}

export function TimePickerModal({ visible, ...rest }: TimePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={rest.onClose}>
      {/* Montado só quando visível: o estado do seletor nasce com os valores atuais. */}
      {visible ? <TimePickerSheet {...rest} /> : null}
    </Modal>
  );
}

function TimePickerSheet({
  titulo,
  abre,
  fecha,
  onConfirm,
  onClose,
}: Omit<TimePickerModalProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [novoAbre, setNovoAbre] = useState(abre);
  const [novoFecha, setNovoFecha] = useState(fecha);
  const invalido = novoFecha <= novoAbre;

  return (
    <View className="flex-1 justify-end">
      <Pressable
        className="absolute inset-0 bg-black/40"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar seletor de horário"
      />
      <View className="bg-paper rounded-t-rd-2xl px-6 pt-3" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="items-center mb-4">
          <View className="w-10 h-1 rounded-rd-pill bg-hairline" />
        </View>
        <Text className="font-display text-[32px] leading-[34px] text-ink">{titulo.toUpperCase()}</Text>
        <Text className="font-body text-[14px] text-fg-2 mt-1 mb-4">
          Escolha o horário de abertura e de fechamento.
        </Text>

        <View className="flex-row" style={{ gap: 12 }}>
          <ColunaHorario rotulo="Abre" valor={novoAbre} onChange={setNovoAbre} />
          <ColunaHorario rotulo="Fecha" valor={novoFecha} onChange={setNovoFecha} />
        </View>

        {invalido ? (
          <Text className="font-body text-[12px] text-error mt-3 ml-1">
            O fechamento precisa ser depois da abertura.
          </Text>
        ) : null}

        <Button
          title="Confirmar"
          className="mt-5"
          disabled={invalido}
          onPress={() => {
            onConfirm(novoAbre, novoFecha);
            onClose();
          }}
        />
      </View>
    </View>
  );
}

function ColunaHorario({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const indice = OPCOES_HORARIO.indexOf(valor);

  return (
    <View className="flex-1">
      <Text className="font-body-medium text-[12px] text-fg-2 mb-1.5 ml-1">{rotulo}</Text>
      <View className="bg-surface-2 rounded-rd-md p-2" style={{ height: ITEM_H * VISIVEIS + 16 }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          // Abre com o valor atual no meio da coluna.
          onLayout={() =>
            scrollRef.current?.scrollTo({ y: Math.max(0, (indice - 2) * ITEM_H), animated: false })
          }
        >
          {OPCOES_HORARIO.map((opcao) => {
            const selecionado = opcao === valor;
            return (
              <TouchableOpacity
                key={opcao}
                onPress={() => onChange(opcao)}
                activeOpacity={0.7}
                style={{ height: ITEM_H }}
                className={`items-center justify-center rounded-rd-xs ${selecionado ? 'bg-plum-tint' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: selecionado }}
                accessibilityLabel={`${rotulo} às ${opcao}`}
              >
                <Text
                  className={
                    selecionado
                      ? 'font-body-semibold text-[18px] text-plum'
                      : 'font-body text-[16px] text-fg-3'
                  }
                >
                  {opcao}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
