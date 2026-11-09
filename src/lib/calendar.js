// Calendar dates are strings; timestamps remain UTC Date values.
export function calendarDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((value) => value.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function shiftDate(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
