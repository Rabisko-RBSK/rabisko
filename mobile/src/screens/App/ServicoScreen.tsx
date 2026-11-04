import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarClock, ChevronRight, Info, MessageCircle, Plus, Trash2 } from 'lucide-react-native';

import { Header } from '../../components/common/Header';
import { DadosSessao, SessaoEditorModal } from '../../components/agenda/SessaoEditorModal';
import { SessionDetailModal, STATUS_LABELS } from './SessionDetailModal';
import { FinalizarServicoModal } from './FinalizarServicoModal';
import type { ServicosStackParamList } from '../../routes/servicos.stack';
import { AppointmentDTO, SessaoListItemDTO, appointmentService } from '../../services/api';
import { HorarioDTO, artistService } from '../../services/api/artistService';
import { paraHorario, paraMinutos } from '../../utils/agendaEstudio';
import {
  SessaoEmEdicao,
  formatarValor,
  houveMudanca,
  montarPedido,
  ordenarSessoes,
  parseValor,
  sessoesDoServico,
} from '../../utils/edicaoServico';

type Nav = NativeStackNavigationProp<ServicosStackParamList, 'Servico'>;
type Rota = RouteProp<ServicosStackParamList, 'Servico'>;

/** Sessão em edição no SessaoEditorModal: existente (chave) ou nova (null). */
type Editando = { chave: string | null } | null;

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function rotuloData(data: string): string {
  const [y, m, d] = data.split('-').map(Number);
  const dia = new Date(y, m - 1, d);
  return `${DIAS[dia.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

function rotuloDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto === 0 ? `${h}h` : `${h}h${resto}`;
}

/**
 * Serviço aberto pelo Kanban do tatuador: tudo num lugar só. Mostra as
 * sessões (detalhes, marcar realizada/falta e QR pelo SessionDetailModal),
 * permite remarcar, adicionar e remover as sessões futuras não marcadas e
 * mudar o valor; e finalizar o serviço. Sessões que já aconteceram ou foram
 * marcadas ficam travadas. Ao salvar, o cliente recebe a grade no chat.
 */
export function ServicoScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rota>();
  const insets = useSafeAreaInsets();

  const [servico, setServico] = useState<AppointmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);

  const [sessoes, setSessoes] = useState<SessaoEmEdicao[]>([]);
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<Editando>(null);
  const [detalhe, setDetalhe] = useState<SessaoListItemDTO | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  // Estúdio onde o tatuador atende: posições e horário de atendimento para remarcar.
  const [estudio, setEstudio] = useState<{ nome: string | null; posicoes: number } | null>(null);
  const [horarios, setHorarios] = useState<HorarioDTO[]>([]);

  const aplicar = useCallback((s: AppointmentDTO) => {
    setServico(s);
    setSessoes(sessoesDoServico(s.sessoes));
    setValor(formatarValor(String(Math.round(s.valorTotal))));
  }, []);

  const carregar = useCallback(() => {
    appointmentService
      .obter(params.servicoId)
      .then((s) => {
        aplicar(s);
        setErroCarga(false);
      })
      .catch((err: any) => {
        console.warn('[Servico] erro ao carregar', err?.response?.status, err?.message);
        setErroCarga(true);
      })
      .finally(() => setLoading(false));
  }, [params.servicoId, aplicar]);

  useEffect(carregar, [carregar]);

  useEffect(() => {
    const hoje = new Date();
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    appointmentService
      .agendaEstudio(iso)
      .then((a) => setEstudio(a.vinculadoEstudio ? { nome: a.nomeEstudio, posicoes: a.posicoes } : null))
      .catch(() => setEstudio(null));
    artistService
      .obterMeuPerfil()
      .then((p) => artistService.horariosDoTatuador(p.tatuadorId))
      .then(setHorarios)
      .catch(() => setHorarios([]));
  }, []);

  const original = useMemo(() => (servico ? sessoesDoServico(servico.sessoes) : []), [servico]);
  const valorNum = parseValor(valor);
  const editavel = !!servico && !servico.finalizado && servico.status !== 'cancelada';
  const mudou = !!servico && houveMudanca(original, sessoes, servico.valorTotal, valorNum);
  const ordenadas = ordenarSessoes(sessoes);

  const sessaoEmEdicao = editando?.chave ? sessoes.find((s) => s.chave === editando.chave) ?? null : null;

  const confirmarEdicao = (dados: DadosSessao) => {
    if (!editando) return;
    if (editando.chave) {
      setSessoes((lista) => lista.map((s) => (s.chave === editando.chave ? { ...s, ...dados } : s)));
    } else {
      setSessoes((lista) => [
        ...lista,
        { ...dados, chave: `nova-${Date.now()}`, sessionId: null, status: 'confirmada', editavel: true },
      ]);
    }
    setEditando(null);
  };

  const remover = (s: SessaoEmEdicao) => {
    const restantes = sessoes.filter((x) => x.chave !== s.chave);
    if (restantes.length === 0) {
      Alert.alert('Última sessão', 'O serviço precisa de ao menos uma sessão. Para encerrá-lo, finalize o serviço.');
      return;
    }
    setSessoes(restantes);
  };

  const salvar = async () => {
    if (!servico) return;
    if (isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Valor inválido', 'Informe o valor total da tatuagem.');
      return;
    }
    setSalvando(true);
    try {
      aplicar(await appointmentService.editar(servico.appointmentId, montarPedido(sessoes, valorNum)));
      Alert.alert('Serviço atualizado', 'O cliente recebeu a nova grade de sessões no chat.');
    } catch (err: any) {
      console.warn('[Servico] erro ao salvar', err?.response?.status, err?.message);
      const mensagem: string | undefined = err?.response?.data?.mensagem;
      Alert.alert('Não foi possível salvar', mensagem ?? 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  /** A sessão como o SessionDetailModal espera (dados gravados, não os em edição). */
  const abrirDetalhe = (sessionId: string) => {
    const s = servico?.sessoes.find((x) => x.sessionId === sessionId);
    if (!servico || !s) return;
    setDetalhe({
      sessionId: s.sessionId,
      appointmentId: servico.appointmentId,
      data: s.data,
      horario: s.horario,
      duracaoMinutos: s.duracaoMinutos,
      outroNome: servico.clienteNome ?? params.clienteNome,
      outroFotoUrl: null,
      valorTotal: servico.valorTotal,
      status: s.status,
    });
  };

  const sair = () => {
    if (!mudou) return navigation.goBack();
    Alert.alert('Descartar alterações?', 'As mudanças ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="SERVIÇO" onBack={sair} />

      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : erroCarga || !servico ? (
        <View className="items-center mt-8 px-6">
          <Text className="font-body text-[13px] text-fg-2 text-center mb-3">Não foi possível carregar o serviço.</Text>
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
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center mb-5">
              <View className="flex-1">
                <Text className="font-aux-bold text-[22px] text-ink" numberOfLines={1}>
                  {servico.clienteNome ?? params.clienteNome}
                </Text>
                <Text className="font-body text-[13px] text-fg-3">
                  {servico.finalizado ? 'Serviço finalizado' : `${ordenadas.length} ${ordenadas.length === 1 ? 'sessão' : 'sessões'}`}
                </Text>
              </View>
              {params.chatId && params.clienteAuthId ? (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ChatThread', {
                      chatId: params.chatId!,
                      outroNome: servico.clienteNome ?? params.clienteNome,
                      outroUsuarioId: params.clienteAuthId!,
                    })
                  }
                  className="flex-row items-center bg-surface rounded-rd-pill px-3 py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Abrir conversa com o cliente"
                >
                  <MessageCircle size={16} color="#602C66" />
                  <Text className="font-body-semibold text-[13px] text-plum ml-1.5">Chat</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text className="font-display text-[12px] text-fg-2 tracking-widest mb-3">SESSÕES</Text>
            {ordenadas.map((s, i) => (
              <LinhaSessao
                key={s.chave}
                indice={i + 1}
                sessao={s}
                posicoesEstudio={estudio?.posicoes ?? 1}
                podeEditar={editavel && s.editavel}
                onDetalhes={s.sessionId ? () => abrirDetalhe(s.sessionId!) : undefined}
                onAlterar={() => setEditando({ chave: s.chave })}
                onRemover={() => remover(s)}
              />
            ))}

            {editavel && (
              <TouchableOpacity
                onPress={() =>
                  estudio
                    ? setEditando({ chave: null })
                    : Alert.alert('Sem estúdio', 'Você precisa atender em um estúdio para agendar sessões.')
                }
                className="flex-row items-center self-start bg-plum px-4 py-2 rounded-rd-xs mt-1 mb-6"
                accessibilityRole="button"
              >
                <Plus size={16} color="#FFFFFF" />
                <Text className="font-body text-[13px] text-white ml-1">Adicionar sessão</Text>
              </TouchableOpacity>
            )}

            <Text className="font-display text-[12px] text-fg-2 tracking-widest mb-3 mt-2">VALOR TOTAL DA TATUAGEM</Text>
            <View className="flex-row items-center bg-surface rounded-rd-xs px-4 py-3 mb-6">
              <Text className="font-body text-[14px] text-fg-2 mr-1">R$</Text>
              <TextInput
                value={valor}
                onChangeText={(t) => setValor(formatarValor(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
                editable={editavel && !salvando}
                className="flex-1 font-body text-[14px] text-ink"
                style={{ padding: 0 }}
                accessibilityLabel="Valor total"
              />
            </View>

            {editavel && (
              <TouchableOpacity
                onPress={() => setFinalizando(true)}
                className="border border-ink rounded-rd-md py-3 items-center"
                accessibilityRole="button"
              >
                <Text className="font-body-semibold text-[14px] text-ink">Finalizar serviço</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {editavel && mudou && (
            <View
              className="absolute bottom-0 left-0 right-0 px-6 bg-background"
              style={{ paddingBottom: insets.bottom + 16, paddingTop: 12 }}
            >
              <TouchableOpacity
                onPress={salvar}
                disabled={salvando}
                className="bg-plum rounded-rd-md py-4 items-center"
                style={{ opacity: salvando ? 0.6 : 1 }}
                accessibilityRole="button"
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-display text-[16px] text-white tracking-wide">SALVAR ALTERAÇÕES</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      <SessaoEditorModal
        visible={!!editando && !!estudio}
        titulo={editando?.chave ? 'REMARCAR SESSÃO' : 'NOVA SESSÃO'}
        inicial={
          sessaoEmEdicao
            ? {
                data: sessaoEmEdicao.data,
                horario: sessaoEmEdicao.horario,
                duracaoMinutos: sessaoEmEdicao.duracaoMinutos,
                posicao: sessaoEmEdicao.posicao ?? 1,
              }
            : null
        }
        ignorarSessionIds={servico?.sessoes.map((s) => s.sessionId) ?? []}
        outras={ordenadas
          .map((s, i) => ({ s, rotulo: `Sessão ${i + 1}` }))
          .filter(({ s }) => s.chave !== editando?.chave && s.posicao !== null)
          .map(({ s, rotulo }) => ({ data: s.data, horario: s.horario, duracaoMinutos: s.duracaoMinutos, posicao: s.posicao!, rotulo }))}
        horarios={horarios}
        posicoesEstudio={estudio?.posicoes ?? 1}
        nomeEstudio={estudio?.nome ?? null}
        onConfirm={confirmarEdicao}
        onClose={() => setEditando(null)}
      />

      <SessionDetailModal
        visible={!!detalhe}
        onClose={() => setDetalhe(null)}
        sessao={detalhe}
        onStatusAtualizado={(sessionId, status) => {
          setDetalhe((d) => (d && d.sessionId === sessionId ? { ...d, status } : d));
          // Sessão marcada fica travada: recarrega o serviço (mantendo o que não foi salvo seria confuso).
          carregar();
        }}
      />

      <FinalizarServicoModal
        card={finalizando ? { servicoId: servico?.appointmentId ?? null, clienteNome: servico?.clienteNome ?? params.clienteNome } : null}
        onClose={() => setFinalizando(false)}
        onFinalizado={carregar}
      />
    </View>
  );
}

function LinhaSessao({
  indice, sessao, posicoesEstudio, podeEditar, onDetalhes, onAlterar, onRemover,
}: {
  indice: number;
  sessao: SessaoEmEdicao;
  posicoesEstudio: number;
  podeEditar: boolean;
  onDetalhes?: () => void;
  onAlterar: () => void;
  onRemover: () => void;
}) {
  const fim = paraHorario(paraMinutos(sessao.horario) + sessao.duracaoMinutos);
  const nova = !sessao.sessionId;
  const travada = !sessao.editavel;

  const conteudo = (
    <View className="flex-1">
      <Text className="font-body-semibold text-[15px] text-ink">
        {indice}. {rotuloData(sessao.data)} · {sessao.horario}–{fim}
      </Text>
      <Text className="font-body text-[12px] text-fg-3 mt-0.5">
        {rotuloDuracao(sessao.duracaoMinutos)}
        {posicoesEstudio > 1 && sessao.posicao ? ` · Posição ${sessao.posicao}` : ''}
        {' · '}
        {nova ? 'Nova (não salva)' : STATUS_LABELS[sessao.status] ?? sessao.status}
        {travada && !nova ? ' · não pode ser alterada' : ''}
      </Text>
    </View>
  );

  if (!podeEditar) {
    // Travada (ou serviço finalizado): tocar abre os detalhes, com marcar e QR.
    return (
      <TouchableOpacity
        onPress={onDetalhes}
        disabled={!onDetalhes}
        activeOpacity={0.85}
        className="flex-row items-center bg-surface rounded-rd-md px-4 py-3 mb-2"
        accessibilityRole="button"
        accessibilityLabel={`Sessão ${indice}: ver detalhes`}
      >
        {conteudo}
        {onDetalhes ? <ChevronRight size={20} color="#6B6B6B" /> : null}
      </TouchableOpacity>
    );
  }

  return (
    <View className="bg-surface rounded-rd-md px-4 py-3 mb-2">
      <View className="flex-row items-center">{conteudo}</View>
      <View className="flex-row mt-3" style={{ gap: 8 }}>
        {onDetalhes && (
          <Acao icone={<Info size={14} color="#602C66" />} texto="Detalhes" onPress={onDetalhes} />
        )}
        <Acao icone={<CalendarClock size={14} color="#602C66" />} texto="Remarcar" onPress={onAlterar} />
        <Acao icone={<Trash2 size={14} color="#B33A3A" />} texto="Remover" onPress={onRemover} perigo />
      </View>
    </View>
  );
}

function Acao({ icone, texto, onPress, perigo }: { icone: React.ReactNode; texto: string; onPress: () => void; perigo?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-background rounded-rd-pill px-3 py-1.5"
      accessibilityRole="button"
      accessibilityLabel={texto}
    >
      {icone}
      <Text className={`font-body-semibold text-[12px] ml-1 ${perigo ? 'text-error' : 'text-plum'}`}>{texto}</Text>
    </TouchableOpacity>
  );
}
