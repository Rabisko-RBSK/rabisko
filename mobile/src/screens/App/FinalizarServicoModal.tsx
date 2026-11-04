import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, ImagePlus, X } from 'lucide-react-native';

import { Checkbox } from '../../components/common/Checkbox';
import { servicosService, KanbanCardDTO } from '../../services/api/servicosService';
import { escolherImagemDaGaleria } from '../../utils/imagePicker';

interface Props {
  /** Card do serviço a finalizar; null fecha o modal. */
  card: KanbanCardDTO | null;
  onClose: () => void;
  /** Chamado depois que o backend confirmou a finalização. */
  onFinalizado: () => void;
}

function mensagemDoErro(err: any): string {
  const data = err?.response?.data;
  if (typeof data === 'string' && data) return data;
  if (err?.response?.status === 403) return 'Este serviço não é seu.';
  return data?.mensagem ?? data?.message ?? 'Não foi possível finalizar o serviço. Tente de novo.';
}

/**
 * Tatuador encerra o serviço a qualquer momento. As sessões futuras que ainda
 * não foram marcadas são canceladas pelo backend. A foto só é pedida quando o
 * trabalho vai para o portfólio.
 */
export function FinalizarServicoModal({ card, onClose, onFinalizado }: Props) {
  const [portfolio, setPortfolio] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    if (!card) return;
    setPortfolio(false);
    setFotoUri(null);
    setEnviando(false);
    setErro(null);
    setFinalizado(false);
  }, [card]);

  const escolherFoto = async () => {
    const uri = await escolherImagemDaGaleria({ editar: true });
    if (uri) {
      setFotoUri(uri);
      setErro(null);
    }
  };

  const confirmar = async () => {
    if (!card?.servicoId) return;
    if (portfolio && !fotoUri) {
      setErro('Escolha a foto do trabalho para adicionar ao portfólio.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await servicosService.finalizar(card.servicoId, portfolio, portfolio ? fotoUri ?? undefined : undefined);
      setFinalizado(true);
      onFinalizado();
    } catch (err: any) {
      console.warn('[FinalizarServico] erro', err?.response?.status, err?.message);
      setErro(mensagemDoErro(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible={!!card} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            FINALIZAR SERVIÇO
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} className="absolute right-4"
            accessibilityRole="button" accessibilityLabel="Fechar">
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {finalizado ? (
          <View className="flex-1 items-center justify-center px-6">
            <CheckCircle2 size={56} color="#10B981" />
            <Text className="font-body-semibold text-[16px] text-ink text-center mt-4">Serviço finalizado</Text>
            <Text className="font-body text-[13px] text-fg-2 text-center mt-2 leading-[18px]">
              {portfolio ? 'A foto já está no seu portfólio.' : 'O serviço foi para a coluna de finalizados.'}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85}
              className="bg-plum rounded-rd-md px-6 py-3 mt-6" accessibilityRole="button">
              <Text className="font-body-semibold text-[14px] text-white">Concluir</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 px-6 pb-6">
            <Text className="font-body-semibold text-[16px] text-ink">{card?.clienteNome}</Text>
            <Text className="font-body text-[13px] text-fg-2 mt-1 leading-[18px]">
              O serviço vai para os finalizados. As sessões futuras que ainda não foram
              marcadas serão canceladas.
            </Text>

            <View className="mt-6">
              <Checkbox
                checked={portfolio}
                onChange={(v) => { setPortfolio(v); setErro(null); }}
                accessibilityLabel="Adicionar ao portfólio"
                label={<Text className="font-body text-[14px] text-ink">Adicionar ao portfólio</Text>}
              />
            </View>

            {portfolio && (
              <TouchableOpacity onPress={escolherFoto} activeOpacity={0.85}
                className="mt-4 rounded-rd-lg border border-hairline bg-paper overflow-hidden items-center justify-center"
                style={{ height: 240 }}
                accessibilityRole="button"
                accessibilityLabel={fotoUri ? 'Trocar foto do trabalho' : 'Escolher foto do trabalho'}>
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View className="items-center">
                    <ImagePlus size={28} color="#602C66" />
                    <Text className="font-body-semibold text-[14px] text-plum mt-2">Escolher foto do trabalho</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {portfolio && fotoUri && (
              <Text className="font-body text-[12px] text-fg-3 text-center mt-2">Toque na foto para trocar.</Text>
            )}

            <View className="flex-1" />

            {erro && (
              <Text className="font-body text-[13px] text-error text-center mb-3 leading-[18px]">{erro}</Text>
            )}
            <TouchableOpacity onPress={confirmar} disabled={enviando} activeOpacity={0.85}
              className={`rounded-rd-md py-3.5 items-center ${enviando ? 'bg-plum/60' : 'bg-plum'}`}
              accessibilityRole="button" accessibilityLabel="Finalizar serviço">
              {enviando
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text className="font-body-semibold text-[15px] text-white">Finalizar serviço</Text>}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
