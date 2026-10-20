import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Heart, Star, MapPin, Mail } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { StatusPill } from '../../components/common/Chip';
import { HorarioFuncionamentoView } from '../../components/common/HorarioFuncionamentoView';
import { HomeStackParamList } from '../../routes/home.stack';
import { chatService } from '../../services/api';
import { artistService } from '../../services/api/artistService';
import { searchService, ArtistSearchResult } from '../../services/api/searchService';
import type { HorarioDia } from '../../utils/horarios';
import { useFavoritesStore } from '../../store/favoritesStore';

type ProfileRoute = RouteProp<HomeStackParamList, 'EstablishmentProfile'>;

export function EstablishmentProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<ProfileRoute>();
  const artistId = route.params?.id;

  const [artistData, setArtistData] = useState<ArtistSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [iniciandoConversa, setIniciandoConversa] = useState(false);
  /** null = ainda carregando ou falhou (o bloco não aparece); [] = não informado. */
  const [horarios, setHorarios] = useState<HorarioDia[] | null>(null);

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = artistId ? isFavorite(artistId) : false;

  useEffect(() => {
    let active = true;
    async function carregar() {
      if (!artistId) {
        setLoading(false);
        return;
      }
      try {
        const list = await searchService.buscarArtistas({});
        if (!active) return;
        const found = list.find((a) => a.tatuadorId === artistId);
        if (found) {
          setArtistData(found);
        } else {
          // Se não encontrou na lista padrão, monta o dado com o id recebido
          setArtistData({
            tatuadorId: artistId,
            nome: 'Tatuador',
            email: '',
            endereco: null,
          });
        }
      } catch (err) {
        console.warn('[EstablishmentProfile] erro ao carregar artista', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    carregar();
    return () => {
      active = false;
    };
  }, [artistId]);

  useEffect(() => {
    if (!artistId) return;
    let active = true;
    artistService
      .obterHorarios(artistId)
      .then((h) => active && setHorarios(h))
      .catch((err) => console.warn('[EstablishmentProfile] erro ao carregar horários', err));
    return () => {
      active = false;
    };
  }, [artistId]);

  const displayName = artistData?.nome ?? 'Tatuador';

  async function iniciarConversa() {
    if (!artistId || iniciandoConversa) return;
    setIniciandoConversa(true);
    try {
      const chat = await chatService.abrirChat(artistId);
      navigation.navigate('ChatThread', {
        chatId: chat.chatId,
        outroNome: chat.outroUsuarioNome,
        outroUsuarioId: chat.outroUsuarioId,
      });
    } catch (e) {
      console.error('Erro ao abrir chat', e);
      Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
    } finally {
      setIniciandoConversa(false);
    }
  }

  const handleToggleFavorite = () => {
    if (!artistId) return;
    toggleFavorite({
      id: artistId,
      name: displayName,
      rating: '5,0',
      endereco: artistData?.endereco,
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#602C66" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={handleToggleFavorite}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              size={24}
              color={favorited ? '#602C66' : '#000000'}
              fill={favorited ? '#602C66' : 'transparent'}
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
            className="rounded-rd-pill bg-ink items-center justify-center mb-3"
            style={{ width: 110, height: 110 }}
          >
            <Text className="font-display text-[44px] text-white">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <StatusPill label="TATUADOR" tone="ink" />

          <View className="flex-row items-center mt-2">
            <Text className="font-body-semibold text-[14px] text-ink mr-1">5,0</Text>
            <Star size={14} color="#000000" fill="#000000" />
          </View>

          <Text className="font-aux-bold text-[32px] leading-[36px] text-ink mt-2 text-center">
            {displayName}
          </Text>
        </View>

        <View className="bg-surface rounded-rd-lg p-5 mb-8">
          <Text className="font-aux-bold text-[16px] text-ink mb-2">Informações</Text>

          {artistData?.email ? (
            <View className="flex-row items-center mb-2">
              <Mail size={16} color="#404040" style={{ marginRight: 8 }} />
              <Text className="font-body text-[14px] text-fg-2">{artistData.email}</Text>
            </View>
          ) : null}

          {artistData?.endereco ? (
            <View className="flex-row items-start">
              <MapPin size={16} color="#6B6B6B" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="font-body text-[14px] text-fg-3 flex-1">{artistData.endereco}</Text>
            </View>
          ) : (
            <Text className="font-body text-[13px] text-fg-3">Atendimento na região de São Paulo/SP</Text>
          )}

          {horarios ? (
            <View className="mt-3 pt-3 border-t border-hairline">
              <HorarioFuncionamentoView horarios={horarios} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        className="absolute left-0 right-0 bottom-0 bg-background pt-3 px-6"
        style={{ paddingBottom: 24 }}
      >
        <Button
          title={iniciandoConversa ? 'Abrindo…' : 'Iniciar Conversa'}
          onPress={iniciarConversa}
        />
      </View>
    </View>
  );
}
