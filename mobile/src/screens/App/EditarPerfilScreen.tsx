import React, { useState } from 'react';
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
import { AtSign, Phone, User } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useArtistProfile } from '../../hooks/useArtistProfile';
import { useAuthStore } from '../../store/authStore';
import {
  AtualizarPerfilDTO,
  ArtistProfile,
  artistService,
} from '../../services/api/artistService';
import { digitosTelefone, formatarTelefone, telefoneValido } from '../../utils/telefone';

/**
 * Edição dos dados cadastrais do tatuador (empilhada no ArtistProfileStack):
 * nome, telefone e instagram. Bio e foto continuam na edição rápida do
 * próprio perfil. Endereço e horário de atendimento são do estúdio onde o
 * tatuador atende (editados nas telas do estúdio).
 */

const NOME_MAX = 150;

export function EditarPerfilScreen() {
  const navigation = useNavigation();
  const { profile, loading, error, reload } = useArtistProfile();

  return (
    <View className="flex-1 bg-background">
      <Header title="DADOS CADASTRAIS" onBack={() => navigation.goBack()} />
      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : error || !profile ? (
        <View className="items-center mt-8 px-6">
          <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
            Não foi possível carregar seus dados.
          </Text>
          <TouchableOpacity onPress={reload} hitSlop={8} accessibilityRole="button">
            <Text className="font-body-semibold text-[13px] text-plum">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Montado só com o perfil carregado: o estado do formulário nasce com os valores atuais.
        <EditarPerfilForm profile={profile} />
      )}
    </View>
  );
}

function EditarPerfilForm({ profile }: { profile: ArtistProfile }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [nome, setNome] = useState(profile.nome ?? '');
  const [telefone, setTelefone] = useState(formatarTelefone(profile.telefone ?? ''));
  const [instagram, setInstagram] = useState((profile.instagram ?? '').replace(/^@+/, ''));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    setErro(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return setErro('Informe seu nome.');
    if (nomeLimpo.length > NOME_MAX) return setErro(`O nome pode ter no máximo ${NOME_MAX} caracteres.`);
    if (!telefoneValido(telefone)) return setErro('Telefone deve ter DDD + 8 ou 9 dígitos.');

    // PATCH só com o que mudou.
    const patch: AtualizarPerfilDTO = {};
    if (nomeLimpo !== profile.nome) patch.nome = nomeLimpo;
    const telDigitos = digitosTelefone(telefone);
    if (telDigitos !== (profile.telefone ?? '')) patch.telefone = telDigitos || null;
    const igLimpo = instagram.trim().replace(/^@+/, '');
    if (igLimpo !== (profile.instagram ?? '').replace(/^@+/, '')) patch.instagram = igLimpo || null;

    if (Object.keys(patch).length === 0) {
      navigation.goBack();
      return;
    }

    setSalvando(true);
    try {
      await artistService.atualizarMeuPerfil(patch);
      // A saudação da Home e outros lugares leem o nome do authStore.
      if (patch.nome && user) setUser({ ...user, name: patch.nome });

      // O perfil recarrega sozinho ao ganhar foco.
      navigation.goBack();
    } catch (err: any) {
      console.warn('[EditarPerfil] erro ao salvar', err?.response?.status, err?.message);
      setErro(
        err?.response?.status === 400
          ? 'Confira os dados informados.'
          : 'Não foi possível salvar. Tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          onChangeText={setNome}
          editable={!salvando}
        />
        <Input
          label="Telefone"
          placeholder="(11) 91234-5678"
          icon={Phone}
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={(t) => setTelefone(formatarTelefone(t))}
          editable={!salvando}
        />
        <Input
          label="Instagram"
          placeholder="seuhandle"
          icon={AtSign}
          autoCapitalize="none"
          autoCorrect={false}
          value={instagram}
          onChangeText={(t) => setInstagram(t.replace(/^@+/, ''))}
          editable={!salvando}
        />

        <Text className="font-aux-bold text-[16px] text-ink mt-4 mb-1">Endereço e horário</Text>
        <Text className="font-body text-[12px] text-fg-3 mb-5 leading-[16px]">
          {profile.estudioId
            ? `Os clientes veem o endereço e o horário de atendimento do ${profile.nomeEstudio ?? 'estúdio'}, onde você atende.`
            : 'Endereço e horário de atendimento são os do estúdio onde você atende. Você passa a atender quando entrar na equipe de um estúdio.'}
        </Text>

        {erro && <Text className="font-body text-[12px] text-error mt-1 mb-3 ml-1">{erro}</Text>}

        <Button title="Salvar" loading={salvando} onPress={salvar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
