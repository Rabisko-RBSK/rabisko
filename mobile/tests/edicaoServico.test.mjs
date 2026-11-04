import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatarValor, houveMudanca, montarPedido, ordenarSessoes, parseValor, sessoesDoServico,
} from '../src/utils/edicaoServico.ts';

const dto = (id, data, horario, extra = {}) => ({
  sessionId: id, data, horario: `${horario}:00`, duracaoMinutos: 60, posicao: 1,
  status: 'confirmada', editavel: true, ...extra,
});

test('converte as sessões do backend, cortando os segundos do horário', () => {
  const [s] = sessoesDoServico([dto('a', '2026-12-10', '14:00')]);
  assert.deepEqual(s, {
    chave: 'a', sessionId: 'a', data: '2026-12-10', horario: '14:00',
    duracaoMinutos: 60, posicao: 1, status: 'confirmada', editavel: true,
  });
});

test('o pedido leva só as editáveis, com as novas sem id', () => {
  const sessoes = [
    ...sessoesDoServico([dto('travada', '2026-11-01', '10:00', { editavel: false, status: 'concluida' })]),
    ...sessoesDoServico([dto('a', '2026-12-10', '14:00')]),
    { chave: 'nova-1', sessionId: null, data: '2026-12-24', horario: '09:30', duracaoMinutos: 120,
      posicao: 2, status: 'confirmada', editavel: true },
  ];
  assert.deepEqual(montarPedido(sessoes, 1500), {
    valorTotal: 1500,
    sessoes: [
      { sessionId: 'a', data: '2026-12-10', horario: '14:00', duracaoMinutos: 60, posicao: 1 },
      { sessionId: null, data: '2026-12-24', horario: '09:30', duracaoMinutos: 120, posicao: 2 },
    ],
  });
});

test('detecta mudança de valor, de data, de remoção e de inclusão', () => {
  const original = sessoesDoServico([dto('a', '2026-12-10', '14:00'), dto('b', '2026-12-17', '14:00')]);
  assert.equal(houveMudanca(original, original, 100, 100), false);
  assert.equal(houveMudanca(original, [...original].reverse(), 100, 100), false);
  assert.equal(houveMudanca(original, original, 100, 150), true);
  assert.equal(houveMudanca(original, [{ ...original[0], horario: '15:00' }, original[1]], 100, 100), true);
  assert.equal(houveMudanca(original, [original[0]], 100, 100), true);
  assert.equal(houveMudanca(original, [...original, { ...original[0], chave: 'n', sessionId: null }], 100, 100), true);
});

test('ordena por data e horário', () => {
  const s = sessoesDoServico([dto('b', '2026-12-17', '09:00'), dto('a', '2026-12-10', '14:00'), dto('c', '2026-12-10', '08:00')]);
  assert.deepEqual(ordenarSessoes(s).map((x) => x.sessionId), ['c', 'a', 'b']);
});

test('máscara e leitura do valor', () => {
  assert.equal(formatarValor('1500'), '1.500');
  assert.equal(formatarValor('R$ 12a3'), '123');
  assert.equal(formatarValor(''), '');
  assert.equal(parseValor('1.500'), 1500);
  assert.ok(Number.isNaN(parseValor('')));
});
