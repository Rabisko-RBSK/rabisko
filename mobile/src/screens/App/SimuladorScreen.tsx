import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { ImagePlus, Sparkles, Camera, Wand2, Trash2, Save, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Header } from '../../components/common/Header';
import { FilterChip } from '../../components/common/Chip';
import {
  TattooSimulationCanvas,
  type TattooSimulationCanvasHandle,
} from '../../components/simulator/TattooSimulationCanvas';
import { IDENTITY_TRANSFORM, type TattooTransform } from '../../components/simulator/tattooMath';
import { simulationService } from '../../services/api/simulationService';
import {
  limparCacheSimulador,
  medirImagem,
  normalizarImagem,
  salvarBytesEmCache,
  type ImageInfo,
} from '../../utils/localImage';
import type { DepthMap } from '../../utils/depthPng';

/**
 * Simulador (DESIGN.md §10 #07 — BiskoAI.jsx). Pré-visualiza a tatuagem no corpo do cliente
 * usando uma foto + uma referência do desenho.
 *
 * Fluxo: a primeira imagem é a foto da pele — ela é normalizada (≤ 2048 px, EXIF aplicado) e
 * enviada para `POST /simulation/depthmap`, que devolve o relevo estimado pelo Depth Anything V2.
 * A segunda é a referência da tatuagem, que passa por `POST /simulation/removebg` (U2Net /
 * line art) para ficar com fundo transparente. As duas entram no `TattooSimulationCanvas`
 * (expo-gl + three.js), que desloca um plano 3D pelo depth map e funde a arte em Multiply na GPU.
 *
 * Os gestos (arrastar, pinçar, girar) rodam na thread JS (`runOnJS(true)`) e vão direto para o
 * canvas pela ref — nada de estado React no caminho quente, para manter 60 FPS. "Salvar" captura
 * o frame do WebGL (`captureSnapshot`) e grava na galeria.
 */

type DepthStatus = 'idle' | 'loading' | 'ready' | 'failed';
type Relevo = 'suave' | 'medio' | 'forte';

const RELEVOS: { id: Relevo; label: string; displacementScale: number }[] = [
  { id: 'suave', label: 'Suave', displacementScale: 0.2 },
  { id: 'medio', label: 'Médio', displacementScale: 0.4 },
  { id: 'forte', label: 'Forte', displacementScale: 0.7 },
];

/**
 * Gestos de manipulação da tatuagem (arrastar, pinçar, girar), simultâneos. Cada gesto guarda no
 * seu `onStart` o estado de onde partiu e só altera o próprio campo, então os três podem rodar ao
 * mesmo tempo sem se atropelar. Os callbacks rodam na thread JS (`runOnJS(true)`): quem consome o
 * gesto é o canvas WebGL, que renderiza a partir do JS, então passar pelo worklet da Reanimated
 * só adicionaria uma ida e volta entre threads.
 *
 * Fecha sobre o handle do canvas (estado), não sobre refs: a regra `react-hooks/refs` do React
 * Compiler proíbe passar funções que leem refs para chamadas feitas durante o render.
 */
function criarGestosDaTatuagem(canvas: TattooSimulationCanvasHandle | null) {
  const estadoAtual = (): TattooTransform => canvas?.getTransform() ?? { ...IDENTITY_TRANSFORM };
  let basePan = estadoAtual();
  let basePinch = basePan;
  let baseRotation = basePan;

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      basePan = estadoAtual();
    })
    .onUpdate((e) => {
      canvas?.setTransform({ x: basePan.x + e.translationX, y: basePan.y + e.translationY });
    });

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      basePinch = estadoAtual();
    })
    .onUpdate((e) => {
      canvas?.setTransform({ scale: basePinch.scale * e.scale });
    });

  const rotation = Gesture.Rotation()
    .runOnJS(true)
    .onStart(() => {
      baseRotation = estadoAtual();
    })
    .onUpdate((e) => {
      canvas?.setTransform({ rotation: baseRotation.rotation + (e.rotation * 180) / Math.PI });
    });

  return Gesture.Simultaneous(pan, pinch, rotation);
}

