import React, { useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { Input } from './Input';
import { Checkbox } from './Checkbox';
import type { EnderecoInput } from '../../services/api';
import { apenasDigitos, buscar, formatarCep } from '../../services/cepService';

/** Valor de "Sem número" (convenção dos Correios). */
export const SEM_NUMERO = 'S/N';

/**
 * Mensagem de erro do endereço, ou null se estiver pronto para enviar.
 * Espelha as validações do EnderecoDTO do backend (que devolve 400 sem mensagem).
 */
export function validarEndereco(e: EnderecoInput | null): string | null {
  if (!e) return 'Informe o CEP do endereço.';
  if (apenasDigitos(e.cep).length !== 8) return 'CEP incompleto.';
  if (!e.logradouro.trim()) return 'Informe a rua do endereço.';
  if (!e.cidade.trim() || e.uf.trim().length !== 2) return 'Informe a cidade e a UF (2 letras).';
  if (!e.numero?.trim()) return 'Informe o número do endereço ou marque "Sem número".';
  return null;
}

type StatusCep = 'idle' | 'buscando' | 'encontrado' | 'naoEncontrado' | 'erro';

interface Props {
  /** null enquanto o CEP não foi informado. */
  value: EnderecoInput | null;
  onChange: (endereco: EnderecoInput | null) => void;
  disabled?: boolean;
}

/**
 * Endereço por CEP: o usuário digita o CEP, a rua/bairro/cidade vêm da ViaCEP
 * e ele completa só número e complemento. Cobre CEP único de cidade (sem rua),
 * CEP inexistente e falha de rede (preenchimento manual).
 * Componente controlado: o endereço fica no pai.
 */
export function EnderecoForm({ value, onChange, disabled }: Props) {
  // Com valor inicial (ex.: edição de perfil), já começa mostrando o resumo.
  const [cep, setCep] = useState(value ? formatarCep(value.cep) : '');
  const [status, setStatus] = useState<StatusCep>(value ? 'encontrado' : 'idle');
  const [modoManual, setModoManual] = useState(false);
  // Rua e bairro editáveis: CEP único de cidade (ViaCEP sem rua), "Alterar" ou modo manual.
  // Definido na busca, e não a partir de value.logradouro, para o campo não sumir enquanto o usuário digita.
  const [editarRua, setEditarRua] = useState(false);
  // Descarta respostas de CEPs antigos que cheguem depois do mais recente.
  const ultimaBusca = useRef(0);

  const atualizar = (campos: Partial<EnderecoInput>) => {
    if (!value) return;
    onChange({ ...value, ...campos });
  };

  const vazioCom = (cepFormatado: string): EnderecoInput => ({
    cep: cepFormatado,
    logradouro: '',
    bairro: '',
    cidade: '',
    uf: '',
    numero: value?.numero,
    complemento: value?.complemento,
  });

  const alterarCep = async (texto: string) => {
    const formatado = formatarCep(texto);
    setCep(formatado);
    setModoManual(false);
    setEditarRua(false);

    if (apenasDigitos(formatado).length !== 8) {
      ultimaBusca.current += 1;
      setStatus('idle');
      onChange(null);
      return;
    }

    const id = ++ultimaBusca.current;
    setStatus('buscando');
    onChange(null);
    try {
      const resultado = await buscar(formatado);
      if (id !== ultimaBusca.current) return;
      if (!resultado) {
        setStatus('naoEncontrado');
        return;
      }
      setStatus('encontrado');
      setEditarRua(!resultado.logradouro);
      onChange({
        ...resultado,
        numero: value?.numero,
        complemento: value?.complemento,
      });
    } catch (err: any) {
      if (id !== ultimaBusca.current) return;
      console.warn('[EnderecoForm] falha ao buscar CEP', err?.message);
      setStatus('erro');
    }
  };

  const preencherManualmente = () => {
    setModoManual(true);
    setEditarRua(true);
    setStatus('encontrado');
    onChange(vazioCom(cep));
  };

  const semNumero = value?.numero === SEM_NUMERO;

  return (
    <View>
      <Input
        label="CEP"
        placeholder="00000-000"
        icon={MapPin}
        keyboardType="number-pad"
        maxLength={9}
        value={cep}
        onChangeText={alterarCep}
        editable={!disabled}
      />

      {status === 'buscando' && (
        <View className="flex-row items-center mb-4 ml-1" style={{ gap: 8 }}>
          <ActivityIndicator size="small" color="#602C66" />
          <Text className="font-body text-[12px] text-fg-2">Buscando endereço...</Text>
          <TouchableOpacity onPress={preencherManualmente} hitSlop={8} accessibilityRole="button">
            <Text className="font-body-semibold text-[12px] text-plum">Preencher manualmente</Text>
          </TouchableOpacity>
        </View>
      )}

      {(status === 'naoEncontrado' || status === 'erro') && (
        <View className="mb-4 ml-1">
          <Text className="font-body text-[12px] text-error mb-1">
            {status === 'naoEncontrado'
              ? 'CEP não encontrado.'
              : 'Não foi possível buscar o CEP. Verifique sua conexão.'}
          </Text>
          <TouchableOpacity onPress={preencherManualmente} hitSlop={8} accessibilityRole="button">
            <Text className="font-body-semibold text-[12px] text-plum">Preencher manualmente</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'encontrado' && value && (
        <>
          {editarRua ? (
            <>
              <Input
                label="Rua"
                placeholder="Rua, avenida..."
                value={value.logradouro}
                onChangeText={(t) => atualizar({ logradouro: t })}
                editable={!disabled}
              />
              <Input
                label="Bairro (opcional)"
                placeholder="Bairro"
                value={value.bairro ?? ''}
                onChangeText={(t) => atualizar({ bairro: t })}
                editable={!disabled}
              />
              {modoManual && (
                <View className="flex-row" style={{ gap: 12 }}>
                  <Input
                    className="flex-1"
                    label="Cidade"
                    placeholder="Cidade"
                    value={value.cidade}
                    onChangeText={(t) => atualizar({ cidade: t })}
                    editable={!disabled}
                  />
                  <Input
                    className="w-20"
                    label="UF"
                    placeholder="SP"
                    autoCapitalize="characters"
                    maxLength={2}
                    value={value.uf}
                    onChangeText={(t) => atualizar({ uf: t.toUpperCase() })}
                    editable={!disabled}
                  />
                </View>
              )}
              {!modoManual && (
                <Text className="font-body text-[12px] text-fg-2 mb-4 ml-1">
                  {value.cidade} - {value.uf}
                </Text>
              )}
            </>
          ) : (
            <View className="bg-surface rounded-rd-md p-4 mb-4 flex-row items-start">
              <View className="flex-1">
                <Text className="font-body-semibold text-[14px] text-ink">
                  {[value.logradouro, value.bairro].filter(Boolean).join(', ')}
                </Text>
                <Text className="font-body text-[12px] text-fg-2 mt-0.5">
                  {value.cidade} - {value.uf}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditarRua(true)}
                hitSlop={8}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Alterar rua e bairro"
              >
                <Text className="font-body-semibold text-[12px] text-plum">Alterar</Text>
              </TouchableOpacity>
            </View>
          )}

          <Input
            label="Número"
            placeholder="Ex.: 1200"
            value={semNumero ? '' : value.numero ?? ''}
            onChangeText={(t) => atualizar({ numero: t })}
            editable={!disabled && !semNumero}
          />
          <View className="mb-4 -mt-2 ml-1">
            <Checkbox
              checked={semNumero}
              onChange={(marcado) => atualizar({ numero: marcado ? SEM_NUMERO : '' })}
              accessibilityLabel="Endereço sem número"
              label={<Text className="font-body text-[12px] text-fg-2">Sem número</Text>}
            />
          </View>
          <Input
            label="Complemento (opcional)"
            placeholder="Sala, apartamento, bloco..."
            maxLength={100}
            value={value.complemento ?? ''}
            onChangeText={(t) => atualizar({ complemento: t })}
            editable={!disabled}
          />
        </>
      )}
    </View>
  );
}
