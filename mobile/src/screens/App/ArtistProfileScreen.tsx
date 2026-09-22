import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, Check, Pencil, Star, UserRound } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { PortfolioCarousel } from '../../components/common/PortfolioCarousel';
import { ArtistProfileStackParamList } from '../../routes/artist-profile.stack';
import { useAuthStore } from '../../store/authStore';
import { useArtistProfile } from '../../hooks/useArtistProfile';
import { useAvaliacoes } from '../../hooks/useAvaliacoes';
import { Avaliacao } from '../../services/api/avaliacaoService';
import { artistService } from '../../services/api/artistService';
import { tempoRelativo } from '../../utils/datas';
import { escolherImagemDaGaleria } from '../../utils/imagePicker';

/**
 * Perfil do tatuador na visão do PRÓPRIO tatuador (#04 do catálogo, DESIGN.md
 * §10). É a aba "Perfil" do fluxo do artista. O mesmo perfil visto pelo
 * cliente é outra tela — EstablishmentProfileScreen, no HomeStack.
 *
 * Tudo vem do banco:
 *  - nome, foto, "Sobre" e portfólio via `useArtistProfile` → GET /artist/me;
 *  - avaliações via `useAvaliacoes` → GET /artist/{id}/avaliacoes.
 * Sem foto cadastrada, cai num avatar anônimo padrão. Cada seção trata os
 * estados de loading / erro / vazio por conta própria.
 *
 * Modo de edição (botão lápis no canto superior direito): permite alterar
 * a foto de perfil e a bio. Salva via `PATCH /artist/me` (precedido por
 * upload em `POST /artist/me/foto` quando a foto muda).
 */


const BIO_MAX = 300;


function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatNota(nota: number): string {
  return nota.toFixed(1).replace('.', ',');
}

/** Normaliza o handle do Instagram pra exibir sempre com um único "@". */
function formatHandle(instagram: string): string {
  return `@${instagram.trim().replace(/^@+/, '')}`;
}


/** Foto de perfil circular */
function ProfilePhoto({ uri }: { uri: string | null }) {
  return (
    <View className="w-full h-full rounded-rd-pill overflow-hidden bg-surface items-center justify-center">
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" />
      ) : (
        <UserRound size={56} color="#6B6B6B" strokeWidth={1.5} />
      )}
    </View>
  );
}

/** Selo de nível do tatuador (Bronze/Prata/Ouro), sobreposto à base da foto.
 *  Sistema de tiers ainda fora do DESIGN.md e do banco — só renderiza quando
 *  o backend mandar um valor (ver `ArtistProfile.tier`). */
function TierBadge({ tier }: { tier: string }) {
  return (
    <View className="bg-surface-2 border border-hairline rounded-rd-pill px-3 py-1">
      <Text
        className="font-body-semibold text-[10px] text-fg-2"
        style={{ letterSpacing: 0.5 }}
      >
        {tier}
      </Text>
    </View>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-ink rounded-rd-md px-5 py-2.5"
      accessibilityRole="button"
      accessibilityLabel="Tentar de novo"
    >
      <Text className="font-body-bold text-[13px] text-on-ink">Tentar de novo</Text>
    </TouchableOpacity>
  );
}

/** Cartão de erro de carregamento com retry. */
function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-5 items-center">
      <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
        {message}
      </Text>
      <RetryButton onPress={onRetry} />
    </View>
  );
}

function SectionHeader({
  title,
  count,
  actionLabel,
  onAction,
}: {
  title: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-end justify-between px-6 mb-3 mt-8">
      <View className="flex-row items-baseline">
        <Text className="font-aux-bold text-[20px] text-ink">{title}</Text>
        {count != null && (
          <Text className="font-body text-[13px] text-fg-3 ml-2">{count}</Text>
        )}
      </View>
      {actionLabel && (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="font-body-semibold text-[12px] text-fg-2">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Cinco estrelas com `value` preenchidas (o resto em contorno). */
function StarRow({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          color="#000000"
          fill={i < value ? '#000000' : 'transparent'}
        />
      ))}
    </View>
  );
}

function ReviewCard({ avaliacao }: { avaliacao: Avaliacao }) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-4 mb-3">
      <View className="flex-row items-center mb-2">
        <View className="w-9 h-9 rounded-rd-pill bg-ink items-center justify-center mr-3">
          <Text className="font-body-bold text-[12px] text-on-ink">
            {iniciais(avaliacao.remetenteNome)}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            className="font-body-semibold text-[14px] text-ink"
            numberOfLines={1}
          >
            {avaliacao.remetenteNome}
          </Text>
          <Text className="font-body text-[11px] text-fg-3">
            {tempoRelativo(avaliacao.dataCriacao)}
          </Text>
        </View>
        <StarRow value={avaliacao.nota} />
      </View>
      {avaliacao.comentario ? (
        <Text className="font-body text-[13px] text-fg-2 leading-[18px]">
          {avaliacao.comentario}
        </Text>
      ) : null}
    </View>
  );
}


