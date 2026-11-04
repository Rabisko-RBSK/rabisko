import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { CheckCircle2, X } from 'lucide-react-native';

import { appointmentService } from '../../services/api';

interface Props {
  visible: boolean;
  /** Sessão aberta no detalhe: o QR lido precisa ser dela. */
  sessionId: string;
  onClose: () => void;
  /** Chamado depois do check-in confirmado pelo backend. */
  onRealizada: () => void;
}

/**
 * Id da sessão dentro do token ("sessão|cliente|validade" em base64url, antes
 * do "."). Só para avisar na hora quando o QR é de outra sessão; quem confere
 * a assinatura e a validade é o backend.
 */
function sessaoDoToken(token: string): string | null {
  try {
    const parte = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const comPadding = parte + '='.repeat((4 - (parte.length % 4)) % 4);
    return atob(comPadding).split('|')[0] ?? null;
  } catch {
    return null;
  }
}

function mensagemDoErro(err: any): string {
  const data = err?.response?.data;
  if (err?.response?.status === 403) return 'Esta sessão não é sua.';
  return data?.mensagem ?? data?.message ?? 'Não foi possível registrar a sessão. Tente de novo.';
}

/**
 * Leitor de QR do TATUADOR: lê o código que o cliente mostra e registra a
 * sessão como realizada (check-in). Os botões manuais do detalhe continuam
 * valendo para quando a câmera ou o celular do cliente não ajudarem.
 */
export function LerQrModal({ visible, sessionId, onClose, onRealizada }: Props) {
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [realizada, setRealizada] = useState(false);
  // A câmera dispara várias leituras seguidas do mesmo código: só a primeira vale.
  const lido = useRef(false);

  useEffect(() => {
    if (!visible) return;
    lido.current = false;
    setErro(null);
    setRealizada(false);
    setEnviando(false);
  }, [visible]);

  const aoLer = async ({ data }: BarcodeScanningResult) => {
    if (lido.current) return;
    lido.current = true;

    if (sessaoDoToken(data) !== sessionId) {
      setErro('Este QR não é desta sessão. Confira se o cliente abriu o código da sessão certa.');
      return;
    }
    setEnviando(true);
    try {
      await appointmentService.checkIn(data);
      setRealizada(true);
      onRealizada();
    } catch (err: any) {
      console.warn('[LerQr] erro no check-in', err?.response?.status, err?.message);
      setErro(mensagemDoErro(err));
    } finally {
      setEnviando(false);
    }
  };

  const lerDeNovo = () => {
    setErro(null);
    lido.current = false;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-4 pt-2 pb-3">
          <Text className="flex-1 font-display text-[22px] text-ink tracking-widest text-center">
            LER QR DO CLIENTE
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} className="absolute right-4"
            accessibilityRole="button" accessibilityLabel="Fechar">
            <X size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 pb-6">
          {!permissao ? (
            <View className="flex-1 items-center justify-center"><ActivityIndicator color="#602C66" /></View>
          ) : !permissao.granted ? (
            <View className="flex-1 items-center justify-center">
              <Text className="font-body text-[14px] text-fg-2 text-center mb-4 leading-[20px]">
                Para ler o QR do cliente, o Rabisko precisa usar a câmera.
              </Text>
              <TouchableOpacity onPress={pedirPermissao} activeOpacity={0.85}
                className="bg-plum rounded-rd-md px-5 py-3" accessibilityRole="button">
                <Text className="font-body-semibold text-[14px] text-white">Permitir câmera</Text>
              </TouchableOpacity>
            </View>
          ) : realizada ? (
            <View className="flex-1 items-center justify-center">
              <CheckCircle2 size={56} color="#10B981" />
              <Text className="font-body-semibold text-[16px] text-ink text-center mt-4">Sessão realizada</Text>
              <Text className="font-body text-[13px] text-fg-2 text-center mt-2">
                O check-in foi registrado pelo QR do cliente.
              </Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.85}
                className="bg-plum rounded-rd-md px-6 py-3 mt-6" accessibilityRole="button">
                <Text className="font-body-semibold text-[14px] text-white">Concluir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="flex-1 rounded-rd-lg overflow-hidden bg-ink">
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={erro || enviando ? undefined : aoLer}
                />
                {enviando && (
                  <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-black/40">
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </View>
              {erro ? (
                <View className="mt-4">
                  <Text className="font-body text-[13px] text-error text-center mb-3 leading-[18px]">{erro}</Text>
                  <TouchableOpacity onPress={lerDeNovo} activeOpacity={0.85}
                    className="bg-plum rounded-rd-md py-3 items-center" accessibilityRole="button">
                    <Text className="font-body-semibold text-[14px] text-white">Ler de novo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text className="font-body text-[13px] text-fg-2 text-center mt-4 leading-[18px]">
                  Aponte a câmera para o QR que aparece no celular do cliente.
                </Text>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
