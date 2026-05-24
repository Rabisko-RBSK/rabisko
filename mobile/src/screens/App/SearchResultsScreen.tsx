import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lightbulb, Mail, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';

import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { HomeStackParamList } from '../../routes/home.stack';
import {
  ArtistSearchResult,
  searchService,
} from '../../services/api/searchService';
import { useEstilos } from '../../hooks/useEstilos';
import { closestMatch } from '../../utils/levenshtein';
import { normalize } from '../../utils/normalize';

type SearchResultsRoute = RouteProp<HomeStackParamList, 'SearchResults'>;
type SearchResultsNav = NativeStackNavigationProp<HomeStackParamList, 'SearchResults'>;

/** Raio default quando o usuario liga "perto de mim" sem ajustar. Bate com o default do backend. */
const RAIO_KM_DEFAULT = 25;

export function SearchResultsScreen() {
  const route = useRoute<SearchResultsRoute>();
  const navigation = useNavigation<SearchResultsNav>();
  const insets = useSafeAreaInsets();

  const estilo = route.params?.estilo?.trim() || undefined;

  // Catalogo cacheado (compartilhado com a Home). Usado pro did-you-mean.
  const { estilos: catalogo } = useEstilos();

  const [results, setResults] = useState<ArtistSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * "Voce quis dizer X?" — calculado quando:
   *  1. ha termo (`estilo`),
   *  2. o termo nao casa exatamente com nenhum item do catalogo (nao e typo
   *     se o usuario escolheu da dropdown ou digitou certo),
   *  3. o catalogo ja carregou.
   * O proprio closestMatch decide se ha candidato perto o suficiente — se
   * retornar null, nao mostramos chip (evita sugestao com baixa confianca).
   */
  const didYouMean = useMemo(() => {
    if (!estilo || catalogo.length === 0) return null;
    const q = normalize(estilo);
    const jaExato = catalogo.some((e) => normalize(e.nome) === q);
    if (jaExato) return null;
    return closestMatch(estilo, catalogo, (e) => e.nome);
  }, [estilo, catalogo]);

  const handleDidYouMean = useCallback(() => {
    if (!didYouMean) return;
    navigation.setParams({ estilo: didYouMean.item.nome });
  }, [didYouMean, navigation]);

  // Distancia: estado local. Mantemos lat/lng separado pra poder re-fetch
  // mesmo se o usuario desligar e ligar o switch (sem pedir permissao de novo).
  const [usarDistancia, setUsarDistancia] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pedindoLocalizacao, setPedindoLocalizacao] = useState(false);

  const fetchResults = useCallback(
    async (opts: { lat?: number; lng?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchService.buscarArtistas({
          estilo: estilo ? [estilo] : undefined,
          lat: opts.lat,
          lng: opts.lng,
          raioKm: opts.lat != null ? RAIO_KM_DEFAULT : undefined,
        });
        setResults(data);
      } catch (err: any) {
        // Erros 4xx/5xx do axios viram exception. Mensagem amigavel — o
        // detalhe tecnico fica no log do dev.
        console.warn('[SearchResults] erro na busca', err?.response?.status, err?.message);
        setError('Nao foi possivel carregar os resultados. Tente de novo.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [estilo],
  );

  // Primeira carga: somente filtro de estilo (se houver).
  useEffect(() => {
    fetchResults({});
  }, [fetchResults]);

  /**
   * Liga/desliga o filtro de distancia. Na primeira vez que liga, pede
   * permissao e busca a posicao; depois reutiliza coords cacheadas pra
   * evitar pedir permissao a cada toggle.
   */
  const handleToggleDistancia = useCallback(
    async (proximoValor: boolean) => {
      if (!proximoValor) {
        setUsarDistancia(false);
        await fetchResults({});
        return;
      }

      // Liga: precisa de coords. Se ja temos, so reusa.
      if (coords) {
        setUsarDistancia(true);
        await fetchResults({ lat: coords.lat, lng: coords.lng });
        return;
      }

      setPedindoLocalizacao(true);
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          // Permissao negada: mantem switch desligado, avisa o usuario.
          // Se for negacao permanente (canAskAgain=false), oferece abrir
          // as configuracoes — caso contrario o switch fica inutil.
          if (!perm.canAskAgain) {
            Alert.alert(
              'Permissao necessaria',
              'Habilite a localizacao nas configuracoes do app pra filtrar por distancia.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir configuracoes', onPress: () => Linking.openSettings() },
              ],
            );
          } else {
            Alert.alert(
              'Permissao negada',
              'Sem acesso a localizacao a busca segue apenas pelo estilo.',
            );
          }
          setUsarDistancia(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const novoCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(novoCoords);
        setUsarDistancia(true);
        await fetchResults(novoCoords);
      } catch (err) {
        console.warn('[SearchResults] erro ao obter localizacao', err);
        Alert.alert('Erro', 'Nao foi possivel obter sua localizacao.');
        setUsarDistancia(false);
      } finally {
        setPedindoLocalizacao(false);
      }
    },
    [coords, fetchResults],
  );

  const handleRetry = useCallback(() => {
    fetchResults(usarDistancia && coords ? { lat: coords.lat, lng: coords.lng } : {});
  }, [fetchResults, usarDistancia, coords]);

  const renderItem = useCallback(
    ({ item }: { item: ArtistSearchResult }) => (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('EstablishmentProfile', { id: item.tatuadorId })}
        className="bg-surface rounded-r-md p-4 mb-3"
      >
        <Text className="font-aux-bold text-[18px] text-ink" numberOfLines={1}>
          {item.nome}
        </Text>

        <View className="flex-row items-center mt-2">
          <Mail size={14} color="#404040" style={{ marginRight: 6 }} />
          <Text className="font-body text-[13px] text-fg-2" numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {item.endereco ? (
          <View className="flex-row items-start mt-1">
            <MapPin size={14} color="#6B6B6B" style={{ marginRight: 6, marginTop: 2 }} />
            <Text className="font-body text-[13px] text-fg-3 flex-1" numberOfLines={2}>
              {item.endereco}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    ),
    [navigation],
  );

  const headerSubtitle = estilo
    ? `Estilo: ${estilo}`
    : 'Todos os tatuadores';

  return (
    <View className="flex-1 bg-background">
      <Header title="BUSCA" onBack={() => navigation.goBack()} />

      <View className="px-6 mb-2">
        <Text className="font-body text-[13px] text-fg-2">{headerSubtitle}</Text>
      </View>

      {/* Toggle "perto de mim" */}
      <View className="px-6 mb-4 flex-row items-center justify-between bg-surface-2 rounded-r-md py-3 px-4 mx-6">
        <View className="flex-1 pr-3">
          <Text className="font-body-semibold text-[14px] text-ink">Perto de mim</Text>
          <Text className="font-body text-[12px] text-fg-3 mt-0.5">
            {usarDistancia && coords
              ? `Filtrando em raio de ${RAIO_KM_DEFAULT} km`
              : 'Usa a localizacao do seu aparelho'}
          </Text>
        </View>
        {pedindoLocalizacao ? (
          <ActivityIndicator color="#602C66" />
        ) : (
          <Switch
            value={usarDistancia}
            onValueChange={handleToggleDistancia}
            trackColor={{ true: '#602C66', false: '#D9D9D9' }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#602C66" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-body text-[14px] text-fg-2 text-center mb-4">{error}</Text>
          <Button title="Tentar de novo" onPress={handleRetry} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.tatuadorId}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 4,
            paddingBottom: insets.bottom + 96,
          }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-16 px-8">
              <Text className="font-aux-bold text-[18px] text-ink mb-2 text-center">
                Nenhum tatuador encontrado
              </Text>
              <Text className="font-body text-[13px] text-fg-2 text-center">
                Tente um estilo diferente ou desligue o filtro de distancia.
              </Text>
              {didYouMean && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleDidYouMean}
                  className="flex-row items-center bg-plum-tint rounded-r-md px-4 py-3 mt-6"
                >
                  <Lightbulb size={16} color="#602C66" style={{ marginRight: 8 }} />
                  <Text className="font-body text-[13px] text-ink">
                    Voce quis dizer{' '}
                    <Text className="font-body-bold text-plum">{didYouMean.item.nome}</Text>?
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
