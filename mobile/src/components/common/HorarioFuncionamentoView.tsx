import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { HorarioDia, diaSemanaIso, linhasExibicao } from '../../utils/horarios';

/**
 * Horário de funcionamento no perfil público do tatuador: recolhido mostra só
 * "Horário de funcionamento ⌄"; expandido lista a semana com o dia de hoje em
 * negrito.
 */
export function HorarioFuncionamentoView({ horarios }: { horarios: HorarioDia[] }) {
  const [expandido, setExpandido] = useState(false);

  if (horarios.length === 0) {
    return <Text className="font-body text-[14px] text-fg-3">Horário não informado</Text>;
  }

  const hoje = diaSemanaIso(new Date());
  const Chevron = expandido ? ChevronUp : ChevronDown;

  return (
    <View>
      <TouchableOpacity
        onPress={() => setExpandido((v) => !v)}
        activeOpacity={0.7}
        hitSlop={8}
        className="flex-row items-center self-start"
        style={{ gap: 6 }}
        accessibilityRole="button"
        accessibilityState={{ expanded: expandido }}
        accessibilityLabel="Horário de funcionamento"
      >
        <Text className="font-body-semibold text-[14px] text-ink">Horário de funcionamento</Text>
        <Chevron size={18} color="#404040" />
      </TouchableOpacity>

      {expandido ? (
        <View className="mt-3.5" style={{ gap: 12 }}>
          {linhasExibicao(horarios).map((linha) => {
            const destaque = linha.diaSemana === hoje;
            const fechado = linha.texto === 'Fechado';
            return (
              <View key={linha.diaSemana} className="flex-row items-center">
                <Text
                  className={`text-[14px] ${destaque ? 'font-body-semibold text-ink' : 'font-body text-fg-2'}`}
                  style={{ width: 124 }}
                >
                  {linha.dia}
                </Text>
                <Text
                  className={`text-[14px] ${destaque ? 'font-body-semibold' : 'font-body'} ${fechado ? 'text-fg-3' : 'text-ink'}`}
                >
                  {linha.texto}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
