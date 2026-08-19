import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore, type UserRoleId } from '../../store/authStore';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { RoleSwitch } from '../../components/common/RoleSwitch';
import { authService } from '../../services/api';

/** Subtitle copy per role (P1 Login — DESIGN.md §3 / IMPLEMENTATION-CHECKLIST F9). */
const SUBTITLE_BY_ROLE: Record<UserRoleId, string> = {
  cliente: 'Encontre artistas, agende sessões e acompanhe sua cicatrização.',
  artista: 'Gerencie seu portfólio, sua agenda e seus clientes em um só lugar.',
  estudio: 'Gerencie seu estúdio, equipe, agenda e financeiro em um só lugar.',
};

/**
 * Mapeia o role que volta do backend (`UserResponseDTO.role`, em minúsculo, com
 * a constante `tatuador` do enum Postgres) pro id do front (`UserRoleId`,
 * usado pelo RoleSwitch — "artista" em vez de "tatuador"). `admin` cai em
 * cliente como fallback (admin não usa o app mobile; se isso acontecer, é
 * porque alguém logou com conta de admin pra testar).
 */
function backendRoleToFront(role: 'admin' | 'cliente' | 'tatuador' | 'estudio'): UserRoleId {
  if (role === 'tatuador') return 'artista';
  if (role === 'admin') return 'cliente';
  return role;
}

/** Permissivo — só corta erro de digitação óbvio. Backend revalida via @Email. */
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** Cobre string (controller catch), JSON de @Valid, e erros de rede. */
function parseAxiosError(e: any, fallback: string): string {
  const data = e?.response?.data;
  if (typeof data === 'string' && data.length) return data;
  if (data?.errors?.[0]?.defaultMessage) return data.errors[0].defaultMessage;
  if (typeof data?.message === 'string' && data.message.length) return data.message;
  if (e?.code === 'ECONNABORTED') return 'Conexão expirou. Verifique sua rede.';
  if (typeof e?.message === 'string' && e.message.includes('Network Error')) {
    return 'Sem conexão com o servidor. Confira se o backend está rodando e se o IP em api/index.ts está certo.';
  }
  return fallback;
}

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthRoutesParamList>>();
  const insets = useSafeAreaInsets();
  const { role, setRole, setUser, setToken } = useAuthStore();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    setErro(null);

    if (!email.trim() || senha.length < 8) {
      setErro('Preencha e-mail e senha (mínimo 8 caracteres).');
      return;
    }
    if (!isValidEmail(email)) {
      setErro('E-mail inválido. Confira se digitou corretamente.');
      return;
    }

    setLoading(true);
    try {
      const { token } = await authService.login({ login: email.trim(), senha });

      setToken(token);

      const me = await authService.me();

      setUser({ id: me.userId, name: me.nome, email: me.email });
      setRole(backendRoleToFront(me.role));

    } catch (e: any) {
      console.warn('[Login] erro:', e?.response?.status, e?.response?.data, e?.message);
      setErro(parseAxiosError(e, 'Falha no login.'));
    } finally {
      setLoading(false);
    }
  }, [email, senha, setToken, setUser, setRole]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <Header onBack={() => navigation.goBack()} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="mb-8">
          <Text className="font-display text-[32px] leading-[34px] text-ink mb-3">BEM-VINDO</Text>
          <Text className="font-body text-[15px] leading-[20px] text-fg-2">
            {SUBTITLE_BY_ROLE[role]}
          </Text>
        </View>

        <RoleSwitch value={role} onChange={setRole} className="mb-8" />

        <Input
          label="E-mail"
          placeholder="seu@email.com"
          icon={Mail}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <Input
          label="Senha"
          placeholder="••••••••"
          icon={Lock}
          secure
          value={senha}
          onChangeText={setSenha}
          editable={!loading}
        />

        <TouchableOpacity
          className="self-end -mt-2 mb-2"
          onPress={() => navigation.navigate('ForgotPassword')}
          hitSlop={8}
        >
          <Text className="font-body-bold text-[12px] text-plum">Esqueceu a Senha?</Text>
        </TouchableOpacity>

        {erro && (
          <Text className="font-body text-[12px] text-error mt-2 mb-1 ml-1">{erro}</Text>
        )}

        <View className="flex-1" />

        <Button title="Entrar" onPress={handleLogin} loading={loading} />

        <View className="flex-row justify-center mt-6">
          <Text className="font-body text-[14px] text-fg-2">Ainda não tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <Text className="font-body-bold text-[14px] text-ink">Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
