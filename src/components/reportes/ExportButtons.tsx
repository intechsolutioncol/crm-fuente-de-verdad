const FORMATOS = [
  { formato: 'csv', label: 'CSV' },
  { formato: 'xlsx', label: 'Excel' },
  { formato: 'pdf', label: 'PDF' },
] as const

export function ExportButtons({ modulo, params }: { modulo: string; params: Record<string, string> }) {
  const base = new URLSearchParams({ modulo, ...params }).toString()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium mr-1">Exportar:</span>
      {FORMATOS.map(f => (
        <a
          key={f.formato}
          href={`/api/reportes/export?${base}&formato=${f.formato}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:border-primary hover:text-primary transition-colors"
        >
          {f.label}
        </a>
      ))}
    </div>
  )
}
