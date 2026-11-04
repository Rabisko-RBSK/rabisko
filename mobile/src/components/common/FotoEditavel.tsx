import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { Camera } from 'lucide-react-native';

import { escolherImagemDaGaleria } from '../../utils/imagePicker';

interface Props {
  fotoUrl: string | null;
  /** Inicial mostrada sem foto. */
  nome: string;
  /** Sobe a imagem local e devolve a URL gravada. */
  enviar: (localUri: string) => Promise<string>;
  onAtualizada: (url: string) => void;
}

/** Avatar redondo que troca a foto ao tocar: galeria (recorte quadrado) e upload na hora. */
export function FotoEditavel({ fotoUrl, nome, enviar, onAtualizada }: Props) {
  const [enviando, setEnviando] = useState(false);

  const trocar = async () => {
    const uri = await escolherImagemDaGaleria({ quadrada: true });
    if (!uri) return;
    setEnviando(true);
    try {
      onAtualizada(await enviar(uri));
    } catch (err: any) {
      console.warn('[FotoEditavel] erro no upload', err?.response?.status, err?.message);
      Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={trocar}
      disabled={enviando}
      activeOpacity={0.85}
      className="self-center mb-6"
      accessibilityRole="button"
      accessibilityLabel="Trocar foto"
    >
      <View
        className="rounded-rd-pill bg-ink items-center justify-center overflow-hidden"
        style={{ width: 110, height: 110 }}
      >
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} className="w-full h-full" />
        ) : (
          <Text className="font-display text-[44px] text-white">{nome.charAt(0).toUpperCase()}</Text>
        )}
        {enviando && (
          <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </View>
      <View className="absolute bottom-0 right-0 bg-plum rounded-rd-pill p-2 border-2 border-background">
        <Camera size={16} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}
