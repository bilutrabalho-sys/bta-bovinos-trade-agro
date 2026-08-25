import { useState } from 'react'
import { useAuth, AuthError } from '@/auth/AuthContext'
import { BTALogo, Btn, Ic } from '@/components'

// Tela de cadastro (modo api). Mesma linguagem visual do login. Campos: nome,
// e-mail, senha (mín. 8). Erros amigáveis (409 e-mail existe, 400 inválido) e
// estado de loading no botão. Sucesso => volta à tela de origem (ou Home).
export function RegisterScreen({ message, onSuccess, onLogin, onBack }: {
  message?: string | null
  onSuccess: () => void
  onLogin: () => void
  onBack: () => void
}) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (loading) return
    setError(null)
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha nome, e-mail e senha.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password)
      onSuccess()
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Não foi possível criar a conta. Tente novamente.')
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
        <h1 className="font-display font-black text-white text-2xl mt-4" style={{ letterSpacing: '-0.025em' }}>Crie sua conta</h1>
        <p className="text-white/40 text-xs mt-1">Leva menos de um minuto.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {message && (
          <div className="bg-bta-amber/10 border border-bta-amber rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-bta-amber flex-shrink-0"><Ic.AlertCircle /></span>
            <p className="text-bta-text text-xs font-display font-semibold">{message}</p>
          </div>
        )}

        <div>
          <label className="text-bta-text text-xs font-display font-semibold block mb-1">Nome</label>
          <input
            type="text" autoComplete="name"
            value={name} onChange={e => { setName(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Seu nome"
            className="w-full bg-bta-surface border border-bta-border rounded-xl px-4 py-3 text-sm text-bta-text outline-none focus:border-bta-primary"
          />
        </div>

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
              type={showPass ? 'text' : 'password'} autoComplete="new-password"
              value={password} onChange={e => { setPassword(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Mínimo 8 caracteres"
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
          {loading ? 'Criando conta...' : 'Criar conta'}
        </Btn>

        <button onClick={onLogin} className="w-full text-center text-bta-muted text-sm font-display font-medium pt-2">
          Já tem conta? <span className="text-bta-primary font-bold">Entrar</span>
        </button>

        <p className="text-bta-muted text-[10px] text-center leading-relaxed pt-2">
          Ao criar a conta você concorda com os Termos de Uso e a Política de Privacidade da BTA.
        </p>
      </div>
    </div>
  )
}
