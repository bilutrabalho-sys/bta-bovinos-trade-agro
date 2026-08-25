import { useState } from 'react'
import type { Screen, Tab } from '@/core/navigation'
import { BTALogo, Ic, BottomNav, Btn } from '@/components'
import { useAuth, AuthError } from '@/auth/AuthContext'
import { useAuthGate } from '@/auth/AuthGate'

export function ProfileScreen({ onTab, onNavigate }: { onTab: (t: Tab) => void; onNavigate: (s: Screen) => void }) {
  const { isDemo, isAuthenticated, user, logout, deleteAccount } = useAuth()
  const { promptLogin, promptRegister } = useAuthGate()

  // Fluxo demo (mock): "Sair da conta" continua sendo o mesmo efeito visual de hoje.
  const [logoutState, setLogoutState] = useState<'idle' | 'confirm' | 'done'>('idle')
  // Fluxo real (api): confirmação de exclusão de conta (exigência Play Store).
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'busy'>('idle')
  const [accountError, setAccountError] = useState<string | null>(null)

  const menuItems: { icon: React.ReactNode; label: string; screen?: Screen; soon?: boolean }[] = [
    { icon: <Ic.Bell />, label: 'Notificações', screen: 'notifications' },
    { icon: <Ic.Heart />, label: 'Favoritos', screen: 'favorites' },
    { icon: <Ic.Book />, label: 'BTA Academy', screen: 'academy' },
    { icon: <Ic.Radar />, label: 'Radar', screen: 'radar' },
    { icon: <Ic.Handshake />, label: 'Minhas negociações', screen: 'business' },
    { icon: <Ic.Crown />, label: 'BTA PRO', screen: 'bta-pro' },
    { icon: <Ic.Wrench />, label: 'Central de Serviços', screen: 'services' },
    { icon: <Ic.Gear />, label: 'Configurações', soon: true },
  ]

  // Identidade exibida. Em demo, o "Rafael" fixo de sempre; em api logado, o
  // usuário real; em api deslogado, um estado de "Visitante".
  const authed = isDemo || isAuthenticated
  const displayName = isDemo ? 'Rafael Mendonça' : (user?.name || 'Sua conta')
  const displaySubtitle = isDemo ? 'Comprador e Investidor' : (user?.email ?? '')
  const displayLocation = isDemo ? 'São José do Rio Preto, SP' : (user?.location ?? null)
  const avatarInitial = (displayName.trim().charAt(0) || 'U').toUpperCase()

  const handleLogout = async () => {
    await logout()
    onTab('home')
  }
  const handleDelete = async () => {
    setDeleteState('busy')
    setAccountError(null)
    try {
      await deleteAccount()
      onTab('home')
    } catch (e) {
      setAccountError(e instanceof AuthError ? e.message : 'Não foi possível excluir a conta. Tente novamente.')
      setDeleteState('confirm')
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="header-dark px-5 pt-12 pb-8">
          <BTALogo dark />
          {authed ? (
            <div className="flex items-center gap-4 mt-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-bta-amber font-display font-black text-3xl bta-mark-amber-sm">{avatarInitial}</div>
              <div>
                <h1 className="font-display font-black text-white text-xl">{displayName}</h1>
                {displaySubtitle && <div className="flex items-center gap-2 mt-1"><span className="text-white/50 text-xs">{displaySubtitle}</span></div>}
                {displayLocation && <div className="flex items-center gap-1 mt-1"><Ic.Pin /><span className="text-white/40 text-xs">{displayLocation}</span></div>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white/50"><Ic.User /></div>
              <div>
                <h1 className="font-display font-black text-white text-xl">Visitante</h1>
                <span className="text-white/50 text-xs">Navegando sem conta</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Visitante (api, deslogado): card de convite para entrar/criar conta. */}
          {!authed && (
            <div className="bg-bta-surface rounded-2xl border border-bta-border -mt-8 card-shadow p-5">
              <p className="font-display font-black text-bta-text text-base">Entre ou crie sua conta</p>
              <p className="text-bta-muted text-xs mt-1 leading-relaxed">Salve favoritos, faça propostas, crie alertas no Radar e acompanhe suas negociações.</p>
              <div className="flex gap-3 mt-4">
                <Btn sound="cta" onClick={() => promptLogin()} className="flex-1 btn-primary-grad text-white font-display font-bold text-sm py-3 rounded-xl">Entrar</Btn>
                <Btn sound="tap" onClick={() => promptRegister()} className="flex-1 border border-bta-primary text-bta-primary font-display font-bold text-sm py-3 rounded-xl">Criar conta</Btn>
              </div>
            </div>
          )}

          {/* Bloco rico do perfil — só para quem tem identidade (demo ou logado). */}
          {authed && (
            <>
              <div className="bg-bta-surface rounded-2xl border border-bta-border -mt-8 card-shadow p-4">
                <div className="grid grid-cols-3 divide-x divide-bta-border">
                  {[{ label: 'Nível', value: 'Iniciante' }, { label: 'Negociações', value: '12' }, { label: 'XP Total', value: '380' }].map(s => (
                    <div key={s.label} className="text-center px-3">
                      <p className="font-display font-black text-bta-primary text-base">{s.value}</p>
                      <p className="text-bta-muted text-[10px] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* BTA PRO teaser */}
              <button onClick={() => onNavigate('bta-pro')} className="w-full bg-bta-amber/10 border border-bta-amber rounded-2xl p-4 flex items-center gap-3 text-left">
                <Ic.Crown />
                <div className="flex-1">
                  <p className="font-display font-bold text-bta-text text-sm">Assinar BTA PRO</p>
                  <p className="text-bta-muted text-xs">Radar avançado, analytics, Match prioritário e mais.</p>
                </div>
                <span className="font-display font-bold text-bta-amber text-sm">R$ 79/mês</span>
              </button>
              <div className="bg-bta-surface rounded-2xl border border-bta-border p-4">
                <p className="font-display font-bold text-bta-text text-sm mb-3">Preferências</p>
                <div className="flex flex-wrap gap-2">
                  {['Comprador', 'Nelore', 'Brangus', 'SP', 'MG', 'Até 200 km'].map(t => <span key={t} className="bg-bta-primary/10 text-bta-primary text-xs font-display font-semibold px-3 py-1 rounded-full">{t}</span>)}
                </div>
              </div>
            </>
          )}

          <div className="bg-bta-surface rounded-2xl border border-bta-border overflow-hidden">
            {menuItems.map((item, i) => (
              <button key={item.label} onClick={() => item.screen && onNavigate(item.screen)} disabled={item.soon} className={`w-full flex items-center justify-between px-4 py-4 text-left transition-colors ${item.soon ? '' : 'hover:bg-bta-bg'} ${i < menuItems.length - 1 ? 'border-b border-bta-border' : ''}`}>
                <div className="flex items-center gap-3"><span className="text-bta-muted">{item.icon}</span><span className={`font-display font-medium text-sm ${item.soon ? 'text-bta-muted' : 'text-bta-text'}`}>{item.label}</span></div>
                {item.soon
                  ? <span className="text-[10px] font-display font-bold text-bta-muted bg-bta-muted/10 px-2 py-0.5 rounded-full">Em breve</span>
                  : <Ic.ChevronRight />}
              </button>
            ))}
          </div>

          {/* ── Ações de conta ─────────────────────────────────────────────── */}
          {isDemo ? (
            // Modo demo (mock): mantém o mesmo "Sair da conta" visual de hoje.
            logoutState === 'done' ? (
              <p className="w-full py-4 text-center text-bta-muted font-display font-semibold text-sm flex items-center justify-center gap-1.5"><Ic.Check /> Sessão encerrada</p>
            ) : logoutState === 'confirm' ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="text-bta-muted text-xs font-display font-medium">Sair da conta?</span>
                <button onClick={() => setLogoutState('idle')} className="text-bta-text text-xs font-display font-semibold px-3 py-1.5 rounded-lg border border-bta-border">Cancelar</button>
                <Btn sound="cta" onClick={() => setLogoutState('done')} className="text-bta-error text-xs font-display font-bold px-3 py-1.5 rounded-lg border border-bta-error">Confirmar saída</Btn>
              </div>
            ) : (
              <Btn sound="tap" onClick={() => setLogoutState('confirm')} className="w-full py-4 text-bta-error font-display font-semibold text-sm">Sair da conta</Btn>
            )
          ) : isAuthenticated ? (
            // Modo api, logado: logout real + exclusão de conta (obrigatória).
            <div className="space-y-3 pt-1">
              <Btn sound="tap" onClick={handleLogout} className="w-full py-4 text-bta-text font-display font-semibold text-sm border border-bta-border rounded-xl">Sair</Btn>

              {deleteState === 'idle' ? (
                <button onClick={() => { setAccountError(null); setDeleteState('confirm') }} className="w-full py-2 text-bta-error font-display font-semibold text-xs">Excluir minha conta</button>
              ) : (
                <div className="bg-bta-error/5 border border-bta-error/30 rounded-2xl p-4 space-y-3">
                  <p className="font-display font-bold text-bta-error text-sm flex items-center gap-1.5"><Ic.AlertCircle /> Excluir conta permanentemente</p>
                  <p className="text-bta-muted text-xs leading-relaxed">Esta ação é permanente e não pode ser desfeita. Seus favoritos, alertas, simulações e dados pessoais serão removidos.</p>
                  {accountError && <p className="text-bta-error text-xs font-display font-semibold">{accountError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteState('idle')} disabled={deleteState === 'busy'} className="flex-1 py-3 rounded-xl border border-bta-border text-bta-text font-display font-bold text-xs">Cancelar</button>
                    <Btn sound="error" onClick={handleDelete} disabled={deleteState === 'busy'} className="flex-1 py-3 rounded-xl bg-bta-error text-white font-display font-bold text-xs">
                      {deleteState === 'busy' ? 'Excluindo...' : 'Sim, excluir'}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <BottomNav active="profile" onTab={onTab} />
    </div>
  )
}
