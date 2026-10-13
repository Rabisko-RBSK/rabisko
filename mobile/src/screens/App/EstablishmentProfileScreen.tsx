import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Heart, Star, UserRound } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { StatusPill } from '../../components/common/Chip';
import { HomeStackParamList } from '../../routes/home.stack';
import { chatService } from '../../services/api';
import { artistService, ArtistProfile } from '../../services/api/artistService';
import { avaliacaoService, Avaliacao } from '../../services/api/avaliacaoService';
import { useFavoriteStore } from '../../store/favoriteStore';
import { tempoRelativo } from '../../utils/datas';

type ProfileRoute = RouteProp<HomeStackParamList, 'EstablishmentProfile'>;

function ReviewCard({ avaliacao }: { avaliacao: Avaliacao }) {
  const iniciais = avaliacao.remetenteNome
    ? avaliacao.remetenteNome.trim().slice(0, 2).toUpperCase()
    : 'CL';

  return (
    <View className="bg-surface-2 rounded-rd-lg p-4 mb-3">
      <View className="flex-row items-center mb-2">
        <View className="w-9 h-9 rounded-rd-pill bg-ink items-center justify-center mr-3">
          <Text className="font-body-bold text-[12px] text-on-ink">{iniciais}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-body-semibold text-[14px] text-ink">{avaliacao.remetenteNome}</Text>
          <Text className="font-body text-[11px] text-fg-3">{tempoRelativo(avaliacao.dataCriacao)}</Text>
        </View>
        <View className="flex-row" style={{ gap: 2 }}>
          {Array.from({ length: avaliacao.nota }).map((_, i) => (
            <Star key={i} size={12} color="#000000" fill="#000000" />
          ))}
        </View>
      </View>
      {avaliacao.comentario ? (
        <Text className="font-body text-[13px] text-fg-2 leading-[18px]">{avaliacao.comentario}</Text>
      ) : null}
    </View>
  );
}

