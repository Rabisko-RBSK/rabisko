import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { X, CalendarDays, Clock, Banknote, UserCircle2, QrCode, ScanLine } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessaoListItemDTO, StatusSessaoMarcavel, appointmentService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { studioDashboardTheme as theme } from '../../theme/studioDashboard';
import { QrSessaoModal } from './QrSessaoModal';
import { LerQrModal } from './LerQrModal';


const PT_WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const PT_MONTHS   = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatDataLonga(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${PT_WEEKDAYS[date.getDay()]}, ${d} ${PT_MONTHS[m - 1]} ${y}`;
}

function formatHorario(horario: string): string {
  return horario.substring(0, 5);
}

function formatDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const STATUS_LABELS: Record<string, string> = {
  confirmada:   'Confirmada',
  agendada:     'Agendada',
  em_andamento: 'Em andamento',
  concluida:    'Realizada',
  cancelada:    'Cancelada',
  no_show:      'Não compareceu',
};

function inicioDaSessao(sessao: SessaoListItemDTO): number {
  const [y, m, d] = sessao.data.split('-').map(Number);
  const [hh, mm] = sessao.horario.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}

/** A sessão já começou? Antes disso, o backend recusa a marcação manual. */
function jaComecou(sessao: SessaoListItemDTO): boolean {
  return inicioDaSessao(sessao) <= Date.now();
}

/** Janela do check-in por QR (igual à do backend): de 30 min antes a 6 h depois do início. */
function naJanelaDoCheckin(sessao: SessaoListItemDTO): boolean {
  const inicio = inicioDaSessao(sessao);
  const agora = Date.now();
  return agora >= inicio - 30 * 60_000 && agora <= inicio + 6 * 3_600_000;
}

function statusBadgeColors(status: string): { bg: string; text: string } {
  switch (status) {
    case 'confirmada':
    case 'agendada':
      return { bg: '#602C66', text: '#FFFFFF' };
    case 'em_andamento':
      return { bg: '#F59E0B', text: '#FFFFFF' };
    case 'concluida':
      return { bg: '#10B981', text: '#FFFFFF' };
    default:
      return { bg: '#9CA3AF', text: '#FFFFFF' };
  }
}


interface Props {
  visible: boolean;
  onClose: () => void;
  sessao: SessaoListItemDTO | null;
  /** Chamado depois que o tatuador marca a sessão (para a lista atualizar o status). */
  onStatusAtualizado?: (sessionId: string, status: StatusSessaoMarcavel) => void;
}

export function SessionDetailModal({ visible, onClose, sessao, onStatusAtualizado }: Props) {
  const perfil = useAuthStore((state) => state.role);
  const [marcando, setMarcando] = useState<StatusSessaoMarcavel | null>(null);
  const [qrVisivel, setQrVisivel] = useState(false);
  const [leitorVisivel, setLeitorVisivel] = useState(false);
  if (!sessao) return null;

  // O tatuador marca a sessão depois do horário dela; cancelada não muda.
  const podeMarcar = perfil === 'artista' && sessao.status !== 'cancelada' && jaComecou(sessao);
  // Check-in por QR: o cliente mostra, o tatuador lê, dentro da janela da sessão.
  const naJanela = naJanelaDoCheckin(sessao);
  const podeLerQr = perfil === 'artista' && naJanela
    && sessao.status !== 'cancelada' && sessao.status !== 'concluida';
  const podeMostrarQr = perfil === 'cliente' && naJanela
    && sessao.status !== 'cancelada' && sessao.status !== 'concluida' && sessao.status !== 'no_show';

  const marcar = async (status: StatusSessaoMarcavel) => {
    setMarcando(status);
    try {
      await appointmentService.marcarSessao(sessao.sessionId, status);
      onStatusAtualizado?.(sessao.sessionId, status);
    } catch (err: any) {
      console.warn('[SessionDetail] erro ao marcar sessão', err?.response?.status, err?.message);
      const mensagem: string | undefined = err?.response?.data?.mensagem ?? err?.response?.data?.message;
      Alert.alert('Não foi possível marcar a sessão', mensagem ?? 'Tente novamente.');
    } finally {
      setMarcando(null);
    }
  };

  const badgeColors = statusBadgeColors(sessao.status);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-surface">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            DETALHES DA SESSÃO
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} className="absolute right-4">
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 28, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-5">
            {sessao.outroFotoUrl ? (
              <Image
                source={{ uri: sessao.outroFotoUrl }}
                style={{ width: 84, height: 84, borderRadius: 42 }}
                contentFit="cover"
              />
            ) : (
              <View
                className="bg-background items-center justify-center"
                style={{ width: 84, height: 84, borderRadius: 42 }}
              >
                <UserCircle2 size={52} color="#9CA3AF" />
              </View>
            )}
            <Text className="font-display text-[24px] text-ink tracking-widest mt-3">
              {sessao.outroNome.toUpperCase()}
            </Text>
          </View>

          <View className="h-px bg-surface mb-5" style={{ backgroundColor: '#E5E0E8' }} />

          <View style={{ gap: 16 }}>
            <DetailRow icon={<CalendarDays size={18} color="#602C66" />} label={formatDataLonga(sessao.data)} />
            <DetailRow
              icon={<Clock size={18} color="#602C66" />}
              label={`${formatHorario(sessao.horario)} · ${formatDuracao(sessao.duracaoMinutos)}`}
            />
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View style={{ width: 18, alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: badgeColors.bg }} />
              </View>
              <View
                className="rounded-rd-pill px-3 py-1"
                style={{ backgroundColor: badgeColors.bg }}
              >
                <Text className="font-body-semibold text-[12px]" style={{ color: badgeColors.text }}>
                  {STATUS_LABELS[sessao.status] ?? sessao.status}
                </Text>
              </View>
            </View>
            <DetailRow icon={<Banknote size={18} color="#602C66" />} label={formatPreco(sessao.valorTotal)} />
          </View>
          {podeMostrarQr && (
            <View style={{ marginTop: 24, padding: 16, gap: 12, backgroundColor: theme.colors.card,
              borderRadius: theme.radius.row, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
              <Text style={{ fontFamily: theme.fonts.bold, fontSize: 18, lineHeight: 26, color: theme.colors.text }}>
                Check-in da sessão
              </Text>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: 14, lineHeight: 22, color: theme.colors.text }}>
                Ao chegar, mostre o QR ao seu tatuador para registrar a sessão.
              </Text>
              <View className="flex-row">
                <BotaoMarcar
                  titulo="Mostrar QR da sessão"
                  principal
                  icone={<QrCode size={18} color="#FFFFFF" />}
                  carregando={false}
                  desabilitado={false}
                  onPress={() => setQrVisivel(true)}
                />
              </View>
            </View>
          )}
          {(podeMarcar || podeLerQr) && (
            <View style={{ marginTop: 24, padding: 16, gap: 12, backgroundColor: theme.colors.card,
              borderRadius: theme.radius.row, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
              <Text style={{ fontFamily: theme.fonts.bold, fontSize: 18, lineHeight: 26, color: theme.colors.text }}>
                {sessao.status === 'concluida' || sessao.status === 'no_show' ? 'Corrigir a sessão' : 'Como foi a sessão?'}
              </Text>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: 14, lineHeight: 22, color: theme.colors.text }}>
                Sessões realizadas entram no fechamento do estúdio (comissão).
              </Text>
              {podeLerQr && (
                <View className="flex-row">
                  <BotaoMarcar
                    titulo="Ler QR do cliente"
                    principal
                    icone={<ScanLine size={18} color="#FFFFFF" />}
                    carregando={false}
                    desabilitado={marcando !== null}
                    onPress={() => setLeitorVisivel(true)}
                  />
                </View>
              )}
              {podeMarcar && <View className="flex-row" style={{ gap: 10 }}>
                {sessao.status !== 'concluida' && (
                  <BotaoMarcar
                    titulo="Sessão realizada"
                    principal
                    carregando={marcando === 'concluida'}
                    desabilitado={marcando !== null}
                    onPress={() => marcar('concluida')}
                  />
                )}
                {sessao.status !== 'no_show' && (
                  <BotaoMarcar
                    titulo="Cliente faltou"
                    carregando={marcando === 'no_show'}
                    desabilitado={marcando !== null}
                    onPress={() => marcar('no_show')}
                  />
                )}
              </View>}
            </View>
          )}
        </ScrollView>
        <QrSessaoModal visible={qrVisivel} sessionId={sessao.sessionId} onClose={() => setQrVisivel(false)} />
        <LerQrModal
          visible={leitorVisivel}
          sessionId={sessao.sessionId}
          onClose={() => setLeitorVisivel(false)}
          onRealizada={() => onStatusAtualizado?.(sessao.sessionId, 'concluida')}
        />
      </SafeAreaView>
    </Modal>
  );
}

function BotaoMarcar({ titulo, principal, icone, carregando, desabilitado, onPress }: {
  titulo: string;
  principal?: boolean;
  icone?: React.ReactNode;
  carregando: boolean;
  desabilitado: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={desabilitado}
      activeOpacity={0.85}
      className={`flex-1 rounded-rd-md py-3 items-center ${principal ? 'bg-plum' : 'bg-background'}`}
      style={{ opacity: desabilitado && !carregando ? 0.5 : 1 }}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      {carregando ? (
        <ActivityIndicator color={principal ? '#FFFFFF' : '#602C66'} />
      ) : (
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {icone}
          <Text className={`font-body-semibold text-[14px] ${principal ? 'text-white' : 'text-ink'}`}>{titulo}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <View style={{ width: 18, alignItems: 'center' }}>{icon}</View>
      <Text className="font-body text-[15px] text-ink flex-1">{label}</Text>
    </View>
  );
}
