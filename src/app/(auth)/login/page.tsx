'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingGithub, setLoadingGithub] = useState(false)
  const supabase = createClient()

  async function handleGoogleLogin() {
    setLoadingGoogle(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    setLoadingGoogle(false)
  }

  async function handleGithubLogin() {
    setLoadingGithub(true)
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    setLoadingGithub(false)
  }

  const busy = loadingGoogle || loadingGithub

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 bg-white rounded-2xl px-5 py-3 shadow-sm">
            <Image
              src="/logo.webp"
              alt="Iglesia Apostólica Fuente de Verdad"
              width={140}
              height={70}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">Poblado · Medellín</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-1">Iniciar sesión</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Accede con tu cuenta de Google para registrarte como miembro.
          </p>

          {/* Google — principal */}
          <Button
            onClick={handleGoogleLogin}
            disabled={busy}
            className="w-full gap-3 mb-3"
            size="lg"
          >
            {loadingGoogle ? (
              <span className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loadingGoogle ? 'Redirigiendo…' : 'Continuar con Google'}
          </Button>

          {/* Separador */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* GitHub — secundario (administradores) */}
          <Button
            variant="outline"
            onClick={handleGithubLogin}
            disabled={busy}
            className="w-full gap-3"
            size="lg"
          >
            {loadingGithub ? (
              <span className="w-5 h-5 border-2 border-foreground/40 border-t-foreground rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            )}
            {loadingGithub ? 'Redirigiendo…' : 'Continuar con GitHub'}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Google para miembros · GitHub para administradores
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CRM v2.0 · INTECH Solution
        </p>
      </div>
    </div>
  )
}
