import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, CircleCheck, MessageCircle, type LucideIcon } from 'lucide-react-native';

import { useKanbanServicos, VisaoKanban } from '../../hooks/useKanbanServicos';
import { KanbanCardDTO } from '../../services/api/servicosService';
import { COLUNAS, ColunaKanban, IconeMeta, agruparPorColuna, iniciais, textosDoCard } from '../../utils/kanbanServicos';

/**
 * Serviços — Kanban somente leitura (Figma "Artista / Serviços"). Uma coluna
 * por vez, com as vizinhas aparecendo nas bordas; troca-se de coluna
 * deslizando ou tocando nas abas de status. O tatuador vê os próprios
 * serviços; o estúdio vê os da equipe inteira, com o tatuador em cada card.
 * A primeira coluna são os chats com mensagens que o tatuador não leu — no
 * estúdio, os clientes sem resposta e há quanto tempo esperam.
 */

const PADDING = 24;
const GAP = 12;
/** Quanto da coluna vizinha aparece à direita (390pt de tela → coluna de 300pt). */
const ESPIA = 54;

const ICONES: Record<IconeMeta, LucideIcon> = {
  mensagem: MessageCircle,
  calendario: CalendarDays,
  concluido: CircleCheck,
};

const SUBTITULO: Record<VisaoKanban, string> = {
  tatuador: 'Acompanhe seus serviços por status.',
  estudio: 'Acompanhe os serviços da equipe por status.',
};

function Contador({ valor, ativo = false, grande = false }: { valor: number; ativo?: boolean; grande?: boolean }) {
  return (
    <View
      className={`rounded-rd-pill ${grande ? 'px-2 py-0.5' : 'px-1.5 py-px'} ${ativo ? 'bg-on-ink/20' : 'bg-paper'}`}
    >
      <Text className={`font-body-semibold ${grande ? 'text-[12px]' : 'text-[11px]'} ${ativo ? 'text-on-ink' : 'text-fg-2'}`}>
        {valor}
      </Text>
    </View>
  );
}

function AbaStatus({ coluna, total, ativa, onPress, onLayout }: {
  coluna: ColunaKanban;
  total: number;
  ativa: boolean;
  onPress: () => void;
  onLayout: (x: number) => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLayout={(e) => onLayout(e.nativeEvent.layout.x)}
      activeOpacity={0.85}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      accessibilityLabel={`${coluna.titulo}, ${total}`}
      className={`flex-row items-center gap-1.5 rounded-rd-md pl-3 pr-1.5 py-1.5 ${ativa ? 'bg-plum' : 'bg-surface'}`}
    >
      <Text className={`text-[12px] ${ativa ? 'font-body-semibold text-on-ink' : 'font-body text-ink'}`}>
        {coluna.titulo}
      </Text>
      <Contador valor={total} ativo={ativa} />
    </TouchableOpacity>
  );
}

