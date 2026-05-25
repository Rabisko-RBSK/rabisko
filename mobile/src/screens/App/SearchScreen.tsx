import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Search, SlidersHorizontal, MapPin, Star } from 'lucide-react-native';

const INITIAL_REGION = {
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MARKERS = [
  {
    id: '1',
    name: 'João Santos',
    coordinate: { latitude: -23.561, longitude: -46.662 },
    rating: 4.9,
    price: 'R$ 250+',
  },
  {
    id: '2',
    name: 'Estúdio Fênix',
    coordinate: { latitude: -23.541, longitude: -46.632 },
    rating: 4.8,
    price: 'R$ 150+',
  },
];

export function SearchScreen() {
  const [selectedPlace, setSelectedPlace] = React.useState<any>(null);

  return (
    <View className="flex-1 bg-white">
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
        initialRegion={INITIAL_REGION}
        customMapStyle={mapStyle}
      >
        {MARKERS.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            onPress={() => setSelectedPlace(marker)}
          >
            <View className="bg-black px-3 py-2 rounded-rd-md border-2 border-white">
              <Text className="text-white font-bold text-xs">{marker.price}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header Search */}
      <View className="absolute top-14 left-6 right-6">
        <View className="flex-row items-center bg-white rounded-rd-md px-4 py-4 border border-hairline">
          <View className="mr-3">
            <Search size={24} color="#000" />
          </View>
          <TextInput
            placeholder="Onde você quer agendar?"
            placeholderTextColor="#6B6B6B"
            className="flex-1 text-black text-lg"
          />
          <TouchableOpacity className="bg-surface p-2 rounded-rd-md">
            <SlidersHorizontal size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Card Popup */}
      {selectedPlace && (
        <View className="absolute bottom-10 left-6 right-6">
          <TouchableOpacity 
            className="bg-black p-6 rounded-rd-lg flex-row items-center"
            activeOpacity={0.9}
          >
            <View className="bg-surface w-16 h-16 rounded-rd-pill items-center justify-center mr-4">
              <MapPin size={24} color="#000" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-xl">{selectedPlace.name}</Text>
              <View className="flex-row items-center mt-1">
                <Star size={14} color="#fff" fill="#fff" />
                <Text className="text-white/80 ml-1">{selectedPlace.rating} • Tatuador</Text>
              </View>
            </View>
            <TouchableOpacity 
              className="bg-white px-6 py-3 rounded-rd-pill"
              onPress={() => setSelectedPlace(null)}
            >
              <Text className="text-black font-bold">Ver</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];
