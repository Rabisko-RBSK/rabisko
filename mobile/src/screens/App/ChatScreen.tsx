import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquarePlus } from 'lucide-react-native';

import { chatService, ChatDTO } from '../../services/api';
import { stompClient } from '../../services/ws/stompClient';
import { ChatStackParamList } from '../../routes/chat.stack';

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const a = partes[0]?.[0] ?? '';
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase() || '?';
}

function formatarHora(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const [chats, setChats] = useState<ChatDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await chatService.listarChats();
      setChats(lista);
    } catch (e) {
      console.error('Erro ao listar chats', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return stompClient.addListener(() => {
      refresh();
    });
  }, [refresh]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-display text-[32px] text-ink tracking-wide">Mensagens</Text>
        <Text className="font-body text-[14px] text-fg-2 mt-2">
          Converse direto com os tatuadores que você reservou.
        </Text>

        {loading && chats.length === 0 && (
          <ActivityIndicator className="mt-8" />
        )}

        {!loading && chats.length === 0 && (
          <Text className="font-body text-[13px] text-fg-3 mt-8 text-center">
            Você ainda não tem conversas. Inicie uma a partir do perfil de um artista.
          </Text>
        )}

        <View className="mt-6">
          {chats.map((c) => (
            <TouchableOpacity
              key={c.chatId}
              activeOpacity={0.8}
              className="flex-row items-center py-3"
              onPress={() =>
                navigation.navigate('ChatThread', {
                  chatId: c.chatId,
                  outroNome: c.outroUsuarioNome,
                  outroUsuarioId: c.outroUsuarioId,
                })
              }
            >
              <View
                className="bg-ink items-center justify-center rounded-rd-pill mr-3"
                style={{ width: 46, height: 46 }}
              >
                <Text className="font-body-semibold text-[14px] text-white">
                  {iniciais(c.outroUsuarioNome)}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text className="font-body-semibold text-[14px] text-ink">{c.outroUsuarioNome}</Text>
                  <Text className="font-body text-[11px] text-fg-3">
                    {formatarHora(c.dataUltimaMensagem)}
                  </Text>
                </View>
                <Text className="font-body text-[12px] text-fg-2 mt-1" numberOfLines={1}>
                  {c.ultimaMensagem ?? 'Sem mensagens ainda'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Nova conversa"
        className="absolute self-center bg-surface items-center justify-center rounded-rd-pill"
        style={{ bottom: 24, width: 48, height: 48 }}
      >
        <MessageSquarePlus size={22} color="#000000" />
      </TouchableOpacity>
    </View>
  );
}
