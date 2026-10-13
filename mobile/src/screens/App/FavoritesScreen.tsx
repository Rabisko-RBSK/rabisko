import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { ArtistCard } from '../../components/common/ArtistCard';
import { Button } from '../../components/common/Button';
import { HomeStackParamList } from '../../routes/home.stack';
import { useFavoriteStore, FavoriteArtist } from '../../store/favoriteStore';

export function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const insets = useSafeAreaInsets();
  const favorites = useFavoriteStore((s) => s.favorites);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);

  const renderItem = ({ item }: { item: FavoriteArtist }) => (
    <View className="mb-4" style={{ width: '48%' }}>
      <ArtistCard
        name={item.name}
        rating={item.rating ?? '—'}
        tags={item.tags ?? []}
        photo={item.photo ?? undefined}
        favorited={true}
        onToggleFavorite={() => toggleFavorite(item)}
        onPress={() => navigation.navigate('EstablishmentProfile', { id: item.id })}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <Header title="FAVORITOS" onBack={() => navigation.goBack()} />

      {favorites.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-rd-pill bg-plum-tint items-center justify-center mb-4">
            <Heart size={32} color="#602C66" />
          </View>
          <Text className="font-aux-bold text-[20px] text-ink text-center mb-2">
            Nenhum favorito ainda
          </Text>
          <Text className="font-body text-[14px] text-fg-2 text-center mb-6">
            Toque no coração dos tatuadores que você mais gostar para salvar aqui e encontrá-los facilmente.
          </Text>
          <Button title="Explorar artistas" onPress={() => navigation.goBack()} />
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
            paddingTop: 16,
            paddingBottom: insets.bottom + 96,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
