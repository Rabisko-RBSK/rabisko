import React, { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NavigationAction } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { AnamneseButton as Button } from '../../components/anamnese/AnamneseButton';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../theme';
import type { ManagementStackParamList } from '../../routes/management.stack';
import {
  camposCliente, camposData, camposProcedimento, camposProduto,
  novaFicha, novoProduto, validarFicha,
} from '../../services/anamnese';
import type { ErrosAnamnese, FichaAnamnese } from '../../services/anamnese';

type Props = NativeStackScreenProps<ManagementStackParamList, 'Anamnese'>;

const MAX_CONTENT_WIDTH = 560;

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <View className="mb-6 gap-3">
    <Text accessibilityRole="header" className="font-display text-[24px] text-ink tracking-wide">{titulo}</Text>
    {children}
  </View>;
}

function Campo({ label, value, onChange, error, date, multiline, review }: {
  label: string; value: string; onChange: (value: string) => void;
  error?: string; date?: boolean; multiline?: boolean; review: boolean;
}) {
  if (review) return <View className="mb-3">
    <Text className="font-body text-[12px] text-fg-2">{label}</Text>
    <Text selectable className="font-body text-[16px] leading-6 text-ink">{value}</Text>
  </View>;
  return <Input label={`${label} *`} accessibilityLabel={label} value={value}
    onChangeText={onChange} error={error} multiline={multiline}
    placeholder={date ? 'DD/MM/AAAA' : undefined}
    keyboardType={date ? 'numbers-and-punctuation' : 'default'}
    maxLength={date ? 10 : 2000} />;
}

