import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  MapPin,
  Search,
  SlidersHorizontal,
  Compass,
  Palette,
  Tag,
  CalendarCheck,
  Heart,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HomeStackParamList } from '../../routes/home.stack';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/common/Input';
import { FilterChip, StatusPill } from '../../components/common/Chip';
import { ArtistCard } from '../../components/common/ArtistCard';
import { SuggestionList } from '../../components/common/SuggestionList';
import { useEstilos } from '../../hooks/useEstilos';
import { Estilo } from '../../services/api/estiloService';
import { normalize } from '../../utils/normalize';
import { levenshtein } from '../../utils/levenshtein';

/** Quantidade maxima de sugestoes mostradas no dropdown da Home. */
const MAX_SUGGESTIONS = 5;

/**
 * Ranqueia estilos pela query: prefixo (rank 0) > substring (1) >
 * Levenshtein proximo (2). Estilos fora desses tres baldes sao
 * descartados. Empate por ranking decide-se por ordem alfabetica
 * (catalogo ja vem ordenado pelo backend).
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

/* ---------- Mock data (P1 Home — replace with real API once `/services/api` is wired) ---------- */

const FILTERS = [
  { id: 'perto', label: 'Perto', icon: Compass },
  { id: 'estilo', label: 'Estilo', icon: Palette },
  { id: 'preco', label: 'Preço', icon: Tag },
  { id: 'disponivel', label: 'Disponível', icon: CalendarCheck },
] as const;

