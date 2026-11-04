import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { appointmentService } from '../../services/api';

/** Pede um token novo um pouco antes do atual vencer (ele vale 2 minutos). */
const RENOVAR_ANTES_MS = 20_000;

interface Props {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
}

function mensagemDoErro(err: any): string {
  const data = err?.response?.data;
  return data?.mensagem ?? data?.message ?? 'Não foi possível gerar o QR. Tente novamente.';
}

/**
 * QR code de check-in que o CLIENTE mostra ao tatuador na sessão. O token é
 * assinado pelo backend e vale 2 minutos; a tela pede outro sozinha antes de
 * vencer, então um print do QR não serve depois. Lido pelo tatuador, a sessão
 * fica marcada como realizada.
 */
export function QrSessaoModal({ visible, sessionId, onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<number | null>(null);
  const [agora, setAgora] = useState(Date.now());
  const [erro, setErro] = useState<string | null>(null);
  const renovacao = useRef<ReturnType<typeof setTimeout> | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const t = await appointmentService.qrCodeSessao(sessionId);
      const expira = new Date(t.expiraEm).getTime();
      setToken(t.token);
      setExpiraEm(expira);
      if (renovacao.current) clearTimeout(renovacao.current);
      renovacao.current = setTimeout(carregar, Math.max(expira - Date.now() - RENOVAR_ANTES_MS, 5_000));
    } catch (err: any) {
      console.warn('[QrSessao] erro ao gerar QR', err?.response?.status, err?.message);
      setToken(null);
      setErro(mensagemDoErro(err));
    }
  }, [sessionId]);

  useEffect(() => {
    if (!visible) return;
    carregar();
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    return () => {
      clearInterval(relogio);
      if (renovacao.current) clearTimeout(renovacao.current);
      renovacao.current = null;
      setToken(null);
      setExpiraEm(null);
    };
  }, [visible, carregar]);

  const segundos = expiraEm ? Math.max(0, Math.round((expiraEm - agora) / 1000)) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            QR DA SESSÃO
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} className="absolute right-4"
            accessibilityRole="button" accessibilityLabel="Fechar">
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          {erro ? (
            <View className="items-center">
              <Text className="font-body text-[14px] text-fg-2 text-center mb-4 leading-[20px]">{erro}</Text>
              <TouchableOpacity onPress={carregar} hitSlop={8} accessibilityRole="button">
                <Text className="font-body-semibold text-[14px] text-plum">Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : !token ? (
            <ActivityIndicator color="#602C66" />
          ) : (
            <>
              <View className="bg-white p-5 rounded-rd-lg" accessible accessibilityLabel="QR code da sessão">
                <QRCode value={token} size={240} />
              </View>
              <Text className="font-body-semibold text-[15px] text-ink text-center mt-6">
                Mostre este código ao seu tatuador
              </Text>
              <Text className="font-body text-[13px] text-fg-2 text-center mt-2 leading-[18px]">
                Quando ele ler, a sessão fica registrada como realizada.
              </Text>
              {segundos !== null && (
                <Text className="font-body text-[12px] text-fg-3 text-center mt-4">
                  O código se renova sozinho · vale por mais {segundos}s
                </Text>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
