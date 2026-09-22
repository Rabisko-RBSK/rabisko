import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthRoutesParamList } from '../../routes/auth.routes';
import { Button } from '../../components/common/Button';

/**
 * Landing (#01 in design/screenshots/01-landing.png) — initial route of `AuthRoutes`.
 * Vertically + horizontally centered: ink logo block 132×132 (`r-2xl`), "RABISKO" in Bebas 64,
 * tagline 14/Inter centered (max 280), primary CTA "Entrar", then text link "Novo por aqui?
 * Criar conta".
 *
 * Logo: marca "Bisko Branco" (polvo branco sobre ink) em `assets/images/bisko-branco.png`. O
 * PNG já tem o fundo ink embutido (512×512); o container `rounded-rd-2xl overflow-hidden` clipa
 * os cantos arredondados sobre a imagem.
 */
export function LandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthRoutesParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background items-center justify-center px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <View
        className="bg-ink rounded-rd-2xl overflow-hidden mb-7"
        style={{ width: 132, height: 132 }}
      >
        <Image
          source={require('../../../assets/images/bisko-branco.png')}
          style={{ width: 132, height: 132 }}
          resizeMode="contain"
          accessibilityLabel="Logo Rabisko"
        />
      </View>

      <Text className="font-display text-[64px] leading-[62px] text-ink" style={{ letterSpacing: 1.3 }}>
        RABISKO
      </Text>

      <Text
        className="font-body text-[14px] text-fg-2 text-center mt-3.5 mb-12"
        style={{ maxWidth: 280 }}
      >
        Transforme sua vida com um Rabisko.
      </Text>

      <View className="w-full">
        <Button title="Entrar" onPress={() => navigation.navigate('Login')} />
      </View>

      <View className="flex-row mt-5">
        <Text className="font-body text-[14px] text-fg-2">Novo por aqui? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} hitSlop={8}>
          <Text className="font-body-bold text-[14px] text-ink">Criar conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
