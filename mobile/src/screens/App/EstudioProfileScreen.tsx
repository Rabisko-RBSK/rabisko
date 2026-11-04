import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, IdCard, Phone, Store } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { EnderecoForm, validarEndereco } from '../../components/common/EnderecoForm';
import { FotoEditavel } from '../../components/common/FotoEditavel';
import { PosicoesCard } from './EquipeScreen';
import { usePosicoesEstudio } from '../../hooks/usePosicoesEstudio';
import { useHorarios } from '../../hooks/useHorarios';
import type { SettingsStackParamList } from '../../routes/settings.stack';
import type { EnderecoInput } from '../../services/api';
import type { EnderecoDTO } from '../../services/api/artistService';
import { CnpjStatus, EstudioPerfil, studioService } from '../../services/api/studioService';
import { resumirGrade } from '../../utils/horario';
import { digitosTelefone, formatarTelefone, telefoneValido } from '../../utils/telefone';

/**
 * Perfil do estúdio (Configurações → Perfil do estúdio), para a conta de
 * estúdio e para o tatuador dono no modo estúdio: foto, nome, telefone e
 * endereço; posições e horário de atendimento (os mesmos da aba Equipe).
 * CNPJ é só leitura — é o que a Receita verifica.
 */

const NOME_MAX = 150;

const CNPJ_STATUS: Record<CnpjStatus, string> = {
  verificado: 'Verificado na Receita Federal',
  pendente: 'Verificação em andamento',
  irregular: 'Irregular na Receita Federal',
};

function enderecoInput(e: EnderecoDTO | null): EnderecoInput | null {
  if (!e) return null;
  return {
    cep: e.cep,
    logradouro: e.logradouro,
    numero: e.numero ?? undefined,
    complemento: e.complemento ?? undefined,
    bairro: e.bairro ?? undefined,
    cidade: e.cidade,
    uf: e.uf,
    latitude: e.latitude ?? undefined,
    longitude: e.longitude ?? undefined,
  };
}

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'PerfilEstudio'>;

export function EstudioProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [perfil, setPerfil] = useState<EstudioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(() => {
    studioService
      .meuPerfil()
      .then((p) => {
        setPerfil(p);
        setErro(false);
      })
      .catch((err: any) => {
        console.warn('[EstudioProfile] erro ao carregar', err?.response?.status, err?.message);
        setErro(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(carregar, [carregar]);

  return (
    <View className="flex-1 bg-background">
      <Header title="PERFIL DO ESTÚDIO" onBack={() => navigation.goBack()} />
      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : erro || !perfil ? (
        <View className="items-center mt-8 px-6">
          <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
            Não foi possível carregar os dados do estúdio.
          </Text>
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
        <EstudioProfileForm perfil={perfil} onHorarios={() => navigation.navigate('HorariosEstudio')} />
      )}
    </View>
  );
}

function EstudioProfileForm({ perfil, onHorarios }: { perfil: EstudioPerfil; onHorarios: () => void }) {
  const insets = useSafeAreaInsets();
  const posicoes = usePosicoesEstudio();
  const horarios = useHorarios();

  // Ao voltar da tela de horários (ou da aba Equipe), a grade e as posições podem ter mudado.
  const primeiroFoco = useRef(true);
  const { reload: reloadHorarios } = horarios;
  const { reload: reloadPosicoes } = posicoes;
  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }
      reloadHorarios();
      reloadPosicoes();
    }, [reloadHorarios, reloadPosicoes]),
  );

  const [fotoUrl, setFotoUrl] = useState(perfil.fotoUrl);
  const [nome, setNome] = useState(perfil.nome);
  const [telefone, setTelefone] = useState(formatarTelefone(perfil.telefone ?? ''));
  const [endereco, setEndereco] = useState<EnderecoInput | null>(enderecoInput(perfil.endereco));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const alterou = () => setSalvo(false);

  const salvar = async () => {
    setErro(null);
    setSalvo(false);
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return setErro('Informe o nome do estúdio.');
    if (!telefoneValido(telefone)) return setErro('Telefone deve ter DDD + 8 ou 9 dígitos.');
    const erroEndereco = validarEndereco(endereco);
    if (erroEndereco || !endereco) return setErro(erroEndereco);

    setSalvando(true);
    try {
      await studioService.atualizarPerfil({
        nome: nomeLimpo,
        telefone: digitosTelefone(telefone) || null,
        endereco,
      });
      setSalvo(true);
    } catch (err: any) {
      console.warn('[EstudioProfile] erro ao salvar', err?.response?.status, err?.message);
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
        <FotoEditavel
          fotoUrl={fotoUrl}
          nome={nome || perfil.nome}
          enviar={studioService.enviarFoto}
          onAtualizada={setFotoUrl}
        />

        <Text className="font-aux-bold text-[16px] text-ink mb-3">Dados do estúdio</Text>
        <Input
          label="Nome"
          placeholder="Nome do estúdio"
          icon={Store}
          maxLength={NOME_MAX}
          value={nome}
          onChangeText={(t) => {
            setNome(t);
            alterou();
          }}
          editable={!salvando}
        />
        <Input
          label="Telefone"
          placeholder="(11) 3456-7890"
          icon={Phone}
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={(t) => {
            setTelefone(formatarTelefone(t));
            alterou();
          }}
          editable={!salvando}
        />
        {perfil.cnpj ? (
          <>
            <Input label="CNPJ" icon={IdCard} value={perfil.cnpj} editable={false} />
            <Text className="font-body text-[12px] text-fg-3 -mt-1 mb-3 ml-1">{CNPJ_STATUS[perfil.cnpjStatus]}</Text>
          </>
        ) : null}

        <Text className="font-aux-bold text-[16px] text-ink mt-2 mb-3">Endereço</Text>
        <EnderecoForm
          value={endereco}
          onChange={(e) => {
            setEndereco(e);
            alterou();
          }}
          disabled={salvando}
        />

        {erro && <Text className="font-body text-[12px] text-error mt-1 mb-3 ml-1">{erro}</Text>}
        {salvo && <Text className="font-body text-[12px] text-success mt-1 mb-3 ml-1">Dados atualizados.</Text>}

        <Button title="Salvar" loading={salvando} onPress={salvar} />

        <Text className="font-aux-bold text-[16px] text-ink mt-8 mb-3">Posições</Text>
        <PosicoesCard
          posicoes={posicoes.posicoes}
          loading={posicoes.loading}
          error={posicoes.error}
          salvando={posicoes.salvando}
          onSalvar={posicoes.salvar}
          onRetry={posicoes.reload}
        />

        <Text className="font-aux-bold text-[16px] text-ink mt-8 mb-3">Horário de atendimento</Text>
        <TouchableOpacity
          onPress={onHorarios}
          activeOpacity={0.85}
          className="bg-surface-2 rounded-rd-lg p-4 flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="Editar horário de atendimento"
        >
          <View className="flex-1">
            {horarios.loading ? (
              <ActivityIndicator color="#602C66" />
            ) : horarios.horarios.length === 0 ? (
              <Text className="font-body text-[14px] text-fg-2">Sem restrição de horário</Text>
            ) : (
              resumirGrade(horarios.horarios).map((linha) => (
                <Text key={linha} className="font-body text-[14px] text-ink">
                  {linha}
                </Text>
              ))
            )}
            <Text className="font-body text-[12px] text-fg-3 mt-1">Vale para toda a equipe · Toque para editar</Text>
          </View>
          <ChevronRight size={22} color="#602C66" />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
