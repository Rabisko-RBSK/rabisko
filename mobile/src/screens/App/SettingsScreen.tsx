import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import {
  User,
  HelpCircle,
  Store,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react-native';

import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/common/Header';
import { sair } from '../../services/supabase';

/**
 * Settings (DESIGN.md §10 #14 / Screens.jsx#SettingsScreen). Single cream-surface list.
 * Sign-out is rendered as a separate, low-emphasis link below the list.
 * Tatuador com estúdio próprio ganha o switch "Modo estúdio", que troca as
 * abas do artista pelas do estúdio (a mesma tela aparece nos dois fluxos).
 */

interface SettingRow {
  id: string;
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
}

export function SettingsScreen() {
  const { role, logout, estudioProprioId, modo, setModo } = useAuthStore();
  const podeAlternarModo = role === 'artista' && !!estudioProprioId;

  // Encerra a sessão no Supabase; se falhar (ex.: sem rede), limpa o app mesmo assim.
  const handleLogout = () => {
    sair().catch(() => {}).finally(logout);
  };

  const rows: SettingRow[] = [
    ...(role !== 'artista' ? [{ id: 'profile', label: 'Meu Perfil', icon: User }] : []),
    {
      id: 'help',
      label: 'Ajuda',
      icon: HelpCircle,
      onPress: () =>
        Alert.alert(
          'Ajuda e Suporte',
          'Para suporte, dúvidas ou sugestões, fale conosco pelo e-mail suporte@rabisko.com.',
        ),
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <Header title="Configurações" />

      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-body text-[14px] text-fg-2 mt-1 mb-6">
          Gerencie sua conta e preferências
        </Text>

        {podeAlternarModo && (
          <View
            className="bg-surface rounded-rd-lg flex-row items-center px-[18px] py-4 mb-4"
            style={{ gap: 14 }}
          >
            <Store size={22} color="#000000" />
            <View className="flex-1">
              <Text className="font-body text-[16px] text-ink">Modo estúdio</Text>
              <Text className="font-body text-[12px] text-fg-2 mt-0.5">
                {modo === 'estudio'
                  ? 'Você está gerenciando o seu estúdio.'
                  : 'Gerencie a equipe, a agenda e o horário do seu estúdio.'}
              </Text>
            </View>
            <Switch
              value={modo === 'estudio'}
              onValueChange={(ativo) => setModo(ativo ? 'estudio' : 'artista')}
              trackColor={{ true: '#602C66' }}
              accessibilityLabel="Modo estúdio"
            />
          </View>
        )}

        <View className="bg-surface rounded-rd-lg overflow-hidden">
          {rows.map((row, i) => {
            const Icon = row.icon;
            return (
              <TouchableOpacity
                key={row.id}
                onPress={row.onPress}
                activeOpacity={0.85}
                className="flex-row items-center px-[18px] py-4"
                accessibilityRole="button"
                accessibilityLabel={row.label}
                style={{
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: 'rgba(0,0,0,0.06)',
                  gap: 14,
                }}
              >
                <Icon size={22} color="#000000" />
                <Text className="flex-1 font-body text-[16px] text-ink">{row.label}</Text>
                <ChevronRight size={22} color="#6B6B6B" />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          className="flex-row items-center justify-center mt-8 py-3"
          accessibilityRole="button"
          accessibilityLabel="Sair da Conta"
          style={{ gap: 8 }}
        >
          <LogOut size={16} color="#B33A3A" />
          <Text className="font-body-semibold text-[14px] text-error">Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
