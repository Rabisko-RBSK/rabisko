import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Store } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { useConvites } from '../../hooks/useConvites';
import { ConviteDetalheDTO } from '../../services/api/artistService';
import { tempoRelativo } from '../../utils/datas';

/**
 * Convites de estúdio recebidos pelo tatuador (empilhada no ArtistProfileStack).
 * Aceitar vincula o tatuador ao estúdio e cancela os outros convites pendentes
 * no backend; ao voltar, o perfil recarrega (useFocusEffect) e mostra o estúdio.
 */

function StudioPhoto({ uri }: { uri: string | null }) {
  return (
    <View className="w-12 h-12 rounded-rd-pill overflow-hidden bg-surface items-center justify-center mr-3">
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" />
      ) : (
        <Store size={22} color="#6B6B6B" strokeWidth={1.5} />
      )}
    </View>
  );
}

function ConviteCard({
  convite,
  respondendo,
  bloqueado,
  onAceitar,
  onRecusar,
}: {
  convite: ConviteDetalheDTO;
  respondendo: boolean;
  bloqueado: boolean;
  onAceitar: () => void;
  onRecusar: () => void;
}) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-4 mb-3">
      <View className="flex-row items-center mb-4">
        <StudioPhoto uri={convite.fotoEstudioUrl} />
        <View className="flex-1">
          <Text
            className="font-body-semibold text-[15px] text-ink"
            numberOfLines={1}
          >
            {convite.nomeEstudio}
          </Text>
          <Text className="font-body text-[12px] text-fg-3">
            {tempoRelativo(convite.dataCriacao)}
          </Text>
        </View>
      </View>

      {respondendo ? (
        <View className="py-2.5 items-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : (
        <View className="flex-row" style={{ gap: 10, opacity: bloqueado ? 0.4 : 1 }}>
          <TouchableOpacity
            onPress={onRecusar}
            disabled={bloqueado}
            activeOpacity={0.85}
            className="flex-1 border border-hairline rounded-rd-md py-2.5 items-center"
            accessibilityRole="button"
            accessibilityLabel={`Recusar convite de ${convite.nomeEstudio}`}
          >
            <Text className="font-body-bold text-[13px] text-ink">Recusar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAceitar}
            disabled={bloqueado}
            activeOpacity={0.85}
            className="flex-1 bg-ink rounded-rd-md py-2.5 items-center"
            accessibilityRole="button"
            accessibilityLabel={`Aceitar convite de ${convite.nomeEstudio}`}
          >
            <Text className="font-body-bold text-[13px] text-on-ink">Aceitar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** Mensagem do backend (ResponseStatusException) ou um fallback genérico. */
function mensagemDeErro(err: any, fallback: string): string {
  const status = err?.response?.status;
  if (status === 409 || status === 404) {
    return 'Este convite não está mais disponível.';
  }
  return fallback;
}

export function ConvitesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { convites, loading, error, respondendoId, aceitar, recusar, reload } =
    useConvites();

  const confirmarAceite = (convite: ConviteDetalheDTO) => {
    const outros = convites.length - 1;
    Alert.alert(
      `Entrar no ${convite.nomeEstudio}?`,
      outros > 0
        ? `Você passará a fazer parte da equipe do estúdio. ${
            outros === 1
              ? 'O outro convite pendente será cancelado.'
              : `Os outros ${outros} convites pendentes serão cancelados.`
          }`
        : 'Você passará a fazer parte da equipe do estúdio.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            try {
              await aceitar(convite.conviteId);
              navigation.goBack();
            } catch (err: any) {
              console.warn(
                '[Convites] erro ao aceitar',
                err?.response?.status,
                err?.message,
              );
              Alert.alert(
                'Erro ao aceitar',
                mensagemDeErro(err, 'Não foi possível aceitar o convite. Tente novamente.'),
              );
            }
          },
        },
      ],
    );
  };

  const confirmarRecusa = (convite: ConviteDetalheDTO) => {
    Alert.alert(
      'Recusar convite?',
      `O ${convite.nomeEstudio} precisará enviar um novo convite caso você mude de ideia.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            try {
              await recusar(convite.conviteId);
            } catch (err: any) {
              console.warn(
                '[Convites] erro ao recusar',
                err?.response?.status,
                err?.message,
              );
              Alert.alert(
                'Erro ao recusar',
                mensagemDeErro(err, 'Não foi possível recusar o convite. Tente novamente.'),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="CONVITES" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 96,
        }}
      >
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : error ? (
          <View className="bg-surface-2 rounded-rd-lg p-5 items-center">
            <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
              {error}
            </Text>
            <TouchableOpacity
              onPress={reload}
              activeOpacity={0.85}
              className="bg-ink rounded-rd-md px-5 py-2.5"
              accessibilityRole="button"
              accessibilityLabel="Tentar de novo"
            >
              <Text className="font-body-bold text-[13px] text-on-ink">
                Tentar de novo
              </Text>
            </TouchableOpacity>
          </View>
        ) : convites.length === 0 ? (
          <View className="bg-surface-2 rounded-rd-lg p-6 items-center">
            <Text className="font-aux-bold text-[15px] text-ink mb-1 text-center">
              Nenhum convite pendente
            </Text>
            <Text className="font-body text-[13px] text-fg-3 text-center leading-[18px]">
              Quando um estúdio convidar você para a equipe, o convite aparece
              aqui.
            </Text>
          </View>
        ) : (
          convites.map((c) => (
            <ConviteCard
              key={c.conviteId}
              convite={c}
              respondendo={respondendoId === c.conviteId}
              bloqueado={respondendoId !== null}
              onAceitar={() => confirmarAceite(c)}
              onRecusar={() => confirmarRecusa(c)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
