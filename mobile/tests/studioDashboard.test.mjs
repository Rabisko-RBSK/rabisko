import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStudioDemoBookings, monthKey, periodDate, summarizeStudioBookings,
  percentageChange, studioArtists,
} from '../src/services/studioDashboard.ts';

test('o mês anterior atravessa a virada de ano', () => {
  assert.equal(monthKey(periodDate('previous', new Date(2027, 0, 31))), '2026-12');
});

test('demonstração mantém valores positivos e totais consistentes em meses curtos e no dia 1', () => {
  for (const now of [new Date(2026, 8, 1), new Date(2026, 8, 27), new Date(2028, 1, 29), new Date(2027, 0, 31)]) {
    const bookings = createStudioDemoBookings(now);
    assert.ok(bookings.every((booking) => booking.value > 0 && booking.style));
    const current = summarizeStudioBookings(bookings, periodDate('current', now), now.getDate());
    const previous = summarizeStudioBookings(bookings, periodDate('previous', now), 31);
    assert.equal(current.revenue, 32450);
    assert.equal(previous.revenue, 27500);
    assert.equal(current.appointments, 86);
    assert.equal(current.newAppointments + current.recurringAppointments, current.appointments);
    assert.equal(current.artists.reduce((sum, artist) => sum + artist.revenue, 0), current.revenue);
    assert.equal(current.styles.reduce((sum, style) => sum + style.count, 0), current.appointments);
    assert.equal(current.daily.reduce((sum, day) => sum + day.value, 0), current.revenue);
    assert.equal(current.daily.length, now.getDate());
    assert.ok(Math.abs(current.styles.reduce((sum, style) => sum + style.percent, 0) - 100) < 0.001);
  }
});

test('exclui cancelamentos, outros meses e dias futuros dos indicadores', () => {
  const base = { id: '1', artistId: studioArtists[0].id, clientId: '1', clientName: 'Cliente',
    date: '2026-09-10', time: '10:00', value: 500, style: 'Realismo', recurring: false, status: 'confirmada' };
  const data = summarizeStudioBookings([
    base,
    { ...base, id: '2', status: 'cancelada', value: 900 },
    { ...base, id: '3', date: '2026-08-10' },
    { ...base, id: '4', date: '2026-09-30' },
    { ...base, id: '5', date: '2026-09-12', value: 1000, recurring: true },
  ], new Date(2026, 8, 1), 20);
  assert.equal(data.appointments, 2);
  assert.equal(data.revenue, 1500);
  assert.equal(data.average, 75);
  assert.deepEqual(data.peak, { day: 12, value: 1000 });
  assert.equal(data.newAppointments, 1);
  assert.equal(data.recurringAppointments, 1);
});

test('período vazio e fevereiro bissexto não produzem NaN ou dias inexistentes', () => {
  const data = summarizeStudioBookings([], new Date(2028, 1, 1), 31);
  assert.equal(data.daily.length, 29);
  assert.equal(data.revenue, 0);
  assert.equal(data.average, 0);
  assert.equal(data.appointments, 0);
  assert.ok(data.styles.every((style) => style.percent === 0));
});

test('comparação distingue ausência de base, queda e crescimento', () => {
  assert.equal(percentageChange(50, 0), null);
  assert.equal(percentageChange(0, 100), -100);
  assert.equal(percentageChange(32450, 27500), 18);
});
