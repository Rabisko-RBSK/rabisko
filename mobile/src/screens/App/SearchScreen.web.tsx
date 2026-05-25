import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { Search, SlidersHorizontal, MapPin, Star } from 'lucide-react-native';
import { theme } from '../../theme';

const MARKERS = [
  {
    id: '1',
    name: 'João Santos',
    rating: 4.9,
    price: 'R$ 250+',
  },
  {
    id: '2',
    name: 'Estúdio Fênix',
    rating: 4.8,
    price: 'R$ 150+',
  },
];

export function SearchScreen() {
  const [selectedPlace, setSelectedPlace] = React.useState<any>(null);

  return (
    <View className="flex-1 bg-background">
      {/* Header Search */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24 }}>
        <View className="flex-row items-center bg-paper rounded-rd-md px-4 py-4 border border-hairline">
          <View className="mr-3">
            <Search size={24} color={theme.colors.ink} />
          </View>
          <TextInput
            placeholder="Onde você quer agendar?"
            placeholderTextColor={theme.colors.fg3}
            className="flex-1 text-ink text-lg"
          />
          <TouchableOpacity className="bg-surface p-2 rounded-rd-md">
            <SlidersHorizontal size={20} color={theme.colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Placeholder for Web */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.hairline }}>
        <MapPin size={48} color={theme.colors.fg3} />
        <Text style={{ color: theme.colors.fg2, fontSize: 16, marginTop: 12 }}>
          Mapa não disponível na versão web
        </Text>
        <Text style={{ color: theme.colors.fg3, fontSize: 14, marginTop: 4 }}>
          Use o aplicativo nativo para acessar o mapa
        </Text>
      </View>

      {/* Results list */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        {MARKERS.map((marker) => (
          <TouchableOpacity
            key={marker.id}
            style={{
              backgroundColor: theme.colors.ink,
              padding: 20,
              borderRadius: theme.radius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
            activeOpacity={0.9}
            onPress={() => setSelectedPlace(marker)}
          >
            <View style={{
              backgroundColor: theme.colors.surface,
              width: 56,
              height: 56,
              borderRadius: theme.radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}>
              <MapPin size={24} color={theme.colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.onInk, fontWeight: 'bold', fontSize: 18 }}>{marker.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Star size={14} color={theme.colors.onInk} fill={theme.colors.onInk} />
                <Text style={{ color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}>
                  {marker.rating} • Tatuador • {marker.price}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.paper,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: theme.radius.pill,
              }}
            >
              <Text style={{ color: theme.colors.ink, fontWeight: 'bold' }}>Ver</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
