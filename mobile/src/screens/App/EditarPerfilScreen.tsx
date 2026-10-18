import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { EnderecoForm, validarEndereco } from '../../components/common/EnderecoForm';
import { useArtistProfile } from '../../hooks/useArtistProfile';
import { useAuthStore } from '../../store/authStore';
import type { EnderecoInput } from '../../services/api';
import {
  AtualizarPerfilDTO,
  ArtistProfile,
  EnderecoDTO,
  artistService,
} from '../../services/api/artistService';
import { geocodificar } from '../../utils/geocodificar';
import { digitosTelefone, formatarTelefone, telefoneValido } from '../../utils/telefone';

/**
 * Edição dos dados cadastrais do tatuador (empilhada no ArtistProfileStack):
 * nome, telefone, instagram e endereço próprio. Bio e foto continuam na
 * edição rápida do próprio perfil.
 */

const NOME_MAX = 150;

/** Endereço do backend (campos null) -> formato do formulário (campos opcionais). */
function paraInput(e: EnderecoDTO | null): EnderecoInput | null {
  if (!e) return null;
  return {
    cep: e.cep,
    logradouro: e.logradouro,
    numero: e.numero ?? undefined,
    complemento: e.complemento ?? undefined,
    bairro: e.bairro ?? undefined,
    cidade: e.cidade,
    uf: e.uf,
  };
}

/** Compara só o que o usuário edita (coordenadas são recalculadas ao salvar). */
function mesmoEndereco(a: EnderecoInput | null, b: EnderecoInput | null): boolean {
  if (!a || !b) return a === b;
  const norm = (v?: string) => (v ?? '').trim();
  return (
    a.cep.replace(/\D/g, '') === b.cep.replace(/\D/g, '') &&
    norm(a.logradouro) === norm(b.logradouro) &&
    norm(a.numero) === norm(b.numero) &&
    norm(a.complemento) === norm(b.complemento) &&
    norm(a.bairro) === norm(b.bairro) &&
    norm(a.cidade) === norm(b.cidade) &&
    norm(a.uf).toUpperCase() === norm(b.uf).toUpperCase()
  );
}

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

  const enderecoInicial = paraInput(profile.endereco);
  const [nome, setNome] = useState(profile.nome ?? '');
  const [telefone, setTelefone] = useState(formatarTelefone(profile.telefone ?? ''));
  const [instagram, setInstagram] = useState((profile.instagram ?? '').replace(/^@+/, ''));
  const [endereco, setEndereco] = useState<EnderecoInput | null>(enderecoInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    setErro(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return setErro('Informe seu nome.');
    if (nomeLimpo.length > NOME_MAX) return setErro(`O nome pode ter no máximo ${NOME_MAX} caracteres.`);
    if (!telefoneValido(telefone)) return setErro('Telefone deve ter DDD + 8 ou 9 dígitos.');

    // Quem já tem endereço não pode ficar sem; quem não tem só valida se começou a preencher.
    const enderecoMudou = !mesmoEndereco(endereco, enderecoInicial);
    if (enderecoMudou && (endereco || enderecoInicial)) {
      const erroEndereco = validarEndereco(endereco);
      if (erroEndereco) return setErro(erroEndereco);
    }

    // PATCH só com o que mudou.
    const patch: AtualizarPerfilDTO = {};
    if (nomeLimpo !== profile.nome) patch.nome = nomeLimpo;
    const telDigitos = digitosTelefone(telefone);
    if (telDigitos !== (profile.telefone ?? '')) patch.telefone = telDigitos || null;
    const igLimpo = instagram.trim().replace(/^@+/, '');
    if (igLimpo !== (profile.instagram ?? '').replace(/^@+/, '')) patch.instagram = igLimpo || null;

    if (Object.keys(patch).length === 0 && !enderecoMudou) {
      navigation.goBack();
      return;
    }

    setSalvando(true);
    try {
      if (Object.keys(patch).length > 0) {
        await artistService.atualizarMeuPerfil(patch);
        // A saudação da Home e outros lugares leem o nome do authStore.
        if (patch.nome && user) setUser({ ...user, name: patch.nome });
      }

      if (enderecoMudou && endereco) {
        const coords = await geocodificar(endereco);
        await artistService.atualizarEndereco({ ...endereco, ...(coords ?? {}) });
        if (!coords) {
          Alert.alert(
            'Endereço salvo',
            'Não foi possível localizar o endereço no mapa. Você pode não aparecer em "Perto de você".',
          );
        }
      }

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

        <Text className="font-aux-bold text-[16px] text-ink mt-4 mb-1">Endereço de atendimento</Text>
        {profile.estudioId ? (
          <Text className="font-body text-[12px] text-fg-3 mb-3 leading-[16px]">
            Enquanto você fizer parte do {profile.nomeEstudio ?? 'estúdio'}, os clientes veem o
            endereço do estúdio. Este é o seu endereço para quando atender por conta própria.
          </Text>
        ) : (
          <View className="mb-3" />
        )}
        <EnderecoForm value={endereco} onChange={setEndereco} disabled={salvando} />

        {erro && <Text className="font-body text-[12px] text-error mt-1 mb-3 ml-1">{erro}</Text>}

        <Button title="Salvar" loading={salvando} onPress={salvar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
