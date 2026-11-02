import assert from 'node:assert/strict';
import test from 'node:test';
import {
  agruparPorColuna, formatarSessao, iniciais, tempoDesde, textosDoCard,
} from '../src/utils/kanbanServicos.ts';

const card = (coluna, extra = {}) => ({
  coluna, chatId: 'c1', servicoId: 's1', clienteNome: 'Cliente A', tatuadorId: 't1', tatuadorNome: 'Ana Souza',
  totalSessoes: 0, sessaoAtual: null, proximaSessao: null, concluidoEm: null, ultimaMensagemEm: null, ...extra,
});

test('agrupa os cards nas quatro colunas, mantendo a ordem recebida', () => {
  const grupos = agruparPorColuna([
    card('agendado', { clienteNome: 'D' }), card('finalizado'), card('agendado', { clienteNome: 'E' }),
  ]);
  assert.deepEqual(grupos.agendado.map((c) => c.clienteNome), ['D', 'E']);
  assert.equal(grupos.chat_iniciado.length, 0);
  assert.equal(grupos.finalizado.length, 1);
});

test('formata a sessão com dia da semana, data e hora', () => {
  assert.equal(formatarSessao('2026-11-05T14:00:00'), 'Qui, 05/11 · 14:00');
  assert.equal(formatarSessao('2026-11-18T13:00'), 'Qua, 18/11 · 13:00');
});

test('tempo desde a última mensagem', () => {
  const agora = new Date(2026, 10, 10, 15, 0);
  assert.equal(tempoDesde(new Date(2026, 10, 10, 14, 59, 30).toISOString(), agora), 'agora');
  assert.equal(tempoDesde(new Date(2026, 10, 10, 14, 40).toISOString(), agora), 'há 20 min');
  assert.equal(tempoDesde(new Date(2026, 10, 10, 13, 0).toISOString(), agora), 'há 2 h');
  assert.equal(tempoDesde(new Date(2026, 10, 9, 10, 0).toISOString(), agora), 'ontem');
  assert.equal(tempoDesde(new Date(2026, 10, 7, 10, 0).toISOString(), agora), 'há 3 dias');
  assert.equal(tempoDesde(new Date(2026, 8, 12, 10, 0).toISOString(), agora), 'em 12/09');
});

test('textos de agendado e em progresso trazem a sessão atual', () => {
  const agendado = textosDoCard(card('agendado', {
    totalSessoes: 2, sessaoAtual: 1, proximaSessao: '2026-11-05T14:00:00',
  }));
  assert.deepEqual(agendado, { etiqueta: 'Sessão 1 de 2', icone: 'calendario', meta: 'Qui, 05/11 · 14:00' });

  const emProgresso = textosDoCard(card('em_progresso', {
    totalSessoes: 3, sessaoAtual: 2, proximaSessao: '2026-11-18T13:00:00',
  }));
  assert.equal(emProgresso.etiqueta, 'Sessão 2 de 3');
  assert.equal(emProgresso.meta, 'Próxima sessão · Qua, 18/11 · 13:00');

  assert.equal(textosDoCard(card('agendado', { totalSessoes: 1, sessaoAtual: 1 })).etiqueta, 'Sessão única');
});

test('textos de finalizado e chat iniciado', () => {
  assert.deepEqual(textosDoCard(card('finalizado', { totalSessoes: 3, concluidoEm: '2026-10-18' })),
    { etiqueta: '3 sessões', icone: 'concluido', meta: 'Concluído em 18/10' });
  assert.equal(textosDoCard(card('finalizado', { totalSessoes: 1 })).etiqueta, 'Sessão única');

  const chat = textosDoCard(
    card('chat_iniciado', { servicoId: null, ultimaMensagemEm: new Date(2026, 10, 10, 13, 0).toISOString() }),
    new Date(2026, 10, 10, 15, 0));
  assert.deepEqual(chat, { etiqueta: null, icone: 'mensagem', meta: 'Última mensagem há 2 h' });
});

test('iniciais do tatuador para o avatar', () => {
  assert.equal(iniciais('Ana Souza'), 'AS');
  assert.equal(iniciais('Tatuador 1'), 'T1');
  assert.equal(iniciais(' ana '), 'A');
});
