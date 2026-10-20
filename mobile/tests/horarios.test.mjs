import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OPCOES_HORARIO,
  aplicarATodosAbertos,
  diaSemanaIso,
  linhasExibicao,
  resumoSemana,
  semanaDaApi,
  semanaPadrao,
  semanaParaApi,
  validarSemana,
} from '../src/utils/horarios.ts';

const dias = (lista, abre = '10:00', fecha = '22:00') =>
  lista.map((diaSemana) => ({ diaSemana, abre, fecha }));

test('semana padrão: seg–sex 10–22, sáb 10–21, domingo fechado', () => {
  assert.deepEqual(semanaParaApi(semanaPadrao()), [
    ...dias([1, 2, 3, 4, 5]),
    { diaSemana: 6, abre: '10:00', fecha: '21:00' },
  ]);
});

test('ida e volta pela API preserva os dias abertos e marca os ausentes como fechados', () => {
  const api = [{ diaSemana: 3, abre: '13:00:00', fecha: '22:00:00' }];
  const semana = semanaDaApi(api);
  assert.equal(semana.length, 7);
  assert.equal(semana.filter((d) => d.aberto).length, 1);
  assert.deepEqual(semanaParaApi(semana), [{ diaSemana: 3, abre: '13:00', fecha: '22:00' }]);
});

test('definir para todos aplica só aos dias abertos', () => {
  const semana = aplicarATodosAbertos(semanaPadrao(), '09:00', '18:00');
  assert.ok(semana.filter((d) => d.aberto).every((d) => d.abre === '09:00' && d.fecha === '18:00'));
  assert.equal(semana[6].aberto, false);
  assert.equal(semana[6].abre, '10:00');
});

test('validação: ao menos um dia aberto e fechamento depois da abertura', () => {
  assert.equal(validarSemana(semanaPadrao()), null);
  const tudoFechado = semanaPadrao().map((d) => ({ ...d, aberto: false }));
  assert.equal(validarSemana(tudoFechado), 'Informe ao menos um dia de atendimento.');
  const invertido = semanaPadrao().map((d) => (d.diaSemana === 6 ? { ...d, abre: '18:00', fecha: '02:00' } : d));
  assert.equal(validarSemana(invertido), 'No sábado, o fechamento precisa ser depois da abertura.');
  const igual = semanaPadrao().map((d) => (d.diaSemana === 1 ? { ...d, fecha: '10:00' } : d));
  assert.equal(validarSemana(igual), 'Na segunda, o fechamento precisa ser depois da abertura.');
});

test('dia da semana ISO a partir de Date', () => {
  assert.equal(diaSemanaIso(new Date(2026, 9, 19)), 1); // segunda
  assert.equal(diaSemanaIso(new Date(2026, 9, 25)), 7); // domingo
});

test('linhas da exibição cobrem os 7 dias', () => {
  const linhas = linhasExibicao([{ diaSemana: 1, abre: '10:00', fecha: '22:00' }]);
  assert.equal(linhas.length, 7);
  assert.deepEqual(linhas[0], { diaSemana: 1, dia: 'Segunda-feira', texto: '10:00–22:00' });
  assert.equal(linhas[6].texto, 'Fechado');
});

test('resumo da semana para o card do perfil', () => {
  assert.equal(resumoSemana([]), 'Horário não informado');
  assert.equal(resumoSemana(dias([1, 2, 3, 4, 5, 6, 7])), 'Todos os dias');
  assert.equal(resumoSemana(dias([1, 2, 3, 4, 5, 6])), 'Seg a sáb · Domingo fechado');
  assert.equal(resumoSemana(dias([2, 3, 4, 5, 6])), 'Ter a sáb · Seg e dom fechados');
  assert.equal(resumoSemana(dias([1, 3, 5])), 'Seg, qua, sex');
  assert.equal(resumoSemana(dias([6, 7])), 'Sáb e dom');
});

test('opções do seletor vão de 00:00 a 23:30 em passos de 30 min', () => {
  assert.equal(OPCOES_HORARIO.length, 48);
  assert.equal(OPCOES_HORARIO[0], '00:00');
  assert.equal(OPCOES_HORARIO[21], '10:30');
  assert.equal(OPCOES_HORARIO[47], '23:30');
});
