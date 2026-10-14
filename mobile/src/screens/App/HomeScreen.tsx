import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Heart,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Compass,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HomeStackParamList } from '../../routes/home.stack';
import { useAuthStore } from '../../store/authStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/Chip';
import { ArtistCard } from '../../components/common/ArtistCard';
import { SuggestionList } from '../../components/common/SuggestionList';
import { useEstilos } from '../../hooks/useEstilos';
import { Estilo } from '../../services/api/estiloService';
import { searchService, ArtistSearchResult } from '../../services/api/searchService';
import { flashService, FlashItem } from '../../services/api/flashService';
import { normalize } from '../../utils/normalize';
import { levenshtein } from '../../utils/levenshtein';

/** Quantidade máxima de sugestões mostradas no dropdown da Home. */
const MAX_SUGGESTIONS = 5;

/** Fotos visuais associadas a cada estilo de tatuagem */
const STYLE_PHOTOS: Record<string, string> = {
  'realismo': 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?q=80&w=400&auto=format&fit=crop',
  'minimalista': 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop',
  'fineline': 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop',
  'aquarela': 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?q=80&w=400&auto=format&fit=crop',
  'blackwork': 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=400&auto=format&fit=crop',
  'old school': 'https://images.unsplash.com/photo-1590246814883-57c511e7afde?q=80&w=400&auto=format&fit=crop',
  'oriental': 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=400&auto=format&fit=crop',
  'oriental/japonês': 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=400&auto=format&fit=crop',
  'tribal': 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?q=80&w=400&auto=format&fit=crop',
  'new school': 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=400&auto=format&fit=crop',
};

function getStylePhoto(nome: string): string {
  const key = nome.toLowerCase().trim();
  return STYLE_PHOTOS[key] || 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?q=80&w=400&auto=format&fit=crop';
}

/** Fotos de perfil dos artistas */
const ARTIST_PHOTOS: Record<string, string> = {
  'Carla Mendes': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  'Diego Fernandes': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  'Filipe Ribeiro': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
  'João Santos': 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=400&auto=format&fit=crop',
  'Marina': 'https://images.unsplash.com/photo-1523783419860-28486a354a3b?q=80&w=400&auto=format&fit=crop',
  'Estúdio Fênix': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop',
  'Pedro': 'https://images.unsplash.com/photo-1753259789341-808371092e19?q=80&w=400&auto=format&fit=crop',
};

function getArtistPhoto(name: string): string {
  return ARTIST_PHOTOS[name] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop';
}

/** Foto de capa para o destaque */
const FEATURED_COVERS: Record<string, string> = {
  'Carla Mendes': 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=800&auto=format&fit=crop',
  'Diego Fernandes': 'https://images.unsplash.com/photo-1590246814883-57c511e7afde?q=80&w=800&auto=format&fit=crop',
  'Filipe Ribeiro': 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=800&auto=format&fit=crop',
  'João Santos': 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=800&auto=format&fit=crop',
};

