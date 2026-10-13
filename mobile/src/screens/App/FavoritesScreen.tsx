import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { ArtistCard } from '../../components/common/ArtistCard';
import { HomeStackParamList } from '../../routes/home.stack';
import { useFavoritesStore, FavoriteArtist } from '../../store/favoritesStore';

type FavoritesNav = NativeStackNavigationProp<HomeStackParamList, 'Favorites'>;

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesNav>();
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();

  const renderItem = ({ item }: { item: FavoriteArtist }) => (
    <View style={{ width: '47.5%', marginBottom: 12 }}>
      <ArtistCard
        name={item.name}
        rating={item.rating ?? '5,0'}
        tags={item.tags ?? []}
        photo={item.photo ?? undefined}
        favorited={isFavorite(item.id)}
        onToggleFavorite={() => toggleFavorite(item)}
        onPress={() => navigation.navigate('EstablishmentProfile', { id: item.id })}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <Header title="FAVORITOS" onBack={() => navigation.goBack()} />

      <View className="px-6 mb-3">
        <Text className="font-body text-[13px] text-fg-2">
          {favorites.length === 1
            ? '1 artista salvo'
            : `${favorites.length} artistas salvos`}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-rd-pill bg-plum-tint items-center justify-center mb-4">
            <Heart size={32} color="#602C66" />
          </View>
          <Text className="font-aux-bold text-[20px] text-ink mb-2 text-center">
            Nenhum favorito ainda
          </Text>
          <Text className="font-body text-[14px] text-fg-2 text-center leading-[20px]">
            Toque no coração nos cards de artistas para salvar seus preferidos e acessá-los facilmente aqui.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            className="mt-6 bg-ink rounded-rd-pill px-6 py-3"
          >
            <Text className="font-body-semibold text-[14px] text-white">Explorar artistas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 40,
          }}
        />
      )}
    </View>
  );
}
