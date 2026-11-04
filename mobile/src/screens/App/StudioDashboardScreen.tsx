import React, { useEffect, useState } from 'react';
import {
  Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text,
  useWindowDimensions, View,
} from 'react-native';
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Scale, ShieldAlert, Users, Wallet, X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { StudioRevenueChart } from '../../components/common/StudioRevenueChart';
import { useStudioDashboard } from '../../hooks/useStudioDashboard';
import { formatStudioCurrency as currency, totaisFinanceiros, type StudioDashboard } from '../../services/studioDashboard';
import type { StudioFinanceiroLinha } from '../../services/api/studioDashboardService';
import { studioService, type CnpjStatus } from '../../services/api/studioService';
import { studioDashboardTheme as theme } from '../../theme/studioDashboard';
import type { StudioRoutesParamList } from '../../routes/studio.routes';
import type { FiltroFinanceiro, StudioDashboardStackParamList } from '../../routes/studio-dashboard.stack';
import { formatarContrato } from '../../utils/contrato';

const c = theme.colors;
const f = theme.fonts;

const sessionStatusLabels: Record<string, string> = {
  agendada: 'Agendada', confirmada: 'Confirmada', em_andamento: 'Em andamento',
  concluida: 'Concluída', no_show: 'Não compareceu',
};