function getFeaturedCover(name: string): string {
  return FEATURED_COVERS[name] || 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=800&auto=format&fit=crop';
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
      {action && onAction && (
        <TouchableOpacity hitSlop={8} onPress={onAction}>
          <Text className="font-body-semibold text-[12px] text-fg-2">{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StyleTile({
  label,
  photo,
  onPress,
}: {
  label: string;
  photo: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="mr-3" style={{ width: 96 }}>
      <View className="rounded-rd-lg overflow-hidden bg-surface" style={{ width: 96, height: 128 }}>
        <Image source={{ uri: photo }} className="w-full h-full" />
      </View>
      <Text className="font-body-medium text-[12px] text-ink mt-2 text-center" numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FlashCard({
  title,
  price,
  photo,
  onPress,
}: {
  title: string;
  price: string;
  photo: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="mr-3" style={{ width: 168 }}>
      <View className="rounded-rd-lg overflow-hidden bg-surface" style={{ width: 168, height: 168 }}>
        <Image source={{ uri: photo }} className="w-full h-full" />
      </View>
      <Text className="font-body-semibold text-[14px] text-ink mt-2" numberOfLines={1}>
        {title}
      </Text>
      <Text className="font-body text-[12px] text-fg-2">{price}</Text>
    </TouchableOpacity>
  );
}

function FavoriteTile({
  name,
  photo,
  onPress,
}: {
  name: string;
  photo: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="mr-3 items-center" style={{ width: 72 }}>
      <View className="relative">
        <View className="rounded-rd-pill overflow-hidden bg-surface" style={{ width: 72, height: 72 }}>
          <Image source={{ uri: photo }} className="w-full h-full" />
        </View>
        <View className="absolute -top-1 -right-1 w-6 h-6 rounded-rd-pill bg-paper items-center justify-center">
          <Heart size={12} color="#602C66" fill="#602C66" />
        </View>
      </View>
      <Text className="font-body text-[12px] text-ink mt-2 text-center" numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

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

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { favorites, isFavorite, toggleFavorite } = useFavoritesStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Estilos reais do backend
  const { estilos, loading: loadingEstilos, error: errorEstilos } = useEstilos();

  // Artistas gerais para Destaque
  const [allArtists, setAllArtists] = useState<ArtistSearchResult[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [errorArtists, setErrorArtists] = useState<string | null>(null);

  // Artistas próximos (Perto de Você)
  const [nearArtists, setNearArtists] = useState<ArtistSearchResult[]>([]);
  const [loadingNear, setLoadingNear] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [errorNear, setErrorNear] = useState<string | null>(null);

  // Flashes do dia
  const [flashes, setFlashes] = useState<FlashItem[]>([]);
  const [loadingFlashes, setLoadingFlashes] = useState(true);

  // 1. Carregar artistas para o destaque
  const carregarDestaques = useCallback(async () => {
    setLoadingArtists(true);
    setErrorArtists(null);
    try {
      const data = await searchService.buscarArtistas({});
      setAllArtists(data);
    } catch (err: any) {
      console.warn('[Home] erro ao carregar artistas para destaque', err);
      setErrorArtists('Não foi possível carregar os artistas.');
    } finally {
      setLoadingArtists(false);
    }
  }, []);

  // 2. Carregar artistas próximos pela localização
  const carregarProximos = useCallback(async () => {
    setLoadingNear(true);
    setErrorNear(null);
    setLocationDenied(false);

    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setLocationDenied(true);
        setLoadingNear(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const data = await searchService.buscarArtistas({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        raioKm: 25,
      });

      setNearArtists(data);
    } catch (err: any) {
      console.warn('[Home] erro ao obter localização ou buscar próximos', err);
      setErrorNear('Não foi possível carregar os artistas próximos.');
    } finally {
      setLoadingNear(false);
    }
  }, []);

  // 3. Carregar flashes do dia
  const carregarFlashes = useCallback(async () => {
    setLoadingFlashes(true);
    try {
      const data = await flashService.listarHoje();
      setFlashes(data);
    } catch (err: any) {
      console.warn('[Home] erro ao carregar flashes', err);
    } finally {
      setLoadingFlashes(false);
    }
  }, []);

  useEffect(() => {
    carregarDestaques();
    carregarProximos();
    carregarFlashes();
  }, [carregarDestaques, carregarProximos, carregarFlashes]);

  // Sugestões de busca ranqueadas
  const suggestions = useMemo(
    () => rankSuggestions(searchQuery, estilos),
    [searchQuery, estilos],
  );

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) {
      navigation.navigate('SearchResults', undefined);
      return;
    }
    const estiloExato = estilos.find((e) => normalize(e.nome) === normalize(q));
    if (estiloExato) {
      navigation.navigate('SearchResults', { estilo: estiloExato.nome });
    } else {
      navigation.navigate('SearchResults', { termo: q });
    }
  };

  const handleSuggestionPress = (estilo: Estilo) => {
    setSearchQuery('');
    navigation.navigate('SearchResults', { estilo: estilo.nome });
  };

  const featuredArtist = allArtists[0] ?? null;
  const firstName = (user?.name?.split(' ')[0] ?? 'VOCÊ').toUpperCase();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 96,
        }}
      >
        {/* Header Superior — Saudação e Localização (Notificações removido) */}
        <View className="px-6 mb-5">
          <Text className="font-body-semibold text-[12px] text-fg-3 tracking-[1.5px]">
            OLÁ, {firstName}
          </Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color="#6B6B6B" style={{ marginRight: 4 }} />
            <Text className="font-body text-[12px] text-fg-2">São Paulo, SP</Text>
          </View>
        </View>

        {/* Título Principal */}
        <View className="px-6 mb-6">
          <Text className="font-display text-[64px] leading-[60px] text-ink">ARTISTAS</Text>
          <View className="flex-row items-baseline ml-1">
            <Text className="font-body-italic text-[28px] leading-[32px] text-plum lowercase mr-3">
              perto de
            </Text>
            <Text className="font-display text-[64px] leading-[70px] text-ink">VOCÊ</Text>
          </View>
        </View>

        {/* Pesquisa */}
        <View className="px-6">
          <Input
            placeholder="Buscar por estilo ou nome..."
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

        {/* 1. Em Destaque */}
        <SectionHeader title="Em destaque" />
        <View className="px-6">
          {loadingArtists ? (
            <View className="h-44 bg-surface rounded-rd-xl items-center justify-center">
              <ActivityIndicator color="#602C66" />
            </View>
          ) : errorArtists ? (
            <View className="p-4 bg-surface-2 rounded-rd-lg items-center">
              <Text className="font-body text-[13px] text-fg-2">{errorArtists}</Text>
              <TouchableOpacity onPress={carregarDestaques} className="mt-2">
                <Text className="font-body-bold text-[12px] text-plum">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : featuredArtist ? (
            <Animated.View entering={FadeInDown.duration(400).springify()}>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() =>
                  navigation.navigate('EstablishmentProfile', { id: featuredArtist.tatuadorId })
                }
                className="rounded-rd-xl overflow-hidden bg-ink"
                style={{ aspectRatio: 16 / 11 }}
              >
                <Image
                  source={{ uri: getFeaturedCover(featuredArtist.nome) }}
                  className="w-full h-full opacity-80"
                />
                <View className="absolute inset-0 p-5 justify-between">
                  <View className="self-start">
                    <StatusPill label="BOOST" tone="plum" />
                  </View>
                  <View>
                    <Text className="font-display text-[32px] text-on-ink leading-[34px]">
                      {featuredArtist.nome.toUpperCase()}
                    </Text>
                    <Text className="font-body text-[14px] text-on-ink mt-1" numberOfLines={1}>
                      {featuredArtist.endereco ?? featuredArtist.email}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="font-body-bold text-[12px] text-plum-tint mr-1">VER PERFIL</Text>
                      <ChevronRight size={14} color="#F5EBE1" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View className="p-6 bg-surface rounded-rd-lg items-center">
              <Text className="font-body text-[13px] text-fg-2 text-center">
                Nenhum artista disponível para destaque no momento.
              </Text>
            </View>
          )}
        </View>

        {/* 2. Favoritos */}
        <SectionHeader
          title="Favoritos"
          action="Ver tudo"
          onAction={() => navigation.navigate('Favorites')}
        />
        {favorites.length === 0 ? (
          <View className="mx-6 p-5 bg-surface rounded-rd-lg items-center">
            <Heart size={20} color="#602C66" style={{ marginBottom: 6 }} />
            <Text className="font-body text-[13px] text-fg-2 text-center leading-[18px]">
              Você ainda não favoritou nenhum tatuador. Toque no coração dos cards para salvá-los aqui!
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {favorites.map((fav) => (
              <FavoriteTile
                key={fav.id}
                name={fav.name}
                photo={fav.photo || getArtistPhoto(fav.name)}
                onPress={() => navigation.navigate('EstablishmentProfile', { id: fav.id })}
              />
            ))}
          </ScrollView>
        )}

        {/* 3. Por Estilo */}
        <SectionHeader
          title="Por estilo"
          action="Ver tudo"
          onAction={() => navigation.navigate('SearchResults', undefined)}
        />
        {loadingEstilos ? (
          <View className="h-28 items-center justify-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : errorEstilos ? (
          <View className="mx-6 p-4 bg-surface rounded-rd-lg items-center">
            <Text className="font-body text-[13px] text-fg-2">{errorEstilos}</Text>
          </View>
        ) : estilos.length === 0 ? (
          <View className="mx-6 p-4 bg-surface rounded-rd-lg items-center">
            <Text className="font-body text-[13px] text-fg-2">Nenhum estilo encontrado.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {estilos.map((s) => (
              <StyleTile
                key={s.estiloId}
                label={s.nome}
                photo={getStylePhoto(s.nome)}
                onPress={() => navigation.navigate('SearchResults', { estilo: s.nome })}
              />
            ))}
          </ScrollView>
        )}

        {/* 4. Flash do Dia */}
        <View className="flex-row items-end justify-between px-6 mb-3 mt-8">
          <View className="flex-row items-center">
            <Text className="font-aux-bold text-[20px] text-ink mr-2">Flash do dia</Text>
            <StatusPill label="HOJE" tone="plum" />
          </View>
          <TouchableOpacity
            hitSlop={8}
            onPress={() => navigation.navigate('SearchResults', undefined)}
          >
            <Text className="font-body-semibold text-[12px] text-fg-2">Ver tudo</Text>
          </TouchableOpacity>
        </View>
        {loadingFlashes ? (
          <View className="h-32 items-center justify-center">
            <ActivityIndicator color="#602C66" />
          </View>
        ) : (
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
                onPress={() => {
                  if (allArtists[0]) {
                    navigation.navigate('EstablishmentProfile', { id: allArtists[0].tatuadorId });
                  }
                }}
              />
            ))}
          </ScrollView>
        )}

        {/* 5. Novidade — Simulação de Tatuagem */}
        <View className="px-6 mt-8">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.getParent()?.navigate('Simulador')}
            className="flex-row items-center bg-plum-tint rounded-rd-lg p-5"
            accessibilityRole="button"
            accessibilityLabel="Abrir simulação de tatuagem"
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

        {/* 6. Perto de Você */}
        <SectionHeader title="Perto de você" />
        <View className="px-6">
          {loadingNear ? (
            <View className="h-32 items-center justify-center">
              <ActivityIndicator color="#602C66" />
            </View>
          ) : locationDenied ? (
            <View className="p-5 bg-surface rounded-rd-lg items-center">
              <AlertCircle size={24} color="#602C66" style={{ marginBottom: 6 }} />
              <Text className="font-aux-bold text-[16px] text-ink mb-1 text-center">
                Permissão de localização necessária
              </Text>
              <Text className="font-body text-[13px] text-fg-2 text-center leading-[18px] mb-4">
                Para encontrar tatuadores perto de você, habilite o acesso à localização do aparelho.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('SearchResults', undefined)}
                className="bg-ink rounded-rd-pill px-5 py-2.5 flex-row items-center"
              >
                <Compass size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="font-body-semibold text-[13px] text-white">Buscar manualmente</Text>
              </TouchableOpacity>
            </View>
          ) : errorNear ? (
            <View className="p-4 bg-surface rounded-rd-lg items-center">
              <Text className="font-body text-[13px] text-fg-2">{errorNear}</Text>
              <TouchableOpacity onPress={carregarProximos} className="mt-2">
                <Text className="font-body-bold text-[12px] text-plum">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : nearArtists.length === 0 ? (
            <View className="p-5 bg-surface rounded-rd-lg items-center">
              <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
                Nenhum tatuador encontrado próximo à sua região no momento.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('SearchResults', undefined)}
                className="bg-ink rounded-rd-pill px-5 py-2.5"
              >
                <Text className="font-body-semibold text-[13px] text-white">Ver todos os artistas</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {nearArtists.map((a, i) => (
                <Animated.View
                  key={a.tatuadorId}
                  entering={FadeInDown.delay(i * 60).duration(400).springify()}
                  style={{ width: '47.5%' }}
                >
                  <ArtistCard
                    name={a.nome}
                    rating="5,0"
                    photo={getArtistPhoto(a.nome)}
                    tags={a.endereco ? [a.endereco.split(',')[0]] : []}
                    favorited={isFavorite(a.tatuadorId)}
                    onToggleFavorite={() =>
                      toggleFavorite({
                        id: a.tatuadorId,
                        name: a.nome,
                        photo: getArtistPhoto(a.nome),
                        endereco: a.endereco,
                      })
                    }
                    onPress={() =>
                      navigation.navigate('EstablishmentProfile', { id: a.tatuadorId })
                    }
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
