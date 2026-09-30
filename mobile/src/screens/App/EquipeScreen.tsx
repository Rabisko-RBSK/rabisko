import React, { useCallback, useRef } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserPlus, UserRound } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { useColaboradores } from '../../hooks/useColaboradores';
import { useConvitesEstudio } from '../../hooks/useConvitesEstudio';
import { StudioEquipeStackParamList } from '../../routes/studio-equipe.stack';
import { ConviteDetalheDTO } from '../../services/api/artistService';
import { ColaboradorDTO } from '../../services/api/studioService';
import { tempoRelativo } from '../../utils/datas';

/**
 * Equipe do estúdio — primeira aba do fluxo do ESTÚDIO. Lista os tatuadores
 * vinculados (com opção de remover) e os convites pendentes enviados (com
 * opção de cancelar). O botão no header abre a busca para convidar.
 */

/** Normaliza o handle do Instagram pra exibir sempre com um único "@". */
function formatHandle(instagram: string): string {
  return `@${instagram.trim().replace(/^@+/, '')}`;
}

function Avatar({ uri }: { uri: string | null }) {
  return (
    <View className="w-11 h-11 rounded-rd-pill overflow-hidden bg-surface items-center justify-center mr-3">
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" />
      ) : (
        <UserRound size={22} color="#6B6B6B" strokeWidth={1.5} />
      )}
    </View>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View className="flex-row items-baseline mb-3 mt-8">
      <Text className="font-aux-bold text-[20px] text-ink">{title}</Text>
      {count != null && count > 0 && (
        <Text className="font-body text-[13px] text-fg-3 ml-2">{count}</Text>
      )}
    </View>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-5 items-center">
      <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
        {message}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.85}
        className="bg-ink rounded-rd-md px-5 py-2.5"
        accessibilityRole="button"
        accessibilityLabel="Tentar de novo"
      >
        <Text className="font-body-bold text-[13px] text-on-ink">Tentar de novo</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-6 items-center">
      <Text className="font-aux-bold text-[15px] text-ink mb-1 text-center">
        {title}
      </Text>
      <Text className="font-body text-[13px] text-fg-3 text-center leading-[18px]">
        {text}
      </Text>
    </View>
  );
}

