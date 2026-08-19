import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, User, AtSign, Building2, MapPin, PenLine, Phone, CalendarDays, IdCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore, type UserRoleId } from '../../store/authStore';
import { AuthRoutesParamList } from '../../routes/auth.routes';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Checkbox } from '../../components/common/Checkbox';
import { RoleSwitch } from '../../components/common/RoleSwitch';
import { PrefChip } from '../../components/common/Chip';
import { authService } from '../../services/api';

/** Subtitle copy per role (P1 Cadastro — DESIGN.md §3 / IMPLEMENTATION-CHECKLIST F9). */
const SUBTITLE_BY_ROLE: Record<UserRoleId, string> = {
  cliente: 'Crie sua conta para encontrar artistas e agendar sessões.',
  artista: 'Crie sua conta para divulgar seu trabalho e receber reservas.',
  estudio: 'Crie sua conta para gerenciar seu estúdio, equipe e agenda.',
};

/** CTA label per role (per IMPLEMENTATION-CHECKLIST P1 Cadastro item). */
const CTA_BY_ROLE: Record<UserRoleId, string> = {
  cliente: 'Criar conta',
  artista: 'Sou artista',
  estudio: 'Sou estúdio',
};

const TATTOO_STYLES = [
  'Realismo',
  'Minimalista',
  'Tradicional',
  'Aquarela',
  'Geométrico',
  'Blackwork',
  'Old School',
  'Japonês',
];

/**
 * Converte "dd/mm/aaaa" pra "yyyy-MM-dd" (formato esperado por LocalDate
 * do Java/Jackson). Retorna `undefined` se a string estiver vazia ou
 * não casar — assim o campo `dataNasc` fica opcional no payload e o
 * backend simplesmente não tenta parsear.
 */
function toIsoDate(dmY: string): string | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmY.trim());
  if (!m) return undefined;
  const [, d, mm, y] = m;
  return `${y}-${mm}-${d}`;
}

/**
 * Máscaras client-side. Cada uma:
 *   1) tira tudo que não é dígito (`\D`),
 *   2) corta no comprimento máximo (8 pra data, 11 pra CPF, 14 pra CNPJ),
 *   3) injeta os separadores conforme o usuário digita.
 *
 * São idempotentes (rodar 2x dá o mesmo resultado), então pode usar direto
 * em `onChangeText={(s) => setX(maskX(s))}` sem preocupação. Apagar (Backspace)
 * funciona naturalmente porque a função sempre re-deriva da string crua.
 */
