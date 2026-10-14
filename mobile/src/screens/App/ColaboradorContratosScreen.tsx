import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { ContratoCard } from '../../components/common/ContratoCard';
import { useContratosColaborador } from '../../hooks/useContratosColaborador';
import { StudioEquipeStackParamList } from '../../routes/studio-equipe.stack';
import { ContratoInput } from '../../services/api/artistService';
import { ContratoModal } from './ContratoModal';

/**
 * Contratos do estúdio com um colaborador (empilhada no StudioEquipeStack):
 * contrato vigente, proposta de renegociação pendente e histórico. A proposta
 * só passa a valer quando o tatuador aceita; até lá o contrato atual continua.
 */

type ColaboradorContratosRoute = RouteProp<StudioEquipeStackParamList, 'ColaboradorContratos'>;

function Secao({ title }: { title: string }) {
  return (
    <Text className="font-aux-bold text-[16px] text-ink mt-6 mb-3">{title}</Text>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-4 mb-3">
      <Text className="font-body text-[13px] text-fg-3 leading-[18px]">{texto}</Text>
    </View>
  );
}

export function ColaboradorContratosScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { tatuadorId, nome } = useRoute<ColaboradorContratosRoute>().params;
  const primeiroNome = nome.split(' ')[0];

  const { ativo, proposta, historico, loading, error, propor, retirarProposta, reload } =
    useContratosColaborador(tatuadorId);

  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [retirando, setRetirando] = useState(false);

  const enviarProposta = async (input: ContratoInput) => {
    setEnviando(true);
    try {
      await propor(input);
      setModalAberto(false);
    } catch (err: any) {
      console.warn('[ColaboradorContratos] erro ao propor', err?.response?.status, err?.message);
      const status = err?.response?.status;
      if (status === 409) {
        setModalAberto(false);
        Alert.alert('Proposta não enviada', `Já existe uma proposta pendente para ${primeiroNome}.`);
      } else if (status === 404) {
        setModalAberto(false);
        Alert.alert('Proposta não enviada', `${primeiroNome} não faz mais parte da equipe.`);
        navigation.goBack();
      } else if (status === 400) {
        Alert.alert('Condições inválidas', 'Confira as condições do contrato.');
      } else {
        Alert.alert('Erro ao propor', 'Não foi possível enviar a proposta. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const confirmarRetirada = () => {
    Alert.alert(
      'Retirar proposta?',
      `${primeiroNome} não poderá mais aceitar estas condições. O contrato atual continua valendo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          style: 'destructive',
          onPress: async () => {
            setRetirando(true);
            try {
              await retirarProposta();
            } catch (err: any) {
              console.warn('[ColaboradorContratos] erro ao retirar', err?.response?.status, err?.message);
              Alert.alert(
                'Erro ao retirar',
                err?.response?.status === 404
                  ? `${primeiroNome} já respondeu a esta proposta.`
                  : 'Não foi possível retirar a proposta. Tente novamente.',
              );
            } finally {
              setRetirando(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={nome.toUpperCase()} onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 96 }}
      >
        {loading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : error ? (
          <View className="items-center mt-6">
            <Text className="font-body text-[13px] text-fg-2 text-center mb-3">{error}</Text>
            <TouchableOpacity onPress={reload} hitSlop={8} accessibilityRole="button">
              <Text className="font-body-semibold text-[13px] text-plum">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Secao title="Contrato vigente" />
            {ativo ? (
              <ContratoCard contrato={ativo} />
            ) : (
              <Aviso
                texto={`${primeiroNome} entrou na equipe sem contrato registrado. Proponha as condições para formalizar.`}
              />
            )}

            <Secao title="Nova proposta" />
            {proposta ? (
              <ContratoCard contrato={proposta}>
                <Text className="font-body text-[12px] text-fg-3 mb-3">
                  Aguardando {primeiroNome} aceitar. Até lá, o contrato vigente continua valendo.
                </Text>
                {retirando ? (
                  <ActivityIndicator color="#602C66" />
                ) : (
                  <TouchableOpacity
                    onPress={confirmarRetirada}
                    activeOpacity={0.85}
                    className="border border-hairline rounded-rd-md py-2.5 items-center"
                    accessibilityRole="button"
                    accessibilityLabel="Retirar proposta"
                  >
                    <Text className="font-body-bold text-[13px] text-ink">Retirar proposta</Text>
                  </TouchableOpacity>
                )}
              </ContratoCard>
            ) : (
              <TouchableOpacity
                onPress={() => setModalAberto(true)}
                activeOpacity={0.85}
                className="bg-ink rounded-rd-md py-3 items-center"
                accessibilityRole="button"
                accessibilityLabel={`Propor novas condições para ${nome}`}
              >
                <Text className="font-body-bold text-[14px] text-on-ink">
                  Propor novas condições
                </Text>
              </TouchableOpacity>
            )}

            <Secao title="Histórico" />
            {historico.length === 0 ? (
              <Aviso texto="Nenhum contrato anterior." />
            ) : (
              historico.map((c) => <ContratoCard key={c.contratoId} contrato={c} />)
            )}
          </>
        )}
      </ScrollView>

      <ContratoModal
        visible={modalAberto}
        titulo={`CONDIÇÕES · ${primeiroNome.toUpperCase()}`}
        textoBotao="Enviar proposta"
        enviando={enviando}
        onClose={() => setModalAberto(false)}
        onConfirmar={enviarProposta}
      />
    </View>
  );
}
