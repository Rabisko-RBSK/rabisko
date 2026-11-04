import assert from 'node:assert/strict';
import test from 'node:test';
import { mesclarResultados } from '../src/utils/resultadosBusca.ts';

const tatuador = (nome, extra = {}) =>
  ({ tatuadorId: nome, nome, email: `${nome.toLowerCase()}@x.com`, endereco: null, ...extra });
const estudio = (nome, extra = {}) => ({ estudioId: nome, nome, endereco: null, ...extra });

test('sem termo, mistura tatuadores e estúdios em ordem alfabética com o tipo', () => {
  const r = mesclarResultados([tatuador('Bruno'), tatuador('Ana')], [estudio('Casa Tattoo')]);
  assert.deepEqual(r.map((x) => [x.tipo, x.item.nome]), [
    ['tatuador', 'Ana'], ['tatuador', 'Bruno'], ['estudio', 'Casa Tattoo'],
  ]);
});

test('o termo filtra as duas listas, ignorando acento e caixa', () => {
  const r = mesclarResultados(
    [tatuador('Ana'), tatuador('Tatiana')],
    [estudio('Estúdio Ánima'), estudio('Black Ink')],
    'ANIMA',
  );
  assert.deepEqual(r.map((x) => x.item.nome), ['Estúdio Ánima']);
});

test('quem começa com o termo vem antes de quem só contém, e depois quem casou por outro campo', () => {
  const r = mesclarResultados(
    [tatuador('Tatiana'), tatuador('Rafa', { endereco: 'Rua Ana Neri, 10' })],
    [estudio('Ana Ink')],
    'ana',
  );
  assert.deepEqual(r.map((x) => x.item.nome), ['Ana Ink', 'Tatiana', 'Rafa']);
});

test('estúdio casa pelo endereço; tatuador também pelo e-mail', () => {
  const r = mesclarResultados(
    [tatuador('Leo', { email: 'leo@pinheiros.com' })],
    [estudio('Black Ink', { endereco: 'Rua dos Pinheiros, 1 - Pinheiros, São Paulo/SP' })],
    'pinheiros',
  );
  assert.deepEqual(r.map((x) => x.tipo).sort(), ['estudio', 'tatuador']);
});

test('chaves não colidem entre tatuador e estúdio de mesmo id', () => {
  const r = mesclarResultados([{ ...tatuador('X'), tatuadorId: '1' }], [{ ...estudio('Y'), estudioId: '1' }]);
  assert.equal(new Set(r.map((x) => x.chave)).size, 2);
});