function CardServico({ card, visao }: { card: KanbanCardDTO; visao: VisaoKanban }) {
  const { etiqueta, icone, meta } = textosDoCard(card);
  const Icone = ICONES[icone];
  return (
    <View className="bg-paper border border-hairline rounded-rd-md p-[14px] gap-2">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 font-body-semibold text-[15px] text-ink" numberOfLines={1}>
          {card.clienteNome}
        </Text>
        {etiqueta && (
          <View className="bg-plum-tint rounded-rd-pill px-2 py-[3px]">
            <Text className="font-body-medium text-[11px] text-plum">{etiqueta}</Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center gap-1.5">
        <Icone size={16} color="#404040" strokeWidth={1.33} />
        <Text className="font-body text-[12px] text-fg-2" numberOfLines={1}>{meta}</Text>
      </View>
      {visao === 'estudio' && (
        <>
          <View className="h-px bg-surface" />
          <View className="flex-row items-center gap-2">
            <View className="w-[22px] h-[22px] rounded-rd-pill bg-plum items-center justify-center">
              <Text className="font-body-semibold text-[9px] text-on-ink">{iniciais(card.tatuadorNome)}</Text>
            </View>
            <Text className="font-body-medium text-[12px] text-ink-soft" numberOfLines={1}>
              {card.tatuadorNome}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

function Coluna({ coluna, cards, largura, visao, refreshing, onRefresh }: {
  coluna: ColunaKanban;
  cards: KanbanCardDTO[];
  largura: number;
  visao: VisaoKanban;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <View style={{ width: largura }} className="bg-surface-2 rounded-rd-lg p-3">
      <View className="flex-row items-center gap-2 px-0.5 pt-0.5 pb-1 mb-2.5">
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: coluna.cor }} />
        <Text className="flex-1 font-body-semibold text-[14px] text-ink">{coluna.titulo}</Text>
        <Contador valor={cards.length} grande />
      </View>
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#602C66" />}
      >
        {cards.length === 0 ? (
          <Text className="font-body text-[13px] text-fg-3 text-center mt-6">Nenhum serviço aqui.</Text>
        ) : (
          cards.map((card) => (
            <CardServico key={card.servicoId ?? `chat-${card.chatId}`} card={card} visao={visao} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Indicador({ ativa }: { ativa: number }) {
  return (
    <View className="flex-row items-center justify-center gap-1.5 pt-3.5">
      {COLUNAS.map((c, i) => (
        <View
          key={c.chave}
          className={`h-1.5 rounded-[3px] ${i === ativa ? 'w-[18px] bg-plum' : 'w-1.5 bg-hairline'}`}
        />
      ))}
    </View>
  );
}

export function ServicosScreen({ visao }: { visao: VisaoKanban }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { cards, loading, refreshing, error, reload, refresh } = useKanbanServicos(visao);

  const [ativa, setAtiva] = useState(0);
  const kanbanRef = useRef<ScrollView>(null);
  const abasRef = useRef<ScrollView>(null);
  const abasX = useRef<number[]>([]);

  const largura = width - PADDING - GAP - ESPIA;
  const passo = largura + GAP;
  const grupos = agruparPorColuna(cards);

  const focarAba = (indice: number) => {
    abasRef.current?.scrollTo({ x: Math.max(0, (abasX.current[indice] ?? 0) - PADDING), animated: true });
  };

  const irPara = (indice: number) => {
    setAtiva(indice);
    focarAba(indice);
    kanbanRef.current?.scrollTo({ x: indice * passo, animated: true });
  };

  const aoDeslizar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const indice = Math.min(COLUNAS.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / passo)));
    if (indice !== ativa) {
      setAtiva(indice);
      focarAba(indice);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-6 gap-1.5 mb-3.5">
        <Text className="font-display text-[32px] text-ink text-center">SERVIÇOS</Text>
        <Text className="font-body text-[13px] text-fg-3">{SUBTITULO[visao]}</Text>
      </View>

      <View className="mb-3.5">
        <ScrollView
          ref={abasRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: PADDING, gap: 6 }}
        >
          {COLUNAS.map((coluna, i) => (
            <AbaStatus
              key={coluna.chave}
              coluna={coluna}
              total={grupos[coluna.chave].length}
              ativa={i === ativa}
              onPress={() => irPara(i)}
              onLayout={(x) => { abasX.current[i] = x; }}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#602C66" />
        </View>
      ) : error && cards.length === 0 ? (
        <View className="flex-1 px-6">
          <View className="bg-surface-2 rounded-rd-lg p-5 items-center">
            <Text className="font-body text-[13px] text-fg-2 text-center mb-3">{error}</Text>
            <TouchableOpacity
              onPress={reload}
              activeOpacity={0.85}
              className="bg-ink rounded-rd-md px-5 py-2.5"
              accessibilityRole="button"
              accessibilityLabel="Tentar de novo"
            >
              <Text className="font-body-bold text-[13px] text-on-ink">Tentar de novo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView
            ref={kanbanRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToOffsets={COLUNAS.map((_, i) => i * passo)}
            decelerationRate="fast"
            disableIntervalMomentum
            onMomentumScrollEnd={aoDeslizar}
            scrollEventThrottle={16}
            className="flex-1"
            // A sobra à direita deixa a última coluna parar na mesma posição das outras.
            contentContainerStyle={{ paddingLeft: PADDING, paddingRight: width - PADDING - largura, gap: GAP }}
          >
            {COLUNAS.map((coluna) => (
              <Coluna
                key={coluna.chave}
                coluna={coluna}
                cards={grupos[coluna.chave]}
                largura={largura}
                visao={visao}
                refreshing={refreshing}
                onRefresh={refresh}
              />
            ))}
          </ScrollView>
          <Indicador ativa={ativa} />
        </View>
      )}

      {/* Respiro acima da barra de abas (mesma folga das outras telas). */}
      <View style={{ height: 16 }} />
    </View>
  );
}

export function ArtistServicosScreen() {
  return <ServicosScreen visao="tatuador" />;
}

export function StudioServicosScreen() {
  return <ServicosScreen visao="estudio" />;
}
