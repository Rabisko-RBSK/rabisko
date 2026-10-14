import React, { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft } from 'lucide-react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NavigationAction } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { AnamneseButton as Button } from '../../components/anamnese/AnamneseButton';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../theme';
import { studioDashboardTheme as visual } from '../../theme/studioDashboard';
import type { ManagementStackParamList } from '../../routes/management.stack';
import {
  camposCliente, camposData, camposProcedimento, camposProduto,
  novaFicha, novoProduto, validarFicha,
} from '../../services/anamnese';
import type { ErrosAnamnese, FichaAnamnese } from '../../services/anamnese';

type Props = NativeStackScreenProps<ManagementStackParamList, 'Anamnese'>;

const MAX_CONTENT_WIDTH = 560;
const c = visual.colors;
const f = visual.fonts;

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [numero, nome] = titulo.split(' · ');
  return <View style={s.card}>
    <View style={s.sectionHeader}>
      <View style={s.sectionNumber}><Text style={s.sectionNumberText}>{numero}</Text></View>
      <Text accessibilityRole="header" style={s.sectionTitle}>{nome}</Text>
    </View>
    {children}
  </View>;
}

function Campo({ label, value, onChange, error, date, multiline, review }: {
  label: string; value: string; onChange: (value: string) => void;
  error?: string; date?: boolean; multiline?: boolean; review: boolean;
}) {
  const [focused, setFocused] = useState(false);
  if (review) return <View style={s.reviewField}>
    <Text style={s.label}>{label}</Text>
    <Text selectable style={s.value}>{value}</Text>
  </View>;
  return <View style={s.field}>
    <Text style={s.label}>{label} <Text style={{ color: c.purple }}>*</Text></Text>
    <TextInput accessibilityLabel={label} value={value}
    onChangeText={onChange} multiline={multiline}
    placeholder={date ? 'DD/MM/AAAA' : undefined}
    placeholderTextColor={c.muted}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={[s.input, multiline && s.multiline, focused && s.inputFocused, !!error && s.inputError]}
    keyboardType={date ? 'numbers-and-punctuation' : 'default'}
    maxLength={date ? 10 : 2000} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}

