import assert from 'node:assert/strict';
import test from 'node:test';
import { acessoAnamnese, dataDaReserva, fichaDaSessao, validarParteCliente, validarParteTatuador } from '../src/services/anamneseFlow.ts';

const agora = new Date(2026, 9, 14, 10);
const sessao = {
  sessionId: 'sessao-1', appointmentId: 'reserva-1', data: '2026-10-15', horario: '14:00:00',
  status: 'confirmada', outroNome: 'Pessoa de teste',
};

test('cliente acessa somente reserva confirmada antes do início da sessão', () => {
  assert.equal(acessoAnamnese(sessao, 'cliente', agora).permitido, true);
  for (const status of ['agendada', 'em_andamento', 'concluida', 'cancelada', 'no_show', 'desconhecida']) {
    assert.equal(acessoAnamnese({ ...sessao, status }, 'cliente', agora).permitido, false, status);
  }
  assert.equal(acessoAnamnese(sessao, 'cliente', new Date(2026, 9, 15, 13, 59)).permitido, true);
  assert.equal(acessoAnamnese(sessao, 'cliente', new Date(2026, 9, 15, 14)).permitido, false);
});

test('data passada não substitui conclusão explícita da sessão para tatuador', () => {
  const antiga = { ...sessao, data: '2026-10-13' };
  for (const status of ['confirmada', 'agendada', 'em_andamento', 'cancelada', 'no_show']) {
    assert.equal(acessoAnamnese({ ...antiga, status }, 'artista', agora).permitido, false, status);
  }
  assert.equal(acessoAnamnese({ ...antiga, status: 'concluida' }, 'artista', agora).permitido, true);
  assert.equal(acessoAnamnese({ ...sessao, status: 'concluida' }, 'artista', agora).permitido, false);
});

test('contexto inválido e perfis não participantes não liberam formulário', () => {
  for (const alteracao of [{ sessionId: '' }, { appointmentId: '' }, { data: '2026-02-30' }, { horario: '25:00' }, { horario: '14:00:99' }]) {
    assert.equal(acessoAnamnese({ ...sessao, ...alteracao }, 'cliente', agora).permitido, false);
  }
  assert.equal(acessoAnamnese(sessao, 'estudio', agora).permitido, false);
});

test('rascunhos não inventam atendimento realizado nem compartilham dados entre sessões', () => {
  const cliente = fichaDaSessao(sessao, 'cliente', 'Cliente de teste');
  assert.equal(cliente.cliente.nomeCompleto, 'Cliente de teste');
  assert.equal(cliente.procedimento.profissional, sessao.outroNome);
  assert.equal(cliente.procedimento.atendimento, '');
  assert.equal(cliente.procedimento.dataProcedimento, '');
  const tatuador = fichaDaSessao(sessao, 'artista', 'Tatuador de teste');
  assert.equal(tatuador.cliente.nomeCompleto, sessao.outroNome);
  assert.equal(tatuador.procedimento.profissional, 'Tatuador de teste');
  cliente.consentimento.anexos.push({ uri: 'file:///teste.jpg', nome: 'Teste' });
  assert.equal(tatuador.consentimento.anexos.length, 0);
  assert.equal(dataDaReserva(sessao), '15/10/2026');
});

function parteCliente() {
  const ficha = fichaDaSessao(sessao, 'cliente', 'Cliente de teste');
  Object.assign(ficha.cliente, { nascimento: '15/10/2008', sexo: 'Feminino', identidade: 'teste', enderecoCompleto: 'Endereço de teste' });
  ficha.consentimento.anexos.push({ uri: 'file:///teste.jpg', nome: 'Documento fictício' });
  return ficha;
}

test('cliente pode revisar antes da reserva futura sem preencher informações do tatuador', () => {
  assert.deepEqual(validarParteCliente(parteCliente(), sessao, agora), {});
});

test('maioridade do cliente é verificada na reserva e documento permanece obrigatório', () => {
  const ficha = parteCliente();
  ficha.cliente.nascimento = '16/10/2008';
  assert.ok(validarParteCliente(ficha, sessao, agora)['cliente.nascimento']);
  ficha.cliente.nascimento = '01/01/2027';
  assert.match(validarParteCliente(ficha, sessao, agora)['cliente.nascimento'], /futuro/);
  ficha.consentimento.anexos = [];
  assert.ok(validarParteCliente(ficha, sessao, agora).anexos);
});

test('tatuador valida sua parte sem exigir que preencha dados pessoais ou anexos do cliente', () => {
  const ficha = fichaDaSessao(sessao, 'artista', 'Tatuador de teste');
  ficha.procedimento = { atendimento: '13/10/2026', dataProcedimento: '13/10/2026', tipo: 'Tatuagem', localCorpo: 'Braço', profissional: 'Tatuador de teste', intercorrencias: 'Nenhuma' };
  ficha.produtos = [{ nome: 'Teste', lote: 'L1', fabricante: 'Teste', registroAnvisa: 'Teste', fabricacao: '01/01/2026', validade: '01/01/2027', abertura: '13/10/2026' }];
  ficha.consentimento.orientado = true;
  ficha.consentimento.segundaViaEntregue = true;
  assert.deepEqual(validarParteTatuador(ficha, agora), {});
  ficha.produtos[0].lote = '';
  ficha.consentimento.orientado = false;
  const erros = validarParteTatuador(ficha, agora);
  assert.ok(erros['produtos.0.lote']);
  assert.ok(erros.orientado);
  assert.equal(Object.keys(erros).some((key) => key.startsWith('cliente.') || key === 'anexos'), false);
});
