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
import { useMeusContratos } from '../../hooks/useMeusContratos';
import { ArtistProfileStackParamList } from '../../routes/artist-profile.stack';
import { formatarContrato } from '../../utils/contrato';

/**
 * Contrato do tatuador com o estúdio atual (empilhada no ArtistProfileStack):
 * proposta de renegociação pendente (aceitar/recusar), contrato vigente e
 * histórico. Aceitar encerra o contrato vigente e ativa o proposto.
 */

type MeuContratoRoute = RouteProp<ArtistProfileStackParamList, 'MeuContrato'>;

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

/** 404 = o estúdio retirou a proposta; 409 = o tatuador não está mais no estúdio. */
function mensagemDeErro(err: any, fallback: string): string {
  const status = err?.response?.status;
  if (status === 404) return 'Esta proposta não está mais disponível.';
  if (status === 409) return 'Você não faz mais parte deste estúdio.';
  return fallback;
}

export function MeuContratoScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { estudioId, nomeEstudio } = useRoute<MeuContratoRoute>().params;

  const { ativo, proposta, historico, loading, error, aceitarProposta, recusarProposta, reload } =
    useMeusContratos(estudioId);

  const [respondendo, setRespondendo] = useState(false);

  const responder = async (acao: () => Promise<void>, titulo: string, fallback: string) => {
    setRespondendo(true);
    try {
      await acao();
    } catch (err: any) {
      console.warn('[MeuContrato] erro ao responder proposta', err?.response?.status, err?.message);
      Alert.alert(titulo, mensagemDeErro(err, fallback));
    } finally {
      setRespondendo(false);
    }
  };

  const confirmarAceite = () => {
    if (!proposta) return;
    Alert.alert(
      'Aceitar novas condições?',
      `Passa a valer: ${formatarContrato(proposta)}.` +
        (ativo ? `\n\nO contrato atual (${formatarContrato(ativo)}) será encerrado.` : ''),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: () =>
            responder(aceitarProposta, 'Erro ao aceitar', 'Não foi possível aceitar a proposta. Tente novamente.'),
        },
      ],
    );
  };

  const confirmarRecusa = () => {
    Alert.alert(
      'Recusar proposta?',
      ativo ? 'O contrato atual continua valendo.' : `O ${nomeEstudio} poderá enviar outra proposta.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: () =>
            responder(recusarProposta, 'Erro ao recusar', 'Não foi possível recusar a proposta. Tente novamente.'),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="MEU CONTRATO" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 96 }}
      >
        <Text className="font-body text-[13px] text-fg-3 mt-2">{nomeEstudio}</Text>

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
            {proposta ? (
              <>
                <Secao title="Nova proposta" />
                <ContratoCard contrato={proposta}>
                  <Text className="font-body text-[12px] text-fg-3 mb-3">
                    O {nomeEstudio} propôs novas condições. Elas só passam a valer se você aceitar.
                  </Text>
                  {respondendo ? (
                    <View className="py-2.5 items-center">
                      <ActivityIndicator color="#602C66" />
                    </View>
                  ) : (
                    <View className="flex-row" style={{ gap: 10 }}>
                      <TouchableOpacity
                        onPress={confirmarRecusa}
                        activeOpacity={0.85}
                        className="flex-1 border border-hairline rounded-rd-md py-2.5 items-center"
                        accessibilityRole="button"
                        accessibilityLabel="Recusar proposta"
                      >
                        <Text className="font-body-bold text-[13px] text-ink">Recusar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={confirmarAceite}
                        activeOpacity={0.85}
                        className="flex-1 bg-ink rounded-rd-md py-2.5 items-center"
                        accessibilityRole="button"
                        accessibilityLabel="Aceitar proposta"
                      >
                        <Text className="font-body-bold text-[13px] text-on-ink">Aceitar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ContratoCard>
              </>
            ) : null}

            <Secao title="Contrato vigente" />
            {ativo ? (
              <ContratoCard contrato={ativo} />
            ) : (
              <Aviso texto="Você ainda não tem um contrato registrado com este estúdio." />
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
    </View>
  );
}
