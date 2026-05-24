import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { StatusPill } from '../../components/common/Chip';
import { HomeStackParamList } from '../../routes/home.stack';
import { chatService } from '../../services/api';

/* ---------- Mock data (P1 ArtistProfile — replace with real API once wired) ---------- */

const ARTIST = {
  id: '1',
  name: 'João Santos',
  rating: '4,9',
  tags: ['Realismo', 'Minimalista'],
  handle: '@joão.santos',
  photo: 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=400&auto=format&fit=crop',
  about: 'Tatuador profissional, com trabalhos que transitam entre o minimalismo e o traço mais pesado.',
  portfolio: [
    'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop',
  ],
};

const REVIEWS = [
  {
    id: 'r1',
    initials: 'AC',
    name: 'Ana Costa',
    timeAgo: 'Há 2 horas',
    stars: 5,
    text: 'Trabalho impecável, super atencioso e ambiente muito limpo. Recomendo demais.',
  },
  {
    id: 'r2',
    initials: 'RS',
    name: 'Rafa Silva',
    timeAgo: 'Há 3 dias',
    stars: 5,
    text: 'Profissional fora de série. Captou a ideia logo na primeira conversa.',
  },
];

/* ---------- Leaf components ---------- */

function ReviewCard({
  initials,
  name,
  timeAgo,
  stars,
  text,
}: {
  initials: string;
  name: string;
  timeAgo: string;
  stars: number;
  text: string;
}) {
  return (
    <View className="bg-surface-2 rounded-r-lg p-4 mb-3">
      <View className="flex-row items-center mb-2">
        <View className="w-9 h-9 rounded-r-pill bg-ink items-center justify-center mr-3">
          <Text className="font-body-bold text-[12px] text-on-ink">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-body-semibold text-[14px] text-ink">{name}</Text>
          <Text className="font-body text-[11px] text-fg-3">{timeAgo}</Text>
        </View>
        <View className="flex-row" style={{ gap: 2 }}>
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} size={12} color="#000000" fill="#000000" />
          ))}
        </View>
      </View>
      <Text className="font-body text-[13px] text-fg-2 leading-[18px]">{text}</Text>
    </View>
  );
}

/* ---------- Screen ---------- */

export function EstablishmentProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [favorited, setFavorited] = useState(false);
  const [iniciandoConversa, setIniciandoConversa] = useState(false);

  async function iniciarConversa() {
    if (iniciandoConversa) return;
    setIniciandoConversa(true);
    try {
      const chat = await chatService.abrirChat(ARTIST.id);
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

  return (
    <View className="flex-1 bg-background">
      <Header
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => setFavorited((v) => !v)}
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
        {/* Hero — chat-centered profile: photo → 1st tag pill → rating+star → name */}
        <View className="items-center mt-2 mb-6">
          <View
            className="rounded-r-pill overflow-hidden bg-surface mb-3"
            style={{ width: 120, height: 120 }}
          >
            <Image source={{ uri: ARTIST.photo }} className="w-full h-full" />
          </View>

          {ARTIST.tags[0] && <StatusPill label={ARTIST.tags[0]} tone="ink" />}

          <View className="flex-row items-center mt-2">
            <Text className="font-body-semibold text-[14px] text-ink mr-1">{ARTIST.rating}</Text>
            <Star size={14} color="#000000" fill="#000000" />
          </View>

          <Text className="font-aux-bold text-[32px] leading-[36px] text-ink mt-2 text-center">
            {ARTIST.name}
          </Text>
        </View>

        {/* Sobre */}
        <View className="bg-surface rounded-r-lg p-5 mb-8">
          <Text className="font-aux-bold text-[16px] text-ink mb-2">Sobre</Text>
          <Text className="font-body text-[14px] text-fg-2 leading-[20px] mb-3">{ARTIST.about}</Text>
          <Text className="font-body text-[13px] text-fg-3">{ARTIST.handle}</Text>
        </View>

        {/* Portfólio */}
        <View className="flex-row items-end justify-between mb-3">
          <Text className="font-aux-bold text-[20px] text-ink">Portfólio</Text>
          <TouchableOpacity hitSlop={8}>
            <Text className="font-body-semibold text-[12px] text-fg-2">Ver Todos</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row mb-8" style={{ gap: 12 }}>
          {ARTIST.portfolio.slice(0, 2).map((src, i) => (
            <View key={i} className="flex-1 rounded-r-xl overflow-hidden bg-surface" style={{ aspectRatio: 1 }}>
              <Image source={{ uri: src }} className="w-full h-full" />
            </View>
          ))}
        </View>

        {/* Avaliações */}
        <Text className="font-aux-bold text-[20px] text-ink mb-3">Avaliações</Text>
        {REVIEWS.map((r) => (
          <ReviewCard key={r.id} {...r} />
        ))}
      </ScrollView>

      {/* Sticky CTA. Primary = "Iniciar Conversa" (links to Chat once threading is built, P2).
       *  Secondary = "Reservar" — temporary DEV entry point to the Booking flow so we can test
       *  Booking→Payment→Confirmed end-to-end. Product decided the canonical entry is via Chat,
       *  not this profile screen; remove or rethink this button when the Chat→Booking handoff
       *  is wired. */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-background pt-3 px-6 flex-row"
        style={{ paddingBottom: 24, gap: 10 }}
      >
        <View className="flex-1">
          <Button
            title="Reservar"
            variant="outline"
            onPress={() => navigation.navigate('BookingFlow', { id: ARTIST.id })}
          />
        </View>
        <View className="flex-1">
          <Button
            title={iniciandoConversa ? 'Abrindo…' : 'Iniciar Conversa'}
            onPress={iniciarConversa}
          />
        </View>
      </View>
    </View>
  );
}