function Sheet({ title, visible, onClose, children }: {
  title: string; visible: boolean; onClose: () => void; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar painel" />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]} accessibilityViewIsModal>
          <View style={s.row}>
            <Text style={[s.sectionTitle, s.flex]} accessibilityRole="header">{title}</Text>
            <Pressable style={s.iconButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar">
              <X size={22} color={c.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.sheetContent}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PeriodPicker() {
  const { period, setPeriod } = useStudioDashboard();
  const [visible, setVisible] = useState(false);
  return <>
    <Pressable style={s.periodButton} onPress={() => setVisible(true)} accessibilityRole="button"
      accessibilityLabel={`Alterar período: ${period === 'current' ? 'Este mês' : 'Mês anterior'}`}>
      <CalendarDays size={17} color={c.purple} />
      <Text style={s.buttonText}>{period === 'current' ? 'Este mês' : 'Mês anterior'}</Text>
      <ChevronDown size={16} color={c.muted} />
    </Pressable>
    <Sheet title="Selecionar período" visible={visible} onClose={() => setVisible(false)}>
      {(['current', 'previous'] as const).map((option) => (
        <Pressable key={option} style={[s.option, period === option && s.optionSelected]}
          accessibilityRole="radio" accessibilityState={{ checked: period === option }}
          onPress={() => { setPeriod(option); setVisible(false); }}>
          <Text style={s.body}>{option === 'current' ? 'Este mês' : 'Mês anterior'}</Text>
        </Pressable>
      ))}
    </Sheet>
  </>;
}

function StudioPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<StudioRoutesParamList>>();
  const { refresh, monthLabel, loading, error } = useStudioDashboard();
  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.purple} />}>
        <View style={s.topBar}>
          {navigation.canGoBack() ? (
            <Pressable style={s.iconButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar">
              <ChevronLeft size={22} color={c.text} />
            </Pressable>
          ) : <View style={s.iconButtonSpace} />}
          <PeriodPicker />
        </View>
        <View style={s.greeting}>
          <Text style={s.title} accessibilityRole="header">{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
          <Text style={s.demoLabel}>{monthLabel}</Text>
          {error && <Text style={s.error} accessibilityRole="alert">{error} Puxe para tentar novamente.</Text>}
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

function Trend({ value, comparison = false }: { value: number | null; comparison?: boolean }) {
  return <View style={s.trend}>
    <Text style={s.trendText}>{value === null ? 'Sem comparação' : `${value >= 0 ? '↗ +' : '↘ '}${value}%${comparison ? ' vs mês anterior' : ''}`}</Text>
  </View>;
}

function ArtistRow({ artist }: { artist: StudioDashboard['artists'][number] }) {
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;
  const initials = artist.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  return <View style={s.artistRow}>
    <View style={s.avatar} accessibilityElementsHidden><Text style={s.initials}>{initials}</Text></View>
    <View style={s.flex}>
      <Text style={s.artistName}>{artist.name}</Text>
      <Text style={s.small}>{artist.appointments} agendamentos</Text>
      {compact && <Text style={s.artistRevenue}>{currency(artist.revenue)}</Text>}
    </View>
    {!compact && <View style={s.trend}><Text style={s.artistRevenue}>{currency(artist.revenue)}</Text></View>}
  </View>;
}

function StylesList({ styles }: { styles: StudioDashboard['styles'] }) {
  if (styles.length === 0) {
    return <Text style={s.note}>Nenhum serviço no período.</Text>;
  }
  return <View style={s.list}>
    {styles.map((style, index) => <View key={style.name} accessible
      accessibilityLabel={`${style.name}: ${Math.round(style.percent)} por cento, ${style.count} agendamentos`}>
      <View style={s.row}>
        <Text style={[s.body, s.flex]}>{style.name}</Text>
        <Text style={s.small}>{Math.round(style.percent)}%</Text>
      </View>
      <View style={s.track}><View style={[s.bar, { width: `${style.percent}%`, opacity: Math.max(0.35, 1 - index * 0.15) }]} /></View>
    </View>)}
  </View>;
}

/** Aviso da conformidade do CNPJ na Receita Federal; nada quando verificado. */
function CnpjAviso({ status }: { status: CnpjStatus | null }) {
  if (status !== 'pendente' && status !== 'irregular') return null;
  const irregular = status === 'irregular';
  const cor = irregular ? c.error : c.warning;
  return <View style={[s.card, s.aviso, { borderColor: cor }]} accessibilityRole="alert">
    <View style={s.row}>
      <ShieldAlert size={19} color={cor} />
      <Text style={[s.sectionTitle, s.flex, { color: cor }]}>
        {irregular ? 'CNPJ irregular' : 'Verificando seu CNPJ'}
      </Text>
    </View>
    <Text style={s.body}>
      {irregular
        ? 'O CNPJ do seu estúdio está irregular na Receita Federal: ele precisa estar ativo e ter a atividade de tatuagem (CNAE 9609-2/06). Depois de regularizar, a verificação se repete todo dia.'
        : 'Estamos verificando o CNPJ do seu estúdio na Receita Federal. Isso acontece automaticamente, em até um dia.'}
    </Text>
  </View>;
}

type FinanceiroNav = NativeStackNavigationProp<StudioDashboardStackParamList>;

/**
 * Área "Resultados financeiros" do dashboard: consolidado, a receber
 * (comissões + aluguéis) e a pagar (salários). Cada card abre a análise por
 * profissional já filtrada.
 */
function ResultadosFinanceiros({ linhas }: { linhas: StudioFinanceiroLinha[] }) {
  const navigation = useNavigation<FinanceiroNav>();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const t = totaisFinanceiros(linhas);
  const abrir = (filtro: FiltroFinanceiro) => navigation.navigate('Financeiro', { filtro });

  return <View style={s.financeiro}>
    <Text style={[s.sectionTitle, s.financeiroTitulo]} accessibilityRole="header">Resultados financeiros</Text>
    <Pressable style={s.card} onPress={() => abrir('todos')} accessibilityRole="button"
      accessibilityLabel={`Consolidado: ${currency(t.consolidado)}. Ver análise por profissional`}>
      <View style={s.row}><Text style={[s.eyebrow, s.flex]}>CONSOLIDADO</Text><Scale size={19} color={c.purple} /></View>
      <Text style={[s.metricValue, { color: t.consolidado < 0 ? c.error : c.text }]}>{currency(t.consolidado)}</Text>
      <View style={s.row}>
        <Text style={[s.small, s.flex]}>A receber menos a pagar com a equipe no período</Text>
        <ChevronRight size={18} color={c.muted} />
      </View>
    </Pressable>
    <View style={[s.metrics, stacked && s.stacked]}>
      <Pressable style={[s.card, s.metricCard, s.cardFinanceiro]} onPress={() => abrir('receber')} accessibilityRole="button"
        accessibilityLabel={`A receber: ${currency(t.aReceber)}. Ver detalhes`}>
        <View style={s.row}><Text style={[s.eyebrow, s.flex]}>A RECEBER</Text><ArrowDownLeft size={19} color={c.success} /></View>
        <Text style={s.metricValue}>{currency(t.aReceber)}</Text>
        <View style={s.metricFooter}>
          <View style={s.flex}><Text style={s.micro}>COMISSÕES</Text><Text style={s.number}>{currency(t.comissoes)}</Text></View>
          <View style={s.flex}><Text style={s.micro}>ALUGUÉIS</Text><Text style={s.number}>{currency(t.alugueis)}</Text></View>
        </View>
      </Pressable>
      <Pressable style={[s.card, s.metricCard, s.cardFinanceiro]} onPress={() => abrir('pagar')} accessibilityRole="button"
        accessibilityLabel={`A pagar: ${currency(t.aPagar)}. Ver detalhes`}>
        <View style={s.row}><Text style={[s.eyebrow, s.flex]}>A PAGAR</Text><ArrowUpRight size={19} color={c.error} /></View>
        <Text style={s.metricValue}>{currency(t.aPagar)}</Text>
        <View style={s.metricFooter}>
          <View style={s.flex}><Text style={s.micro}>SALÁRIOS</Text><Text style={s.number}>{currency(t.aPagar)}</Text></View>
        </View>
      </Pressable>
    </View>
    <Text style={s.note}>Comissão sobre as sessões marcadas como realizadas; aluguel e salário proporcionais aos dias de contrato no período.</Text>
  </View>;
}

export function StudioDashboardScreen() {
  const { dashboard: data, period, month, revenueChange, bookingChange } = useStudioDashboard();
  const navigation = useNavigation<BottomTabNavigationProp<StudioRoutesParamList>>();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const [showStyles, setShowStyles] = useState(false);
  const peakDate = new Date(month.getFullYear(), month.getMonth(), data.peak.day)
    .toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  // Nome do estúdio gerenciado (conta de estúdio ou estúdio próprio do tatuador
  // no modo estúdio — por isso não dá para usar o nome do usuário logado).
  const [nomeEstudio, setNomeEstudio] = useState<string | null>(null);
  const [cnpjStatus, setCnpjStatus] = useState<CnpjStatus | null>(null);
  useEffect(() => {
    let ativo = true;
    studioService.meuEstudio()
      .then((e) => {
        if (!ativo) return;
        setNomeEstudio(e.nome);
        setCnpjStatus(e.cnpjStatus);
      })
      .catch(() => { if (ativo) setNomeEstudio(null); });
    return () => { ativo = false; };
  }, []);

  return <StudioPage title={nomeEstudio ? `Olá, ${nomeEstudio}!` : 'Olá!'} subtitle={`Aqui está o resumo de desempenho do seu estúdio ${period === 'current' ? 'este mês' : 'no mês anterior'}.`}>
    <CnpjAviso status={cnpjStatus} />
    <View style={[s.metrics, stacked && s.stacked]}>
      <View style={[s.card, s.metricCard]}>
        <View style={s.row}><Text style={[s.eyebrow, s.flex]}>RECEITA TOTAL</Text><Wallet size={19} color={c.purple} /></View>
        <Text style={s.metricValue}>{currency(data.revenue)}</Text>
        <Trend value={revenueChange} comparison />
        <StudioRevenueChart daily={data.daily} compact />
      </View>
      <View style={[s.card, s.metricCard]}>
        <View style={s.row}><Text style={[s.eyebrow, s.flex]}>AGENDAMENTOS</Text><Users size={19} color={c.purple} /></View>
        <View style={s.row}><Text style={s.count}>{data.appointments}</Text><Trend value={bookingChange} /></View>
        <View style={s.metricFooter}>
          <View style={s.flex}><Text style={s.micro}>NOVOS</Text><Text style={s.number}>{data.newAppointments}</Text></View>
          <View style={s.flex}><Text style={s.micro}>RECORRENTES</Text><Text style={s.number}>{data.recurringAppointments}</Text></View>
        </View>
      </View>
    </View>
    <ResultadosFinanceiros linhas={data.financeiro} />
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.flex}>
          <Text style={s.purpleEyebrow}>DESEMPENHO</Text>
          <Text style={s.sectionTitle} accessibilityRole="header">Evolução da Receita</Text>
        </View>
        <Text style={s.periodTag}>{period === 'current' ? 'Mês atual' : 'Mês anterior'}</Text>
      </View>
      <StudioRevenueChart daily={data.daily} />
      <View style={[s.revenueFooter, stacked && s.stacked]}>
        <View style={s.flex}>
          <Text style={s.small}>Maior receita do mês</Text>
          <Text style={s.number}>{currency(data.peak.value)}</Text>
          <Text style={s.purpleCaption}>{data.revenue ? peakDate : 'Sem receita no período'}</Text>
        </View>
        <View style={s.flex}>
          <Text style={s.small}>Média diária</Text>
          <Text style={s.number}>{currency(data.average)}</Text>
          <Text style={s.small}>Por dia do período</Text>
        </View>
      </View>
      <Text style={s.note}>Valores contratados; não representam pagamentos recebidos.</Text>
    </View>
    <View style={s.card}>
      <View style={s.row}>
        <Text style={[s.sectionTitle, s.flex]} accessibilityRole="header">Tatuadores <Text style={s.dot}>•</Text></Text>
        <Pressable style={s.link} onPress={() => navigation.navigate('Team')} accessibilityRole="button" accessibilityLabel="Ver todos os tatuadores">
          <Text style={s.linkText}>Ver todos</Text>
        </Pressable>
      </View>
      <View style={s.list}>{data.artists.slice(0, 2).map((artist) => <ArtistRow key={artist.id} artist={artist} />)}</View>
    </View>
    <View style={s.card}>
      <View style={s.row}>
        <Text style={[s.sectionTitle, s.flex]} accessibilityRole="header">Estilos mais procurados <Text style={s.dot}>•</Text></Text>
        <Pressable style={s.link} onPress={() => setShowStyles(true)} accessibilityRole="button" accessibilityLabel="Ver todos os estilos">
          <Text style={s.linkText}>Ver todos</Text>
        </Pressable>
      </View>
      <StylesList styles={data.styles.slice(0, 4)} />
    </View>
    <Sheet title="Estilos mais procurados" visible={showStyles} onClose={() => setShowStyles(false)}>
      <StylesList styles={data.styles} />
    </Sheet>
  </StudioPage>;
}

export function StudioTeamScreen() {
  const { dashboard } = useStudioDashboard();
  return <StudioPage title="Equipe do estúdio" subtitle="Agendamentos e receita contratada de cada tatuador no período.">
    <View style={s.card}><View style={s.list}>{dashboard.artists.map((artist) => <ArtistRow key={artist.id} artist={artist} />)}</View></View>
  </StudioPage>;
}

const FILTROS: { id: FiltroFinanceiro; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'receber', rotulo: 'A receber' },
  { id: 'pagar', rotulo: 'A pagar' },
];

/** "2026-10-15" -> "15/10". */
function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** Base do cálculo de uma linha: sessões (comissão) ou dias de contrato (aluguel/salário). */
function baseDoCalculo(l: StudioFinanceiroLinha): string {
  const sessoes = `${l.sessoes} ${l.sessoes === 1 ? 'sessão realizada' : 'sessões realizadas'}`;
  if (l.modelo === 'comissao') return `${sessoes} · ${currency(l.valorSessoes)}`;
  return `${l.dias} ${l.dias === 1 ? 'dia' : 'dias'} de contrato · ${sessoes}`;
}

function LinhaFinanceira({ linha }: { linha: StudioFinanceiroLinha }) {
  const pagar = linha.modelo === 'salario';
  const valor = pagar ? linha.aPagar : linha.aReceber;
  const initials = linha.nome.split(' ').map((part) => part[0]).slice(0, 2).join('');
  return <View style={s.artistRow} accessible
    accessibilityLabel={`${linha.nome}, ${formatarContrato(linha)}: ${pagar ? 'a pagar' : 'a receber'} ${currency(valor)}`}>
    <View style={s.avatar} accessibilityElementsHidden><Text style={s.initials}>{initials}</Text></View>
    <View style={s.flex}>
      <Text style={s.artistName}>{linha.nome}</Text>
      <Text style={s.purpleCaption}>{formatarContrato(linha)}</Text>
      <Text style={s.small}>{baseDoCalculo(linha)}</Text>
      <Text style={s.small}>{diaMes(linha.inicio)} a {diaMes(linha.fim)}</Text>
    </View>
    <Text style={[s.artistRevenue, { color: pagar ? c.error : c.success }]}>
      {pagar ? '−' : '+'} {currency(valor)}
    </Text>
  </View>;
}

/**
 * Análise dos resultados financeiros por profissional da equipe, no período do
 * dashboard. Abre filtrada pelo card tocado (consolidado, a receber ou a pagar).
 */
export function StudioFinanceiroScreen() {
  const { dashboard } = useStudioDashboard();
  const route = useRoute<RouteProp<StudioDashboardStackParamList, 'Financeiro'>>();
  const [filtro, setFiltro] = useState<FiltroFinanceiro>(route.params?.filtro ?? 'todos');
  const linhas = dashboard.financeiro.filter((l) =>
    filtro === 'todos' || (filtro === 'pagar' ? l.modelo === 'salario' : l.modelo !== 'salario'));
  const t = totaisFinanceiros(linhas);
  const total = filtro === 'pagar' ? t.aPagar : filtro === 'receber' ? t.aReceber : t.consolidado;

  return <StudioPage title="Resultados financeiros" subtitle="Comissões, aluguéis e salários de cada profissional da equipe no período.">
    <View style={s.row}>
      {FILTROS.map((opcao) => <Pressable key={opcao.id} style={[s.chip, filtro === opcao.id && s.optionSelected]}
        onPress={() => setFiltro(opcao.id)} accessibilityRole="radio" accessibilityState={{ checked: filtro === opcao.id }}>
        <Text style={s.buttonText}>{opcao.rotulo}</Text>
      </Pressable>)}
    </View>
    <View style={s.card}>
      <Text style={s.eyebrow}>
        {filtro === 'pagar' ? 'TOTAL A PAGAR' : filtro === 'receber' ? 'TOTAL A RECEBER' : 'CONSOLIDADO'}
      </Text>
      <Text style={[s.metricValue, { color: total < 0 ? c.error : c.text }]}>{currency(total)}</Text>
      {filtro === 'receber' && <Text style={s.small}>Comissões {currency(t.comissoes)} · Aluguéis {currency(t.alugueis)}</Text>}
      {filtro === 'todos' && <Text style={s.small}>A receber {currency(t.aReceber)} · A pagar {currency(t.aPagar)}</Text>}
    </View>
    <View style={s.card}>
      {linhas.length === 0
        ? <Text style={s.note}>Nenhum contrato da equipe neste período.</Text>
        : <View style={s.list}>{linhas.map((linha) => <LinhaFinanceira key={linha.contratoId} linha={linha} />)}</View>}
    </View>
  </StudioPage>;
}

export function StudioAgendaScreen() {
  const { dashboard } = useStudioDashboard();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const dates = [...new Set(dashboard.bookings.map((booking) => booking.date))].sort();
  const date = selectedDay && dates.includes(selectedDay) ? selectedDay : dates[dates.length - 1];
  const bookings = dashboard.bookings.filter((booking) => booking.date === date);
  return <StudioPage title="Agenda do estúdio" subtitle="Consulte as sessões agendadas por dia.">
    <View style={s.card}>
      <ScrollView horizontal contentContainerStyle={s.days}>
        {dates.map((day) => <Pressable key={day} style={[s.day, day === date && s.optionSelected]}
          onPress={() => setSelectedDay(day)} accessibilityRole="button" accessibilityState={{ selected: day === date }}
          accessibilityLabel={`Dia ${Number(day.slice(-2))}`}>
          <Text style={s.body}>{day.slice(-2)}</Text>
        </Pressable>)}
      </ScrollView>
      <Text style={s.sectionTitle} accessibilityRole="header">{date ? `Dia ${Number(date.slice(-2))}` : 'Sem agendamentos'}</Text>
      <View style={s.list}>{bookings.map((booking) => <View key={booking.id} style={s.artistRow}>
        <View style={s.flex}>
          <Text style={s.artistName}>{booking.time} · {booking.clientName}</Text>
          <Text style={s.small}>{dashboard.artists.find((artist) => artist.id === booking.artistId)?.name}</Text>
          <Text style={s.small}>{sessionStatusLabels[booking.status] ?? booking.status}</Text>
        </View>
      </View>)}</View>
    </View>
  </StudioPage>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: theme.radius.pill, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  iconButtonSpace: { width: 44, height: 44 },
  periodButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: theme.radius.pill, backgroundColor: c.card },
  buttonText: { fontFamily: f.semibold, fontSize: 13, color: c.text },
  greeting: { gap: 5, paddingHorizontal: 4 },
  title: { fontFamily: f.bold, fontSize: 25, lineHeight: 32, color: c.text },
  subtitle: { fontFamily: f.regular, fontSize: 13, lineHeight: 19, color: c.muted },
  demoLabel: { fontFamily: f.medium, fontSize: 11, color: c.purple, lineHeight: 17 },
  error: { fontFamily: f.medium, fontSize: 12, lineHeight: 18, color: '#B42318' },
  metrics: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  stacked: { flexDirection: 'column' },
  card: { padding: 20, backgroundColor: c.card, borderRadius: theme.radius.card, gap: 12, boxShadow: '0 4px 20px -2px rgba(28,25,23,0.05)' },
  aviso: { borderWidth: 1.5 },
  financeiro: { gap: 12 },
  financeiroTitulo: { paddingHorizontal: 4 },
  cardFinanceiro: { minHeight: 0 },
  chip: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: theme.radius.pill, backgroundColor: c.card },
  metricCard: { flex: 1, padding: 16, minHeight: 185, justifyContent: 'space-between' },
  eyebrow: { fontFamily: f.bold, fontSize: 10, lineHeight: 15, color: c.muted },
  purpleEyebrow: { fontFamily: f.bold, fontSize: 10, lineHeight: 15, color: c.purple, marginBottom: 3 },
  metricValue: { fontFamily: f.extraBold, fontSize: 19, lineHeight: 26, color: c.text },
  count: { fontFamily: f.extraBold, fontSize: 28, lineHeight: 36, color: c.text },
  trend: { backgroundColor: c.tint, paddingVertical: 3, paddingHorizontal: 6, borderRadius: theme.radius.pill, alignSelf: 'flex-start', flexShrink: 1 },
  trendText: { fontFamily: f.semibold, fontSize: 10, lineHeight: 15, color: c.purple },
  metricFooter: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10 },
  micro: { fontFamily: f.semibold, fontSize: 9, lineHeight: 14, color: c.muted },
  number: { fontFamily: f.bold, fontSize: 16, lineHeight: 23, color: c.text },
  sectionTitle: { fontFamily: f.bold, fontSize: 17, lineHeight: 23, color: c.text },
  periodTag: { fontFamily: f.medium, fontSize: 10, lineHeight: 15, color: c.muted, backgroundColor: c.soft, padding: 7, borderRadius: theme.radius.pill, maxWidth: 90 },
  revenueFooter: { flexDirection: 'row', gap: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.line },
  body: { fontFamily: f.medium, fontSize: 13, lineHeight: 20, color: c.text },
  small: { fontFamily: f.regular, fontSize: 11, lineHeight: 17, color: c.muted },
  purpleCaption: { fontFamily: f.medium, fontSize: 11, lineHeight: 17, color: c.purple },
  note: { fontFamily: f.regular, fontSize: 10, lineHeight: 16, color: c.muted },
  link: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  linkText: { fontFamily: f.semibold, fontSize: 12, lineHeight: 18, color: c.purple },
  dot: { color: c.purple },
  list: { gap: 12 },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.soft, borderRadius: theme.radius.row, padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: theme.radius.pill, backgroundColor: c.tint, justifyContent: 'center', alignItems: 'center' },
  initials: { fontFamily: f.bold, fontSize: 14, color: c.purple },
  artistName: { fontFamily: f.bold, fontSize: 13, lineHeight: 20, color: c.text },
  artistRevenue: { fontFamily: f.bold, fontSize: 12, lineHeight: 20, color: c.purple },
  track: { height: 8, borderRadius: theme.radius.pill, backgroundColor: c.soft, overflow: 'hidden', marginTop: 6 },
  bar: { height: '100%', borderRadius: theme.radius.pill, backgroundColor: c.purple },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,25,23,0.35)' },
  sheet: { backgroundColor: c.card, borderTopLeftRadius: theme.radius.card, borderTopRightRadius: theme.radius.card, padding: 20, maxHeight: '80%', width: '100%', maxWidth: 560, alignSelf: 'center' },
  sheetContent: { paddingVertical: 12, gap: 8 },
  option: { minHeight: 48, padding: 14, borderRadius: theme.radius.row },
  optionSelected: { backgroundColor: c.tint, borderWidth: 1, borderColor: c.purple },
  days: { gap: 8, paddingBottom: 12 },
  day: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: theme.radius.row, backgroundColor: c.soft },
});
