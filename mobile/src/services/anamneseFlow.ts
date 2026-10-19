import { camposCliente, lerData, novaFicha, validarFicha } from './anamnese.ts';
import type { ErrosAnamnese, FichaAnamnese } from './anamnese.ts';

/** O backend resolve cliente/tatuador pela sessão; nomes não identificam a ficha. */
export interface SessaoAnamnese {
  sessionId: string;
  appointmentId: string;
  data: string;
  horario: string;
  status: string;
  outroNome: string;
}

export type ParteAnamnese = 'cliente' | 'artista';

export function dataDaReserva(sessao: SessaoAnamnese): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sessao.data);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

export function inicioDaSessao(sessao: SessaoAnamnese): Date | null {
  const data = lerData(dataDaReserva(sessao));
  const horario = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(sessao.horario);
  if (!data || !horario || +horario[1] > 23 || +horario[2] > 59 || +(horario[3] ?? 0) > 59) return null;
  data.setHours(+horario[1], +horario[2], +(horario[3] ?? 0), 0);
  return data;
}

/** Regra de apresentação; a autorização e o estado devem ser revalidados no servidor (#188). */
export function acessoAnamnese(sessao: SessaoAnamnese, perfil: string, agora = new Date()) {
  if (!sessao.sessionId || !sessao.appointmentId) {
    return { permitido: false, motivo: 'Selecione uma sessão vinculada a uma reserva.' };
  }
  const inicio = inicioDaSessao(sessao);
  if (!inicio) return { permitido: false, motivo: 'A data ou o horário da sessão não está disponível.' };
  if (perfil === 'cliente') {
    if (sessao.status !== 'confirmada') {
      return { permitido: false, motivo: 'Sua parte fica disponível após a confirmação da reserva e antes do atendimento.' };
    }
    if (agora >= inicio) return { permitido: false, motivo: 'O prazo de preenchimento pré-atendimento desta sessão terminou.' };
    return { permitido: true, motivo: 'Preencha seus dados e anexe o termo assinado antes do atendimento.' };
  }
  if (perfil === 'artista') {
    if (sessao.status !== 'concluida' || agora < inicio) {
      return { permitido: false, motivo: 'O registro do tatuador será liberado quando o atendimento estiver marcado como concluído. Apenas passar da data não libera o formulário.' };
    }
    return { permitido: true, motivo: 'Registre o procedimento realizado, os produtos utilizados e as intercorrências.' };
  }
  return { permitido: false, motivo: 'Esta ficha está disponível apenas para o cliente e o tatuador da sessão.' };
}

export function fichaDaSessao(sessao: SessaoAnamnese, perfil: ParteAnamnese, nome: string): FichaAnamnese {
  const ficha = novaFicha(perfil === 'artista' ? nome : sessao.outroNome);
  ficha.cliente.nomeCompleto = perfil === 'cliente' ? nome : sessao.outroNome;
  // A reserva é contexto, não comprovação da data efetiva do procedimento.
  return ficha;
}

export function validarParteCliente(ficha: FichaAnamnese, sessao: SessaoAnamnese, hoje = new Date()): ErrosAnamnese {
  const erros: ErrosAnamnese = {};
  for (const [campo] of camposCliente) {
    const valor = ficha.cliente[campo].trim();
    if (!valor) erros[`cliente.${campo}`] = 'Preencha este campo.';
    else if (valor.length > 2000) erros[`cliente.${campo}`] = 'Use até 2.000 caracteres.';
  }
  const nascimento = lerData(ficha.cliente.nascimento);
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (!nascimento) erros['cliente.nascimento'] = 'Informe uma data válida: DD/MM/AAAA.';
  else if (nascimento > inicioHoje) erros['cliente.nascimento'] = 'A data não pode estar no futuro.';
  else {
    const reserva = lerData(dataDaReserva(sessao));
    const aniversario = new Date(nascimento.getFullYear() + 18, nascimento.getMonth(), nascimento.getDate());
    if (reserva && reserva < aniversario) erros['cliente.nascimento'] = 'É necessário ter 18 anos na data do atendimento.';
  }
  if (!ficha.consentimento.anexos.length) erros.anexos = 'Anexe todas as páginas do termo assinado antes do atendimento.';
  return erros;
}

export function validarParteTatuador(ficha: FichaAnamnese, hoje = new Date()): ErrosAnamnese {
  // O tatuador não preenche dados pessoais nem anexa o documento em nome do cliente.
  return Object.fromEntries(Object.entries(validarFicha(ficha, hoje))
    .filter(([campo]) => !campo.startsWith('cliente.') && campo !== 'anexos'));
}
