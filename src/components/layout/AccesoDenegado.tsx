interface AccesoDenegadoProps {
  mensaje?: string
}

export function AccesoDenegado({ mensaje }: AccesoDenegadoProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-foreground">No tienes acceso a este módulo</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        {mensaje ?? 'Si crees que deberías tener acceso, contacta a un administrador.'}
      </p>
    </div>
  )
}
