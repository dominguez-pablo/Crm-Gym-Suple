export function startOfToday() {
  return startOfDate(new Date());
}

export function startOfDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function cuotaVigente(fechaVencimiento, activo = true) {
  if (!activo || !fechaVencimiento) return false;
  return new Date(fechaVencimiento) >= startOfToday();
}

export function sameCalendarDay(a, b) {
  if (!a || !b) return false;
  return startOfDate(a).getTime() === startOfDate(b).getTime();
}

export function endOfDate(value) {
  const date = startOfDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
}
