import assert from 'node:assert/strict';
import test from 'node:test';
import {
  acaoDoCard, agruparPorColuna, formatarSessao, iniciais, tempoDeEspera, textosDoCard,
} from '../src/utils/kanbanServicos.ts';

const card = (coluna, extra = {}) => ({
  coluna, chatId: 'c1', servicoId: 's1', clienteNome: 'Cliente A', clienteAuthId: 'a1',
  tatuadorId: 't1', tatuadorNome: 'Ana Souza', sessao: null,
  totalSessoes: 0, sessaoAtual: null, proximaSessao: null, concluidoEm: null,
  naoLidas: null, aguardandoDesde: null, ultimaMensagemEm: null, ...extra,
});

test('agrupa os cards nas quatro colunas, mantendo a ordem recebida', () => {
  const grupos = agruparPorColuna([
    card('agendado', { clienteNome: 'D' }), card('finalizado'), card('agendado', { clienteNome: 'E' }),
  ]);
  assert.deepEqual(grupos.agendado.map((c) => c.clienteNome), ['D', 'E']);
  assert.equal(grupos.mensagens_nao_lidas.length, 0);
  assert.equal(grupos.finalizado.length, 1);
});

test('formata a sessão com dia da semana, data e hora', () => {
  assert.equal(formatarSessao('2026-11-05T14:00:00'), 'Qui, 05/11 · 14:00');
  assert.equal(formatarSessao('2026-11-18T13:00'), 'Qua, 18/11 · 13:00');
});

test('há quanto tempo o cliente espera resposta', () => {
  const agora = new Date(2026, 10, 10, 15, 0);
  assert.equal(tempoDeEspera(new Date(2026, 10, 10, 14, 59, 30).toISOString(), agora), 'menos de 1 min');
  assert.equal(tempoDeEspera(new Date(2026, 10, 10, 14, 40).toISOString(), agora), '20 min');
  assert.equal(tempoDeEspera(new Date(2026, 10, 10, 13, 0).toISOString(), agora), '2 h');
  assert.equal(tempoDeEspera(new Date(2026, 10, 9, 14, 0).toISOString(), agora), '1 dia');
  assert.equal(tempoDeEspera(new Date(2026, 10, 7, 10, 0).toISOString(), agora), '3 dias');
  // Com offset explícito, como o backend envia.
  assert.equal(tempoDeEspera('2026-11-10T12:00:00-03:00', new Date('2026-11-10T17:30:00Z')), '2 h');
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

test('textos de finalizado e mensagens não lidas', () => {
  assert.deepEqual(textosDoCard(card('finalizado', { totalSessoes: 3, concluidoEm: '2026-10-18' })),
    { etiqueta: '3 sessões', icone: 'concluido', meta: 'Concluído em 18/10' });
  assert.equal(textosDoCard(card('finalizado', { totalSessoes: 1 })).etiqueta, 'Sessão única');

  const espera = textosDoCard(
    card('mensagens_nao_lidas', { servicoId: null, naoLidas: 3, aguardandoDesde: new Date(2026, 10, 10, 13, 0).toISOString() }),
    new Date(2026, 10, 10, 15, 0));
  assert.deepEqual(espera, { etiqueta: '3 não lidas', icone: 'mensagem', meta: 'Sem resposta há 2 h' });
  assert.equal(textosDoCard(card('mensagens_nao_lidas', { naoLidas: 1 })).etiqueta, '1 não lida');
});

test('iniciais do tatuador para o avatar', () => {
  assert.equal(iniciais('Ana Souza'), 'AS');
  assert.equal(iniciais('Tatuador 1'), 'T1');
  assert.equal(iniciais(' ana '), 'A');
});

test('ação ao tocar: chat e serviço para o tatuador; detalhes da sessão para o estúdio', () => {
  const naoLida = card('mensagens_nao_lidas', { servicoId: null, naoLidas: 2 });
  assert.equal(acaoDoCard(naoLida, 'tatuador'), 'abrir_chat');
  assert.equal(acaoDoCard(naoLida, 'estudio'), null);
  assert.equal(acaoDoCard({ ...naoLida, clienteAuthId: null }, 'tatuador'), null);

  const sessao = { sessionId: 'r1', appointmentId: 's1', data: '2026-11-10', horario: '14:00:00',
    duracaoMinutos: 120, outroNome: 'Cliente A', outroFotoUrl: null, valorTotal: 500, status: 'confirmada' };
  for (const coluna of ['agendado', 'em_progresso', 'finalizado']) {
    assert.equal(acaoDoCard(card(coluna, { sessao }), 'tatuador'), 'abrir_servico');
    assert.equal(acaoDoCard(card(coluna, { sessao }), 'estudio'), 'detalhes_sessao');
  }
  assert.equal(acaoDoCard(card('agendado'), 'tatuador'), 'abrir_servico');
  assert.equal(acaoDoCard(card('agendado'), 'estudio'), null);
  assert.equal(acaoDoCard(card('agendado', { servicoId: null }), 'tatuador'), null);
});