function maskDate(s: string): string {
  const d = s.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function maskCPF(s: string): string {
  const d = s.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Telefone BR — alterna entre fixo (10 dígitos: "(XX) XXXX-XXXX") e celular
 * (11 dígitos: "(XX) XXXXX-XXXX") conforme o usuário digita. Trava em 11.
 */
function maskPhone(s: string): string {
  const d = s.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCNPJ(s: string): string {
  const d = s.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Validação de e-mail bem permissiva — exige `@` com algo antes, algo depois,
 * e um `.` no domínio. Não valida regras de RFC; o backend faz isso via @Email.
 * Aqui é só pra cortar erro de digitação óbvio antes do round-trip.
 */
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/**
 * Mapeia o role do backend pro vocabulário do RoleSwitch (tatuador → artista).
 * Mesmo helper usado no LoginScreen — quando virar a 3ª duplicação, vale extrair
 * pra `src/utils/role.ts`.
 */
function backendRoleToFront(role: 'admin' | 'cliente' | 'tatuador' | 'estudio'): UserRoleId {
  if (role === 'tatuador') return 'artista';
  if (role === 'admin') return 'cliente';
  return role;
}

/**
 * Parser de erro de axios — cobre os 3 formatos que o backend pode devolver:
 *   1) Controller catch: body é string (ex.: "E-mail ja cadastrado!").
 *   2) @Valid falha: body é JSON tipo { message, errors:[{defaultMessage}] }.
 *   3) Erro de rede/timeout: e.response é undefined.
 */
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

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthRoutesParamList>>();
  const insets = useSafeAreaInsets();
  const { role, setRole, setUser, setToken } = useAuthStore();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');

  const [dataNasc, setDataNasc] = useState('');
  const [cpf, setCpf] = useState('');

  const [bio, setBio] = useState('');
  const [endereco, setEndereco] = useState('');
  const [instagram, setInstagram] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const [cnpj, setCnpj] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
  };

  const handleRegister = useCallback(async () => {
    setErro(null);

    if (!nome.trim() || !email.trim() || senha.length < 8) {
      setErro('Preencha nome, e-mail e senha (mínimo 8 caracteres).');
      return;
    }
    if (!isValidEmail(email)) {
      setErro('E-mail inválido. Confira se digitou corretamente.');
      return;
    }
    if (!termsAccepted) {
      setErro('Você precisa aceitar os termos para continuar.');
      return;
    }
    if (role === 'artista' && selectedStyles.length === 0) {
      setErro('Selecione pelo menos um estilo de tatuagem.');
      return;
    }

    setLoading(true);
    try {
      let token: string;
      if (role === 'cliente') {
        ({ token } = await authService.registerCliente({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          telefone: telefone || undefined,
          dataNasc: toIsoDate(dataNasc),
          cpf: cpf || undefined,
          termosAceitos: termsAccepted,
        }));
      } else if (role === 'artista') {
        ({ token } = await authService.registerArtista({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          telefone: telefone || undefined,
          dataNasc: toIsoDate(dataNasc),
          cpf: cpf || undefined,
          bio: bio || undefined,
          instagram: instagram || undefined,
          endereco: endereco || undefined,
          estilos: selectedStyles.length ? selectedStyles : undefined,
          termosAceitos: termsAccepted,
        }));
      } else {
        ({ token } = await authService.registerEstudio({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          telefone: telefone || undefined,
          cnpj: cnpj || undefined,
          endereco: endereco || undefined,
          termosAceitos: termsAccepted,
        }));
      }

      setToken(token);
      const me = await authService.me();
      setUser({ id: me.userId, name: me.nome, email: me.email });
      setRole(backendRoleToFront(me.role));
    } catch (e: any) {
      console.warn('[Register] erro:', e?.response?.status, e?.response?.data, e?.message);
      setErro(parseAxiosError(e, 'Falha no cadastro.'));
    } finally {
      setLoading(false);
    }
  }, [
    role, nome, email, senha, telefone, dataNasc, cpf,
    bio, instagram, endereco, cnpj, selectedStyles, termsAccepted,
    setToken, setUser, setRole,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="mb-6">
          <Text className="font-display text-[32px] leading-[34px] text-ink mb-3">
            CRIE SUA CONTA
          </Text>
          <Text className="font-body text-[15px] leading-[20px] text-fg-2">
            {SUBTITLE_BY_ROLE[role]}
          </Text>
        </View>

        <RoleSwitch value={role} onChange={setRole} className="mb-8" />

        <Input
          label={role === 'estudio' ? 'Nome do estúdio' : 'Nome completo'}
          placeholder={role === 'estudio' ? 'Ex: Estúdio Fênix' : 'Ex: Maria Silva'}
          icon={role === 'estudio' ? Building2 : User}
          value={nome}
          onChangeText={setNome}
          editable={!loading}
        />
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
          label="Telefone"
          placeholder="(11) 99999-9999"
          icon={Phone}
          keyboardType="phone-pad"
          maxLength={15}
          value={telefone}
          onChangeText={(s) => setTelefone(maskPhone(s))}
          editable={!loading}
        />
        {(role === 'cliente' || role === 'artista') && (
          <>
            <Input
              label="Data de nascimento"
              placeholder="dd/mm/aaaa"
              icon={CalendarDays}
              keyboardType="numeric"
              maxLength={10}
              value={dataNasc}
              onChangeText={(s) => setDataNasc(maskDate(s))}
              editable={!loading}
            />
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              icon={IdCard}
              keyboardType="numeric"
              maxLength={14}
              value={cpf}
              onChangeText={(s) => setCpf(maskCPF(s))}
              editable={!loading}
            />
          </>
        )}
        <Input
          label="Senha"
          placeholder="••••••••"
          icon={Lock}
          secure
          value={senha}
          onChangeText={setSenha}
          editable={!loading}
        />

        {role === 'artista' && (
          <>
            <Input
              label="Bio"
              placeholder="Conte um pouco sobre você e seu trabalho..."
              icon={PenLine}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
              style={{ minHeight: 92 }}
              value={bio}
              onChangeText={setBio}
              editable={!loading}
            />
            <Input
              label="Endereço de atendimento"
              placeholder="Rua, número, bairro, cidade — UF"
              icon={MapPin}
              value={endereco}
              onChangeText={setEndereco}
              editable={!loading}
            />
            <Input
              label="@ Instagram"
              placeholder="@seuhandle"
              icon={AtSign}
              autoCapitalize="none"
              value={instagram}
              onChangeText={setInstagram}
              editable={!loading}
            />
            <Text className="font-body text-[12px] text-fg-2 mb-2 ml-1">Estilos</Text>
            <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
              {TATTOO_STYLES.map((style) => (
                <PrefChip
                  key={style}
                  label={style}
                  selected={selectedStyles.includes(style)}
                  onPress={() => toggleStyle(style)}
                />
              ))}
            </View>
          </>
        )}

        {role === 'estudio' && (
          <>
            <Input
              label="Sobre o estúdio"
              placeholder="Conte um pouco sobre o estúdio, especialidades, ambiente..."
              icon={PenLine}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={400}
              style={{ minHeight: 92 }}
              value={bio}
              onChangeText={setBio}
              editable={!loading}
            />
            <Input
              label="CNPJ"
              placeholder="00.000.000/0001-00"
              icon={Building2}
              keyboardType="numeric"
              maxLength={18}
              value={cnpj}
              onChangeText={(s) => setCnpj(maskCNPJ(s))}
              editable={!loading}
            />
            <Input
              label="Endereço completo"
              placeholder="Rua, número, bairro, cidade — UF"
              icon={MapPin}
              value={endereco}
              onChangeText={setEndereco}
              editable={!loading}
            />
          </>
        )}

        <View className="mt-2 mb-2">
          <Checkbox
            checked={termsAccepted}
            onChange={setTermsAccepted}
            accessibilityLabel="Aceitar Termos de Uso e Política de Privacidade"
            label={
              <Text className="font-body text-[12px] text-fg-3 leading-[16px]">
                Li e aceito os <Text className="text-plum font-body-semibold">Termos de Uso</Text> e a{' '}
                <Text className="text-plum font-body-semibold">Política de Privacidade</Text>.
              </Text>
            }
          />
        </View>

        {erro && (
          <Text className="font-body text-[12px] text-error mt-2 mb-3 ml-1">{erro}</Text>
        )}

        <Button
          title={CTA_BY_ROLE[role]}
          onPress={handleRegister}
          disabled={!termsAccepted}
          loading={loading}
        />

        <View className="flex-row justify-center mt-6">
          <Text className="font-body text-[14px] text-fg-2">Já tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text className="font-body-bold text-[14px] text-ink">Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
