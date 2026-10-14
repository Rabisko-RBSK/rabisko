import React from 'react';
import { Text, View } from 'react-native';

import { StatusPill } from './Chip';
import { ContratoDTO } from '../../services/api/artistService';
import { STATUS_LABELS, formatarContrato, formatarPeriodo } from '../../utils/contrato';

/**
 * Resumo de um contrato: condições, observações, status e datas.
 * `children` fica no rodapé do card (ex.: botões de aceitar/recusar).
 */
export function ContratoCard({
  contrato,
  children,
}: {
  contrato: ContratoDTO;
  children?: React.ReactNode;
}) {
  const destaque = contrato.status === 'ativo' || contrato.status === 'proposto';

  return (
    <View className="bg-surface-2 rounded-rd-lg p-4 mb-3">
      <View className="flex-row items-start mb-1" style={{ gap: 8 }}>
        <Text className="flex-1 font-body-semibold text-[15px] text-ink">
          {formatarContrato(contrato)}
        </Text>
        <StatusPill label={STATUS_LABELS[contrato.status]} tone={destaque ? 'plum' : 'ink'} />
      </View>
      <Text className="font-body text-[12px] text-fg-3">{formatarPeriodo(contrato)}</Text>
      {contrato.observacoes ? (
        <Text className="font-body text-[13px] text-fg-2 mt-2">{contrato.observacoes}</Text>
      ) : null}
      {children ? <View className="mt-4">{children}</View> : null}
    </View>
  );
}
