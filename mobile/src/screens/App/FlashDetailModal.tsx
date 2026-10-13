import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { X, Sparkles, User, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FlashItem } from '../../services/api/flashService';
import { Button } from '../../components/common/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  flash: FlashItem | null;
  onSelectArtist?: (artistId: string) => void;
}

export function FlashDetailModal({ visible, onClose, flash, onSelectArtist }: Props) {
  if (!flash) return null;

  const precoFormatado = typeof flash.price === 'number'
    ? flash.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : flash.price;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-surface">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            FLASH DO DIA
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} className="absolute right-4">
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-rd-xl overflow-hidden bg-surface mb-6" style={{ width: '100%', height: 280 }}>
            <Image source={{ uri: flash.photo }} className="w-full h-full" resizeMode="cover" />
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-display text-[28px] text-ink flex-1 mr-2">{flash.title}</Text>
            <View className="bg-plum-tint px-3 py-1.5 rounded-rd-pill">
              <Text className="font-body-bold text-[16px] text-plum">{precoFormatado}</Text>
            </View>
          </View>

          {flash.tatuadorNome && (
            <View className="flex-row items-center mt-2 mb-4">
              <User size={16} color="#602C66" style={{ marginRight: 6 }} />
              <Text className="font-body-semibold text-[14px] text-ink">{flash.tatuadorNome}</Text>
            </View>
          )}

          {flash.description && (
            <View className="bg-surface rounded-rd-lg p-4 mt-2 mb-6">
              <Text className="font-body text-[14px] text-fg-2 leading-[20px]">{flash.description}</Text>
            </View>
          )}

          <View className="mt-4">
            {flash.tatuadorId && onSelectArtist ? (
              <Button
                title="Ver perfil do artista"
                onPress={() => {
                  onClose();
                  onSelectArtist(flash.tatuadorId!);
                }}
              />
            ) : (
              <Button title="Fechar" variant="outline" onPress={onClose} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
