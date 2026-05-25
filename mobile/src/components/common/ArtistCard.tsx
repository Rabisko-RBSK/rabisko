import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Heart, Star } from 'lucide-react-native';

/**
 * The black hero card (DESIGN.md §8.6 — ArtistCard.jsx): ink top block com foto 96px, nome
 * centralizado, rating logo abaixo do nome, outlined style-tag pills, e um coração (top-left)
 * de favoritar; um footer cream "ver mais..." fecha o card. Tudo é um botão → ArtistScreen.
 *
 * O rating ficava em overlay top-right no design original mas, no grid 2-col de "Perto de você"
 * (cards ~150-165px), se sobrepunha à foto centralizada — agora vive abaixo do nome.
 *
 * A área de tags tem `minHeight` fixo (cabe 2 linhas de pills) pra garantir altura igual entre
 * cards num grid: sem isso, um card com 1 tag fica mais curto que outro com 2 tags que quebram.
 */
interface ArtistCardProps {
  name: string;
  rating: string | number;
  tags?: string[];
  photo?: string;
  favorited?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

export function ArtistCard({
  name,
  rating,
  tags = [],
  photo,
  favorited,
  onToggleFavorite,
  onPress,
}: ArtistCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="overflow-hidden rounded-rd-lg"
      accessibilityRole="button"
    >
      <View className="bg-ink px-[22px] pb-[22px] pt-[18px]">
        {onToggleFavorite && (
          <TouchableOpacity
            onPress={onToggleFavorite}
            hitSlop={8}
            className="absolute left-3 top-3 z-10"
            accessibilityRole="button"
            accessibilityLabel={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart size={20} color="#FFFFFF" fill={favorited ? '#FFFFFF' : 'transparent'} />
          </TouchableOpacity>
        )}

        <View
          className="mx-auto mb-3 mt-2 bg-surface rounded-rd-lg overflow-hidden"
          style={{ width: 96, height: 96 }}
        >
          {photo ? <Image source={{ uri: photo }} className="w-full h-full" /> : null}
        </View>

        <Text
          className="text-center font-body-semibold text-[18px] text-white"
          numberOfLines={1}
        >
          {name}
        </Text>

        <View className="flex-row items-center justify-center mt-1" style={{ gap: 4 }}>
          <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
          <Text className="font-body text-[13px] text-white">{rating}</Text>
        </View>

        {tags.length > 0 && (
          <View
            className="flex-row flex-wrap justify-center mt-3.5"
            style={{ gap: 8, minHeight: 58 }}
          >
            {tags.map((t) => (
              <View key={t} className="rounded-rd-pill border border-white px-3 py-1">
                <Text className="font-body-medium text-[11px] text-white">{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="bg-surface items-center py-2.5">
        <Text className="font-body text-[14px] text-ink">ver mais...</Text>
      </View>
    </TouchableOpacity>
  );
}
