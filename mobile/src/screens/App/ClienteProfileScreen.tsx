import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CalendarDays, IdCard, Mail, Phone, User } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { DatePickerModal } from '../../components/common/DatePickerModal';
import { ClientePerfil, clientService } from '../../services/api/clientService';
import { useAuthStore } from '../../store/authStore';
import { digitosTelefone, formatarTelefone, telefoneValido } from '../../utils/telefone';

/**
 * Perfil do cliente (Configurações → Meu Perfil): nome, telefone e
 * nascimento editáveis; e-mail (do login) e CPF só para leitura.
 */

const NOME_MAX = 150;

/** "yyyy-MM-dd" <-> "dd/mm/aaaa" (formato do DatePickerModal). */
function isoParaBr(iso: string | null): string {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}
function brParaIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function formatarCpf(cpf: string | null): string {
  const d = (cpf ?? '').replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf ?? '';
}

export function ClienteProfileScreen() {
  const navigation = useNavigation();
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(() => {
    clientService
      .meuPerfil()
      .then((p) => {
        setPerfil(p);
        setErro(false);
      })
      .catch((err: any) => {
        console.warn('[ClienteProfile] erro ao carregar', err?.response?.status, err?.message);
        setErro(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(carregar, [carregar]);

  return (
    <View className="flex-1 bg-background">
      <Header title="MEU PERFIL" onBack={() => navigation.goBack()} />
      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : erro || !perfil ? (
        <View className="items-center mt-8 px-6">
          <Text className="font-body text-[13px] text-fg-2 text-center mb-3">Não foi possível carregar seus dados.</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              carregar();
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text className="font-body-semibold text-[13px] text-plum">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Montado só com o perfil carregado: o estado do formulário nasce com os valores atuais.
        <ClienteProfileForm perfil={perfil} />
      )}
    </View>
  );
}

function ClienteProfileForm({ perfil }: { perfil: ClientePerfil }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [nome, setNome] = useState(perfil.nome);
  const [telefone, setTelefone] = useState(formatarTelefone(perfil.telefone ?? ''));
  const [dataNasc, setDataNasc] = useState(isoParaBr(perfil.dataNasc));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const salvar = async () => {
    setErro(null);
    setSalvo(false);
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return setErro('Informe seu nome.');
    if (!telefoneValido(telefone)) return setErro('Telefone deve ter DDD + 8 ou 9 dígitos.');

    setSalvando(true);
    try {
      const atualizado = await clientService.atualizar({
        nome: nomeLimpo,
        telefone: digitosTelefone(telefone) || null,
        dataNasc: brParaIso(dataNasc),
      });
      // A saudação da Home lê o nome do authStore.
      if (user) setUser({ ...user, name: atualizado.nome });
      setSalvo(true);
    } catch (err: any) {
      console.warn('[ClienteProfile] erro ao salvar', err?.response?.status, err?.message);
      setErro(err?.response?.status === 400 ? 'Confira os dados informados.' : 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 96 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-aux-bold text-[16px] text-ink mb-3">Dados pessoais</Text>
        <Input
          label="Nome"
          placeholder="Seu nome"
          icon={User}
          maxLength={NOME_MAX}
          value={nome}
          onChangeText={(t) => {
            setNome(t);
            setSalvo(false);
          }}
          editable={!salvando}
        />
        <Input
          label="Telefone"
          placeholder="(11) 91234-5678"
          icon={Phone}
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={(t) => {
            setTelefone(formatarTelefone(t));
            setSalvo(false);
          }}
          editable={!salvando}
        />
        <TouchableOpacity activeOpacity={0.8} onPress={() => !salvando && setDatePickerVisible(true)}>
          <View pointerEvents="none">
            <Input
              label="Data de nascimento"
              placeholder="Selecione a data"
              icon={CalendarDays}
              value={dataNasc}
              editable={false}
            />
          </View>
        </TouchableOpacity>

        <Text className="font-aux-bold text-[16px] text-ink mt-2 mb-3">Conta</Text>
        <Input label="E-mail" icon={Mail} value={perfil.email} editable={false} />
        {perfil.cpf ? <Input label="CPF" icon={IdCard} value={formatarCpf(perfil.cpf)} editable={false} /> : null}

        {erro && <Text className="font-body text-[12px] text-error mt-1 mb-3 ml-1">{erro}</Text>}
        {salvo && <Text className="font-body text-[12px] text-success mt-1 mb-3 ml-1">Dados atualizados.</Text>}

        <Button title="Salvar" loading={salvando} onPress={salvar} />
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelectDate={(d) => {
          setDataNasc(d);
          setSalvo(false);
        }}
        currentValue={dataNasc}
      />
    </KeyboardAvoidingView>
  );
}
