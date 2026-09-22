import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { CreditCard, QrCode, Smartphone, Lock, type LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../../components/common/Header';
import { Stepper } from '../../components/common/Stepper';
import { Button } from '../../components/common/Button';
import { HomeStackParamList } from '../../routes/home.stack';

const PROJECT_PHOTO =
  'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=800&auto=format&fit=crop';

const METHODS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'pix', label: 'Pix', icon: QrCode },
  { id: 'card', label: 'Cartão', icon: CreditCard },
  { id: 'apple', label: 'Apple Pay', icon: Smartphone },
];

function BreakdownRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text
        className={`text-[14px] ${bold ? 'font-body-bold text-ink' : 'font-body text-fg-2'}`}
      >
        {label}
      </Text>
      <Text
        className={`text-[14px] ${bold ? 'font-body-bold text-ink' : 'font-body text-ink'}`}
      >
        {value}
      </Text>
    </View>
  );
}

function MethodTile({
  label,
  icon: Icon,
  selected,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`flex-1 items-center justify-center bg-surface rounded-rd-md py-5 border-2 ${
        selected ? 'border-plum' : 'border-transparent'
      }`}
    >
      <Icon size={24} color="#000000" />
      <Text className="font-body-medium text-[12px] text-ink mt-2">{label}</Text>
    </TouchableOpacity>
  );
}

export function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [selectedMethod, setSelectedMethod] = useState('pix');
  const [processing, setProcessing] = useState(false);

  const handleConfirm = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      navigation.navigate('Confirmed', {
        artistName: 'João Santos',
        dateTime: 'Ter 14 Out · 14:00',
        total: 'R$ 220,00',
      });
    }, 700);
  }, [navigation]);

  return (
    <View className="flex-1 bg-background">
      <Header title="Pagamento" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      >
        <Stepper current={2} />

        <Text className="font-body text-[13px] text-fg-2 mt-4 mb-2">Projeto escolhido</Text>
        <View
          className="rounded-rd-lg overflow-hidden bg-surface mb-6"
          style={{ aspectRatio: 16 / 9 }}
        >
          <Image source={{ uri: PROJECT_PHOTO }} className="w-full h-full" />
        </View>

        <View className="bg-surface rounded-rd-lg p-5 mb-8">
          <BreakdownRow label="Valor" value="R$ 200,00" />
          <BreakdownRow label="Sessões" value="3x" />
          <BreakdownRow label="Taxa da Reserva" value="R$ 20,00" />
          <View className="h-px bg-ink my-3" />
          <BreakdownRow label="Valor Total" value="R$ 220,00" bold />
        </View>

        <Text className="font-aux-bold text-[20px] text-ink mb-3">Método de Pagamento</Text>
        <View className="flex-row mb-5" style={{ gap: 10 }}>
          {METHODS.map((m) => (
            <MethodTile
              key={m.id}
              label={m.label}
              icon={m.icon}
              selected={selectedMethod === m.id}
              onPress={() => setSelectedMethod(m.id)}
            />
          ))}
        </View>

        <View className="flex-row items-center mb-1">
          <View style={{ marginRight: 8 }}>
            <Lock size={12} color="#6B6B6B" />
          </View>
          <Text className="font-body text-[12px] text-fg-3 flex-1">
            Pagamento criptografado e processado com segurança.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-background pt-3 px-6" style={{ paddingBottom: 24 }}>
        <Button
          title={processing ? 'Processando…' : 'Confirmar Pagamento'}
          loading={processing}
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
}
