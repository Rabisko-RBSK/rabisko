import React, { useMemo } from 'react';
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

import { PortfolioImage } from '../../services/api/artistService';

/**
 * Carrossel horizontal do portfólio (DESIGN.md §5 — media tiles em `r-xl`).
 * Mostra ~2 imagens por vez e desliza para revelar as demais SEM sair da tela
 * — o botão "Ver Todos" do perfil é que abre o portfólio completo.
 *
 * É full-bleed: aplica o padding de tela (24px) internamente para que a
 * primeira/última imagem alinhem com a margem e o conteúdo role de borda a
 * borda. Renderize-o fora de qualquer wrapper com `px-6`.
 */

const SCREEN_PADDING = 24;
const GAP = 12;

interface PortfolioCarouselProps {
  images: PortfolioImage[];
  /** Toque numa imagem — ex.: abrir o portfólio completo. */
  onImagePress?: (index: number) => void;
}

export function PortfolioCarousel({ images, onImagePress }: PortfolioCarouselProps) {
  // Largura para caber exatamente 2 imagens + 1 gap dentro da área útil.
  const itemWidth = useMemo(() => {
    const content = Dimensions.get('window').width - SCREEN_PADDING * 2;
    return (content - GAP) / 2;
  }, []);

  if (images.length === 0) {
    return (
      <View className="px-6">
        <View className="bg-surface-2 rounded-r-xl items-center justify-center py-12">
          <Text className="font-body text-[13px] text-fg-3">
            Nenhuma imagem no portfólio ainda.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.imagemId}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={itemWidth + GAP}
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING }}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onImagePress?.(index)}
          accessibilityRole="imagebutton"
          accessibilityLabel={item.descricao ?? `Trabalho ${index + 1} do portfólio`}
          style={{ width: itemWidth }}
        >
          <View
            className="rounded-r-xl overflow-hidden bg-surface"
            style={{ width: itemWidth, aspectRatio: 3 / 4 }}
          >
            <Image source={{ uri: item.url }} className="w-full h-full" />
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
