import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Building2 } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { EnderecoForm, validarEndereco } from '../../components/common/EnderecoForm';
import type { EnderecoInput } from '../../services/api';
import { artistService } from '../../services/api/artistService';
import { useAuthStore } from '../../store/authStore';
import { AJUDA_CNPJ, maskCNPJ } from '../../utils/cnpj';
import { geocodificar } from '../../utils/geocodificar';
import { isValidCNPJ } from '../../utils/validators';

const NOME_MAX = 150;

/** Motivo vindo do backend: texto puro ou `message` do ResponseStatusException. */
function mensagemDoErro(err: any): string | null {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.length) return data;
  if (typeof data?.message === 'string' && data.message.length) return data.message;
  return null;
}

/**
 * Tatuador sem estúdio próprio abre o seu depois do cadastro (empilhada no
 * ArtistProfileStack). Cria o estúdio com 1 posição e o contrato "dono"; o
 * CNPJ é conferido na Receita Federal pelo backend. Ao salvar, o switch
 * "Modo estúdio" passa a aparecer nas Configurações.
 */
export function CriarEstudioScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const setEstudioProprioId = useAuthStore((s) => s.setEstudioProprioId);
  const setModo = useAuthStore((s) => s.setModo);

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [endereco, setEndereco] = useState<EnderecoInput | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    setErro(null);
    setCnpjError(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return setErro('Informe o nome do estúdio.');
    if (!cnpj.trim()) {
      setCnpjError('Informe o CNPJ do estúdio.');
      return setErro('Informe o CNPJ do estúdio.');
    }
    if (!isValidCNPJ(cnpj)) {
      setCnpjError('CNPJ inválido (dígitos incorretos ou repetidos).');
      return setErro('CNPJ inválido. Confira os números.');
    }
    const erroEndereco = validarEndereco(endereco);
    if (erroEndereco) return setErro(erroEndereco);

    setSalvando(true);
    try {
      // Coordenadas para "Perto de você"; se não der, segue sem elas.
      const coords = await geocodificar(endereco!);
      const estudio = await artistService.criarEstudioProprio({
        nome: nomeLimpo,
        cnpj,
        endereco: { ...endereco!, ...(coords ?? {}) },
      });
      setEstudioProprioId(estudio.estudioId);
      navigation.goBack();
      Alert.alert(
        'Estúdio criado',
        `O ${estudio.nome} está pronto. Você já pode agendar sessões nele e gerenciá-lo pelo modo estúdio.`,
        [
          { text: 'Depois', style: 'cancel' },
          { text: 'Abrir modo estúdio', onPress: () => setModo('estudio') },
        ],
      );
    } catch (err: any) {
      console.warn('[CriarEstudio] erro ao criar', err?.response?.status, err?.response?.data, err?.message);
      const mensagem = mensagemDoErro(err) ?? 'Não foi possível criar o estúdio. Tente novamente.';
      setErro(mensagem);
      // Recusa da Receita ou CNPJ já usado por outro estúdio.
      if (mensagem.includes('CNPJ')) setCnpjError(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="MEU ESTÚDIO" onBack={() => navigation.goBack()} />
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 96 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-body text-[13px] text-fg-2 mb-5 leading-[18px]">
          Com o seu estúdio, você agenda sessões nele e gerencia horário, posições e equipe pelo
          modo estúdio. Ele começa com uma posição de atendimento.
        </Text>

        <Input
          label="Nome do estúdio"
          placeholder="Ex: Estúdio Fênix"
          icon={Building2}
          maxLength={NOME_MAX}
          value={nome}
          onChangeText={setNome}
          editable={!salvando}
        />
        <Input
          label="CNPJ do estúdio"
          placeholder="00.000.000/0001-00"
          icon={Building2}
          keyboardType="numeric"
          maxLength={18}
          value={cnpj}
          onChangeText={(s) => {
            setCnpj(maskCNPJ(s));
            setCnpjError(null);
          }}
          error={cnpjError ?? undefined}
          editable={!salvando}
        />
        <Text className="font-body text-[12px] text-fg-3 -mt-2 mb-4 ml-1 leading-[16px]">
          {AJUDA_CNPJ}
        </Text>

        <Text className="font-body text-[12px] text-fg-2 mb-2 ml-1">Endereço do estúdio</Text>
        <EnderecoForm value={endereco} onChange={setEndereco} disabled={salvando} />

        {erro && <Text className="font-body text-[12px] text-error mt-1 mb-3 ml-1">{erro}</Text>}

        <Button title="Criar estúdio" loading={salvando} onPress={salvar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
