import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  User,
  CalendarDays,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react-native';

import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/common/Header';

/**
 * Settings (DESIGN.md §10 #14 / Screens.jsx#SettingsScreen). Single cream-surface list — five
 * rows + chevron, hairline dividers, **no chip block around the icon**. Sign-out is rendered
 * as a separate, low-emphasis link below the list (the design's screen catalog says §14 has
 * sign-out, even though the prototype stub omits it — see IMPLEMENTATION-CHECKLIST.md).
 *
 * The previous version's toggles (Notificações Push, Modo Escuro) are gone — neither belongs
 * on this screen per the design. Notifications becomes a row → its own screen later.
 */

interface SettingRow {
  id: string;
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
}

export function SettingsScreen() {
  const { logout } = useAuthStore();

  const rows: SettingRow[] = [
    { id: 'profile',  label: 'Meu Perfil',           icon: User },
    { id: 'orders',   label: 'Meus Pedidos',         icon: CalendarDays },
    { id: 'payments', label: 'Métodos de Pagamento', icon: CreditCard },
    { id: 'notifs',   label: 'Notificações',         icon: Bell },
    { id: 'help',     label: 'Ajuda',                icon: HelpCircle },
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
          Gerencie sua conta, pedidos, pagamentos e preferências
        </Text>

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
          onPress={logout}
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
