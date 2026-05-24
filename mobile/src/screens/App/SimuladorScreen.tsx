import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { ImagePlus, Sparkles, Camera, Wand2, Trash2, Save, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Header } from '../../components/common/Header';

/**
 * Simulador (DESIGN.md §10 #07 — BiskoAI.jsx). Pre-visualiza a tatuagem no corpo do cliente
 * usando uma foto + uma referência do desenho. Contraparte mobile do `boofcv-all` no backend
 * (Spring) — ainda não wired.
 *
 * Por enquanto é só uma tela-placeholder ligada à aba do BottomNav: hero com Bebas + copy +
 * dois CTAs ("Tirar foto" / "Carregar do rolo"). Quando o `expo-image-picker` for plugado,
 * cada CTA dispara a câmera/galeria, depois um segundo passo pede a referência da tatuagem,
 * e aí o pipeline (BoofCV no backend) compõe a simulação.
 */

type ImageInfo = { uri: string; width: number; height: number };

export function SimuladorScreen() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const viewShotRef = useRef<any>(null);

  // Reanimated values for pan, zoom, and rotation
  const offset = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedOffset = useSharedValue({ x: 0, y: 0 });
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const processReferenceImage = async (uri: string, width: number, height: number) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: uri,
        name: 'reference.jpg',
        type: 'image/jpeg',
      } as any);

      const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/simulation/removebg`;

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        // React Native fetch with FormData will automatically set the correct Content-Type with boundary
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64Uri = reader.result as string;
        setImages((prev) => [...prev, { uri: base64Uri, width, height }]);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Erro ao remover fundo:', error);
      Alert.alert('Aviso', 'Não foi possível limpar o fundo automaticamente. Usando imagem original.');
      setImages((prev) => [...prev, { uri, width, height }]);
      setIsProcessing(false);
    }
  };

  const handleImageAdded = (uri: string, width: number, height: number) => {
    if (images.length === 0) {
      // Primeira imagem (Base)
      setImages([{ uri, width, height }]);
    } else if (images.length === 1) {
      // Segunda imagem (Referência) -> Manda pro Backend
      processReferenceImage(uri, width, height);
    }
  };

  const abrirCamera = async () => {
    if (images.length >= 2) return;
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
      const asset = result.assets[0];
      handleImageAdded(asset.uri, asset.width, asset.height);
    }
  };

  const abrirGaleria = async () => {
    if (images.length >= 2) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permissão necessária',
        'É necessário permitir o acesso à galeria para escolher uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      handleImageAdded(asset.uri, asset.width, asset.height);
    }
  };

  const limparImagens = () => {
    setImages([]);
    offset.value = { x: 0, y: 0 };
    scale.value = 1;
    rotation.value = 0;
    savedOffset.value = { x: 0, y: 0 };
    savedScale.value = 1;
    savedRotation.value = 0;
  };

  const salvarSimulacao = async () => {
    try {
      if (!viewShotRef.current) return;
      const uri = await viewShotRef.current.capture();

      // 1. Tenta pedir permissão do MediaLibrary
      const permission = await MediaLibrary.requestPermissionsAsync();
      
      if (permission.granted) {
        try {
          // 2. Se tiver permissão, tenta salvar diretamente
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Sucesso!', 'A simulação foi salva na sua galeria.');
          return;
        } catch (saveError) {
          console.warn('Falha ao salvar via MediaLibrary, usando fallback de compartilhamento:', saveError);
        }
      }

      // 3. Fallback: Se não tiver permissão ou se o salvamento direto falhar (limitações do Android/Expo Go),
      // usamos o compartilhamento nativo para permitir que o usuário salve a imagem.
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

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      offset.value = {
        x: savedOffset.value.x + e.translationX,
        y: savedOffset.value.y + e.translationY,
      };
    })
    .onEnd(() => {
      savedOffset.value = {
        x: offset.value.x,
        y: offset.value.y,
      };
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + (e.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.value.x },
      { translateY: offset.value.y },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <View className="flex-1 bg-background">
      <Header title="Simulador" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — copy + selo "novidade" */}
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

        {/* Hero ilustrativo (placeholder até o fluxo real). `width: '100%'` é obrigatório:
            quando uma View tem só `aspectRatio` (sem width), o Yoga sized-to-content em vez de
            esticar — ela encolhe pro tamanho dos filhos e sobra margem na direita. */}
        <GestureHandlerRootView>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
            <View
              className="bg-surface items-center justify-center rounded-xl mb-6 overflow-hidden"
              style={{ width: '100%', aspectRatio: images.length > 0 ? images[0].width / images[0].height : 4 / 3, position: 'relative' }}
            >
            {isProcessing && (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text className="font-body-bold text-[14px] text-surface mt-3">Processando imagem...</Text>
              </View>
            )}

            {images.length === 0 ? (
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
              <>
                <Image
                  source={{ uri: images[0].uri }}
                  style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%', resizeMode: 'cover' }]}
                />

                {images.length > 1 && (
                  <GestureDetector gesture={composed}>
                    <Animated.Image
                      source={{ uri: images[1].uri }}
                      style={[
                        { width: '50%', height: '50%', resizeMode: 'contain', opacity: 0.9 },
                        animatedStyle,
                      ]}
                    />
                  </GestureDetector>
                )}
              </>
            )}
          </View>
          </ViewShot>
        </GestureHandlerRootView>

        {images.length < 2 && (
          <>
            <TouchableOpacity // Botão tirar foto
              activeOpacity={0.65}
              className="bg-ink flex-row items-center justify-center py-4 rounded-md mb-3"
              style={{ gap: 10 }}
              onPress={abrirCamera}
            >
              <Camera size={18} color="#FFFFFF" />
              <Text className="font-body-bold text-[16px] text-surface" style={{ textAlign: 'center' }}>
                Tirar foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity // Botão importar foto
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

        {images.length === 2 && (
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

        <Text className="font-body text-[11px] text-fg-3 text-center mt-6">
          Suas simulações ficam salvas aqui e podem ser enviadas direto no chat com o artista.
        </Text>
      </ScrollView>
    </View>
  );
}
