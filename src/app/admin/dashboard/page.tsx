'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Store, Users, Clock, CheckCircle2, XCircle,
  TrendingUp, LogOut, Search, RefreshCw,
  Check, X, ChevronRight, ShieldCheck,
  MessageCircle, BarChart2, AlertTriangle,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''
  return fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers },
    ...options,
  }).then(async res => {
    const data = await res.json()
    if (!res.ok) throw new Error(data.erro || 'Erro')
    return data
  })
}

// ── Tipos ──────────────────────────────────────────────────────
interface Stats {
  total_comercios: number; total_comerciantes: number
  pendentes: number; aprovados: number; rejeitados: number
  leads_hoje: number; leads_mes: number
}
interface Comerciante {
  id: string; nome_completo: string; email: string; whatsapp: string
  ativo: boolean; status_verificacao: string; criado_em: string
  comercios: { id: string; nome: string; slug: string } | null
}
interface Comercio {
  id: string; nome: string; slug: string; verificado: boolean
  destaque: boolean; bairro: string; criado_em: string
  categorias: { nome: string; icone: string } | null
}

// ── Card de stat ───────────────────────────────────────────────
function StatCard({ icone, label, valor, cor, bg }: { icone: React.ReactNode; label: string; valor: number | string; cor: string; bg: string }) {
  return (
    <div style={{
      background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16,
      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 2px 8px rgba(31,41,55,0.05)',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icone}
      </div>
      <div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: cor, lineHeight: 1 }}>{valor}</div>
        <div style={{ color: '#6B7280', fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

// ── Badge de status ────────────────────────────────────────────
function BadgeStatus({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pendente:  { bg: '#FEF9C3', color: '#854D0E', label: '⏳ Pendente' },
    aprovado:  { bg: '#DCFCE7', color: '#15803D', label: '✅ Aprovado' },
    rejeitado: { bg: '#FEE2E2', color: '#DC2626', label: '❌ Rejeitado' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#6B7280', label: status }
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', padding: '3px 10px', borderRadius: 999 }}>
      {s.label}
    </span>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [aba, setAba]               = useState<'pendentes' | 'comerciantes' | 'comercios'>('pendentes')
  const [stats, setStats]           = useState<Stats | null>(null)
  const [comerciantes, setComerciantes] = useState<Comerciante[]>([])
  const [comercios, setComercios]   = useState<Comercio[]>([])
  const [busca, setBusca]           = useState('')
  const [carregando, setCarregando] = useState(true)
  const [acao, setAcao]             = useState<string | null>(null)
  const [motivo, setMotivo]         = useState('')
  const [confirmar, setConfirmar]   = useState<{ id: string; tipo: 'aprovar' | 'rejeitar'; nome: string } | null>(null)

  // Proteção de rota
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) router.push('/admin/login')
  }, [router])

  const carregarStats = useCallback(async () => {
    try {
      const s = await adminFetch<Stats>('/admin/stats')
      setStats(s)
    } catch { }
  }, [])

  const carregarComerciantes = useCallback(async (filtro?: string) => {
    setCarregando(true)
    try {
      const res = await adminFetch<{ data: Comerciante[] }>(`/admin/comerciantes?status=todos&busca=${filtro || ''}`)
      setComerciantes(res.data)
    } catch { }
    finally { setCarregando(false) }
  }, [])

  const carregarComercios = useCallback(async (filtro?: string) => {
    setCarregando(true)
    try {
      const res = await adminFetch<{ data: Comercio[] }>(`/admin/comercios?busca=${filtro || ''}`)
      setComercios(res.data)
    } catch { }
    finally { setCarregando(false) }
  }, [])

  useEffect(() => {
    carregarStats()
    carregarComerciantes()
  }, [carregarStats, carregarComerciantes])

  useEffect(() => {
    if (aba === 'comercios') carregarComercios()
    else carregarComerciantes()
  }, [aba, carregarComerciantes, carregarComercios])

  const handleBusca = (v: string) => {
    setBusca(v)
    if (aba === 'comercios') carregarComercios(v)
    else carregarComerciantes(v)
  }

  const executarAcao = async () => {
    if (!confirmar) return
    setAcao(confirmar.id)
    try {
      await adminFetch(`/admin/comerciantes/${confirmar.id}/${confirmar.tipo}`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
      })
      setConfirmar(null)
      setMotivo('')
      await Promise.all([carregarStats(), carregarComerciantes(busca)])
    } catch (e: any) {
      alert(e.message)
    } finally {
      setAcao(null)
    }
  }

  const sair = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_email')
    router.push('/admin/login')
  }

  const pendentes = comerciantes.filter(c => c.status_verificacao === 'pendente')
  const listaAtual = aba === 'pendentes' ? pendentes : aba === 'comerciantes' ? comerciantes : []

  const formatarData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: 'white', borderBottom: '1.5px solid #E5E7EB',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={140} height={36} style={{ objectFit: 'contain' }} />
          <div style={{ background: '#DCFCE7', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 999, padding: '3px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={12} color="#16A34A" />
            <span style={{ color: '#16A34A', fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</span>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => { carregarStats(); aba === 'comercios' ? carregarComercios(busca) : carregarComerciantes(busca) }} style={{
            background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563', fontSize: 13, fontFamily: 'Poppins, sans-serif', fontWeight: 600, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}
          >
            <RefreshCw size={14} /> Atualizar
          </button>
          <button onClick={sair} style={{
            background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563', fontSize: 13, fontFamily: 'Poppins, sans-serif', fontWeight: 600, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.color = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard icone={<Store size={20} color="#16A34A" />} label="Comércios" valor={stats.total_comercios} cor="#16A34A" bg="#DCFCE7" />
            <StatCard icone={<Users size={20} color="#3B82F6" />} label="Comerciantes" valor={stats.total_comerciantes} cor="#1D4ED8" bg="#DBEAFE" />
            <StatCard icone={<Clock size={20} color="#F59E0B" />} label="Pendentes" valor={stats.pendentes} cor="#B45309" bg="#FEF3C7" />
            <StatCard icone={<CheckCircle2 size={20} color="#16A34A" />} label="Aprovados" valor={stats.aprovados} cor="#15803D" bg="#DCFCE7" />
            <StatCard icone={<TrendingUp size={20} color="#8B5CF6" />} label="Leads hoje" valor={stats.leads_hoje} cor="#6D28D9" bg="#EDE9FE" />
            <StatCard icone={<BarChart2 size={20} color="#EC4899" />} label="Leads 30d" valor={stats.leads_mes} cor="#BE185D" bg="#FCE7F3" />
          </div>
        )}

        {/* Banner pendentes */}
        {stats && stats.pendentes > 0 && (
          <div style={{
            background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: 14,
            padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <AlertTriangle size={18} color="#B45309" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ color: '#92400E', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
                {stats.pendentes} comerciante{stats.pendentes > 1 ? 's' : ''} aguardando aprovação
              </span>
              <span style={{ color: '#B45309', fontSize: 13, marginLeft: 6 }}>— revise abaixo</span>
            </div>
            <button onClick={() => setAba('pendentes')} style={{
              background: '#B45309', color: 'white', border: 'none', borderRadius: 999,
              padding: '6px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
            }}>
              Ver agora
            </button>
          </div>
        )}

        {/* Abas */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: 6 }}>
          {([
            { key: 'pendentes',     label: `⏳ Pendentes${stats?.pendentes ? ` (${stats.pendentes})` : ''}` },
            { key: 'comerciantes',  label: '👥 Comerciantes' },
            { key: 'comercios',     label: '🏪 Comércios' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => { setAba(tab.key); setBusca('') }} style={{
              flex: 1, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
              background: aba === tab.key ? '#16A34A' : 'transparent',
              color: aba === tab.key ? 'white' : '#6B7280',
              boxShadow: aba === tab.key ? '0 2px 8px rgba(22,163,74,0.25)' : 'none',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" value={busca} onChange={e => handleBusca(e.target.value)}
            placeholder={aba === 'comercios' ? 'Buscar comércio...' : 'Buscar por nome ou email...'}
            style={{
              width: '100%', padding: '11px 14px 11px 40px', boxSizing: 'border-box',
              background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 12,
              fontSize: 14, color: '#111827', outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#16A34A')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Carregando...</p>
          </div>
        ) : aba !== 'comercios' ? (
          /* ── Lista Comerciantes ── */
          listaAtual.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '1.5px solid #E5E7EB' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{aba === 'pendentes' ? '🎉' : '👥'}</div>
              <p style={{ color: '#4B5563', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                {aba === 'pendentes' ? 'Nenhum pendente no momento!' : 'Nenhum comerciante encontrado'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {listaAtual.map(c => (
                <div key={c.id} style={{
                  background: 'white', border: `1.5px solid ${c.status_verificacao === 'pendente' ? '#FDE68A' : '#E5E7EB'}`,
                  borderRadius: 16, padding: '16px 20px',
                  boxShadow: '0 2px 8px rgba(31,41,55,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#16A34A' }}>
                            {(c.nome_completo || c.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>
                            {c.nome_completo || '—'}
                          </div>
                          <div style={{ color: '#6B7280', fontSize: 12 }}>{c.email}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 8 }}>
                        {c.whatsapp && (
                          <span style={{ color: '#4B5563', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MessageCircle size={12} color="#25D366" /> {c.whatsapp}
                          </span>
                        )}
                        {c.comercios && (
                          <span style={{ color: '#4B5563', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Store size={12} color="#16A34A" /> {c.comercios.nome}
                          </span>
                        )}
                        <span style={{ color: '#9CA3AF', fontSize: 11 }}>
                          Cadastro: {formatarData(c.criado_em)}
                        </span>
                      </div>

                      <BadgeStatus status={c.status_verificacao} />
                    </div>

                    {/* Ações */}
                    {c.status_verificacao === 'pendente' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => setConfirmar({ id: c.id, tipo: 'rejeitar', nome: c.nome_completo || c.email })}
                          disabled={acao === c.id}
                          style={{
                            padding: '8px 16px', borderRadius: 999, border: '1.5px solid #FECACA',
                            background: 'white', color: '#DC2626', fontSize: 13, fontWeight: 700,
                            fontFamily: 'Poppins, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                        >
                          <X size={14} /> Rejeitar
                        </button>
                        <button
                          onClick={() => setConfirmar({ id: c.id, tipo: 'aprovar', nome: c.nome_completo || c.email })}
                          disabled={acao === c.id}
                          style={{
                            padding: '8px 16px', borderRadius: 999, border: 'none',
                            background: '#16A34A', color: 'white', fontSize: 13, fontWeight: 700,
                            fontFamily: 'Poppins, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 5,
                            boxShadow: '0 3px 10px rgba(22,163,74,0.3)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                          <Check size={14} /> Aprovar
                        </button>
                      </div>
                    )}
                    {c.status_verificacao !== 'pendente' && c.comercios?.slug && (
                      <a href={`http://localhost:3000/c/${c.comercios.slug}`} target="_blank" rel="noreferrer" style={{
                        padding: '8px 14px', borderRadius: 999, border: '1.5px solid #E5E7EB',
                        color: '#4B5563', fontSize: 12, fontFamily: 'Poppins, sans-serif', fontWeight: 600,
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}
                      >
                        Ver perfil <ChevronRight size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── Lista Comércios ── */
          comercios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '1.5px solid #E5E7EB' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
              <p style={{ color: '#4B5563', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Nenhum comércio encontrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comercios.map(c => (
                <div key={c.id} style={{
                  background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14,
                  padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 1px 4px rgba(31,41,55,0.04)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {c.categorias?.icone || '🏪'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>{c.nome}</span>
                      {c.verificado && <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>✓ Verificado</span>}
                      {c.destaque  && <span style={{ background: '#FEF9C3', color: '#854D0E', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>⭐ Destaque</span>}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>{c.categorias?.nome || '—'}</span>
                      {c.bairro && <span>· {c.bairro}</span>}
                    </div>
                  </div>
                  <a href={`http://localhost:3000/c/${c.slug}`} target="_blank" rel="noreferrer" style={{
                    padding: '7px 14px', borderRadius: 999, border: '1.5px solid #E5E7EB',
                    color: '#4B5563', fontSize: 12, fontFamily: 'Poppins, sans-serif', fontWeight: 600,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}
                  >
                    Ver <ChevronRight size={13} />
                  </a>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal de confirmação */}
      {confirmar && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20,
        }} onClick={e => { if (e.target === e.currentTarget) setConfirmar(null) }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '28px 28px',
            maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'fadeUp 0.2s ease forwards',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{confirmar.tipo === 'aprovar' ? '✅' : '❌'}</div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginBottom: 6 }}>
                {confirmar.tipo === 'aprovar' ? 'Aprovar comerciante?' : 'Rejeitar comerciante?'}
              </h3>
              <p style={{ color: '#4B5563', fontSize: 14 }}>
                <strong>{confirmar.nome}</strong> será {confirmar.tipo === 'aprovar' ? 'aprovado e notificado via WhatsApp' : 'rejeitado'}
              </p>
            </div>

            {confirmar.tipo === 'rejeitar' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#111827', fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Motivo (opcional)
                </label>
                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={2}
                  placeholder="Ex: Não conseguimos confirmar a titularidade..."
                  style={{ width: '100%', padding: '10px 12px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, color: '#111827', fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#16A34A')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setConfirmar(null); setMotivo('') }} style={{
                flex: 1, padding: '12px', borderRadius: 999, border: '1.5px solid #E5E7EB',
                background: 'white', color: '#4B5563', fontSize: 14, fontWeight: 600,
                fontFamily: 'Poppins, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                Cancelar
              </button>
              <button onClick={executarAcao} disabled={!!acao} style={{
                flex: 1, padding: '12px', borderRadius: 999, border: 'none',
                background: confirmar.tipo === 'aprovar' ? '#16A34A' : '#DC2626',
                color: 'white', fontSize: 14, fontWeight: 700,
                fontFamily: 'Poppins, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: confirmar.tipo === 'aprovar' ? '0 4px 14px rgba(22,163,74,0.35)' : '0 4px 14px rgba(220,38,38,0.3)',
              }}>
                {acao ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : confirmar.tipo === 'aprovar' ? <><Check size={14} /> Aprovar</> : <><X size={14} /> Rejeitar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: #9CA3AF; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
