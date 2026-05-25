import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export function NewPasswordScreen() {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-12 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ChevronLeft size={24} stroke="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-black uppercase tracking-tighter">Nova Senha</Text>
      </View>

      <View className="px-6 pt-10">
        <Text className="text-gray-500 mb-8 leading-tight">
          Crie uma nova senha forte para proteger sua conta.
        </Text>

        <View className="bg-surface rounded-rd-md px-4 py-4 mb-4 flex-row items-center">
          <View className="mr-3">
            <Lock size={20} color="#000" />
          </View>
          <TextInput
            placeholder="Nova Senha"
            placeholderTextColor="#6B6B6B"
            className="flex-1 text-black text-base"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} color="#000" /> : <Eye size={20} color="#000" />}
          </TouchableOpacity>
        </View>

        <View className="bg-surface rounded-rd-md px-4 py-4 mb-8 flex-row items-center">
          <View className="mr-3">
            <Lock size={20} color="#000" />
          </View>
          <TextInput
            placeholder="Confirmar Nova Senha"
            placeholderTextColor="#6B6B6B"
            className="flex-1 text-black text-base"
            secureTextEntry={!showPassword}
          />
        </View>

        <TouchableOpacity
          className="bg-black rounded-rd-md py-5 mt-12 items-center"
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text className="text-white font-bold text-lg">Alterar Senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
