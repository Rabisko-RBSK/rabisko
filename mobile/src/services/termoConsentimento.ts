import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

/** Modelo original incluído no aplicativo, independente do backend. */
const modelo = require('../../assets/documents/tcle-modelo.pdf');

export async function baixarModeloTermo(): Promise<void> {
  const asset = Asset.fromModule(modelo);
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = asset.uri;
    link.download = 'Termo-de-consentimento-TCLE.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('O compartilhamento de arquivos não está disponível neste dispositivo.');
  }
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Não foi possível obter o modelo.');
  await Sharing.shareAsync(asset.localUri, {
    mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Salvar ou imprimir o termo',
  });
}
