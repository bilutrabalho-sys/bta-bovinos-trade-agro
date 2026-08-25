import { useState } from 'react'
import { useAuth, AuthError } from '@/auth/AuthContext'
import { BTALogo, Btn, Ic } from '@/components'

// Tela de login (modo api). Visual BTA: header verde escuro, inputs limpos,
// botão primário em degradê, link para o cadastro. `message` é a mensagem curta
// vinda de um gate ("Entre para continuar", "Entre para favoritar"...).
export function LoginScreen({ message, onSuccess, onRegister, onBack }: {
  message?: string | null
  onSuccess: () => void
  onRegister: () => void
  onBack: () => void
}) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (loading) return
    setError(null)
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      onSuccess()
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Não foi possível entrar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bta-bg">
      <div className="header-dark px-5 pt-12 pb-8">
        <Btn sound="back" onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/70 mb-5">
          <Ic.Back />
        </Btn>
        <BTALogo dark size="md" />
        <h1 className="font-display font-black text-white text-2xl mt-4" style={{ letterSpacing: '-0.025em' }}>Bem-vindo de volta</h1>
        <p className="text-white/40 text-xs mt-1">Entre para acessar sua conta BTA.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {message && (
          <div className="bg-bta-amber/10 border border-bta-amber rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-bta-amber flex-shrink-0"><Ic.AlertCircle /></span>
            <p className="text-bta-text text-xs font-display font-semibold">{message}</p>
          </div>
        )}

        <div>
          <label className="text-bta-text text-xs font-display font-semibold block mb-1">E-mail</label>
          <input
            type="email" inputMode="email" autoComplete="email"
            value={email} onChange={e => { setEmail(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="voce@email.com"
            className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm text-bta-text outline-none focus:border-bta-primary"
          />
        </div>

        <div>
          <label className="text-bta-text text-xs font-display font-semibold block mb-1">Senha</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'} autoComplete="current-password"
              value={password} onChange={e => { setPassword(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Sua senha"
              className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 pr-12 text-sm text-bta-text outline-none focus:border-bta-primary"
            />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-bta-muted">
              <Ic.Eye />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-bta-error text-xs font-display font-semibold flex items-center gap-1.5">
            <Ic.AlertCircle /> {error}
          </p>
        )}

        <Btn
          sound="cta"
          onClick={submit}
          disabled={loading}
          className={`w-full font-display font-bold text-base py-4 rounded-xl mt-2 ${loading ? 'bg-bta-border text-bta-muted' : 'btn-primary-grad text-white'}`}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Btn>

        <button onClick={onRegister} className="w-full text-center text-bta-muted text-sm font-display font-medium pt-2">
          Não tem conta? <span className="text-bta-primary font-bold">Criar conta</span>
        </button>
      </div>
    </div>
  )
}
