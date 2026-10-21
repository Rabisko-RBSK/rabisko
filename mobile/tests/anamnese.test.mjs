import assert from 'node:assert/strict';
import test from 'node:test';
import { lerData, novaFicha, novoProduto, validarFicha } from '../src/services/anamnese.ts';

const hoje = new Date(2026, 9, 13);
function fichaValida() {
  return {
    cliente: { nomeCompleto: 'Cliente de teste', nascimento: '13/10/2008', sexo: 'Feminino', identidade: '12345678', enderecoCompleto: 'Rua de Teste, 123, Centro, São Paulo, SP, 01000-000' },
    procedimento: { atendimento: '13/10/2026', dataProcedimento: '13/10/2026', tipo: 'Tatuagem', localCorpo: 'Braço', profissional: 'Profissional de teste', intercorrencias: 'Nenhuma' },
    produtos: [{ nome: 'Tinta de teste', lote: 'L123', fabricante: 'Fabricante de teste', registroAnvisa: '123456', fabricacao: '01/01/2026', validade: '01/01/2027', abertura: '12/10/2026' }],
    consentimento: { anexos: [{ uri: 'file:///termo-teste.jpg', nome: 'Termo de teste' }], orientado: true, segundaViaEntregue: true },
  };
}

test('ficha completa é aceita no dia do aniversário de 18 anos', () => {
  assert.deepEqual(validarFicha(fichaValida(), hoje), {});
});

test('dados novos são independentes e confirmações nunca vêm aceitas', () => {
  const a = novaFicha('Artista');
  a.produtos[0].nome = 'Teste';
  assert.equal(novaFicha().produtos[0].nome, '');
  assert.equal(a.procedimento.profissional, 'Artista');
  assert.equal(a.consentimento.orientado, false);
  assert.equal(a.consentimento.segundaViaEntregue, false);
  assert.equal(a.consentimento.anexos.length, 0);
});

test('datas inexistentes, ambíguas e ano incompleto são rejeitados', () => {
  for (const valor of ['31/04/2026', '29/02/2025', '00/01/2026', '01/13/2026', '1/1/2026', '2026-01-01', '01/01/26', '01/01/0001']) {
    assert.equal(lerData(valor), null, valor);
  }
  assert.equal(lerData('29/02/2024')?.getDate(), 29);
});

test('campos vazios e espaços não passam pela revisão', () => {
  const ficha = fichaValida();
  ficha.cliente.identidade = '   ';
  ficha.procedimento.intercorrencias = '';
  ficha.produtos[0].registroAnvisa = ' ';
  const erros = validarFicha(ficha, hoje);
  assert.ok(erros['cliente.identidade']);
  assert.ok(erros['procedimento.intercorrencias']);
  assert.ok(erros['produtos.0.registroAnvisa']);
});

test('idade é verificada na data do procedimento, inclusive na véspera dos 18 anos', () => {
  const ficha = fichaValida();
  ficha.cliente.nascimento = '14/10/2008';
  assert.match(validarFicha(ficha, hoje)['cliente.nascimento'], /menores de 18/);
  ficha.cliente.nascimento = '13/10/2008';
  ficha.procedimento.atendimento = '12/10/2026';
  ficha.procedimento.dataProcedimento = '12/10/2026';
  assert.ok(validarFicha(ficha, hoje)['cliente.nascimento']);
});

test('anexar termo não contorna bloqueio de menores', () => {
  const ficha = fichaValida();
  ficha.cliente.nascimento = '01/01/2010';
  assert.ok(validarFicha(ficha, hoje)['cliente.nascimento']);
});

test('datas futuras de nascimento e atendimento são rejeitadas', () => {
  const ficha = fichaValida();
  ficha.cliente.nascimento = '01/01/2027';
  ficha.procedimento.atendimento = '01/01/2027';
  ficha.procedimento.dataProcedimento = '01/01/2027';
  const erros = validarFicha(ficha, hoje);
  assert.ok(erros['cliente.nascimento']);
  assert.ok(erros['procedimento.atendimento']);
  assert.ok(erros['procedimento.dataProcedimento']);
});

test('procedimento não pode ocorrer antes do atendimento', () => {
  const ficha = fichaValida();
  ficha.procedimento.dataProcedimento = '12/10/2026';
  assert.ok(validarFicha(ficha, hoje)['procedimento.dataProcedimento']);
});

test('todos os produtos exigem rastreabilidade', () => {
  const ficha = fichaValida();
  ficha.produtos.push(novoProduto());
  assert.equal(Object.keys(validarFicha(ficha, hoje)).filter((key) => key.startsWith('produtos.1.')).length, 7);
  ficha.produtos = [];
  assert.ok(validarFicha(ficha, hoje).produtos);
});

test('validade é comparada à data do procedimento, não à data de consulta', () => {
  const ficha = fichaValida();
  ficha.produtos[0].validade = '12/10/2026';
  assert.ok(validarFicha(ficha, hoje)['produtos.0.validade']);
  ficha.produtos[0].validade = '13/10/2026';
  assert.deepEqual(validarFicha(ficha, new Date(2027, 1, 1)), {});
});

test('abertura deve ocorrer entre fabricação e procedimento', () => {
  const ficha = fichaValida();
  ficha.produtos[0].abertura = '01/12/2025';
  assert.ok(validarFicha(ficha, hoje)['produtos.0.abertura']);
  ficha.produtos[0].abertura = '14/10/2026';
  assert.ok(validarFicha(ficha, hoje)['produtos.0.abertura']);
});

test('validade anterior à fabricação é rejeitada', () => {
  const ficha = fichaValida();
  ficha.produtos[0].validade = '01/12/2025';
  assert.ok(validarFicha(ficha, hoje)['produtos.0.validade']);
});

test('consentimento exige documento assinado e as duas confirmações', () => {
  const ficha = fichaValida();
  ficha.consentimento = { anexos: [], orientado: false, segundaViaEntregue: false };
  assert.deepEqual(Object.keys(validarFicha(ficha, hoje)).sort(), ['anexos', 'orientado', 'segundaViaEntregue']);
});

test('validar não altera dados preenchidos', () => {
  const ficha = fichaValida();
  const copia = structuredClone(ficha);
  validarFicha(ficha, hoje);
  assert.deepEqual(ficha, copia);
});
