import assert from 'node:assert/strict';
import test from 'node:test';
import { rotuloPosicoes, validarNovaQuantidade } from '../src/utils/posicoesEstudio.ts';

test('campo vazio não habilita o salvar', () => {
  assert.deepEqual(validarNovaQuantidade('', 3), { ok: false, motivo: 'vazio' });
  assert.deepEqual(validarNovaQuantidade('  ', 3), { ok: false, motivo: 'vazio' });
});

test('quantidade igual à atual não é alterada', () => {
  assert.deepEqual(validarNovaQuantidade('3', 3), { ok: false, motivo: 'igual' });
  assert.deepEqual(validarNovaQuantidade('03', 3), { ok: false, motivo: 'igual' });
});

test('fora de 1 a 50 é inválido', () => {
  for (const t of ['0', '51', '-2', '2.5', 'abc']) {
    assert.deepEqual(validarNovaQuantidade(t, 3), { ok: false, motivo: 'invalido' }, t);
  }
});

test('valor válido e diferente pode ser salvo, inclusive antes de carregar a atual', () => {
  assert.deepEqual(validarNovaQuantidade('5', 3), { ok: true, valor: 5 });
  assert.deepEqual(validarNovaQuantidade('1', 4), { ok: true, valor: 1 });
  assert.deepEqual(validarNovaQuantidade('50', null), { ok: true, valor: 50 });
});

test('rótulo no singular e no plural', () => {
  assert.equal(rotuloPosicoes(1), '1 posição');
  assert.equal(rotuloPosicoes(4), '4 posições');
});