export function SimuladorScreen() {
  const [fotoBase, setFotoBase] = useState<ImageInfo | null>(null);
  const [tatuagem, setTatuagem] = useState<ImageInfo | null>(null);
  const [depthMap, setDepthMap] = useState<DepthMap | null>(null);
  const [depthStatus, setDepthStatus] = useState<DepthStatus>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [relevo, setRelevo] = useState<Relevo>('medio');

  // Handle imperativo do canvas guardado como estado (callback ref): os gestos fecham sobre ele.
  // Volta a null quando o canvas desmonta ("Limpar"), e o próximo canvas nasce com a arte centrada.
  const [canvas, setCanvas] = useState<TattooSimulationCanvasHandle | null>(null);
  // Invalida respostas do depth map que chegarem depois de "Limpar" ou de outra foto.
  const depthRequestRef = useRef(0);
  const renderErrorShownRef = useRef(false);

  const adicionarFotoBase = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsProcessing(true);
    let foto: ImageInfo;
    try {
      foto = await normalizarImagem(asset.uri, asset.width, asset.height);
    } catch (error) {
      console.error('Erro ao preparar a foto:', error);
      Alert.alert('Erro', 'Não foi possível preparar a foto. Tente outra imagem.');
      setIsProcessing(false);
      return;
    }
    setFotoBase(foto);
    setIsProcessing(false);

    const requestId = ++depthRequestRef.current;
    setDepthStatus('loading');
    try {
      const map = await simulationService.gerarDepthMap(foto.uri);
      if (requestId !== depthRequestRef.current) return;
      setDepthMap(map);
      setDepthStatus('ready');
    } catch (error) {
      if (requestId !== depthRequestRef.current) return;
      console.warn('Erro ao gerar o mapa de profundidade:', error);
      setDepthStatus('failed');
      Alert.alert('Aviso', 'Não foi possível calcular o relevo da foto. A simulação segue sem a profundidade 3D.');
    }
  };

  const adicionarTatuagem = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsProcessing(true);
    try {
      const referencia = await normalizarImagem(asset.uri, asset.width, asset.height);
      try {
        const png = await simulationService.removerFundo(referencia.uri);
        const file = salvarBytesEmCache(png, `tatuagem-${Date.now()}.png`);
        const { width, height } = await medirImagem(file.uri);
        setTatuagem({ uri: file.uri, width, height });
      } catch (error) {
        console.error('Erro ao remover fundo:', error);
        Alert.alert('Aviso', 'Não foi possível limpar o fundo automaticamente. Usando imagem original.');
        setTatuagem(referencia);
      }
    } catch (error) {
      console.error('Erro ao preparar a referência:', error);
      Alert.alert('Erro', 'Não foi possível preparar a imagem da tatuagem. Tente outra imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageAdded = (asset: ImagePicker.ImagePickerAsset) => {
    if (!fotoBase) {
      void adicionarFotoBase(asset);
    } else if (!tatuagem) {
      void adicionarTatuagem(asset);
    }
  };

  const abrirCamera = async () => {
    if (fotoBase && tatuagem) return;
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Permissão necessária',
        'É necessário permitir o acesso à câmera para tirar uma foto.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      handleImageAdded(result.assets[0]);
    }
  };

  const abrirGaleria = async () => {
    if (fotoBase && tatuagem) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permissão necessária',
        'É necessário permitir o acesso à galeria para escolher uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      handleImageAdded(result.assets[0]);
    }
  };

  const limparImagens = () => {
    depthRequestRef.current += 1;
    setFotoBase(null);
    setTatuagem(null);
    setDepthMap(null);
    setDepthStatus('idle');
    setRelevo('medio');
    renderErrorShownRef.current = false;
    // As texturas já estão na GPU (ou o canvas está desmontando): os arquivos podem ir embora.
    limparCacheSimulador();
  };

  const salvarSimulacao = async () => {
    try {
      if (!canvas) return;
      const { uri } = await canvas.captureSnapshot({ format: 'jpeg', quality: 0.9 });

      const permission = await MediaLibrary.requestPermissionsAsync();

      if (permission.granted) {
        try {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Sucesso!', 'A simulação foi salva na sua galeria.');
          return;
        } catch (saveError) {
          console.warn('Falha ao salvar via MediaLibrary, usando fallback de compartilhamento:', saveError);
        }
      }

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Salvar Simulação',
          mimeType: 'image/jpeg',
        });
      } else {
        Alert.alert(
          'Erro ao salvar',
          'Não foi possível salvar a imagem diretamente e o compartilhamento nativo não está disponível.'
        );
      }
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      Alert.alert('Erro', 'Não foi possível salvar a imagem.');
    }
  };

  const handleRenderError = useCallback(() => {
    if (renderErrorShownRef.current) return;
    renderErrorShownRef.current = true;
    Alert.alert('Erro', 'Não foi possível renderizar a simulação 3D neste aparelho.');
  }, []);

  const composed = useMemo(() => criarGestosDaTatuagem(canvas), [canvas]);

  const displacementScale = RELEVOS.find((opcao) => opcao.id === relevo)?.displacementScale ?? 0.4;

  return (
    <View className="flex-1 bg-background">
      <Header title="Simulador" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center mt-1 mb-3" style={{ gap: 8 }}>
          <View
            className="bg-plum items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 14 }}
          >
            <Sparkles size={14} color="#FFFFFF" />
          </View>
          <Text className="font-body-bold text-[10px] tracking-widest text-plum">
            BISKO AI · NOVIDADE
          </Text>
        </View>

        <Text className="font-display text-[44px] leading-[44px] text-ink mb-3">
          VEJA NO SEU{'\n'}CORPO ANTES{'\n'}DE TATUAR
        </Text>

        <Text className="font-body text-[14px] leading-[20px] text-fg-2 mb-6">
          Tire uma foto do braço, perna ou onde quiser, escolha uma referência de tatuagem e a
          gente compõe a simulação pra você ver como vai ficar.
        </Text>

        <GestureHandlerRootView>
          <View
            className="bg-surface items-center justify-center rounded-xl mb-3 overflow-hidden"
            style={{ width: '100%', aspectRatio: fotoBase ? fotoBase.width / fotoBase.height : 4 / 3 }}
          >
            {isProcessing && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text className="font-body-bold text-[14px] text-surface mt-3">Processando imagem...</Text>
              </View>
            )}

            {!fotoBase ? (
              <>
                <View
                  className="bg-plum-tint items-center justify-center mb-3"
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                >
                  <Wand2 size={28} color="#602C66" />
                </View>
                <Text className="font-body-semibold text-[14px] text-ink">Nenhuma simulação ainda</Text>
                <Text className="font-body text-[12px] text-fg-3 mt-1 text-center px-6">
                  A primeira imagem deve ser o local aonde a tatuagem será aplicada e a segunda imagem a referência da tatuagem
                </Text>
              </>
            ) : (
              <GestureDetector gesture={composed}>
                <View style={StyleSheet.absoluteFill}>
                  <TattooSimulationCanvas
                    ref={setCanvas}
                    skin={fotoBase}
                    depthMap={depthMap}
                    tattoo={tatuagem}
                    displacementScale={displacementScale}
                    onError={handleRenderError}
                  />
                </View>
              </GestureDetector>
            )}
          </View>
        </GestureHandlerRootView>

        {fotoBase && depthStatus === 'loading' && (
          <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
            <ActivityIndicator size="small" color="#602C66" />
            <Text className="font-body text-[12px] text-fg-3">Calculando o relevo da pele...</Text>
          </View>
        )}

        {fotoBase && depthStatus === 'ready' && (
          <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
            <Text className="font-body-semibold text-[12px] text-fg-2 mr-1">Relevo</Text>
            {RELEVOS.map((opcao) => (
              <FilterChip
                key={opcao.id}
                label={opcao.label}
                active={relevo === opcao.id}
                onPress={() => setRelevo(opcao.id)}
              />
            ))}
          </View>
        )}

        {fotoBase && depthStatus === 'failed' && (
          <Text className="font-body text-[12px] text-fg-3 mb-3">
            Relevo indisponível — a simulação segue sem a profundidade 3D.
          </Text>
        )}

        {!tatuagem && (
          <>
            <TouchableOpacity
              activeOpacity={0.65}
              className="bg-ink flex-row items-center justify-center py-4 rounded-md mb-3"
              style={{ gap: 10 }}
              onPress={abrirCamera}
            >
              <Camera size={18} color="#FFFFFF" />
              <Text className="font-body-bold text-[16px] text-surface" style={{ textAlign: 'center' }}>
                {fotoBase ? 'Fotografar a referência' : 'Tirar foto'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.65}
              className="bg-surface flex-row items-center justify-center py-4 rounded-md mb-3"
              style={{ gap: 10 }}
              onPress={abrirGaleria}
            >
              <ImagePlus size={18} color="#000000" />
              <Text className="font-body-bold text-[16px] text-ink" style={{ textAlign: 'center' }}>
                Carregar da galeria
              </Text>
            </TouchableOpacity>
          </>
        )}

        {fotoBase && tatuagem && (
          <View className="mb-3" style={{ gap: 12 }}>
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.65}
                className="bg-ink flex-row flex-1 items-center justify-center py-4 rounded-md px-2"
                style={{ gap: 8 }}
                onPress={() => Alert.alert('Em breve!', 'A conexão com o chat do tatuador será implementada na próxima versão.')}
              >
                <Send size={18} color="#FFFFFF" />
                <Text className="font-body-bold text-[14px] text-surface text-center">Enviar p/ Tatuador</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.65}
                className="bg-plum flex-row flex-1 items-center justify-center py-4 rounded-md px-2"
                style={{ gap: 8 }}
                onPress={salvarSimulacao}
              >
                <Save size={18} color="#FFFFFF" />
                <Text className="font-body-bold text-[14px] text-surface text-center">Salvar Imagem</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.65}
              className="bg-red-50 flex-row w-full items-center justify-center py-4 rounded-md"
              style={{ gap: 8, backgroundColor: '#FEE2E2' }}
              onPress={limparImagens}
            >
              <Trash2 size={18} color="#DC2626" />
              <Text className="font-body-bold text-[14px]" style={{ color: '#DC2626' }}>Limpar Simulação</Text>
            </TouchableOpacity>
          </View>
        )}

        {fotoBase && !tatuagem && (
          <TouchableOpacity
            activeOpacity={0.65}
            className="flex-row w-full items-center justify-center py-3 rounded-md mb-3"
            style={{ gap: 8 }}
            onPress={limparImagens}
          >
            <Trash2 size={16} color="#6B6B6B" />
            <Text className="font-body-semibold text-[13px] text-fg-3">Trocar a foto</Text>
          </TouchableOpacity>
        )}

        <Text className="font-body text-[11px] text-fg-3 text-center mt-6">
          Suas simulações ficam salvas aqui e podem ser enviadas direto no chat com o artista.
        </Text>
      </ScrollView>
    </View>
  );
}
