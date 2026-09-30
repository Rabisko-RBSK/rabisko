import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Check, Search, UserRound } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import {
  TatuadorBuscaDTO,
  studioService,
} from '../../services/api/studioService';

/**
 * Busca de tatuadores para convidar à equipe (empilhada no StudioEquipeStack).
 * O backend casa o termo com nome, e-mail ou instagram e só devolve
 * tatuadores sem estúdio. Os convites enviados nesta sessão ficam marcados
 * na lista; a tela Equipe recarrega os pendentes ao voltar.
 */

const TERMO_MIN = 2;
const DEBOUNCE_MS = 400;

/** Normaliza o handle do Instagram pra exibir sempre com um único "@". */
function formatHandle(instagram: string): string {
  return `@${instagram.trim().replace(/^@+/, '')}`;
}

function Avatar({ uri }: { uri: string | null }) {
  return (
    <View className="w-11 h-11 rounded-rd-pill overflow-hidden bg-surface items-center justify-center mr-3">
      {uri ? (
        <Image source={{ uri }} className="w-full h-full" />
      ) : (
        <UserRound size={22} color="#6B6B6B" strokeWidth={1.5} />
      )}
    </View>
  );
}

function ResultadoRow({
  tatuador,
  convidado,
  convidando,
  bloqueado,
  onConvidar,
}: {
  tatuador: TatuadorBuscaDTO;
  convidado: boolean;
  convidando: boolean;
  bloqueado: boolean;
  onConvidar: () => void;
}) {
  return (
    <View className="bg-surface-2 rounded-rd-lg p-4 mb-3 flex-row items-center">
      <Avatar uri={tatuador.fotoPerfilUrl} />
      <View className="flex-1">
        <Text className="font-body-semibold text-[15px] text-ink" numberOfLines={1}>
          {tatuador.nome}
        </Text>
        {tatuador.instagram ? (
          <Text className="font-body text-[12px] text-fg-3" numberOfLines={1}>
            {formatHandle(tatuador.instagram)}
          </Text>
        ) : null}
      </View>
      {convidando ? (
        <ActivityIndicator color="#602C66" />
      ) : convidado ? (
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <Check size={14} color="#6B6B6B" />
          <Text className="font-body-semibold text-[12px] text-fg-3">Enviado</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onConvidar}
          disabled={bloqueado}
          activeOpacity={0.85}
          className="bg-ink rounded-rd-md px-4 py-2"
          style={{ opacity: bloqueado ? 0.4 : 1 }}
          accessibilityRole="button"
          accessibilityLabel={`Convidar ${tatuador.nome}`}
        >
          <Text className="font-body-bold text-[12px] text-on-ink">Convidar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ConvidarTatuadorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<TatuadorBuscaDTO[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);
  const [convidandoId, setConvidandoId] = useState<string | null>(null);
  const [convidados, setConvidados] = useState<Set<string>>(new Set());

  // Descarta respostas de buscas antigas que chegarem depois da mais recente.
  const ultimaBusca = useRef(0);

  const termoLimpo = termo.trim().replace(/^@+/, '');
  const termoValido = termoLimpo.length >= TERMO_MIN;

  useEffect(() => {
    if (!termoValido) {
      ultimaBusca.current += 1;
      setResultados([]);
      setBuscando(false);
      setErro(null);
      setBuscou(false);
      return;
    }

    const id = ++ultimaBusca.current;
    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const data = await studioService.buscarTatuadores(termoLimpo);
        if (id !== ultimaBusca.current) return;
        setResultados(data);
        setErro(null);
      } catch (err: any) {
        if (id !== ultimaBusca.current) return;
        console.warn(
          '[ConvidarTatuador] falha na busca',
          err?.response?.status,
          err?.message,
        );
        setErro('Não foi possível buscar tatuadores. Tente novamente.');
        setResultados([]);
      } finally {
        if (id === ultimaBusca.current) {
          setBuscando(false);
          setBuscou(true);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [termoLimpo, termoValido]);

  const convidar = async (tatuador: TatuadorBuscaDTO) => {
    setConvidandoId(tatuador.tatuadorId);
    try {
      await studioService.convidarTatuador(tatuador.tatuadorId);
      setConvidados((prev) => new Set(prev).add(tatuador.tatuadorId));
    } catch (err: any) {
      console.warn(
        '[ConvidarTatuador] erro ao convidar',
        err?.response?.status,
        err?.message,
      );
      const status = err?.response?.status;
      if (status === 409) {
        // Já há convite pendente, ou o tatuador entrou em outro estúdio.
        setConvidados((prev) => new Set(prev).add(tatuador.tatuadorId));
        Alert.alert(
          'Convite não enviado',
          `${tatuador.nome} já tem um convite pendente do seu estúdio ou entrou em outro estúdio.`,
        );
      } else {
        Alert.alert(
          'Erro ao convidar',
          'Não foi possível enviar o convite. Tente novamente.',
        );
      }
    } finally {
      setConvidandoId(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="CONVIDAR" onBack={() => navigation.goBack()} />

      <View className="px-6 pt-2 pb-3">
        <View className="bg-surface rounded-rd-md flex-row items-center px-4">
          <Search size={18} color="#6B6B6B" />
          <TextInput
            value={termo}
            onChangeText={setTermo}
            placeholder="Nome, e-mail ou @instagram"
            placeholderTextColor="#6B6B6B"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
            className="flex-1 font-body text-[14px] text-ink py-3 ml-2"
            accessibilityLabel="Buscar tatuador"
          />
          {buscando ? <ActivityIndicator size="small" color="#602C66" /> : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 96,
        }}
      >
        {!termoValido ? (
          <Text className="font-body text-[13px] text-fg-3 text-center mt-6 leading-[18px]">
            Digite ao menos {TERMO_MIN} caracteres para buscar. Só aparecem
            tatuadores que ainda não fazem parte de um estúdio.
          </Text>
        ) : erro ? (
          <Text className="font-body text-[13px] text-fg-2 text-center mt-6">
            {erro}
          </Text>
        ) : buscou && !buscando && resultados.length === 0 ? (
          <View className="bg-surface-2 rounded-rd-lg p-6 items-center mt-2">
            <Text className="font-aux-bold text-[15px] text-ink mb-1 text-center">
              Nenhum tatuador encontrado
            </Text>
            <Text className="font-body text-[13px] text-fg-3 text-center leading-[18px]">
              Confira a grafia ou tente pelo e-mail ou instagram.
            </Text>
          </View>
        ) : (
          resultados.map((t) => (
            <ResultadoRow
              key={t.tatuadorId}
              tatuador={t}
              convidado={convidados.has(t.tatuadorId)}
              convidando={convidandoId === t.tatuadorId}
              bloqueado={convidandoId !== null}
              onConvidar={() => convidar(t)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
