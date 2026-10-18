import assert from 'node:assert/strict';
import test from 'node:test';
import {
  blocosDoDia, encaixarNoPasso, minutosAgoraSeHoje, motivoConflito, paraHorario, paraMinutos, primeiroNome, sobrepoe,
} from '../src/utils/agendaEstudio.ts';

const reserva = (horario, duracaoMinutos, posicao, propria = false, data = '2026-11-10') =>
  ({ posicao, data, horario: `${horario}:00`, duracaoMinutos, tatuadorNome: 'Ana Souza', propria });

test('converte horários e minutos nos dois sentidos', () => {
  assert.equal(paraMinutos('14:30'), 870);
  assert.equal(paraMinutos('09:05:00'), 545);
  assert.equal(paraHorario(870), '14:30');
  assert.equal(paraHorario(1380), '23:00');
});

test('intervalos que só se encostam não se sobrepõem', () => {
  assert.equal(sobrepoe(840, 120, 960, 60), false);
  assert.equal(sobrepoe(780, 60, 840, 60), false);
  assert.equal(sobrepoe(840, 120, 900, 60), true);
});

test('reserva de outro tatuador na mesma posição bloqueia; em outra posição, não', () => {
  const blocos = blocosDoDia([reserva('14:00', 120, 1)], '2026-11-10');
  assert.equal(motivoConflito({ posicao: 1, inicioMin: 900, duracaoMin: 60 }, blocos),
    'A posição 1 já está ocupada das 14:00 às 16:00.');
  assert.equal(motivoConflito({ posicao: 2, inicioMin: 900, duracaoMin: 60 }, blocos), null);
});

test('a própria sessão bloqueia qualquer posição', () => {
  const blocos = blocosDoDia([reserva('14:00', 120, 1, true)], '2026-11-10');
  assert.equal(motivoConflito({ posicao: 2, inicioMin: 900, duracaoMin: 60 }, blocos),
    'Você já tem uma sessão das 14:00 às 16:00.');
});

test('sessões pendentes da mesma proposta também bloqueiam', () => {
  const pendente = { posicao: 3, inicioMin: 600, duracaoMin: 60, propria: true, pendente: true, rotulo: 'Sessão 1' };
  assert.equal(motivoConflito({ posicao: 1, inicioMin: 630, duracaoMin: 60 }, [pendente]),
    'Outra sessão desta proposta já ocupa das 10:00 às 11:00.');
});

test('sessão sem posição de colega não ocupa nenhuma posição', () => {
  const blocos = blocosDoDia([reserva('14:00', 60, null)], '2026-11-10');
  assert.equal(motivoConflito({ posicao: 1, inicioMin: 840, duracaoMin: 60 }, blocos), null);
});

test('sessão que começou no dia anterior entra com início negativo', () => {
  const [bloco] = blocosDoDia([reserva('23:00', 180, 1, false, '2026-11-09')], '2026-11-10');
  assert.equal(bloco.inicioMin, -60);
  assert.ok(motivoConflito({ posicao: 1, inicioMin: 60, duracaoMin: 60 }, [bloco]));
});

test('rótulos: "Você" para a própria sessão e primeiro nome para colegas', () => {
  const [colega, propria] = blocosDoDia([reserva('10:00', 60, 1), reserva('12:00', 60, 2, true)], '2026-11-10');
  assert.equal(colega.rotulo, 'Ana');
  assert.equal(propria.rotulo, 'Você');
  assert.equal(primeiroNome('   '), 'Tatuador');
});

test('minuto atual só existe quando o dia exibido é hoje', () => {
  const agora = new Date(2026, 9, 18, 18, 40);
  assert.equal(minutosAgoraSeHoje(new Date(2026, 9, 18), agora), 18 * 60 + 40);
  assert.equal(minutosAgoraSeHoje(new Date(2026, 9, 19), agora), null);
});

test('horário que já passou (ou é agora) é recusado; logo depois, liberado', () => {
  const agoraMin = 18 * 60 + 40;
  assert.equal(motivoConflito({ posicao: 1, inicioMin: 18 * 60 + 30, duracaoMin: 60 }, [], agoraMin), 'Esse horário já passou.');
  assert.equal(motivoConflito({ posicao: 1, inicioMin: agoraMin, duracaoMin: 60 }, [], agoraMin), 'Esse horário já passou.');
  assert.equal(motivoConflito({ posicao: 1, inicioMin: 19 * 60, duracaoMin: 60 }, [], agoraMin), null);
  // Outros dias (agoraMin null) não têm restrição de horário.
  assert.equal(motivoConflito({ posicao: 1, inicioMin: 9 * 60, duracaoMin: 60 }, [], null), null);
});

test('o toque é arredondado para o passo de 30 min e respeita a grade', () => {
  assert.equal(encaixarNoPasso(875, 60), 870);
  assert.equal(encaixarNoPasso(300, 60), 480);
  assert.equal(encaixarNoPasso(1370, 120), 1260);
});