type ArtistProfileNav = NativeStackNavigationProp<
  ArtistProfileStackParamList,
  'ArtistProfile'
>;
type ArtistProfileRoute = RouteProp<
  ArtistProfileStackParamList,
  'ArtistProfile'
>;

export function ArtistProfileScreen() {
  const navigation = useNavigation<ArtistProfileNav>();
  const route = useRoute<ArtistProfileRoute>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useArtistProfile();

  const tatuadorId = route.params?.tatuadorId ?? profile?.tatuadorId;
  const {
    avaliacoes,
    loading: avaliacoesLoading,
    error: avaliacoesError,
    notaMedia,
    total,
    reload: reloadAvaliacoes,
  } = useAvaliacoes(tatuadorId);

  const primeiroFoco = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }
      reloadProfile();
    }, [reloadProfile]),
  );


  const [editing, setEditing] = useState(false);
  const [editingBio, setEditingBio] = useState('');
  const [editingFotoUri, setEditingFotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const houveAlteracao =
    editing &&
    (editingBio !== (profile?.bio ?? '') || editingFotoUri !== null);

  const iniciarEdicao = () => {
    setEditingBio(profile?.bio ?? '');
    setEditingFotoUri(null);
    setEditing(true);
  };

  const sairDaEdicao = () => {
    setEditing(false);
    setEditingBio('');
    setEditingFotoUri(null);
  };

  const cancelarEdicao = () => {
    if (!houveAlteracao) {
      sairDaEdicao();
      return;
    }
    Alert.alert(
      'Descartar alterações?',
      'Você tem mudanças que ainda não foram salvas.',
      [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: sairDaEdicao },
      ],
    );
  };

  const escolherFoto = async () => {
    if (saving) return;
    const uri = await escolherImagemDaGaleria({ quadrada: true });
    if (uri) setEditingFotoUri(uri);
  };

  const salvarEdicao = async () => {
    if (saving) return;
    setSaving(true);
    try {
      let novaFotoUrl: string | undefined;
      if (editingFotoUri) {
        novaFotoUrl = await artistService.enviarFotoPerfil(editingFotoUri);
      }

      const payload: { bio?: string | null; fotoUrl?: string | null } = {};
      const bioNormalizada = editingBio.trim();
      if (bioNormalizada !== (profile?.bio ?? '')) {
        payload.bio = bioNormalizada.length ? bioNormalizada : null;
      }
      if (novaFotoUrl !== undefined) {
        payload.fotoUrl = novaFotoUrl;
      }
      if (Object.keys(payload).length > 0) {
        await artistService.atualizarMeuPerfil(payload);
      }

      await reloadProfile();
      sairDaEdicao();
    } catch (err: any) {
      console.warn(
        '[ArtistProfile] erro ao salvar edição',
        err?.response?.status,
        err?.message,
      );
      Alert.alert(
        'Erro ao salvar',
        'Não foi possível salvar suas alterações. Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  };


  const displayName = profile?.nome ?? user?.name ?? '—';
  const bio = profile?.bio?.trim();
  const portfolio = profile?.portfolio ?? [];
  const profileReady = !profileLoading && !profileError;
  const fotoUri = editing
    ? (editingFotoUri ?? profile?.fotoUrl ?? null)
    : (profile?.fotoUrl ?? null);

  const ratingText =
    total > 0 && notaMedia != null ? formatNota(notaMedia) : '—';

  const abrirPortfolioCompleto = () =>
    navigation.navigate('Portfolio', {
      artistName: displayName,
      images: portfolio,
    });


  const renderHeaderRight = () => {
    if (editing) {
      if (saving) return <ActivityIndicator color="#602C66" />;
      return (
        <TouchableOpacity
          onPress={salvarEdicao}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Salvar alterações"
        >
          <Check size={26} color="#602C66" strokeWidth={2.5} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        onPress={iniciarEdicao}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Editar perfil"
        disabled={!profileReady}
        style={{ opacity: profileReady ? 1 : 0.4 }}
      >
        <Pencil size={22} color="#000000" />
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="PERFIL"
        onBack={
          editing
            ? cancelarEdicao
            : navigation.canGoBack()
              ? () => navigation.goBack()
              : undefined
        }
        right={renderHeaderRight()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mt-2 px-6">
          <View style={{ width: 120, height: 120 }} className="mb-6">
            {editing ? (
              <TouchableOpacity
                onPress={escolherFoto}
                activeOpacity={0.85}
                disabled={saving}
                className="w-full h-full"
                accessibilityRole="button"
                accessibilityLabel="Trocar foto de perfil"
              >
                <ProfilePhoto uri={fotoUri} />
                <View
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-rd-pill bg-ink items-center justify-center"
                  style={{
                    borderWidth: 2,
                    borderColor: '#F8F9FA',
                  }}
                >
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ) : (
              <>
                <ProfilePhoto uri={fotoUri} />
                {profile?.tier ? (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -10,
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                    }}
                  >
                    <TierBadge tier={profile.tier} />
                  </View>
                ) : null}
              </>
            )}
          </View>

          <Text className="font-aux-bold text-[32px] leading-[36px] text-ink text-center">
            {displayName}
          </Text>

          {profile?.instagram ? (
            <Text className="font-body text-[14px] text-fg-2 mt-1">
              {formatHandle(profile.instagram)}
            </Text>
          ) : null}

          <View className="flex-row items-center mt-1.5" style={{ gap: 5 }}>
            <Text className="font-body-semibold text-[14px] text-ink">
              {ratingText}
            </Text>
            <Star size={14} color="#000000" fill="#000000" />
          </View>
        </View>

        <View className="px-6 mt-7">
          <View className="bg-surface rounded-rd-lg p-5">
            <Text className="font-aux-bold text-[16px] text-ink mb-2">Sobre</Text>
            {editing ? (
              <>
                <TextInput
                  value={editingBio}
                  onChangeText={(t) =>
                    setEditingBio(t.slice(0, BIO_MAX))
                  }
                  multiline
                  placeholder="Conte um pouco sobre você e seu trabalho..."
                  placeholderTextColor="#6B6B6B"
                  maxLength={BIO_MAX}
                  editable={!saving}
                  className="font-body text-[14px] text-fg-2 leading-[20px]"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
                <Text className="font-body text-[11px] text-fg-3 mt-2 text-right">
                  {editingBio.length}/{BIO_MAX}
                </Text>
              </>
            ) : profileLoading ? (
              <View className="py-3 items-center">
                <ActivityIndicator color="#602C66" />
              </View>
            ) : profileError ? (
              <View className="items-center py-1">
                <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
                  {profileError}
                </Text>
                <RetryButton onPress={reloadProfile} />
              </View>
            ) : (
              <>
                <Text
                  className={`font-body text-[14px] leading-[20px] ${
                    bio ? 'text-fg-2' : 'text-fg-3'
                  }`}
                >
                  {bio ||
                    'Você ainda não adicionou uma descrição sobre o seu trabalho.'}
                </Text>
              </>
            )}
          </View>
        </View>

        <SectionHeader
          title="Portfólio"
          actionLabel={
            !editing && profileReady
              ? portfolio.length > 0
                ? 'Ver Todos'
                : 'Gerenciar'
              : undefined
          }
          onAction={abrirPortfolioCompleto}
        />
        {profileLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : profileError ? (
          <View className="px-6">
            <LoadError
              message="Não foi possível carregar o portfólio."
              onRetry={reloadProfile}
            />
          </View>
        ) : (
          <PortfolioCarousel
            images={portfolio}
            onImagePress={editing ? undefined : abrirPortfolioCompleto}
          />
        )}

        <SectionHeader
          title="Avaliações"
          count={total > 0 ? total : undefined}
        />
        <View className="px-6">
          {avaliacoesLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#602C66" />
            </View>
          ) : avaliacoesError ? (
            <LoadError message={avaliacoesError} onRetry={reloadAvaliacoes} />
          ) : avaliacoes.length === 0 ? (
            <View className="bg-surface-2 rounded-rd-lg p-6 items-center">
              <Text className="font-aux-bold text-[15px] text-ink mb-1 text-center">
                Sem avaliações ainda
              </Text>
              <Text className="font-body text-[13px] text-fg-3 text-center leading-[18px]">
                As avaliações dos seus clientes aparecem aqui depois das
                sessões.
              </Text>
            </View>
          ) : (
            avaliacoes.map((a) => <ReviewCard key={a.avaliacaoId} avaliacao={a} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}