const STYLE_TILES = [
  { id: 'realismo', label: 'Realismo', photo: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?q=80&w=200&auto=format&fit=crop' },
  { id: 'minimalista', label: 'Minimalista', photo: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=200&auto=format&fit=crop' },
  { id: 'aquarela', label: 'Aquarela', photo: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?q=80&w=200&auto=format&fit=crop' },
  { id: 'blackwork', label: 'Blackwork', photo: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=200&auto=format&fit=crop' },
  { id: 'old', label: 'Old School', photo: 'https://images.unsplash.com/photo-1590246814883-57c511e7afde?q=80&w=200&auto=format&fit=crop' },
];

const FLASH_TODAY = [
  { id: 'f1', title: 'Lobo geométrico', price: 'R$ 280', photo: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=400&auto=format&fit=crop' },
  { id: 'f2', title: 'Borboleta minimal', price: 'R$ 180', photo: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop' },
  { id: 'f3', title: 'Cobra tradicional', price: 'R$ 320', photo: 'https://images.unsplash.com/photo-1590246814883-57c511e7afde?q=80&w=400&auto=format&fit=crop' },
];

const FEATURED = {
  id: '1',
  name: 'João Santos',
  tagline: 'Realismo · Premiado',
  rating: 4.9,
  // Homem com tatuagem no braço trabalhando em arte — perfeito pra hero do tatuador.
  photo: 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=800&auto=format&fit=crop',
};

const FAVORITES = [
  // Marina: mulher tatuada (Annie Spratt 2018, retrato clássico).
  { id: 'fav1', name: 'Marina', photo: 'https://images.unsplash.com/photo-1523783419860-28486a354a3b?q=80&w=200&auto=format&fit=crop' },
  { id: 'fav2', name: 'Estúdio Fênix', photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200&auto=format&fit=crop' },
  // Pedro: tatuador preparando o trabalho.
  { id: 'fav3', name: 'Pedro', photo: 'https://images.unsplash.com/photo-1753259789341-808371092e19?q=80&w=200&auto=format&fit=crop' },
];

const NEAR_YOU = [
  {
    id: '1',
    name: 'João Santos',
    rating: 4.9,
    tags: ['Realismo', 'Minimalista'],
    photo: 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Estúdio Fênix',
    rating: 4.8,
    tags: ['Old School'],
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop',
  },
];

/* ---------- Small leaf components ---------- */

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View className="flex-row items-end justify-between px-6 mb-3 mt-8">
      <Text className="font-aux-bold text-[20px] text-ink">{title}</Text>
      {action && (
        <TouchableOpacity hitSlop={8}>
          <Text className="font-body-semibold text-[12px] text-fg-2">{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StyleTile({ label, photo }: { label: string; photo: string }) {
  return (
    <TouchableOpacity activeOpacity={0.85} className="mr-3" style={{ width: 96 }}>
      <View className="rounded-r-lg overflow-hidden bg-surface" style={{ width: 96, height: 128 }}>
        <Image source={{ uri: photo }} className="w-full h-full" />
      </View>
      <Text className="font-body-medium text-[12px] text-ink mt-2 text-center">{label}</Text>
    </TouchableOpacity>
  );
}

function FlashCard({ title, price, photo }: { title: string; price: string; photo: string }) {
  return (
    <TouchableOpacity activeOpacity={0.9} className="mr-3" style={{ width: 168 }}>
      <View className="rounded-r-lg overflow-hidden bg-surface" style={{ width: 168, height: 168 }}>
        <Image source={{ uri: photo }} className="w-full h-full" />
      </View>
      <Text className="font-body-semibold text-[14px] text-ink mt-2" numberOfLines={1}>
        {title}
      </Text>
      <Text className="font-body text-[12px] text-fg-2">{price}</Text>
    </TouchableOpacity>
  );
}

function FavoriteTile({ name, photo }: { name: string; photo: string }) {
  return (
    <TouchableOpacity activeOpacity={0.85} className="mr-3 items-center" style={{ width: 72 }}>
      <View className="relative">
        <View className="rounded-r-pill overflow-hidden bg-surface" style={{ width: 72, height: 72 }}>
          <Image source={{ uri: photo }} className="w-full h-full" />
        </View>
        <View className="absolute -top-1 -right-1 w-6 h-6 rounded-r-pill bg-paper items-center justify-center">
          <Heart size={12} color="#602C66" fill="#602C66" />
        </View>
      </View>
      <Text className="font-body text-[12px] text-ink mt-2 text-center" numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------- Screen ---------- */

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [activeFilter, setActiveFilter] = useState<string>('perto');
  const [searchQuery, setSearchQuery] = useState('');

  // Catalogo cacheado em memoria de processo (useEstilos). Compartilhado
  // com SearchResults pro did-you-mean.
  const { estilos } = useEstilos();

  // Sugestoes derivadas: memoiza para nao re-ranquear a cada render do scroll.
  const suggestions = useMemo(
    () => rankSuggestions(searchQuery, estilos),
    [searchQuery, estilos],
  );

  // Enter na barra de busca -> tela de resultados. Vazio = lista todos
  // os tatuadores ativos (sem filtro de estilo).
  const handleSearchSubmit = () => {
    const estilo = searchQuery.trim() || undefined;
    navigation.navigate('SearchResults', estilo ? { estilo } : undefined);
  };

  // Tap numa sugestao: navega com o nome canonico (sem typo) e limpa a barra.
  const handleSuggestionPress = (estilo: Estilo) => {
    setSearchQuery('');
    navigation.navigate('SearchResults', { estilo: estilo.nome });
  };

  // First name only for the greeting; falls back to "VOCÊ" if no user.
  const firstName = (user?.name?.split(' ')[0] ?? 'VOCÊ').toUpperCase();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 96, // leave room for the bottom tab bar
        }}
      >
        {/* Greeting row */}
        <View className="flex-row items-start justify-between px-6 mb-5">
          <View className="flex-1">
            <Text className="font-body-semibold text-[12px] text-fg-3 tracking-[1.5px]">
              OLÁ, {firstName}
            </Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#6B6B6B" style={{ marginRight: 4 }} />
              <Text className="font-body text-[12px] text-fg-2">São Paulo, SP</Text>
            </View>
          </View>
          <TouchableOpacity
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            className="relative"
          >
            <Bell size={24} color="#000000" />
            <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-r-pill bg-plum border border-background" />
          </TouchableOpacity>
        </View>

        {/* Editorial headline — 2 linhas: "ARTISTAS" em cima, "perto de VOCÊ" embaixo. O
            "perto de" italic plum acompanha o "VOCÊ" Bebas pela baseline (alignItems: baseline)
            pra criar o ritmo editorial sem quebrar em 3 linhas. */}
        <View className="px-6 mb-6">
          <Text className="font-display text-[64px] leading-[60px] text-ink">ARTISTAS</Text>
          <View className="flex-row items-baseline ml-1">
            <Text className="font-body-italic text-[28px] leading-[32px] text-plum lowercase mr-3">
              perto de
            </Text>
            <Text className="font-display text-[64px] leading-[60px] text-ink">VOCÊ</Text>
          </View>
        </View>

        {/* Search field */}
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
          {/* Dropdown de sugestoes — so renderiza quando ha o que sugerir.
              `-mt-2` puxa pra perto do Input compensando a `mb-4` interna dele. */}
          {suggestions.length > 0 && (
            <View className="-mt-2 mb-2">
              <SuggestionList suggestions={suggestions} onSelect={handleSuggestionPress} />
            </View>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingVertical: 4 }}
          className="-mt-1"
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              icon={f.icon}
              active={activeFilter === f.id}
              onPress={() => setActiveFilter(f.id)}
            />
          ))}
        </ScrollView>

        {/* Em destaque (BOOST hero) — primeira seção após pesquisa+filtros (gancho editorial). */}
        <SectionHeader title="Em destaque" />
        <Animated.View entering={FadeInDown.duration(400).springify()} className="px-6">
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('EstablishmentProfile', { id: FEATURED.id })}
            className="rounded-r-xl overflow-hidden bg-ink"
            style={{ aspectRatio: 16 / 11 }}
          >
            <Image source={{ uri: FEATURED.photo }} className="w-full h-full opacity-80" />
            <View className="absolute inset-0 p-5 justify-between">
              <View className="self-start">
                <StatusPill label="BOOST" tone="plum" />
              </View>
              <View>
                <Text className="font-display text-[32px] text-on-ink leading-[34px]">
                  {FEATURED.name.toUpperCase()}
                </Text>
                <Text className="font-body text-[14px] text-on-ink mt-1">{FEATURED.tagline}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Favoritos — logo após o destaque pra valorizar retorno do usuário recorrente. */}
        <SectionHeader title="Favoritos" action="Ver tudo" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {FAVORITES.map((fav) => (
            <FavoriteTile key={fav.id} name={fav.name} photo={fav.photo} />
          ))}
        </ScrollView>

        {/* Por estilo */}
        <SectionHeader title="Por estilo" action="Ver tudo" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {STYLE_TILES.map((s) => (
            <StyleTile key={s.id} label={s.label} photo={s.photo} />
          ))}
        </ScrollView>

        {/* Flash do dia */}
        <View className="flex-row items-end justify-between px-6 mb-3 mt-8">
          <View className="flex-row items-center">
            <Text className="font-aux-bold text-[20px] text-ink mr-2">Flash do dia</Text>
            <StatusPill label="HOJE" tone="plum" />
          </View>
          <TouchableOpacity hitSlop={8}>
            <Text className="font-body-semibold text-[12px] text-fg-2">Ver tudo</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {FLASH_TODAY.map((f) => (
            <FlashCard key={f.id} title={f.title} price={f.price} photo={f.photo} />
          ))}
        </ScrollView>

        {/* Card-dica: NOVIDADE → Simulador */}
        <View className="px-6 mt-8">
          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-row items-center bg-plum-tint rounded-r-lg p-5"
          >
            <View className="w-12 h-12 rounded-r-pill bg-plum items-center justify-center mr-4">
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

        {/* Perto de você (2-col grid of ArtistCard) */}
        <SectionHeader title="Perto de você" />
        <View className="px-6 flex-row flex-wrap" style={{ gap: 12 }}>
          {NEAR_YOU.map((a, i) => (
            <Animated.View
              key={a.id}
              entering={FadeInDown.delay(i * 60).duration(400).springify()}
              style={{ width: '47.5%' }}
            >
              <ArtistCard
                name={a.name}
                rating={a.rating}
                tags={a.tags}
                photo={a.photo}
                onPress={() => navigation.navigate('EstablishmentProfile', { id: a.id })}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
