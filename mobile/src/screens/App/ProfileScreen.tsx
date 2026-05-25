import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { Mail, Phone, MapPin, Star, Settings } from 'lucide-react-native';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-6 bg-surface rounded-b-r-2xl items-center">
        <View className="relative">
          <View className="w-32 h-32 rounded-rd-pill bg-white items-center justify-center border-4 border-white overflow-hidden">
             {user?.avatar ? (
               <Image source={{ uri: user.avatar }} className="w-full h-full" />
             ) : (
               <Text className="text-5xl font-bold text-ink">{user?.name?.charAt(0)}</Text>
             )}
          </View>
          <TouchableOpacity 
            className="absolute bottom-0 right-0 bg-black p-2 rounded-rd-pill border-2 border-white"
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Settings size={16} stroke="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text className="text-3xl font-bold text-black mt-4 uppercase tracking-tighter">{user?.name}</Text>
        <Text className="text-gray-500">{user?.email}</Text>
      </View>

      <ScrollView className="px-6 pt-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between mb-10">
          <View className="items-center bg-surface-2 p-6 rounded-rd-lg flex-1 mr-2">
            <Text className="text-2xl font-bold text-black">12</Text>
            <Text className="text-gray-500 text-xs uppercase font-bold">Reservas</Text>
          </View>
          <View className="items-center bg-surface-2 p-6 rounded-rd-lg flex-1 ml-2">
            <Text className="text-2xl font-bold text-black">4</Text>
            <Text className="text-gray-500 text-xs uppercase font-bold">Avaliações</Text>
          </View>
        </View>

        <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-4">Informações</Text>
        <View className="bg-surface-2 rounded-rd-lg p-6 space-y-6 mb-10">
          <View className="flex-row items-center mb-6">
            <View className="mr-4">
              <Mail size={20} color="#000" />
            </View>
            <Text className="text-black font-medium">{user?.email}</Text>
          </View>
          <View className="flex-row items-center mb-6">
            <View className="mr-4">
              <Phone size={20} color="#000" />
            </View>
            <Text className="text-black font-medium">(11) 99999-9999</Text>
          </View>
          <View className="flex-row items-center">
            <View className="mr-4">
              <MapPin size={20} color="#000" />
            </View>
            <Text className="text-black font-medium">São Paulo, SP</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