/** Linha com avatar, nome, subtítulo e uma ação em texto à direita. */
function PessoaRow({
  fotoUrl,
  nome,
  subtitulo,
  actionLabel,
  accessibilityLabel,
  busy,
  disabled,
  onAction,
}: {
  fotoUrl: string | null;
  nome: string;
  subtitulo: string | null;
  actionLabel: string;
  accessibilityLabel: string;
  busy: boolean;
  disabled: boolean;
  onAction: () => void;
}) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-4 mb-3 flex-row items-center">
      <Avatar uri={fotoUrl} />
      <View className="flex-1">
        <Text className="font-body-semibold text-[15px] text-ink" numberOfLines={1}>
          {nome}
        </Text>
        {subtitulo ? (
          <Text className="font-body text-[12px] text-fg-3" numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {busy ? (
        <ActivityIndicator color="#602C66" />
      ) : (
        <TouchableOpacity
          onPress={onAction}
          disabled={disabled}
          hitSlop={8}
          style={{ opacity: disabled ? 0.4 : 1 }}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Text className="font-body-semibold text-[12px] text-fg-2">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type EquipeNav = NativeStackNavigationProp<StudioEquipeStackParamList, 'Equipe'>;

export function EquipeScreen() {
  const navigation = useNavigation<EquipeNav>();
  const insets = useSafeAreaInsets();

  const {
    colaboradores,
    loading: colaboradoresLoading,
    error: colaboradoresError,
    removendoId,
    remover,
    reload: reloadColaboradores,
  } = useColaboradores();

  const {
    convites,
    loading: convitesLoading,
    error: convitesError,
    cancelandoId,
    cancelar,
    reload: reloadConvites,
  } = useConvitesEstudio();

  // Ao voltar da busca, pode haver convites novos; tatuadores também podem ter
  // aceitado convites enquanto a aba estava em segundo plano.
  const primeiroFoco = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }
      reloadColaboradores();
      reloadConvites();
    }, [reloadColaboradores, reloadConvites]),
  );

  const confirmarRemocao = (colaborador: ColaboradorDTO) => {
    Alert.alert(
      `Remover ${colaborador.nome}?`,
      'O tatuador deixará de fazer parte da equipe. Para voltar, será preciso enviar um novo convite.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await remover(colaborador.tatuadorId);
            } catch (err: any) {
              console.warn(
                '[Equipe] erro ao remover colaborador',
                err?.response?.status,
                err?.message,
              );
              Alert.alert(
                'Erro ao remover',
                err?.response?.status === 404
                  ? 'Este tatuador não faz mais parte da equipe.'
                  : 'Não foi possível remover o colaborador. Tente novamente.',
              );
            }
          },
        },
      ],
    );
  };

  const confirmarCancelamento = (convite: ConviteDetalheDTO) => {
    Alert.alert(
      'Cancelar convite?',
      `${convite.nomeTatuador} não poderá mais aceitar este convite.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar convite',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelar(convite.conviteId);
            } catch (err: any) {
              console.warn(
                '[Equipe] erro ao cancelar convite',
                err?.response?.status,
                err?.message,
              );
              const status = err?.response?.status;
              Alert.alert(
                'Erro ao cancelar',
                status === 409 || status === 404
                  ? 'Este convite já foi respondido pelo tatuador.'
                  : 'Não foi possível cancelar o convite. Tente novamente.',
              );
              // A resposta do tatuador pode ter mudado a equipe também.
              if (status === 409) reloadColaboradores();
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="EQUIPE"
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('ConvidarTatuador')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Convidar tatuador"
          >
            <UserPlus size={24} color="#000000" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 96,
        }}
      >
        <SectionHeader title="Colaboradores" count={colaboradores.length} />
        {colaboradoresLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : colaboradoresError ? (
          <LoadError message={colaboradoresError} onRetry={reloadColaboradores} />
        ) : colaboradores.length === 0 ? (
          <View>
            <EmptyCard
              title="Sua equipe está vazia"
              text="Convide tatuadores para fazer parte do seu estúdio."
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('ConvidarTatuador')}
              activeOpacity={0.85}
              className="bg-ink rounded-rd-md py-3 items-center mt-3"
              accessibilityRole="button"
              accessibilityLabel="Convidar tatuador"
            >
              <Text className="font-body-bold text-[14px] text-on-ink">
                Convidar tatuador
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          colaboradores.map((c) => (
            <PessoaRow
              key={c.tatuadorId}
              fotoUrl={c.fotoPerfilUrl}
              nome={c.nome}
              subtitulo={c.instagram ? formatHandle(c.instagram) : null}
              actionLabel="Remover"
              accessibilityLabel={`Remover ${c.nome} da equipe`}
              busy={removendoId === c.tatuadorId}
              disabled={removendoId !== null}
              onAction={() => confirmarRemocao(c)}
            />
          ))
        )}

        <SectionHeader title="Convites enviados" count={convites.length} />
        {convitesLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : convitesError ? (
          <LoadError message={convitesError} onRetry={reloadConvites} />
        ) : convites.length === 0 ? (
          <EmptyCard
            title="Nenhum convite pendente"
            text="Os convites que você enviar aparecem aqui até o tatuador responder."
          />
        ) : (
          convites.map((c) => (
            <PessoaRow
              key={c.conviteId}
              fotoUrl={c.fotoTatuadorUrl}
              nome={c.nomeTatuador}
              subtitulo={`Enviado · ${tempoRelativo(c.dataCriacao)}`}
              actionLabel="Cancelar"
              accessibilityLabel={`Cancelar convite de ${c.nomeTatuador}`}
              busy={cancelandoId === c.conviteId}
              disabled={cancelandoId !== null}
              onAction={() => confirmarCancelamento(c)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
