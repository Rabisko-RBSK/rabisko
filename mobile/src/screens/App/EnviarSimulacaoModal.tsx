import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, X } from 'lucide-react-native';

import { chatService, type ChatDTO } from '../../services/api';

/** Limite do backend para a legenda (`ChatService.enviarImagem`). */
const LEGENDA_MAX = 2000;

export interface ImagemSimulacao {
  /** Arquivo local (`file://`) com o frame capturado do canvas. */
  uri: string;
  width: number;
  height: number;
}

interface Props {
  /** Frame a enviar; o modal fica visível enquanto houver um. */
  imagem: ImagemSimulacao | null;
  onClose: () => void;
  /** Chamado depois que a imagem foi enviada, com a conversa escolhida. */
  onEnviado: (chat: ChatDTO) => void;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const a = partes[0]?.[0] ?? '';
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase() || '?';
}

function mensagemDoErro(err: any): string {
  const data = err?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Não foi possível enviar a imagem. Tente novamente.';
}

/**
 * Envia a simulação do Bisko AI direto numa conversa: o cliente escolhe com qual tatuador
 * (entre as conversas que já tem), escreve uma legenda opcional e a imagem vai pelo mesmo
 * endpoint das fotos do chat (`POST /chats/{id}/imagens`). Quem abre a conversa depois é o
 * `SimuladorScreen`, via `onEnviado`.
 */
export function EnviarSimulacaoModal({ imagem, onClose, onEnviado }: Props) {
  const visible = imagem !== null;
  const [chats, setChats] = useState<ChatDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [legenda, setLegenda] = useState('');
  const [enviandoPara, setEnviandoPara] = useState<string | null>(null);
  // Incrementado pelo "Tentar novamente" para refazer a busca das conversas.
  const [tentativa, setTentativa] = useState(0);

  // O efeito só mexe no estado depois da resposta; o reset fica no cleanup (ao fechar).
  useEffect(() => {
    if (!visible) return;
    let cancelado = false;
    chatService
      .listarChats()
      .then((lista) => {
        if (!cancelado) setChats(lista);
      })
      .catch((err: any) => {
        console.warn('[EnviarSimulacao] erro ao listar chats', err?.response?.status, err?.message);
        if (!cancelado) setErro('Não foi possível carregar suas conversas.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
      setCarregando(true);
      setErro(null);
    };
  }, [visible, tentativa]);

  // Legenda e envio só zeram ao fechar (não a cada "Tentar novamente").
  useEffect(() => {
    if (!visible) return;
    return () => {
      setLegenda('');
      setEnviandoPara(null);
    };
  }, [visible]);

  const tentarNovamente = useCallback(() => setTentativa((n) => n + 1), []);

  const enviar = async (chat: ChatDTO) => {
    if (!imagem || enviandoPara) return;
    setEnviandoPara(chat.chatId);
    try {
      await chatService.enviarImagem(chat.chatId, imagem.uri, legenda.trim() || undefined);
      onEnviado(chat);
    } catch (err: any) {
      console.error('[EnviarSimulacao] erro ao enviar imagem', err?.response?.status, err?.message);
      Alert.alert('Erro', mensagemDoErro(err));
      setEnviandoPara(null);
    }
  };

  const fechar = () => {
    if (enviandoPara) return;
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={fechar}>
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            ENVIAR SIMULAÇÃO
          </Text>
          <TouchableOpacity
            onPress={fechar}
            hitSlop={8}
            className="absolute right-4"
            disabled={enviandoPara !== null}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {imagem && (
            <Image
              source={{ uri: imagem.uri }}
              className="rounded-xl self-center mb-4"
              style={{
                width: '70%',
                aspectRatio: imagem.height > 0 ? imagem.width / imagem.height : 3 / 4,
              }}
              resizeMode="cover"
              accessibilityLabel="Prévia da simulação"
            />
          )}

          <TextInput
            value={legenda}
            onChangeText={setLegenda}
            placeholder="Escreva uma mensagem (opcional)"
            placeholderTextColor="#9A9A9A"
            maxLength={LEGENDA_MAX}
            multiline
            editable={enviandoPara === null}
            className="bg-background rounded-md px-4 py-3 font-body text-[14px] text-ink mb-6"
            style={{ minHeight: 48, maxHeight: 120 }}
          />

          <Text className="font-body-semibold text-[12px] tracking-widest text-fg-3 mb-2">
            ESCOLHA O TATUADOR
          </Text>

          {carregando && !erro && chats.length === 0 && (
            <ActivityIndicator className="mt-6" color="#602C66" />
          )}

          {erro && (
            <View className="items-center mt-6">
              <Text className="font-body text-[14px] text-fg-2 text-center mb-3">{erro}</Text>
              <TouchableOpacity onPress={tentarNovamente} hitSlop={8} accessibilityRole="button">
                <Text className="font-body-semibold text-[14px] text-plum">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!carregando && !erro && chats.length === 0 && (
            <Text className="font-body text-[13px] text-fg-3 text-center mt-6 leading-[18px]">
              Você ainda não tem conversas. Inicie uma a partir do perfil de um artista e depois
              envie a simulação por aqui.
            </Text>
          )}

          {chats.map((c) => {
            const enviandoEste = enviandoPara === c.chatId;
            return (
              <TouchableOpacity
                key={c.chatId}
                activeOpacity={0.8}
                className="flex-row items-center py-3"
                style={{ opacity: enviandoPara && !enviandoEste ? 0.4 : 1 }}
                disabled={enviandoPara !== null}
                onPress={() => enviar(c)}
                accessibilityRole="button"
                accessibilityLabel={`Enviar simulação para ${c.outroUsuarioNome}`}
              >
                <View
                  className="bg-ink items-center justify-center rounded-rd-pill mr-3"
                  style={{ width: 46, height: 46 }}
                >
                  <Text className="font-body-semibold text-[14px] text-white">{iniciais(c.outroUsuarioNome)}</Text>
                </View>
                <Text className="flex-1 font-body-semibold text-[14px] text-ink" numberOfLines={1}>
                  {c.outroUsuarioNome}
                </Text>
                {enviandoEste ? (
                  <ActivityIndicator color="#602C66" />
                ) : (
                  <Send size={18} color="#602C66" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
