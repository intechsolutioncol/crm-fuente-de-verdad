// El servidor (Vercel) corre en UTC; para check-ins la fecha debe ser
// la fecha en Colombia, no la fecha UTC (evita que domingo en la
// noche cuente como lunes).
export function hoyColombia(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  return formatter.format(new Date()) // 'en-CA' produce YYYY-MM-DD
}
