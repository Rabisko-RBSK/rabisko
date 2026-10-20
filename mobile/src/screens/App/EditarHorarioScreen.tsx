import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { HorarioFuncionamentoInput } from '../../components/common/HorarioFuncionamentoInput';
import { useArtistProfile } from '../../hooks/useArtistProfile';
import { artistService } from '../../services/api/artistService';
import {
  HorarioDia,
  SemanaForm,
  semanaDaApi,
  semanaPadrao,
  semanaParaApi,
  validarSemana,
} from '../../utils/horarios';

/**
 * Edição do horário de funcionamento do tatuador (empilhada no
 * ArtistProfileStack, aberta pelo card do perfil). Salva a semana inteira.
 */
export function EditarHorarioScreen() {
  const navigation = useNavigation();
  const { profile, loading, error, reload } = useArtistProfile();

  return (
    <View className="flex-1 bg-background">
      <Header title="HORÁRIO" onBack={() => navigation.goBack()} />
      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : error || !profile ? (
        <View className="items-center mt-8 px-6">
          <Text className="font-body text-[13px] text-fg-2 text-center mb-3">
            Não foi possível carregar seu horário.
          </Text>
          <TouchableOpacity onPress={reload} hitSlop={8} accessibilityRole="button">
            <Text className="font-body-semibold text-[13px] text-plum">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Montado só com o perfil carregado: o formulário nasce com a semana atual.
        <EditarHorarioForm horariosAtuais={profile.horarios ?? []} />
      )}
    </View>
  );
}

function EditarHorarioForm({ horariosAtuais }: { horariosAtuais: HorarioDia[] }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Quem ainda não informou o horário começa pela semana sugerida do cadastro.
  const [semana, setSemana] = useState<SemanaForm>(() =>
    horariosAtuais.length ? semanaDaApi(horariosAtuais) : semanaPadrao(),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    setErro(null);
    const erroSemana = validarSemana(semana);
    if (erroSemana) return setErro(erroSemana);

    setSalvando(true);
    try {
      await artistService.atualizarHorarios(semanaParaApi(semana));
      // O perfil recarrega sozinho ao ganhar foco.
      navigation.goBack();
    } catch (err: any) {
      console.warn('[EditarHorario] erro ao salvar', err?.response?.status, err?.message);
      setErro(
        err?.response?.status === 400
          ? 'Confira os horários informados.'
          : 'Não foi possível salvar. Tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 px-6"
      contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 96 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="font-body text-[14px] text-fg-2 leading-[20px] mb-4">
        Defina os dias e horários em que você atende. Os clientes veem essas informações no seu perfil.
      </Text>

      <HorarioFuncionamentoInput value={semana} onChange={setSemana} disabled={salvando} />

      {erro && <Text className="font-body text-[12px] text-error mt-1 mb-3 ml-1">{erro}</Text>}

      <Button title="Salvar" loading={salvando} onPress={salvar} />
    </ScrollView>
  );
}
