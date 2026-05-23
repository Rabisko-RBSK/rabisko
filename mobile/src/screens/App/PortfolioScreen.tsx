import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { ArtistProfileStackParamList } from '../../routes/artist-profile.stack';
import {
  artistService,
  PortfolioImage,
} from '../../services/api/artistService';
import { escolherImagemDaGaleria } from '../../utils/imagePicker';

/**
 * Portfólio completo do tatuador — aberto pelo botão "Ver Todos" do perfil.
 * Grade de 2 colunas com todas as imagens; o carrossel da tela de perfil é só
 * uma prévia.
 *
 * Recebe as imagens já carregadas via params (snapshot do ArtistProfileScreen)
 * e mantém esse mesmo array como estado local — assim as operações de
 * adicionar/remover do modo de edição refletem na hora, sem refetch. Quando
 * o usuário volta pra tela de perfil, ela própria re-busca via `useFocusEffect`.
 *
 * Modo de edição (botão lápis no canto superior direito): exibe um botão
 * "Adicionar" e overlay de lixeira em cada tile. Operações chamam
 * `POST /artist/me/portfolio` e `DELETE /artist/me/portfolio/{id}`.
 */

type PortfolioRoute = RouteProp<ArtistProfileStackParamList, 'Portfolio'>;
type PortfolioNav = NativeStackNavigationProp<
  ArtistProfileStackParamList,
  'Portfolio'
>;

const GAP = 12;
// Largura do tile para 2 colunas dentro da área útil (tela − 2×24 de margem).
const TILE_WIDTH = (Dimensions.get('window').width - 48 - GAP) / 2;

export function PortfolioScreen() {
  const navigation = useNavigation<PortfolioNav>();
  const route = useRoute<PortfolioRoute>();
  const insets = useSafeAreaInsets();

  const { artistName } = route.params;

  // Estado local — seed das params, atualizado pelas operações de edição.
  const [images, setImages] = useState<PortfolioImage[]>(route.params.images);
  const [editing, setEditing] = useState(false);
  /** Bloqueia novas ações enquanto um add/remove está em curso, pra evitar
   *  taps duplos disparando 2 requests pra mesma imagem. */
  const [working, setWorking] = useState(false);

  const adicionarImagem = async () => {
    if (working) return;
    const uri = await escolherImagemDaGaleria();
    if (!uri) return;
    setWorking(true);
    try {
      const nova = await artistService.adicionarImagemPortfolio(uri);
      // Prepend pra que o trabalho recém-adicionado apareça primeiro.
      setImages((prev) => [nova, ...prev]);
    } catch (err: any) {
      console.warn(
        '[Portfolio] erro ao adicionar imagem',
        err?.response?.status,
        err?.message,
      );
      Alert.alert(
        'Erro ao adicionar',
        'Não foi possível adicionar a imagem ao portfólio.',
      );
    } finally {
      setWorking(false);
    }
  };

  const confirmarRemocao = (img: PortfolioImage) => {
    if (working) return;
    Alert.alert(
      'Remover imagem?',
      img.descricao
        ? `Esta ação não pode ser desfeita: "${img.descricao}".`
        : 'Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => removerImagem(img),
        },
      ],
    );
  };

  const removerImagem = async (img: PortfolioImage) => {
    setWorking(true);
    try {
      await artistService.removerImagemPortfolio(img.imagemId);
      setImages((prev) => prev.filter((i) => i.imagemId !== img.imagemId));
    } catch (err: any) {
      console.warn(
        '[Portfolio] erro ao remover imagem',
        err?.response?.status,
        err?.message,
      );
      Alert.alert(
        'Erro ao remover',
        'Não foi possível remover a imagem do portfólio.',
      );
    } finally {
      setWorking(false);
    }
  };

  /* ---------- Header right slot ---------- */

  const renderHeaderRight = () => {
    if (working) return <ActivityIndicator color="#602C66" />;
    if (editing) {
      return (
        <TouchableOpacity
          onPress={() => setEditing(false)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Concluir edição do portfólio"
        >
          <Check size={26} color="#602C66" strokeWidth={2.5} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => setEditing(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Editar portfólio"
      >
        <Pencil size={22} color="#000000" />
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="PORTFÓLIO"
        onBack={() => navigation.goBack()}
        right={renderHeaderRight()}
      />

      <View className="px-6 mb-3 flex-row items-center justify-between">
        <Text className="font-body text-[13px] text-fg-2 flex-1" numberOfLines={1}>
          {artistName} · {images.length}{' '}
          {images.length === 1 ? 'trabalho' : 'trabalhos'}
        </Text>
        {editing && (
          <TouchableOpacity
            onPress={adicionarImagem}
            activeOpacity={0.85}
            disabled={working}
            className="flex-row items-center bg-ink rounded-r-pill pl-3 pr-4 py-2 ml-3"
            accessibilityRole="button"
            accessibilityLabel="Adicionar imagem ao portfólio"
            style={{ opacity: working ? 0.5 : 1 }}
          >
            <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text className="font-body-bold text-[12px] text-on-ink">
              Adicionar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={images}
        keyExtractor={(item) => item.imagemId}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 96,
          gap: GAP,
        }}
        renderItem={({ item }) => (
          <View style={{ width: TILE_WIDTH }}>
            <View
              className="rounded-r-lg overflow-hidden bg-surface"
              style={{ width: TILE_WIDTH, aspectRatio: 1 }}
            >
              <Image source={{ uri: item.url }} className="w-full h-full" />
              {editing && (
                <TouchableOpacity
                  onPress={() => confirmarRemocao(item)}
                  activeOpacity={0.85}
                  disabled={working}
                  hitSlop={6}
                  className="absolute top-2 right-2 w-8 h-8 rounded-r-pill bg-ink items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.descricao
                      ? `Remover imagem "${item.descricao}"`
                      : 'Remover imagem do portfólio'
                  }
                >
                  <Trash2 size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            {item.descricao ? (
              <Text
                className="font-body text-[12px] text-fg-3 mt-1.5"
                numberOfLines={1}
              >
                {item.descricao}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center mt-16 px-8">
            <Text className="font-aux-bold text-[18px] text-ink mb-2 text-center">
              Portfólio vazio
            </Text>
            <Text className="font-body text-[13px] text-fg-2 text-center">
              {editing
                ? 'Toque em "Adicionar" para enviar a primeira imagem.'
                : 'As imagens adicionadas ao portfólio aparecerão aqui.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
