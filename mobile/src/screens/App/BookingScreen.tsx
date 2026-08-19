import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Header } from '../../components/common/Header';
import { Stepper } from '../../components/common/Stepper';
import { CalendarMini } from '../../components/common/CalendarMini';
import { Button } from '../../components/common/Button';
import { HomeStackParamList } from '../../routes/home.stack';

/** Same mock artist as ArtistProfile until the API is wired (P1). */
const ARTIST = {
  id: '1',
  name: 'João Santos',
  tags: ['Realismo', 'Minimalista'],
  photo: 'https://images.unsplash.com/photo-1682406593404-99578759c260?q=80&w=200&auto=format&fit=crop',
};

/** Fixed slots per the design spec (6 slots, 3 per row). */
const TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

export function BookingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('14:00');

  const subline = useMemo(() => {
    if (!selectedDate) return '';
    return `${format(selectedDate, "d 'de' MMM", { locale: ptBR })} · ${selectedTime}`;
  }, [selectedDate, selectedTime]);

  return (
    <View className="flex-1 bg-background">
      <Header title="Reserva" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      >
        <Stepper current={1} />

        <View className="flex-row items-center mb-5 mt-2">
          <View className="rounded-rd-pill overflow-hidden bg-surface mr-3" style={{ width: 46, height: 46 }}>
            <Image source={{ uri: ARTIST.photo }} className="w-full h-full" />
          </View>
          <View className="flex-1">
            <Text className="font-body-semibold text-[15px] text-ink">{ARTIST.name}</Text>
            <Text className="font-body text-[12px] text-fg-3">{ARTIST.tags.join(' · ')}</Text>
          </View>
        </View>

        <CalendarMini selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        <Text className="font-aux-bold text-[20px] text-ink mt-7">Horário</Text>
        <Text className="font-body text-[13px] text-fg-2 mt-1 mb-4 capitalize">{subline}</Text>

        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {TIME_SLOTS.map((time) => {
            const selected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.85}
                className={`items-center justify-center rounded-rd-md py-4 ${selected ? 'bg-ink' : 'bg-surface'}`}
                style={{ width: '31.5%' }}
              >
                <Text
                  className={`font-body-semibold text-[15px] ${selected ? 'text-on-ink' : 'text-ink'}`}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-background pt-3 px-6" style={{ paddingBottom: 24 }}>
        <Button
          title="Avançar para Pagamento"
          onPress={() => navigation.navigate('Payment', { bookingId: ARTIST.id })}
        />
      </View>
    </View>
  );
}
