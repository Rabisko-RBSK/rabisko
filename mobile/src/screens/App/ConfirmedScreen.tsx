import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Stepper } from '../../components/common/Stepper';
import { StatusPill } from '../../components/common/Chip';
import { Button } from '../../components/common/Button';
import { HomeStackParamList } from '../../routes/home.stack';

const PLUM = '#602C66';

/** Animated check + 2 expanding rings (DESIGN.md §10 / IMPLEMENTATION-CHECKLIST P2 #06b). */
function ConfirmedHero() {
  const checkScale = useSharedValue(0);
  const ringA = useSharedValue(0);
  const ringB = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withDelay(120, withSpring(1, { damping: 9, stiffness: 140 }));
    const ringLoop = () =>
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      );
    ringA.value = withSequence(withDelay(220, ringLoop()));
    ringB.value = withSequence(withDelay(520, ringLoop()));
  }, [checkScale, ringA, ringB]);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const ringAStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ringA.value * 1.4 }],
    opacity: 1 - ringA.value,
  }));
  const ringBStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ringB.value * 1.4 }],
    opacity: 1 - ringB.value,
  }));

  return (
    <View className="items-center justify-center my-8" style={{ height: 140 }}>
      <Animated.View
        style={[
          { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: PLUM },
          ringAStyle,
        ]}
      />
      <Animated.View
        style={[
          { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: PLUM },
          ringBStyle,
        ]}
      />
      <Animated.View
        style={[
          { width: 100, height: 100, borderRadius: 50, backgroundColor: PLUM, alignItems: 'center', justifyContent: 'center' },
          checkStyle,
        ]}
      >
        <Check size={48} color="#FFFFFF" strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

type ConfirmedRoute = RouteProp<HomeStackParamList, 'Confirmed'>;

const FALLBACK = {
  artistName: 'João Santos',
  dateTime: 'Ter 14 Out · 14:00',
  total: 'R$ 220,00',
  photo: 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=200&auto=format&fit=crop',
};

export function ConfirmedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<ConfirmedRoute>();
  const { artistName = FALLBACK.artistName, dateTime = FALLBACK.dateTime, total = FALLBACK.total } =
    route.params ?? {};

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: 56 }}>
      <View className="px-6">
        <Stepper current={3} />
      </View>

      <View className="flex-1 px-6">
        <ConfirmedHero />

        <Text className="font-display text-[32px] leading-[34px] text-ink text-center">
          RESERVA CONFIRMADA
        </Text>
        <Text className="font-body text-[14px] text-fg-2 text-center mt-3 px-6 leading-[20px]">
          Você receberá uma confirmação do artista em até 24h. Acompanhe pelo chat.
        </Text>

        <View className="bg-surface rounded-rd-lg p-4 mt-7 flex-row items-center">
          <View className="rounded-rd-pill overflow-hidden bg-paper mr-3" style={{ width: 46, height: 46 }}>
            <Image source={{ uri: FALLBACK.photo }} className="w-full h-full" />
          </View>
          <View className="flex-1">
            <Text className="font-body-semibold text-[15px] text-ink">{artistName}</Text>
            <Text className="font-body text-[12px] text-fg-2 mt-0.5">
              {dateTime} · {total}
            </Text>
          </View>
          <StatusPill label="PAGO" tone="plum" />
        </View>

        <View className="flex-1" />

        <Button
          title={`Abrir Chat com ${artistName.split(' ')[0]}`}
          onPress={() => {
          }}
        />
        <Button
          title="Voltar para Home"
          variant="ghost"
          className="mt-2"
          onPress={() => navigation.popToTop()}
        />
      </View>

      <View style={{ height: 24 }} />
    </View>
  );
}
