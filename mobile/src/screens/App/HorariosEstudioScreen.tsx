import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { HorarioSemanalForm } from '../../components/common/HorarioSemanalForm';
import { useHorarios } from '../../hooks/useHorarios';
import { HorarioDTO } from '../../services/api/artistService';
import { studioService } from '../../services/api/studioService';
import { mesmaGrade, umIntervaloPorDia } from '../../utils/horario';

/**
 * Horário de atendimento do estúdio (empilhada na StudioEquipeStack). Vale
 * para todos os tatuadores da equipe: aparece no perfil deles e limita os
 * horários que podem agendar. No estúdio próprio, quem edita é o dono.
 */
export function HorariosEstudioScreen() {
  const navigation = useNavigation();
  const { horarios, loading, error, reload } = useHorarios();

  return (
    <View className="flex-1 bg-background">
      <Header title="HORÁRIO DE ATENDIMENTO" onBack={() => navigation.goBack()} />
      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : error ? (
        <View className="items-center mt-8 px-6">
          <Text className="font-body text-[13px] text-fg-2 text-center mb-3">{error}</Text>
          <TouchableOpacity onPress={reload} hitSlop={8} accessibilityRole="button">
            <Text className="font-body-semibold text-[13px] text-plum">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Montado só com a grade carregada: o formulário nasce com os valores atuais.
        // O formulário edita um intervalo por dia; grades com pausa no dia viram um só.
        <HorariosForm iniciais={umIntervaloPorDia(horarios)} tinhaPausa={umIntervaloPorDia(horarios).length < horarios.length} />
      )}
    </View>
  );
}

function HorariosForm({ iniciais, tinhaPausa }: { iniciais: HorarioDTO[]; tinhaPausa: boolean }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [horarios, setHorarios] = useState<HorarioDTO[]>(iniciais);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    setErro(null);
    // Sem mudança: não salva (inclusive mantém a pausa de grades antigas).
    if (mesmaGrade(horarios, iniciais)) {
      navigation.goBack();
      return;
    }
    setSalvando(true);
    try {
      await studioService.atualizarHorarios(horarios);
      navigation.goBack();
    } catch (err: any) {
      console.warn('[HorariosEstudio] erro ao salvar', err?.response?.status, err?.response?.data, err?.message);
      // Mostra o motivo que o backend manda (ex.: "Há horários sobrepostos no mesmo dia").
      const data = err?.response?.data;
      const motivo: string | undefined = typeof data === 'string' && data.length ? data : data?.message;
      setErro(motivo ?? 'Não foi possível salvar. Tente novamente.');
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
      <Text className="font-body text-[12px] text-fg-3 mb-4 leading-[16px]">
        Os dias e horários em que o estúdio aceita sessões. Valem para toda a equipe: aparecem no
        perfil dos tatuadores e limitam os horários que eles podem agendar. Sem nenhum dia marcado,
        não há restrição.
      </Text>
      {tinhaPausa && (
        <Text className="font-body text-[12px] text-fg-3 mb-4 leading-[16px]">
          Os dias com pausa foram unidos num intervalo só (da abertura ao fechamento). Ao salvar, a
          pausa deixa de existir.
        </Text>
      )}
      <HorarioSemanalForm value={horarios} onChange={setHorarios} disabled={salvando} />

      {erro && <Text className="font-body text-[12px] text-error mt-1 mb-3 ml-1">{erro}</Text>}

      <Button title="Salvar" loading={salvando} onPress={salvar} />
    </ScrollView>
  );
}
