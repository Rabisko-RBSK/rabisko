import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Mail, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthRoutesParamList } from '../../routes/auth.routes';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthRoutesParamList>>();

  return (
    <View className="flex-1 bg-white pt-20">
      <View className="px-6 pt-12 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ChevronLeft size={24} stroke="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-black uppercase tracking-tighter">Recuperar Senha</Text>
      </View>

      <View className="px-6 pt-10">
        <Text className="text-gray-500 mb-8 leading-tight">
          Insira seu e-mail cadastrado para receber as instruções de recuperação.
        </Text>

        <View className="bg-surface rounded-rd-md px-4 py-4 mb-8 flex-row items-center">
          <View className="mr-3">
            <Mail size={20} color="#000" />
          </View>
          <TextInput
            placeholder="seu@email.com"
            placeholderTextColor="#6B6B6B"
            className="flex-1 text-black"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      <TouchableOpacity
        className="bg-black rounded-rd-md py-5 mt-12 items-center"
        onPress={() => navigation.navigate('NewPassword', { email: 'test@example.com' })}
      >
        <Text className="text-white font-bold text-lg">Enviar Link</Text>
      </TouchableOpacity>
    </View>
  );
}
