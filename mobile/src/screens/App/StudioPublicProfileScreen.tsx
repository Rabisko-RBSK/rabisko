import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { ChevronRight, Clock, MapPin, Phone } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { StatusPill } from '../../components/common/Chip';
import { HomeStackParamList } from '../../routes/home.stack';
import { chatService } from '../../services/api';
import type { EnderecoDTO } from '../../services/api/artistService';
import { searchService, EstudioPublico } from '../../services/api/searchService';
import { resumirGrade } from '../../utils/horario';

type ProfileRoute = RouteProp<HomeStackParamList, 'StudioPublicProfile'>;

function formatarEndereco(e: EnderecoDTO): string {
  const rua = [e.logradouro, e.numero].filter(Boolean).join(', ');
  return `${rua}${e.bairro ? ` - ${e.bairro}` : ''}, ${e.cidade}/${e.uf}`;
}

/**
 * Perfil público do estúdio, visto pelo cliente. "Conversar com o estúdio"
 * abre o chat com o tatuador dono, que atende e agenda pela equipe; estúdio
 * sem dono não oferece conversa — o cliente fala com alguém da equipe.
 */
export function StudioPublicProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<ProfileRoute>();
  const estudioId = route.params?.id;

  const [estudio, setEstudio] = useState<EstudioPublico | null>(null);
  const [loading, setLoading] = useState(!!estudioId);
  const [falhou, setFalhou] = useState(false);
  const [iniciandoConversa, setIniciandoConversa] = useState(false);

  useEffect(() => {
    if (!estudioId) return;
    let active = true;
    searchService
      .perfilEstudio(estudioId)
      .then((e) => active && setEstudio(e))
      .catch((err) => {
        console.warn('[StudioPublicProfile] erro ao carregar estúdio', err?.response?.status, err?.message);
        if (active) setFalhou(err?.response?.status !== 404);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [estudioId]);

  async function conversarComEstudio() {
    if (!estudio?.donoTatuadorId || iniciandoConversa) return;
    setIniciandoConversa(true);
    try {
      const chat = await chatService.abrirChat(estudio.donoTatuadorId);
      navigation.navigate('ChatThread', {
        chatId: chat.chatId,
        outroNome: chat.outroUsuarioNome,
        outroUsuarioId: chat.outroUsuarioId,
      });
    } catch (e) {
      console.error('Erro ao abrir chat com o estúdio', e);
      Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
    } finally {
      setIniciandoConversa(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#602C66" />
      </View>
    );
  }

  if (!estudio) {
    return (
      <View className="flex-1 bg-background">
        <Header onBack={() => navigation.goBack()} />
        <View className="mx-6 mt-4 bg-surface rounded-rd-lg p-5">
          <Text className="font-aux-bold text-[16px] text-ink mb-2">
            {falhou ? 'Não foi possível carregar o estúdio' : 'Estúdio indisponível'}
          </Text>
          <Text className="font-body text-[13px] text-fg-2 leading-[18px]">
            {falhou ? 'Confira sua conexão e tente de novo.' : 'Este estúdio não está atendendo no momento.'}
          </Text>
        </View>
      </View>
    );
  }

  const linhasHorario = resumirGrade(estudio.horarios);
  const podeConversar = !!estudio.donoTatuadorId;

  return (
    <View className="flex-1 bg-background">
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: podeConversar ? 120 : 40 }}
      >
        <View className="items-center mt-2 mb-6">
          <View
            className="rounded-rd-pill bg-ink items-center justify-center mb-3 overflow-hidden"
            style={{ width: 110, height: 110 }}
          >
            {estudio.fotoPerfilUrl ? (
              <Image source={{ uri: estudio.fotoPerfilUrl }} className="w-full h-full" />
            ) : (
              <Text className="font-display text-[44px] text-white">{estudio.nome.charAt(0).toUpperCase()}</Text>
            )}
          </View>

          <StatusPill label="ESTÚDIO" tone="plum" />

          <Text className="font-aux-bold text-[32px] leading-[36px] text-ink mt-2 text-center">{estudio.nome}</Text>
        </View>

        <View className="bg-surface rounded-rd-lg p-5 mb-4">
          <Text className="font-aux-bold text-[16px] text-ink mb-2">Informações</Text>

          {estudio.endereco ? (
            <View className="flex-row items-start mb-2">
              <MapPin size={16} color="#6B6B6B" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="font-body text-[14px] text-fg-3 flex-1">{formatarEndereco(estudio.endereco)}</Text>
            </View>
          ) : (
            <Text className="font-body text-[13px] text-fg-3 mb-2">Endereço não informado</Text>
          )}

          {estudio.telefone ? (
            <View className="flex-row items-center mb-2">
              <Phone size={16} color="#404040" style={{ marginRight: 8 }} />
              <Text className="font-body text-[14px] text-fg-2">{estudio.telefone}</Text>
            </View>
          ) : null}

          {linhasHorario.length > 0 ? (
            <View className="flex-row items-start mt-1">
              <Clock size={16} color="#6B6B6B" style={{ marginRight: 8, marginTop: 2 }} />
              <View className="flex-1">
                <Text className="font-body-semibold text-[13px] text-ink mb-0.5">Horário de atendimento</Text>
                {linhasHorario.map((linha) => (
                  <Text key={linha} className="font-body text-[14px] text-fg-3">
                    {linha}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View className="bg-surface rounded-rd-lg p-5 mb-8">
          <Text className="font-aux-bold text-[16px] text-ink mb-2">Equipe</Text>
          {estudio.equipe.map((t) => (
            <TouchableOpacity
              key={t.tatuadorId}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('EstablishmentProfile', { id: t.tatuadorId })}
              className="flex-row items-center py-2"
            >
              <View className="w-10 h-10 rounded-rd-pill bg-ink items-center justify-center overflow-hidden mr-3">
                {t.fotoPerfilUrl ? (
                  <Image source={{ uri: t.fotoPerfilUrl }} className="w-full h-full" />
                ) : (
                  <Text className="font-display text-[18px] text-white">{t.nome.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-[14px] text-ink" numberOfLines={1}>
                  {t.nome}
                </Text>
                {t.tatuadorId === estudio.donoTatuadorId ? (
                  <Text className="font-body text-[12px] text-fg-3">Dono do estúdio</Text>
                ) : t.instagram ? (
                  <Text className="font-body text-[12px] text-fg-3">@{t.instagram.replace(/^@/, '')}</Text>
                ) : null}
              </View>
              <ChevronRight size={18} color="#6B6B6B" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {podeConversar ? (
        <View className="absolute left-0 right-0 bottom-0 bg-background pt-3 px-6" style={{ paddingBottom: 24 }}>
          <Button
            title={iniciandoConversa ? 'Abrindo…' : 'Conversar com o estúdio'}
            onPress={conversarComEstudio}
          />
        </View>
      ) : null}
    </View>
  );
}