function Confirmacao({ label, description, value, onChange, error, review }: {
  label: string; description: string; value: boolean; onChange: () => void; error?: string; review: boolean;
}) {
  return <View style={s.confirmation}>
    <Pressable
      accessibilityRole="checkbox" accessibilityLabel={`${label}. ${description}`}
      accessibilityState={{ checked: value, disabled: review }} disabled={review}
      onPress={onChange}
      style={({ pressed }) => [s.checkRow, value && s.checkRowSelected, !!error && s.inputError,
        pressed && !review && { opacity: 0.8 }]}>
      <View aria-hidden style={[s.checkBox, value && s.checkBoxSelected]}>
        {value && <Check size={18} strokeWidth={3} color={c.card} />}
      </View>
      <View style={s.checkContent}>
        <Text style={s.checkLabel}>{label}</Text>
        <Text style={s.hint}>{description}</Text>
        <Text style={s.checkStatus}>{value ? 'Selecionado' : review ? 'Não selecionado' : 'Clique ou toque para selecionar'}</Text>
      </View>
    </Pressable>
    {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View>;
}

/** Dados ficam apenas em memória até a integração da issue #188. */
export function AnamneseScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gutter = width < 360 ? theme.spacing[4] : theme.spacing[6];
  const nome = useAuthStore((state) => state.user?.name ?? '');
  const [ficha, setFicha] = useState(() => novaFicha(nome));
  const [erros, setErros] = useState<ErrosAnamnese>({});
  const [revisao, setRevisao] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [anexando, setAnexando] = useState(false);
  const [erroAnexo, setErroAnexo] = useState('');
  const [saida, setSaida] = useState<NavigationAction | null>(null);
  const scroll = useRef<ScrollView>(null);

  usePreventRemove(alterado, ({ data }) => setSaida(data.action));

  function atualizar(proxima: FichaAnamnese) {
    setFicha(proxima);
    setAlterado(true);
    if (Object.keys(erros).length) setErros(validarFicha(proxima));
  }

  async function anexarTermo() {
    if (anexando) return;
    setAnexando(true);
    setErroAnexo('');
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 10 - ficha.consentimento.anexos.length), quality: 1,
      });
      if (resultado.canceled) return;
      if (resultado.assets.some((arquivo) => (arquivo.fileSize ?? 0) > 10 * 1024 * 1024)) {
        setErroAnexo('Selecione imagens de até 10 MB por página.');
        return;
      }
      const anexos = resultado.assets.map((arquivo, indice) => ({
        uri: arquivo.uri, nome: arquivo.fileName ?? `Página ${ficha.consentimento.anexos.length + indice + 1}`,
      }));
      if (ficha.consentimento.anexos.length + anexos.length > 10) {
        setErroAnexo('Anexe no máximo 10 páginas.');
        return;
      }
      atualizar({ ...ficha, consentimento: { ...ficha.consentimento, anexos: [...ficha.consentimento.anexos, ...anexos] } });
    } catch {
      setErroAnexo('Não foi possível abrir as imagens. Tente novamente.');
    } finally {
      setAnexando(false);
    }
  }

  function revisar() {
    const resultado = validarFicha(ficha);
    setErros(resultado);
    if (!Object.keys(resultado).length) setRevisao(true);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  function editar() {
    setRevisao(false);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[s.topBar, { paddingTop: insets.top + theme.spacing[2],
      paddingHorizontal: gutter, paddingBottom: theme.spacing[2], width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={revisao ? editar : navigation.goBack}
        style={s.backButton}>
        <ChevronLeft size={theme.spacing[6]} color={theme.colors.ink} />
      </Pressable>
      <Text accessibilityRole="header" style={s.pageTitle}>
        {revisao ? 'Revisar ficha' : 'Anamnese'}
      </Text>
    </View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: gutter, paddingBottom: theme.spacing[10] + insets.bottom,
        width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
      <View style={s.intro}>
        <Text style={s.eyebrow}>CUIDADO EM CADA DETALHE</Text>
        <Text style={s.introTitle}>Conheça seu cliente.</Text>
        <Text style={s.body}>
          Preencha os dados com o cliente e confira os registros do atendimento. Todos os campos são obrigatórios.
        </Text>
        <Text accessibilityRole="alert" style={s.notice}>
          {revisao ? 'Ficha revisada, ainda não salva. ' : ''}
          O salvamento ainda não está disponível. Ao sair desta tela, os dados serão descartados.
        </Text>
      </View>
      {!!Object.keys(erros).length && !revisao && <Text accessibilityRole="alert"
        style={[s.error, { marginBottom: 20 }]}>Revise os campos indicados abaixo para continuar.</Text>}

      <Secao titulo="01 · Identificação">
        {camposCliente.map(([campo, label]) => <Campo key={campo} label={label}
          value={ficha.cliente[campo]} date={camposData.has(campo)} review={revisao}
          multiline={campo === 'enderecoCompleto'} error={erros[`cliente.${campo}`]}
          onChange={(value) => atualizar({ ...ficha, cliente: { ...ficha.cliente, [campo]: value } })} />)}
        <Text style={s.hint}>Endereço: logradouro, número, complemento, bairro, cidade, UF e CEP.</Text>
        <Text style={s.hint}>Em São Paulo, tatuagem e piercing são proibidos para menores de 18 anos, mesmo com autorização dos pais.</Text>
      </Secao>

      <Secao titulo="02 · Procedimento">
        {camposProcedimento.map(([campo, label]) => <Campo key={campo} label={label}
          value={ficha.procedimento[campo]} date={camposData.has(campo)} review={revisao}
          multiline={campo === 'intercorrencias'} error={erros[`procedimento.${campo}`]}
          onChange={(value) => atualizar({ ...ficha, procedimento: { ...ficha.procedimento, [campo]: value } })} />)}
        <Text style={s.hint}>Descreva alergias, infecções, acidentes ou outras intercorrências. Se não houver, informe “Nenhuma”.</Text>
      </Secao>

      <Secao titulo="03 · Produtos utilizados">
        {ficha.produtos.map((produto, indice) => <View key={indice} style={s.product}>
          <Text style={s.productTitle}>Produto {indice + 1}</Text>
          {camposProduto.map(([campo, label]) => <Campo key={campo} label={label} value={produto[campo]}
            date={camposData.has(campo)} review={revisao} error={erros[`produtos.${indice}.${campo}`]}
            onChange={(value) => atualizar({ ...ficha, produtos: ficha.produtos.map((item, i) => i === indice ? { ...item, [campo]: value } : item) })} />)}
          {!revisao && ficha.produtos.length > 1 && <Button title="Remover produto" variant="ghost"
            accessibilityLabel={`Remover produto ${indice + 1}`}
            onPress={() => atualizar({ ...ficha, produtos: ficha.produtos.filter((_, i) => i !== indice) })} />}
        </View>)}
        {!revisao && <Button title="Adicionar produto" variant="outline"
          onPress={() => atualizar({ ...ficha, produtos: [...ficha.produtos, novoProduto()] })} />}
        {erros.produtos && <Text style={s.error}>{erros.produtos}</Text>}
      </Secao>

      <Secao titulo="04 · Consentimento">
        <Text style={s.body}>
          Anexe fotos legíveis de todas as páginas do Termo de Consentimento Livre e Esclarecido,
          assinado antes do procedimento, conforme o documento de identidade. Mantenha uma via
          com a ficha e entregue a segunda ao cliente. As confirmações abaixo não substituem o termo assinado.
        </Text>
        {ficha.consentimento.anexos.map((anexo, indice) => <View key={`${anexo.uri}-${indice}`} style={s.attachment}>
          <Text style={s.value}>{indice + 1}. {anexo.nome}</Text>
          <Image source={{ uri: anexo.uri }} resizeMode="contain"
            accessibilityLabel={`Página ${indice + 1} do termo de consentimento`}
            style={{ width: '100%', aspectRatio: 0.707, backgroundColor: theme.colors.paper }} />
          {!revisao && <Button title="Remover página" variant="ghost" accessibilityLabel={`Remover página ${indice + 1}`}
            onPress={() => atualizar({ ...ficha, consentimento: { ...ficha.consentimento,
              anexos: ficha.consentimento.anexos.filter((_, i) => i !== indice) } })} />}
        </View>)}
        {!revisao && <Button title="📎 Anexar termo assinado" accessibilityLabel="Anexar termo assinado" variant="outline" loading={anexando}
          disabled={ficha.consentimento.anexos.length >= 10} onPress={anexarTermo} />}
        {!!(erroAnexo || erros.anexos) && <Text accessibilityRole="alert" style={s.error}>{erroAnexo || erros.anexos}</Text>}
        <Text style={s.hint}>Até 10 imagens, com no máximo 10 MB por página. Os anexos também serão descartados ao sair.</Text>
        <Confirmacao label="Orientação e assinatura" description="O cliente foi orientado sobre os riscos e assinou o termo antes do procedimento."
          value={ficha.consentimento.orientado} review={revisao} error={erros.orientado}
          onChange={() => atualizar({ ...ficha, consentimento: { ...ficha.consentimento, orientado: !ficha.consentimento.orientado } })} />
        <Confirmacao label="Segunda via entregue" description="A segunda via do termo foi entregue ao cliente."
          value={ficha.consentimento.segundaViaEntregue} review={revisao} error={erros.segundaViaEntregue}
          onChange={() => atualizar({ ...ficha, consentimento: { ...ficha.consentimento, segundaViaEntregue: !ficha.consentimento.segundaViaEntregue } })} />
      </Secao>
      <Button title={revisao ? 'Voltar à edição' : 'Revisar ficha'} onPress={revisao ? editar : revisar} />
    </ScrollView>

    <Modal visible={!!saida} transparent animationType="fade" onRequestClose={() => setSaida(null)}>
      <View style={[s.overlay, { paddingHorizontal: gutter,
        paddingTop: insets.top + theme.spacing[4], paddingBottom: insets.bottom + theme.spacing[4] }]}>
        <ScrollView style={{ flexGrow: 0, maxHeight: '100%', width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
        <View accessibilityViewIsModal style={s.dialog}>
          <Text accessibilityRole="header" style={s.introTitle}>Descartar ficha?</Text>
          <Text style={s.body}>Os dados e anexos não foram salvos. Ao sair, será necessário preencher a ficha novamente.</Text>
          <Button title="Continuar preenchendo" onPress={() => setSaida(null)} />
          <Button title="Descartar e sair" variant="ghost" onPress={() => {
            if (saida) navigation.dispatch(saida);
            setSaida(null);
          }} />
        </View>
        </ScrollView>
      </View>
    </Modal>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: c.card, borderRadius: visual.radius.pill },
  pageTitle: { flex: 1, minWidth: 0, fontFamily: f.semibold, fontSize: 20, lineHeight: 28, color: c.text },
  intro: { gap: 12, marginBottom: 24 },
  eyebrow: { fontFamily: f.bold, fontSize: 11, lineHeight: 17, letterSpacing: 1.4, color: c.purple },
  introTitle: { fontFamily: f.bold, fontSize: 24, lineHeight: 32, color: c.text },
  body: { fontFamily: f.regular, fontSize: 14, lineHeight: 22, color: theme.colors.fg2 },
  notice: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.purple, padding: 16, backgroundColor: c.tint, borderRadius: theme.radius.md },
  card: { padding: 16, marginBottom: 20, gap: 12, backgroundColor: c.card, borderRadius: visual.radius.card, boxShadow: '0 4px 20px -2px rgba(28,25,23,0.05)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionNumber: { minWidth: 32, minHeight: 32, padding: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: c.tint, borderRadius: theme.radius.xs },
  sectionNumberText: { fontFamily: f.semibold, fontSize: 14, lineHeight: 20, color: c.purple },
  sectionTitle: { flex: 1, minWidth: 0, fontFamily: f.semibold, fontSize: 16, lineHeight: 24, color: c.text },
  field: { gap: 8, marginBottom: 4 },
  label: { fontFamily: f.medium, fontSize: 13, lineHeight: 20, color: theme.colors.fg2 },
  input: { width: '100%', minWidth: 0, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: c.soft, borderWidth: 1, borderColor: theme.colors.hairline, borderRadius: theme.radius.md, fontFamily: f.regular, fontSize: 16, lineHeight: 24, color: c.text },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
  inputFocused: { borderColor: c.purple, backgroundColor: c.card },
  inputError: { borderColor: theme.colors.error },
  reviewField: { gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.line },
  value: { fontFamily: f.regular, fontSize: 16, lineHeight: 24, color: c.text, flexShrink: 1 },
  hint: { fontFamily: f.regular, fontSize: 12, lineHeight: 19, color: theme.colors.fg2 },
  error: { fontFamily: f.medium, fontSize: 12, lineHeight: 19, color: theme.colors.error },
  product: { gap: 12, paddingBottom: 16, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: c.line },
  productTitle: { fontFamily: f.semibold, fontSize: 14, lineHeight: 22, color: c.purple },
  confirmation: { gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 56,
    padding: 14, borderWidth: 1.5, borderColor: theme.colors.hairline,
    borderRadius: theme.radius.md, backgroundColor: c.card },
  checkRowSelected: { borderColor: c.purple, backgroundColor: c.tint },
  checkBox: { width: 26, height: 26, flexShrink: 0, marginTop: 1, borderWidth: 2,
    borderColor: c.purple, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card },
  checkBoxSelected: { backgroundColor: c.purple },
  checkContent: { flex: 1, minWidth: 0, gap: 6 },
  checkLabel: { fontFamily: f.semibold, fontSize: 14, lineHeight: 22, color: c.text },
  checkStatus: { fontFamily: f.semibold, fontSize: 12, lineHeight: 18, color: c.purple },
  attachment: { gap: 8, marginBottom: 12 },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(28,25,23,0.6)' },
  dialog: { backgroundColor: c.card, padding: 20, borderRadius: visual.radius.card, gap: 16 },
});
