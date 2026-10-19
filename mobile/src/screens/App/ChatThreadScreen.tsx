import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CalendarDays, ImagePlus, Send, X } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { chatService, MensagemDTO } from '../../services/api';
import { stompClient } from '../../services/ws/stompClient';
import { useAuthStore } from '../../store/authStore';
import { ScheduleModal } from './ScheduleModal';
import { escolherImagemDaGaleria } from '../../utils/imagePicker';
import { resolverUrlStorage } from '../../utils/storageUrl';

type ChatThreadParams = { chatId: string; outroNome: string; outroUsuarioId: string };

export function ChatThreadScreen() {
  const route = useRoute<RouteProp<{ ChatThread: ChatThreadParams }, 'ChatThread'>>();
  const navigation = useNavigation();
  const { chatId, outroNome, outroUsuarioId } = route.params;

  const { role } = useAuthStore();
  const [mensagens, setMensagens] = useState<MensagemDTO[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [imagemAberta, setImagemAberta] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    chatService
      .listarMensagens(chatId, 0, 30)
      .then((page) => {
        if (!cancelled) setMensagens(page.content);
      })
      .catch((e) => console.error('Erro ao carregar mensagens', e));
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    return stompClient.addListener((msg) => {
      if (msg.chatId !== chatId) return;
      setMensagens((prev) => [msg, ...prev]);
    });
  }, [chatId]);

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    if (!stompClient.isConnected()) {
      Alert.alert('Sem conexão', 'Aguardando reconectar ao chat.');
      return;
    }
    setEnviando(true);
    try {
      stompClient.publish(chatId, conteudo);
      setTexto('');
    } catch (e) {
      console.error('Erro ao enviar', e);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  }

  async function enviarImagem() {
    if (enviandoImagem) return;
    const uri = await escolherImagemDaGaleria({ editar: false });
    if (!uri) return;
    setEnviandoImagem(true);
    try {
      // A mensagem volta pelo listener do WebSocket; não precisa inserir aqui.
      await chatService.enviarImagem(chatId, uri);
    } catch (e) {
      console.error('Erro ao enviar imagem', e);
      Alert.alert('Erro', 'Não foi possível enviar a imagem.');
    } finally {
      setEnviandoImagem(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={outroNome}
        onBack={() => navigation.goBack()}
        right={
          role === 'artista' ? (
            <TouchableOpacity
              onPress={() => setAgendando(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Agendar sessão"
            >
              <CalendarDays size={22} color="#000000" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScheduleModal
        visible={agendando}
        onClose={() => setAgendando(false)}
        chatId={chatId}
        outroNome={outroNome}
        onSent={() => setAgendando(false)}
      />

      <Modal
        visible={!!imagemAberta}
        transparent
        animationType="fade"
        onRequestClose={() => setImagemAberta(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onPress={() => setImagemAberta(null)}
          accessibilityRole="button"
          accessibilityLabel="Fechar imagem"
        >
          {imagemAberta && (
            <Image
              source={{ uri: imagemAberta }}
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          )}
          <View className="absolute top-12 right-4">
            <X size={26} color="#ffffff" />
          </View>
        </Pressable>
      </Modal>

      <FlatList
        inverted
        data={mensagens}
        keyExtractor={(m) => m.mensagemId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        renderItem={({ item }) => {
          const minha = item.remetenteId !== outroUsuarioId;
          return (
            <View
              className={
                minha
                  ? 'self-end bg-plum rounded-rd-md mb-2 px-3 py-2'
                  : 'self-start bg-surface rounded-rd-md mb-2 px-3 py-2'
              }
              style={{ maxWidth: '80%' }}
            >
              {item.imagemUrl && (
                <TouchableOpacity
                  onPress={() => setImagemAberta(resolverUrlStorage(item.imagemUrl))}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="Abrir imagem"
                >
                  <Image
                    source={{ uri: resolverUrlStorage(item.imagemUrl) }}
                    style={{ width: 220, height: 220, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              {!!item.conteudo && (
                <Text
                  className={
                    minha
                      ? 'font-body text-[14px] text-white'
                      : 'font-body text-[14px] text-ink'
                  }
                  style={item.imagemUrl ? { marginTop: 6 } : undefined}
                >
                  {item.conteudo}
                </Text>
              )}
            </View>
          );
        }}
      />

      <View className="flex-row items-center px-4 py-3 bg-surface">
        <TouchableOpacity
          onPress={enviarImagem}
          disabled={enviandoImagem}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Enviar imagem"
          className="w-10 h-10 items-center justify-center mr-1"
        >
          {enviandoImagem ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ImagePlus size={22} color="#000000" />
          )}
        </TouchableOpacity>
        <TextInput
          className="flex-1 bg-background rounded-rd-pill px-4 py-2 mr-2 font-body text-[14px] text-ink"
          value={texto}
          onChangeText={setTexto}
          placeholder="Mensagem"
          editable={!enviando}
        />
        <TouchableOpacity
          onPress={enviar}
          disabled={!texto.trim() || enviando}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          className="w-10 h-10 items-center justify-center bg-plum rounded-rd-pill"
          style={{ opacity: !texto.trim() || enviando ? 0.5 : 1 }}
        >
          <Send size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
