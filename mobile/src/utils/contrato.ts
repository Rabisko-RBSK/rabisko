import type {
  ContratoDTO,
  ContratoModelo,
  ContratoPeriodicidade,
  ContratoStatus,
} from '../services/api/artistService';

export const MODELO_LABELS: Record<ContratoModelo, string> = {
  comissao: 'Comissão',
  aluguel: 'Aluguel',
  salario: 'Salário',
};

export const PERIODICIDADE_LABELS: Record<ContratoPeriodicidade, string> = {
  diaria: 'por dia',
  semanal: 'por semana',
  mensal: 'por mês',
};

/**
 * Campos usados na exibição. Aceita tanto o ContratoDTO (campos `null`)
 * quanto o ContratoInput (campos opcionais), pra servir também de prévia
 * no modal antes de enviar a proposta.
 */
type ContratoResumo = {
  modelo: ContratoModelo;
  percentualEstudio?: number | null;
  valorFixo?: number | null;
  periodicidade?: ContratoPeriodicidade | null;
};

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Texto curto do contrato pras telas:
 *   "Comissão · 40% para o estúdio"
 *   "Aluguel · R$ 800,00 por mês"
 * Se o campo esperado pro modelo vier vazio, devolve só o rótulo do modelo
 * em vez de "null%" ou "R$ NaN".
 */
export function formatarContrato(c: ContratoResumo): string {
  const modelo = MODELO_LABELS[c.modelo];

  if (c.modelo === 'comissao') {
    if (c.percentualEstudio == null) return modelo;
    return `${modelo} · ${c.percentualEstudio.toLocaleString('pt-BR')}% para o estúdio`;
  }

  if (c.valorFixo == null || c.periodicidade == null) return modelo;
  return `${modelo} · ${formatarMoeda(c.valorFixo)} ${PERIODICIDADE_LABELS[c.periodicidade]}`;
}

export const STATUS_LABELS: Record<ContratoStatus, string> = {
  proposto: 'Proposta pendente',
  ativo: 'Vigente',
  recusado: 'Recusado',
  cancelado: 'Retirado',
  encerrado: 'Encerrado',
};

/** "2026-10-14T14:57:15" -> "14/10/2026". */
function formatarData(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Linha de datas do contrato conforme o status (vigência, envio ou resposta). */
export function formatarPeriodo(c: ContratoDTO): string {
  switch (c.status) {
    case 'ativo':
      return `Desde ${formatarData(c.dataResposta)}`;
    case 'encerrado':
      return `${formatarData(c.dataResposta)} a ${formatarData(c.dataEncerramento)}`;
    case 'proposto':
      return `Enviada em ${formatarData(c.dataCriacao)}`;
    default:
      return formatarData(c.dataResposta);
  }
}

export interface ContratosDoEstudio {
  ativo: ContratoDTO | null;
  /** Renegociação aguardando o aceite do tatuador. */
  proposta: ContratoDTO | null;
  /** Os demais contratos (encerrados, recusados, retirados), do mais recente ao mais antigo. */
  historico: ContratoDTO[];
}

/**
 * Separa os contratos de um estúdio. Proposta de renegociação = `proposto`
 * sem convite: os `proposto` com conviteId são de convites pendentes
 * (inclusive de outros estúdios, no caso do GET /artist/me/contratos).
 * Sem `estudioId`, considera que a lista já é de um único estúdio.
 */
export function separarContratos(contratos: ContratoDTO[], estudioId?: string): ContratosDoEstudio {
  const doEstudio = estudioId ? contratos.filter((c) => c.estudioId === estudioId) : contratos;
  const ativo = doEstudio.find((c) => c.status === 'ativo') ?? null;
  const proposta = doEstudio.find((c) => c.status === 'proposto' && c.conviteId === null) ?? null;
  return {
    ativo,
    proposta,
    historico: doEstudio.filter((c) => c !== ativo && c !== proposta && c.status !== 'proposto'),
  };
}
