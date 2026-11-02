import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { chatService, ChatDTO } from '../../services/api';
import { stompClient } from '../../services/ws/stompClient';
import { ChatStackParamList } from '../../routes/chat.stack';
import { useAuthStore } from '../../store/authStore';

// A mesma tela serve cliente e tatuador; só os textos mudam.
const TEXTOS_CLIENTE = {
  subtitulo: 'Converse direto com os tatuadores que você reservou.',
  vazio: 'Você ainda não tem conversas. Inicie uma a partir do perfil de um artista.',
};

const TEXTOS_ARTISTA = {
  subtitulo: 'Converse com os clientes interessados no seu trabalho.',
  vazio: 'Você ainda não tem conversas. Quando um cliente iniciar uma conversa pelo seu perfil, ela aparece aqui.',
};

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
  const role = useAuthStore((s) => s.role);
  const textos = role === 'artista' ? TEXTOS_ARTISTA : TEXTOS_CLIENTE;
  // Indicador de não lida só para o tatuador (o backend calcula para os dois papéis).
  const mostrarNaoLidas = role === 'artista';

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

  // Ao voltar de uma conversa, o "não lida" dela já mudou.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

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
          {textos.subtitulo}
        </Text>

        {loading && chats.length === 0 && (
          <ActivityIndicator className="mt-8" />
        )}

        {!loading && chats.length === 0 && (
          <Text className="font-body text-[13px] text-fg-3 mt-8 text-center">
            {textos.vazio}
          </Text>
        )}

        <View className="mt-6">
          {chats.map((c) => (
            <TouchableOpacity
              key={c.chatId}
              activeOpacity={0.8}
              className="flex-row items-center py-3"
              onPress={() => {
                // A conversa marca a leitura ao abrir; apaga o ponto já, sem esperar o refresh.
                setChats((prev) => prev.map((x) => (x.chatId === c.chatId ? { ...x, naoLida: false } : x)));
                navigation.navigate('ChatThread', {
                  chatId: c.chatId,
                  outroNome: c.outroUsuarioNome,
                  outroUsuarioId: c.outroUsuarioId,
                });
              }}
              accessibilityLabel={
                mostrarNaoLidas && c.naoLida ? `${c.outroUsuarioNome}, mensagem não lida` : c.outroUsuarioNome
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
                <View className="flex-row items-center mt-1">
                  <Text className="flex-1 font-body text-[12px] text-fg-2" numberOfLines={1}>
                    {c.ultimaMensagem ?? 'Sem mensagens ainda'}
                  </Text>
                  {mostrarNaoLidas && c.naoLida && (
                    <View className="w-2.5 h-2.5 rounded-rd-pill bg-plum ml-2" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
