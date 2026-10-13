import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Heart,
  Sparkles,
  ChevronRight,
  MapPinOff,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';

import { HomeStackParamList } from '../../routes/home.stack';
import { useAuthStore } from '../../store/authStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/Chip';
import { ArtistCard } from '../../components/common/ArtistCard';
import { SuggestionList } from '../../components/common/SuggestionList';
import { useEstilos } from '../../hooks/useEstilos';
import { Estilo } from '../../services/api/estiloService';
import { searchService, ArtistSearchResult } from '../../services/api/searchService';
import { flashService, FlashItem } from '../../services/api/flashService';
import { FlashDetailModal } from './FlashDetailModal';
import { normalize } from '../../utils/normalize';
import { levenshtein } from '../../utils/levenshtein';

/** Quantidade máxima de sugestões mostradas no dropdown da Home. */
const MAX_SUGGESTIONS = 5;

/**
 * Ranqueia estilos pela query: prefixo (rank 0) > substring (1) >
 * Levenshtein próximo (2).
 */
function rankSuggestions(query: string, catalogo: Estilo[]): Estilo[] {
  const q = normalize(query);
  if (q.length === 0) return [];
  const limiteLeve = Math.max(2, Math.floor(q.length / 3));

  type Ranked = { estilo: Estilo; rank: number; distance: number };
  const ranked: Ranked[] = [];
  for (const estilo of catalogo) {
    const nome = normalize(estilo.nome);
    if (nome.startsWith(q)) {
      ranked.push({ estilo, rank: 0, distance: 0 });
    } else if (nome.includes(q)) {
      ranked.push({ estilo, rank: 1, distance: 0 });
    } else {
      const d = levenshtein(q, nome);
      if (d <= limiteLeve) {
        ranked.push({ estilo, rank: 2, distance: d });
      }
    }
  }
  ranked.sort((a, b) => a.rank - b.rank || a.distance - b.distance);
  return ranked.slice(0, MAX_SUGGESTIONS).map((r) => r.estilo);
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-end justify-between px-6 mb-3 mt-8">
      <Text className="font-aux-bold text-[20px] text-ink">{title}</Text>
      {action && (
        <TouchableOpacity hitSlop={8} onPress={onAction}>
          <Text className="font-body-semibold text-[12px] text-fg-2">{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function FlashCard({
  title,
  price,
  photo,
  onPress,
}: {
  title: string;
  price: string | number;
  photo: string;
  onPress: () => void;
}) {
  const precoFormatado = typeof price === 'number'
    ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : price;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="mr-3" style={{ width: 168 }}>
      <View className="rounded-rd-lg overflow-hidden bg-surface" style={{ width: 168, height: 168 }}>
        <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
      </View>
      <Text className="font-body-semibold text-[14px] text-ink mt-2" numberOfLines={1}>
        {title}
      </Text>
      <Text className="font-body text-[12px] text-fg-2">{precoFormatado}</Text>
    </TouchableOpacity>
  );
}

function FavoriteTile({
  name,
  photo,
  onPress,
}: {
  name: string;
  photo?: string | null;
  onPress: () => void;
}) {
  const iniciais = name.trim().slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} className="mr-3 items-center" style={{ width: 72 }}>
      <View className="relative">
        <View className="rounded-rd-pill overflow-hidden bg-surface items-center justify-center" style={{ width: 72, height: 72 }}>
          {photo ? (
            <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-ink items-center justify-center">
              <Text className="font-body-bold text-[16px] text-on-ink">{iniciais}</Text>
            </View>
          )}
        </View>
        <View className="absolute -top-1 -right-1 w-6 h-6 rounded-rd-pill bg-paper items-center justify-center border border-hairline">
          <Heart size={12} color="#602C66" fill="#602C66" />
        </View>
      </View>
      <Text className="font-body text-[12px] text-ink mt-2 text-center" numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // Favoritos
  const favorites = useFavoriteStore((s) => s.favorites);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const isFavorite = useFavoriteStore((s) => s.isFavorite);

  // Busca e estilos
  const [searchQuery, setSearchQuery] = useState('');
  const { estilos, loading: estilosLoading } = useEstilos();
  const [estiloSelecionado, setEstiloSelecionado] = useState<string | null>(null);

  // Artistas por estilo
  const [artistasPorEstilo, setArtistasPorEstilo] = useState<ArtistSearchResult[]>([]);
  const [loadingPorEstilo, setLoadingPorEstilo] = useState(false);
  const [erroPorEstilo, setErroPorEstilo] = useState<string | null>(null);

  // Artistas em destaque
  const [featuredArtists, setFeaturedArtists] = useState<ArtistSearchResult[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Flash do dia
  const [flashes, setFlashes] = useState<FlashItem[]>([]);
  const [loadingFlashes, setLoadingFlashes] = useState(true);
  const [selectedFlash, setSelectedFlash] = useState<FlashItem | null>(null);

  // Localização e "Perto de você"
  const [localizacaoPermissao, setLocalizacaoPermissao] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cidadeTexto, setCidadeTexto] = useState('Localizando...');
  const [artistasPerto, setArtistasPerto] = useState<ArtistSearchResult[]>([]);
  const [loadingPerto, setLoadingPerto] = useState(false);
  const [erroPerto, setErroPerto] = useState<string | null>(null);

  // 1. Sugestões de busca
  const suggestions = useMemo(
    () => rankSuggestions(searchQuery, estilos),
    [searchQuery, estilos],
  );

  const handleSearchSubmit = () => {
    const estilo = searchQuery.trim() || undefined;
    navigation.navigate('SearchResults', estilo ? { estilo } : undefined);
  };

  const handleSuggestionPress = (estilo: Estilo) => {
    setSearchQuery('');
    navigation.navigate('SearchResults', { estilo: estilo.nome });
  };

  // 2. Carregar Artistas em Destaque (dados reais do backend)
  const carregarDestaques = useCallback(async () => {
    setLoadingFeatured(true);
    try {
      const data = await searchService.buscarArtistas({});
      setFeaturedArtists(data);
    } catch (e) {
      console.warn('[HomeScreen] erro ao carregar artistas em destaque', e);
      setFeaturedArtists([]);
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  // 3. Carregar Flashes do Dia
  const carregarFlashes = useCallback(async () => {
    setLoadingFlashes(true);
    try {
      const data = await flashService.listarFlashesDoDia();
      setFlashes(data);
    } catch {
      setFlashes([]);
    } finally {
      setLoadingFlashes(false);
    }
  }, []);

  // 4. Carregar Artistas por Estilo
  const carregarArtistasPorEstilo = useCallback(async (nomeEstilo: string) => {
    setLoadingPorEstilo(true);
    setErroPorEstilo(null);
    try {
      const data = await searchService.buscarArtistas({ estilo: [nomeEstilo] });
      setArtistasPorEstilo(data);
    } catch (e) {
      console.warn('[HomeScreen] erro ao carregar artistas por estilo', e);
      setErroPorEstilo('Não foi possível carregar os artistas deste estilo.');
      setArtistasPorEstilo([]);
    } finally {
      setLoadingPorEstilo(false);
    }
  }, []);

  // Selecionar primeiro estilo assim que a lista de estilos carregar
  useEffect(() => {
    if (estilos.length > 0 && !estiloSelecionado) {
      const primeiro = estilos[0].nome;
      setEstiloSelecionado(primeiro);
      carregarArtistasPorEstilo(primeiro);
    }
  }, [estilos, estiloSelecionado, carregarArtistasPorEstilo]);

  const handleSelectEstilo = (nome: string) => {
    setEstiloSelecionado(nome);
    carregarArtistasPorEstilo(nome);
  };

  // 5. Carregar "Perto de Você" com geolocalização real
  const obterLocalizacaoEArtistas = useCallback(async (solicitarPermissao = false) => {
    setLoadingPerto(true);
    setErroPerto(null);
    try {
      let status = (await Location.getForegroundPermissionsAsync()).status;
      if (status !== 'granted' && solicitarPermissao) {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        setLocalizacaoPermissao('denied');
        setCidadeTexto('Localização não informada');
        setArtistasPerto([]);
        setLoadingPerto(false);
        return;
      }

      setLocalizacaoPermissao('granted');
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Tenta obter o nome da cidade real via geocodificação reversa
      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (geo) {
          const cidade = geo.subregion || geo.city || geo.region || 'Sua localização';
          const uf = geo.regionCode || geo.region || '';
          setCidadeTexto(`${cidade}${uf ? `, ${uf}` : ''}`);
        }
      } catch {
        setCidadeTexto('Próximo a você');
      }

      const data = await searchService.buscarArtistas({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        raioKm: 25,
      });
      setArtistasPerto(data);
    } catch (e: any) {
      console.warn('[HomeScreen] erro ao carregar artistas perto', e);
      setErroPerto('Não foi possível obter sua localização ou buscar artistas próximos.');
      setArtistasPerto([]);
    } finally {
      setLoadingPerto(false);
    }
  }, []);

  useEffect(() => {
    carregarDestaques();
    carregarFlashes();
    obterLocalizacaoEArtistas(false);
  }, [carregarDestaques, carregarFlashes, obterLocalizacaoEArtistas]);

  const firstName = (user?.name?.split(' ')[0] ?? 'VOCÊ').toUpperCase();
  const featuredArtist = featuredArtists.length > 0 ? featuredArtists[0] : null;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 96,
        }}
      >
        {/* Cabeçalho sem o sino de notificações */}
        <View className="flex-row items-start justify-between px-6 mb-5">
          <View className="flex-1">
            <Text className="font-body-semibold text-[12px] text-fg-3 tracking-[1.5px]">
              OLÁ, {firstName}
            </Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#6B6B6B" style={{ marginRight: 4 }} />
              <Text className="font-body text-[12px] text-fg-2">{cidadeTexto}</Text>
            </View>
          </View>
        </View>

        {/* Hero Title */}
        <View className="px-6 mb-6">
          <Text className="font-display text-[64px] leading-[60px] text-ink">ARTISTAS</Text>
          <View className="flex-row items-baseline ml-1">
            <Text className="font-body-italic text-[28px] leading-[32px] text-plum lowercase mr-3">
              perto de
            </Text>
            <Text className="font-display text-[64px] leading-[70px] text-ink">VOCÊ</Text>
          </View>
        </View>

        {/* Input de Pesquisa com Auto-sugestões */}
        <View className="px-6">
          <Input
            placeholder="Realismo, Aquarela, Blackwork..."
            icon={Search}
            trailingIcon={SlidersHorizontal}
            autoCapitalize="none"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            onTrailingPress={handleSearchSubmit}
          />
          {suggestions.length > 0 && (
            <View className="-mt-2 mb-2">
              <SuggestionList suggestions={suggestions} onSelect={handleSuggestionPress} />
            </View>
          )}
        </View>

        {/* Seção: Em Destaque */}
        <SectionHeader title="Em destaque" />
        <Animated.View entering={FadeInDown.duration(400).springify()} className="px-6">
          {loadingFeatured ? (
            <View className="rounded-rd-xl bg-surface items-center justify-center p-8" style={{ aspectRatio: 16 / 11 }}>
              <ActivityIndicator color="#602C66" />
              <Text className="font-body text-[13px] text-fg-3 mt-2">Carregando destaques...</Text>
            </View>
          ) : featuredArtist ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => navigation.navigate('EstablishmentProfile', { id: featuredArtist.tatuadorId })}
              className="rounded-rd-xl overflow-hidden bg-ink justify-between p-5"
              style={{ aspectRatio: 16 / 11 }}
            >
              <View className="self-start">
                <StatusPill label="BOOST" tone="plum" />
              </View>
              <View>
                <Text className="font-display text-[32px] text-on-ink leading-[34px]">
                  {featuredArtist.nome.toUpperCase()}
                </Text>
                <Text className="font-body text-[14px] text-on-ink mt-1">
                  {featuredArtist.endereco || 'Tatuador profissional verificado'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="rounded-rd-xl bg-surface-2 items-center justify-center p-6">
              <Text className="font-body text-[13px] text-fg-3">Nenhum artista em destaque no momento.</Text>
            </View>
          )}
        </Animated.View>

        {/* Seção: Favoritos */}
        <SectionHeader
          title="Favoritos"
          action={favorites.length > 0 ? 'Ver tudo' : undefined}
          onAction={() => navigation.navigate('Favorites')}
        />
        {favorites.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {favorites.map((fav) => (
              <FavoriteTile
                key={fav.id}
                name={fav.name}
                photo={fav.photo}
                onPress={() => navigation.navigate('EstablishmentProfile', { id: fav.id })}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="mx-6 p-4 rounded-rd-lg bg-surface-2 items-center">
            <Heart size={20} color="#602C66" style={{ marginBottom: 6 }} />
            <Text className="font-body text-[13px] text-fg-2 text-center">
              Você ainda não favoritou nenhum artista.
            </Text>
            <Text className="font-body text-[11px] text-fg-3 text-center mt-0.5">
              Toque no coração de um perfil para salvar como favorito.
            </Text>
          </View>
        )}

        {/* Seção: Por Estilo */}
        <SectionHeader
          title="Por estilo"
          action="Buscar mais"
          onAction={() => navigation.navigate('SearchResults', estiloSelecionado ? { estilo: estiloSelecionado } : undefined)}
        />
        {estilosLoading ? (
          <View className="py-4 items-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
          >
            {estilos.map((estilo) => {
              const ativo = estiloSelecionado === estilo.nome;
              return (
                <TouchableOpacity
                  key={estilo.estiloId}
                  activeOpacity={0.8}
                  onPress={() => handleSelectEstilo(estilo.nome)}
                  className={`mr-2.5 px-4 py-2.5 rounded-rd-pill border ${
                    ativo ? 'bg-plum border-plum' : 'bg-surface border-hairline'
                  }`}
                >
                  <Text className={`font-body-semibold text-[13px] ${ativo ? 'text-white' : 'text-ink'}`}>
                    {estilo.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Resultados de artistas pelo estilo selecionado */}
        <View className="px-6 mt-3">
          {loadingPorEstilo ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#602C66" />
              <Text className="font-body text-[12px] text-fg-3 mt-2">Buscando artistas...</Text>
            </View>
          ) : erroPorEstilo ? (
            <Text className="font-body text-[13px] text-fg-3 text-center py-4">{erroPorEstilo}</Text>
          ) : artistasPorEstilo.length === 0 ? (
            <View className="bg-surface-2 rounded-rd-lg p-4 items-center">
              <Text className="font-body text-[13px] text-fg-3 text-center">
                Nenhum tatuador encontrado para o estilo {estiloSelecionado}.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {artistasPorEstilo.map((item) => (
                <View key={item.tatuadorId} style={{ width: 160 }}>
                  <ArtistCard
                    name={item.nome}
                    rating="—"
                    tags={estiloSelecionado ? [estiloSelecionado] : []}
                    favorited={isFavorite(item.tatuadorId)}
                    onToggleFavorite={() =>
                      toggleFavorite({
                        id: item.tatuadorId,
                        name: item.nome,
                        tags: estiloSelecionado ? [estiloSelecionado] : [],
                      })
                    }
                    onPress={() => navigation.navigate('EstablishmentProfile', { id: item.tatuadorId })}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Seção: Flash do Dia */}
        <View className="flex-row items-end justify-between px-6 mb-3 mt-8">
          <View className="flex-row items-center">
            <Text className="font-aux-bold text-[20px] text-ink mr-2">Flash do dia</Text>
            <StatusPill label="HOJE" tone="plum" />
          </View>
        </View>

        {loadingFlashes ? (
          <View className="py-6 items-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : flashes.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {flashes.map((f) => (
              <FlashCard
                key={f.id}
                title={f.title}
                price={f.price}
                photo={f.photo}
                onPress={() => setSelectedFlash(f)}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="mx-6 p-5 rounded-rd-lg bg-surface-2 items-center">
            <Text className="font-aux-bold text-[15px] text-ink mb-1 text-center">
              Nenhum flash do dia disponível hoje
            </Text>
            <Text className="font-body text-[12px] text-fg-3 text-center leading-[18px]">
              Fique de olho! Novos desenhos com preços promocionais são adicionados pelos artistas com frequência.
            </Text>
          </View>
        )}

        {/* Banner: Novidade -> Redireciona para o Simulador de Tatuagem */}
        <View className="px-6 mt-8">
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => (navigation.getParent() as any)?.navigate('Simulador')}
            className="flex-row items-center bg-plum-tint rounded-rd-lg p-5"
          >
            <View className="w-12 h-12 rounded-rd-pill bg-plum items-center justify-center mr-4">
              <Sparkles size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="font-body-bold text-[11px] text-plum tracking-[1.5px]">NOVIDADE</Text>
              <Text className="font-body-semibold text-[15px] text-ink mt-0.5">
                Veja como a tatuagem fica em você
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="font-body-bold text-[12px] text-plum mr-1">ABRIR</Text>
              <ChevronRight size={16} color="#602C66" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Seção: Perto de Você */}
        <SectionHeader
          title="Perto de você"
          action={localizacaoPermissao === 'granted' ? 'Atualizar' : undefined}
          onAction={() => obterLocalizacaoEArtistas(true)}
        />

        {loadingPerto ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#602C66" />
            <Text className="font-body text-[13px] text-fg-3 mt-2">Buscando artistas na sua região...</Text>
          </View>
        ) : localizacaoPermissao === 'denied' ? (
          <View className="mx-6 p-5 rounded-rd-lg bg-surface-2 items-center">
            <MapPinOff size={28} color="#602C66" style={{ marginBottom: 8 }} />
            <Text className="font-aux-bold text-[16px] text-ink text-center mb-1">
              Localização necessária
            </Text>
            <Text className="font-body text-[13px] text-fg-2 text-center mb-4 leading-[18px]">
              Para listar tatuadores próximos a você, autorize a localização do dispositivo ou faça uma busca manual.
            </Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => obterLocalizacaoEArtistas(true)}
                activeOpacity={0.85}
                className="bg-plum px-4 py-2.5 rounded-rd-md"
              >
                <Text className="font-body-bold text-[13px] text-white">Ativar localização</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('SearchResults', undefined)}
                activeOpacity={0.85}
                className="bg-surface px-4 py-2.5 rounded-rd-md border border-hairline"
              >
                <Text className="font-body-semibold text-[13px] text-ink">Busca manual</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : erroPerto ? (
          <View className="mx-6 p-5 rounded-rd-lg bg-surface-2 items-center">
            <Text className="font-body text-[13px] text-fg-2 text-center mb-3">{erroPerto}</Text>
            <TouchableOpacity
              onPress={() => obterLocalizacaoEArtistas(true)}
              className="bg-ink px-4 py-2 rounded-rd-md"
            >
              <Text className="font-body-bold text-[12px] text-on-ink">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : artistasPerto.length === 0 ? (
          <View className="mx-6 p-5 rounded-rd-lg bg-surface-2 items-center">
            <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
              Nenhum tatuador encontrado no raio de 25 km da sua localização.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchResults', undefined)}
              className="bg-ink px-4 py-2 rounded-rd-md"
            >
              <Text className="font-body-bold text-[12px] text-on-ink">Ver todos os artistas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-6 flex-row flex-wrap" style={{ gap: 12 }}>
            {artistasPerto.map((a, i) => (
              <Animated.View
                key={a.tatuadorId}
                entering={FadeInDown.delay(i * 60).duration(400).springify()}
                style={{ width: '47.5%' }}
              >
                <ArtistCard
                  name={a.nome}
                  rating="—"
                  tags={[]}
                  favorited={isFavorite(a.tatuadorId)}
                  onToggleFavorite={() =>
                    toggleFavorite({
                      id: a.tatuadorId,
                      name: a.nome,
                      address: a.endereco,
                    })
                  }
                  onPress={() => navigation.navigate('EstablishmentProfile', { id: a.tatuadorId })}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalhes do Flash */}
      <FlashDetailModal
        visible={!!selectedFlash}
        flash={selectedFlash}
        onClose={() => setSelectedFlash(null)}
        onSelectArtist={(artistId) => navigation.navigate('EstablishmentProfile', { id: artistId })}
      />
    </View>
  );
}