export function EstablishmentProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<ProfileRoute>();
  const artistId = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<Partial<ArtistProfile> | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [iniciandoConversa, setIniciandoConversa] = useState(false);

  const isFavorited = useFavoriteStore((s) => (artistId ? s.isFavorite(artistId) : false));
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const carregarPerfil = useCallback(async () => {
    if (!artistId) {
      setError('Artista não encontrado.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [perfilRes, avaliacoesRes] = await Promise.all([
        artistService.obterPerfilPublico(artistId),
        avaliacaoService.listarPorTatuador(artistId).catch(() => []),
      ]);
      setArtist(perfilRes);
      setAvaliacoes(avaliacoesRes);
    } catch (e: any) {
      console.warn('[EstablishmentProfile] erro ao carregar:', e);
      setError('Não foi possível carregar os dados deste artista.');
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  const handleToggleFavorite = () => {
    if (!artistId) return;
    toggleFavorite({
      id: artistId,
      name: artist?.nome || 'Artista',
      photo: artist?.fotoUrl,
      rating: avaliacoes.length > 0 ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1) : undefined,
    });
  };

  async function iniciarConversa() {
    if (iniciandoConversa || !artistId) return;
    setIniciandoConversa(true);
    try {
      const chat = await chatService.abrirChat(artistId);
      navigation.navigate('ChatThread', {
        chatId: chat.chatId,
        outroNome: chat.outroUsuarioNome || artist?.nome || 'Artista',
        outroUsuarioId: chat.outroUsuarioId || artistId,
      });
    } catch (e) {
      console.error('Erro ao abrir chat', e);
      Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
    } finally {
      setIniciandoConversa(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <Header onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#602C66" />
        </View>
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View className="flex-1 bg-background">
        <Header onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-body text-[14px] text-fg-2 text-center mb-4">{error || 'Artista indisponível'}</Text>
          <Button title="Tentar de novo" onPress={carregarPerfil} />
        </View>
      </View>
    );
  }

  const nomeArtista = artist.nome || 'Artista';
  const handleInstagram = artist.instagram ? `@${artist.instagram.replace(/^@+/, '')}` : null;
  const notaMedia = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1).replace('.', ',')
    : null;

  return (
    <View className="flex-1 bg-background">
      <Header
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={handleToggleFavorite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              size={24}
              color={isFavorited ? '#602C66' : '#000000'}
              fill={isFavorited ? '#602C66' : 'transparent'}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      >
        <View className="items-center mt-2 mb-6">
          <View
            className="rounded-rd-pill overflow-hidden bg-surface mb-3 items-center justify-center"
            style={{ width: 120, height: 120 }}
          >
            {artist.fotoUrl ? (
              <Image source={{ uri: artist.fotoUrl }} className="w-full h-full" />
            ) : (
              <UserRound size={60} color="#6B6B6B" strokeWidth={1.5} />
            )}
          </View>

          {artist.nomeEstudio ? (
            <StatusPill label={artist.nomeEstudio} tone="plum" />
          ) : (
            <StatusPill label="TATUADOR" tone="ink" />
          )}

          {notaMedia ? (
            <View className="flex-row items-center mt-2">
              <Text className="font-body-semibold text-[14px] text-ink mr-1">{notaMedia}</Text>
              <Star size={14} color="#000000" fill="#000000" />
            </View>
          ) : (
            <Text className="font-body text-[12px] text-fg-3 mt-1.5">Novo no Rabisko</Text>
          )}

          <Text className="font-aux-bold text-[32px] leading-[36px] text-ink mt-2 text-center">
            {nomeArtista}
          </Text>
        </View>

        <View className="bg-surface rounded-rd-lg p-5 mb-8">
          <Text className="font-aux-bold text-[16px] text-ink mb-2">Sobre</Text>
          <Text className="font-body text-[14px] text-fg-2 leading-[20px] mb-3">
            {artist.bio || 'Tatuador profissional disponível no Rabisko para orçamentos e agendamentos.'}
          </Text>
          {handleInstagram && (
            <Text className="font-body text-[13px] text-plum">{handleInstagram}</Text>
          )}
        </View>

        <View className="flex-row items-end justify-between mb-3">
          <Text className="font-aux-bold text-[20px] text-ink">Portfólio</Text>
        </View>
        {artist.portfolio && artist.portfolio.length > 0 ? (
          <View className="flex-row flex-wrap mb-8" style={{ gap: 12 }}>
            {artist.portfolio.map((img) => (
              <View key={img.imagemId} className="rounded-rd-xl overflow-hidden bg-surface" style={{ width: '47%', aspectRatio: 1 }}>
                <Image source={{ uri: img.url }} className="w-full h-full" />
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surface rounded-rd-lg p-5 items-center mb-8">
            <Text className="font-body text-[13px] text-fg-3 text-center">Nenhum trabalho no portfólio ainda.</Text>
          </View>
        )}

        <Text className="font-aux-bold text-[20px] text-ink mb-3">Avaliações</Text>
        {avaliacoes.length === 0 ? (
          <View className="bg-surface rounded-rd-lg p-5 items-center mb-6">
            <Text className="font-body text-[13px] text-fg-3 text-center">Sem avaliações ainda.</Text>
          </View>
        ) : (
          avaliacoes.map((r) => <ReviewCard key={r.avaliacaoId} avaliacao={r} />)
        )}
      </ScrollView>

      <View
        className="absolute left-0 right-0 bottom-0 bg-background pt-3 px-6 flex-row"
        style={{ paddingBottom: 24, gap: 10 }}
      >
        <Button
          title="Reservar"
          variant="outline"
          className="flex-1 px-5"
          onPress={() => navigation.navigate('BookingFlow', { id: artistId! })}
        />
        <Button
          title={iniciandoConversa ? 'Abrindo…' : 'Chat'}
          className="flex-1 px-5"
          onPress={iniciarConversa}
        />
      </View>
    </View>
  );
}
