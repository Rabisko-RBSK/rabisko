import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/common/Button';
import { FilterChip } from '../../components/common/Chip';
import { Input } from '../../components/common/Input';
import {
  ContratoInput,
  ContratoModelo,
  ContratoPeriodicidade,
} from '../../services/api/artistService';
import { MODELO_LABELS, PERIODICIDADE_LABELS, formatarContrato } from '../../utils/contrato';

const MODELOS = Object.keys(MODELO_LABELS) as ContratoModelo[];
const PERIODICIDADES = Object.keys(PERIODICIDADE_LABELS) as ContratoPeriodicidade[];

const AJUDA: Record<ContratoModelo, string> = {
  comissao: 'O estúdio fica com esse percentual do valor bruto de cada trabalho.',
  aluguel: 'O tatuador paga esse valor ao estúdio e fica com 100% dos trabalhos.',
  salario: 'O estúdio paga esse valor ao tatuador e fica com a receita dos trabalhos.',
};

/** "40,5" -> 40.5; vazio ou inválido -> null. */
function paraNumero(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function percentualValido(n: number | null): n is number {
  return n != null && n >= 0 && n <= 100;
}

function valorValido(n: number | null): n is number {
  return n != null && n > 0;
}

const duasCasas = (n: number) => Math.round(n * 100) / 100;

/**
 * Monta o corpo enviado ao backend só com os campos do modelo escolhido
 * (o backend recusa, por exemplo, comissão com valorFixo). null = inválido.
 */
function montarInput(
  modelo: ContratoModelo,
  percentual: string,
  valor: string,
  periodicidade: ContratoPeriodicidade,
  observacoes: string,
): ContratoInput | null {
  const obs = observacoes.trim() || undefined;

  if (modelo === 'comissao') {
    const p = paraNumero(percentual);
    if (!percentualValido(p)) return null;
    return { modelo, percentualEstudio: duasCasas(p), observacoes: obs };
  }

  const v = paraNumero(valor);
  if (!valorValido(v)) return null;
  return { modelo, valorFixo: duasCasas(v), periodicidade, observacoes: obs };
}

interface Props {
  visible: boolean;
  titulo: string;
  enviando: boolean;
  textoBotao?: string;
  onClose: () => void;
  onConfirmar: (input: ContratoInput) => void;
}

/**
 * Formulário das condições de contrato (comissão, aluguel ou salário).
 * Não chama a API: entrega o ContratoInput pro pai, que trata os erros —
 * assim serve tanto pro convite quanto pra renegociação.
 */
export function ContratoModal({ visible, titulo, onClose, ...formProps }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-surface">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            {titulo}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={8}
            className="absolute right-4"
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* O Modal desmonta o conteúdo ao fechar, então o formulário volta zerado a cada abertura. */}
        <ContratoForm {...formProps} />
      </SafeAreaView>
    </Modal>
  );
}

function ContratoForm({
  enviando,
  textoBotao = 'Enviar convite',
  onConfirmar,
}: Pick<Props, 'enviando' | 'textoBotao' | 'onConfirmar'>) {
  const [modelo, setModelo] = useState<ContratoModelo>('comissao');
  const [percentual, setPercentual] = useState('');
  const [valor, setValor] = useState('');
  const [periodicidade, setPeriodicidade] = useState<ContratoPeriodicidade>('mensal');
  const [observacoes, setObservacoes] = useState('');

  const input = montarInput(modelo, percentual, valor, periodicidade, observacoes);

  // Só acusa erro depois que o usuário digitou algo.
  const erroPercentual =
    percentual.trim() !== '' && !percentualValido(paraNumero(percentual))
      ? 'Informe um valor entre 0 e 100'
      : undefined;
  const erroValor =
    valor.trim() !== '' && !valorValido(paraNumero(valor)) ? 'Informe um valor maior que zero' : undefined;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-body text-[12px] text-fg-2 mb-2 ml-1">Modelo de contrato</Text>
        <View className="flex-row mb-2" style={{ gap: 8 }}>
          {MODELOS.map((m) => (
            <FilterChip
              key={m}
              label={MODELO_LABELS[m]}
              active={modelo === m}
              onPress={() => setModelo(m)}
            />
          ))}
        </View>
        <Text className="font-body text-[13px] text-fg-2 mb-5 ml-1">{AJUDA[modelo]}</Text>

        {modelo === 'comissao' ? (
          <Input
            label="% do estúdio"
            placeholder="Ex.: 40"
            keyboardType="decimal-pad"
            value={percentual}
            onChangeText={setPercentual}
            error={erroPercentual}
          />
        ) : (
          <>
            <Input
              label="Valor (R$)"
              placeholder="Ex.: 800"
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
              error={erroValor}
            />
            <Text className="font-body text-[12px] text-fg-2 mb-2 ml-1">Periodicidade</Text>
            <View className="flex-row mb-4" style={{ gap: 8 }}>
              {PERIODICIDADES.map((p) => (
                <FilterChip
                  key={p}
                  label={PERIODICIDADE_LABELS[p]}
                  active={periodicidade === p}
                  onPress={() => setPeriodicidade(p)}
                />
              ))}
            </View>
          </>
        )}

        <Input
          label="Observações (opcional)"
          placeholder="Ex.: material incluso, dias de bancada..."
          multiline
          maxLength={500}
          value={observacoes}
          onChangeText={setObservacoes}
        />

        {input && (
          <View className="bg-background rounded-rd-md p-4 mb-5">
            <Text className="font-body text-[12px] text-fg-2 mb-1">Você vai propor</Text>
            <Text className="font-body-semibold text-[15px] text-ink">{formatarContrato(input)}</Text>
          </View>
        )}

        <Button
          title={textoBotao}
          loading={enviando}
          disabled={!input}
          onPress={() => input && onConfirmar(input)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