function Confirmacao({ label, value, onChange, error, review }: {
  label: string; value: boolean; onChange: () => void; error?: string; review: boolean;
}) {
  return <View className="gap-2">
    <Button title={`${value ? '✓ ' : ''}${label}`} variant={value ? 'plum' : 'secondary'}
      accessibilityRole="checkbox" accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: review }} disabled={review}
      onPress={onChange} />
    {error && <Text accessibilityRole="alert" className="font-body text-[12px] text-error">{error}</Text>}
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

  return <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View className="flex-row items-center gap-2" style={{ paddingTop: insets.top + theme.spacing[2],
      paddingHorizontal: gutter, paddingBottom: theme.spacing[2], width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={revisao ? editar : navigation.goBack}
        style={{ minWidth: theme.spacing[12], minHeight: theme.spacing[12], justifyContent: 'center', alignItems: 'center' }}>
        <ChevronLeft size={theme.spacing[6]} color={theme.colors.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="flex-1 font-display text-[32px] leading-10 text-ink tracking-wide">
        {revisao ? 'REVISAR FICHA' : 'ANAMNESE'}
      </Text>
    </View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: gutter, paddingBottom: theme.spacing[10] + insets.bottom,
        width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
      <View className="bg-surface rounded-rd-lg p-4 mb-6 gap-2">
        <Text className="font-body-bold text-[16px] text-ink">Ficha cadastral do cliente</Text>
        <Text className="font-body text-[14px] text-fg-2">
          Preencha os dados com o cliente e confira os registros do atendimento. Todos os campos são obrigatórios.
        </Text>
        <Text accessibilityRole="alert" className="font-body text-[14px] text-fg-2">
          {revisao ? 'Ficha revisada, ainda não salva. ' : ''}
          O salvamento ainda não está disponível. Ao sair desta tela, os dados serão descartados.
        </Text>
      </View>
      {!!Object.keys(erros).length && !revisao && <Text accessibilityRole="alert"
        className="font-body-bold text-[14px] text-error mb-6">Revise os campos indicados abaixo para continuar.</Text>}

      <Secao titulo="01 · IDENTIFICAÇÃO">
        {camposCliente.map(([campo, label]) => <Campo key={campo} label={label}
          value={ficha.cliente[campo]} date={camposData.has(campo)} review={revisao}
          multiline={campo === 'enderecoCompleto'} error={erros[`cliente.${campo}`]}
          onChange={(value) => atualizar({ ...ficha, cliente: { ...ficha.cliente, [campo]: value } })} />)}
        <Text className="font-body text-[12px] text-fg-2">Endereço: logradouro, número, complemento, bairro, cidade, UF e CEP.</Text>
        <Text className="font-body text-[12px] text-fg-2">Em São Paulo, tatuagem e piercing são proibidos para menores de 18 anos, mesmo com autorização dos pais.</Text>
      </Secao>

      <Secao titulo="02 · PROCEDIMENTO">
        {camposProcedimento.map(([campo, label]) => <Campo key={campo} label={label}
          value={ficha.procedimento[campo]} date={camposData.has(campo)} review={revisao}
          multiline={campo === 'intercorrencias'} error={erros[`procedimento.${campo}`]}
          onChange={(value) => atualizar({ ...ficha, procedimento: { ...ficha.procedimento, [campo]: value } })} />)}
        <Text className="font-body text-[12px] text-fg-2">Descreva alergias, infecções, acidentes ou outras intercorrências. Se não houver, informe “Nenhuma”.</Text>
      </Secao>

      <Secao titulo="03 · PRODUTOS UTILIZADOS">
        {ficha.produtos.map((produto, indice) => <View key={indice} className="bg-surface-2 rounded-rd-lg p-4 mb-3">
          <Text className="font-body-bold text-[16px] text-ink mb-4">Produto {indice + 1}</Text>
          {camposProduto.map(([campo, label]) => <Campo key={campo} label={label} value={produto[campo]}
            date={camposData.has(campo)} review={revisao} error={erros[`produtos.${indice}.${campo}`]}
            onChange={(value) => atualizar({ ...ficha, produtos: ficha.produtos.map((item, i) => i === indice ? { ...item, [campo]: value } : item) })} />)}
          {!revisao && ficha.produtos.length > 1 && <Button title="Remover produto" variant="ghost"
            accessibilityLabel={`Remover produto ${indice + 1}`}
            onPress={() => atualizar({ ...ficha, produtos: ficha.produtos.filter((_, i) => i !== indice) })} />}
        </View>)}
        {!revisao && <Button title="Adicionar produto" variant="outline"
          onPress={() => atualizar({ ...ficha, produtos: [...ficha.produtos, novoProduto()] })} />}
        {erros.produtos && <Text className="font-body text-error">{erros.produtos}</Text>}
      </Secao>

      <Secao titulo="04 · CONSENTIMENTO">
        <Text className="font-body text-[14px] text-fg-2">
          Anexe fotos legíveis de todas as páginas do Termo de Consentimento Livre e Esclarecido,
          assinado antes do procedimento, conforme o documento de identidade. Mantenha uma via
          com a ficha e entregue a segunda ao cliente. As confirmações abaixo não substituem o termo assinado.
        </Text>
        {ficha.consentimento.anexos.map((anexo, indice) => <View key={`${anexo.uri}-${indice}`} className="gap-2 mb-3">
          <Text className="font-body text-[14px] text-ink">{indice + 1}. {anexo.nome}</Text>
          <Image source={{ uri: anexo.uri }} resizeMode="contain"
            accessibilityLabel={`Página ${indice + 1} do termo de consentimento`}
            style={{ width: '100%', aspectRatio: 0.707, backgroundColor: theme.colors.paper }} />
          {!revisao && <Button title="Remover página" variant="ghost" accessibilityLabel={`Remover página ${indice + 1}`}
            onPress={() => atualizar({ ...ficha, consentimento: { ...ficha.consentimento,
              anexos: ficha.consentimento.anexos.filter((_, i) => i !== indice) } })} />}
        </View>)}
        {!revisao && <Button title="Anexar termo assinado" variant="outline" loading={anexando}
          disabled={ficha.consentimento.anexos.length >= 10} onPress={anexarTermo} />}
        {!!(erroAnexo || erros.anexos) && <Text accessibilityRole="alert" className="font-body text-[12px] text-error">{erroAnexo || erros.anexos}</Text>}
        <Text className="font-body text-[12px] text-fg-2">Até 10 imagens, com no máximo 10 MB por página. Os anexos também serão descartados ao sair.</Text>
        <Text className="font-body text-[14px] text-fg-2">O cliente foi orientado sobre os riscos e assinou o termo antes do procedimento.</Text>
        <Confirmacao label="Orientação e assinatura" value={ficha.consentimento.orientado} review={revisao} error={erros.orientado}
          onChange={() => atualizar({ ...ficha, consentimento: { ...ficha.consentimento, orientado: !ficha.consentimento.orientado } })} />
        <Text className="font-body text-[14px] text-fg-2">A segunda via do termo foi entregue ao cliente.</Text>
        <Confirmacao label="Segunda via entregue" value={ficha.consentimento.segundaViaEntregue} review={revisao} error={erros.segundaViaEntregue}
          onChange={() => atualizar({ ...ficha, consentimento: { ...ficha.consentimento, segundaViaEntregue: !ficha.consentimento.segundaViaEntregue } })} />
      </Secao>
      <Button title={revisao ? 'Voltar à edição' : 'Revisar ficha'} onPress={revisao ? editar : revisar} />
    </ScrollView>

    <Modal visible={!!saida} transparent animationType="fade" onRequestClose={() => setSaida(null)}>
      <View className="flex-1 bg-ink/60 justify-center" style={{ paddingHorizontal: gutter,
        paddingTop: insets.top + theme.spacing[4], paddingBottom: insets.bottom + theme.spacing[4] }}>
        <ScrollView style={{ flexGrow: 0, maxHeight: '100%', width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
        <View accessibilityViewIsModal className="bg-paper rounded-rd-lg p-4 gap-4">
          <Text accessibilityRole="header" className="font-display text-[24px] text-ink">DESCARTAR FICHA?</Text>
          <Text className="font-body text-[16px] text-fg-2">Os dados e anexos não foram salvos. Ao sair, será necessário preencher a ficha novamente.</Text>
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
