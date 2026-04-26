'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Store, Users, DollarSign, Megaphone, Brain,
  BarChart2, Tag, Bell, Settings, LogOut, Search, RefreshCw,
  Check, X, ChevronRight, ShieldCheck, MessageCircle, AlertTriangle,
  Clock, CheckCircle2, TrendingUp, Plus, Pencil, Trash2,
  Activity, Zap, ChevronDown, MapPin, Send, Eye, EyeOff, Loader2,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zappicidade-site.vercel.app'

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

// ── Tipos ────────────────────────────────────────────────────────
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
type Secao = 'dashboard' | 'pendentes' | 'comerciantes' | 'comercios' | 'monetizacao' | 'ia' | 'relatorios' | 'anuncios' | 'notificacoes' | 'configuracoes' | 'usuarios'

// ── Helpers ──────────────────────────────────────────────────────
const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

// ── Sidebar ──────────────────────────────────────────────────────
const MENU: { key: Secao; icon: React.ElementType; label: string; badge?: string; href?: string }[] = [
  { key: 'dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'pendentes',      icon: Clock,            label: 'Aprovações',      badge: 'pendentes' },
  { key: 'comerciantes',   icon: Users,            label: 'Comerciantes',  href: '/admin/comerciantes' },
  { key: 'comercios',      icon: Store,            label: 'Comércios',     href: '/admin/comercios' },
  { key: 'usuarios',       icon: MessageCircle,    label: 'Usuários Bot',    href: '/admin/usuarios' },
  { key: 'monetizacao',    icon: DollarSign,       label: 'Monetização' },
  { key: 'anuncios',       icon: Megaphone,        label: 'Anúncios' },
  { key: 'ia',             icon: Brain,            label: 'IA — RAG' },
  { key: 'relatorios',     icon: BarChart2,        label: 'Relatórios' },
  { key: 'notificacoes',   icon: Bell,             label: 'Notificações' },
  { key: 'configuracoes',  icon: Settings,         label: 'Configurações' },
]

function Sidebar({ secao, setSecao, pendentes, collapsed, setCollapsed, onSair }: {
  secao: Secao; setSecao: (s: Secao) => void
  pendentes: number; collapsed: boolean; setCollapsed: (v: boolean) => void
  onSair: () => void
}) {
  return (
    <aside style={{
      width: collapsed ? 64 : 240, flexShrink: 0,
      background: 'white', borderRight: '1.5px solid #E5E7EB',
      height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '18px 16px' : '18px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
        {!collapsed && <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={120} height={30} style={{ objectFit: 'contain' }} />}
        {collapsed && <div style={{ width: 32, height: 32, background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={16} color="#16A34A" />
        </div>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: '#9CA3AF', flexShrink: 0 }}
        >
          <ChevronDown size={16} style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Badge admin */}
      {!collapsed && (
        <div style={{ padding: '8px 20px' }}>
          <div style={{ background: '#DCFCE7', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 999, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={12} color="#16A34A" />
            <span style={{ color: '#16A34A', fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrador</span>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {MENU.map(({ key, icon: Icon, label, badge, href }) => {
          const ativo = secao === key
          const cnt = badge === 'pendentes' ? pendentes : 0
          const style: React.CSSProperties = {
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 12px' : '10px 14px',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: ativo ? '#F0FDF4' : 'transparent',
            color: ativo ? '#16A34A' : '#6B7280',
            fontFamily: 'Inter, sans-serif', fontWeight: ativo ? 600 : 500,
            fontSize: 13.5, marginBottom: 2, transition: 'all 0.15s',
            boxShadow: ativo ? 'inset 3px 0 0 #16A34A' : 'none',
            position: 'relative', textDecoration: 'none',
          }
          const inner = <>
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>{label}</span>}
            {!collapsed && cnt > 0 && (
              <span style={{ background: '#F59E0B', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '2px 7px' }}>{cnt}</span>
            )}
            {collapsed && cnt > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#F59E0B', borderRadius: '50%' }} />
            )}
          </>
          if (href) return (
            <a key={key} href={href} style={style}
              onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >{inner}</a>
          )
          return (
            <button key={key} onClick={() => setSecao(key)} style={style}
              onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent' }}
            >{inner}</button>
          )
        })}
      </nav>

      {/* Sair */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #F3F4F6' }}>
        <button onClick={onSair} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '10px 12px' : '10px 14px', borderRadius: 10,
          border: 'none', cursor: 'pointer', background: 'transparent',
          color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: 13.5, transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}

// ── StatCard ─────────────────────────────────────────────────────
function StatCard({ icon, label, valor, sub, cor, bg }: { icon: React.ReactNode; label: string; valor: number | string; sub?: string; cor: string; bg: string }) {
  return (
    <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '20px', boxShadow: '0 2px 8px rgba(31,41,55,0.04)', transition: 'all 0.2s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(31,41,55,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(31,41,55,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {sub && <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, fontFamily: 'Inter, sans-serif' }}>{sub}</span>}
      </div>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#111827', lineHeight: 1, marginBottom: 4 }}>{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</div>
      <div style={{ color: '#6B7280', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{label}</div>
    </div>
  )
}

// ── Mini bar chart (SVG) ─────────────────────────────────────────
function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', background: `rgba(22,163,74,${0.3 + (d.value / max) * 0.7})`, borderRadius: '4px 4px 0 0', height: `${(d.value / max) * 64}px`, transition: 'height 0.5s ease', minHeight: 4 }} />
          <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Mini line chart (SVG) ────────────────────────────────────────
function MiniLineChart({ data }: { data: number[] }) {
  const max = Math.max(...data); const min = Math.min(...data)
  const range = max - min || 1
  const w = 280; const h = 80; const pad = 10
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const path = `M ${pts.join(' L ')}`
  const area = `M ${pts[0]} L ${pts.join(' L ')} L ${w - pad},${h} L ${pad},${h} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lineGrad)" />
      <path d={path} fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2)
        const y = h - pad - ((v - min) / range) * (h - pad * 2)
        return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#16A34A" strokeWidth="2" />
      })}
    </svg>
  )
}

// ── BadgeStatus ──────────────────────────────────────────────────
function BadgeStatus({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pendente:  { bg: '#FEF9C3', color: '#854D0E', label: '⏳ Pendente' },
    aprovado:  { bg: '#DCFCE7', color: '#15803D', label: '✅ Aprovado' },
    rejeitado: { bg: '#FEE2E2', color: '#DC2626', label: '❌ Rejeitado' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#6B7280', label: status }
  return <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', padding: '3px 10px', borderRadius: 999 }}>{s.label}</span>
}

// ── Toggle ───────────────────────────────────────────────────────
function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F3F4F6' }}>
      <div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#111827' }}>{label}</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 48, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: value ? '#16A34A' : '#E5E7EB', transition: 'background 0.2s', position: 'relative', flexShrink: 0,
      }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: value ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
      </button>
    </div>
  )
}

// ── CardStatusBot ─────────────────────────────────────────────────
interface BotStatus {
  whatsapp_ok: boolean; whatsapp_status: string
  ia_ok: boolean; ia_configurada: boolean
  sessoes_ativas: number
  ultimo_sucesso: string | null
  ultimo_erro: { ts: string; tipo: string; status: number | null; message: string } | null
  erros_ultima_hora: number
}

function CardStatusBot() {
  const [status, setStatus] = useState<BotStatus | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [ultimaVerif, setUltimaVerif] = useState<Date | null>(null)

  const verificar = useCallback(async () => {
    setCarregando(true)
    try {
      const data = await fetch(`${API_URL}/webhook/status`).then(r => r.json())
      setStatus(data)
      setUltimaVerif(new Date())
    } catch {
      setStatus(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    verificar()
    const iv = setInterval(verificar, 2 * 60 * 1000)
    return () => clearInterval(iv)
  }, [verificar])

  const temErroRecente = !!status?.ultimo_erro &&
    (Date.now() - new Date(status.ultimo_erro.ts).getTime()) < 60 * 60_000
  const botOk = !carregando && !!status?.ia_ok && !!status?.whatsapp_ok
  const botErro = !carregando && (!!status && (!status.ia_ok || !status.whatsapp_ok))

  const corBorda = botErro ? '#FECACA' : botOk ? '#BBF7D0' : '#E5E7EB'
  const corIcone = botErro ? '#DC2626' : botOk ? '#16A34A' : '#9CA3AF'
  const bgIcone  = botErro ? '#FEE2E2' : botOk ? '#DCFCE7' : '#F3F4F6'

  return (
    <div style={{ background: 'white', border: `1.5px solid ${corBorda}`, borderRadius: 16, padding: '18px 20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(31,41,55,0.04)', transition: 'border-color 0.3s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: bgIcone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={18} color={corIcone} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>Status do Bot</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
            {ultimaVerif ? `Verificado às ${ultimaVerif.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · auto-refresh 2 min` : 'Verificando…'}
          </div>
        </div>
        <button
          onClick={verificar} disabled={carregando}
          style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 14px', cursor: carregando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 12, fontFamily: 'Inter, sans-serif', opacity: carregando ? 0.6 : 1 }}
        >
          <RefreshCw size={12} />
          Verificar agora
        </button>
      </div>

      {/* Indicadores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'WhatsApp', ok: status?.whatsapp_ok, valor: carregando ? '…' : status?.whatsapp_ok ? 'Conectado' : status?.whatsapp_status || 'Desconectado' },
          { label: 'IA Claude', ok: status?.ia_ok,       valor: carregando ? '…' : status?.ia_ok ? 'Operacional' : !status?.ia_configurada ? 'Sem chave API' : 'Com falha' },
          { label: 'Sessões',   ok: true,                valor: carregando ? '…' : `${status?.sessoes_ativas ?? 0} ativas`, cor: '#3B82F6' },
        ].map(({ label, ok, valor, cor }) => (
          <div key={label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cor || (ok ? '#16A34A' : '#DC2626'), flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'Poppins, sans-serif' }}>{valor}</div>
          </div>
        ))}
      </div>

      {/* Último erro */}
      {status?.ultimo_erro && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <AlertTriangle size={12} color="#DC2626" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', fontFamily: 'Poppins, sans-serif' }}>
              Último erro — {new Date(status.ultimo_erro.ts).toLocaleString('pt-BR', { timeZone: 'America/Belem', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              {status.erros_ultima_hora > 0 && ` · ${status.erros_ultima_hora}× na última hora`}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#B91C1C', fontFamily: 'Inter, sans-serif', wordBreak: 'break-all' }}>
            [{status.ultimo_erro.tipo}{status.ultimo_erro.status ? ` ${status.ultimo_erro.status}` : ''}] {status.ultimo_erro.message}
          </div>
        </div>
      )}

      {/* Último sucesso */}
      {status?.ultimo_sucesso && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <CheckCircle2 size={12} color="#16A34A" />
          <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
            Última resposta com sucesso: {new Date(status.ultimo_sucesso).toLocaleString('pt-BR', { timeZone: 'America/Belem', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Tipos dos dados reais ─────────────────────────────────────────
interface TopComercio {
  id: string; nome: string; total_interacoes: number; plano: string
  categorias: { nome: string; icone: string } | null
}
interface AtividadeItem {
  id: string; nome_completo: string; criado_em: string
  status_verificacao: string; comercios: { nome: string } | null
}

function tempoRelativo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)} dias`
}

// ── Seção Dashboard ──────────────────────────────────────────────
function SecaoDashboard({ stats, onNavigate }: { stats: Stats | null; onNavigate: (s: Secao) => void }) {
  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const [topComercios, setTopComercios]     = useState<TopComercio[]>([])
  const [atividade, setAtividade]           = useState<AtividadeItem[]>([])

  useEffect(() => {
    adminFetch<TopComercio[]>('/admin/stats/top-comercios').then(setTopComercios).catch(() => {})
    adminFetch<AtividadeItem[]>('/admin/stats/atividade').then(setAtividade).catch(() => {})
  }, [])

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Store size={22} color="#16A34A" />}    label="Comércios ativos"     valor={stats?.total_comercios ?? '—'}    sub=""  cor="#16A34A" bg="#DCFCE7" />
        <StatCard icon={<Users size={22} color="#3B82F6" />}    label="Comerciantes"          valor={stats?.total_comerciantes ?? '—'} sub=""  cor="#1D4ED8" bg="#DBEAFE" />
        <StatCard icon={<Activity size={22} color="#EC4899" />} label="Leads hoje"            valor={stats?.leads_hoje ?? '—'}         sub=""  cor="#BE185D" bg="#FCE7F3" />
        <StatCard icon={<TrendingUp size={22} color="#8B5CF6" />} label="Leads (30 dias)"     valor={stats?.leads_mes ?? '—'}          sub=""  cor="#6D28D9" bg="#EDE9FE" />
        <StatCard icon={<DollarSign size={22} color="#F59E0B" />} label="Receita mensal"      valor="—"                                sub="em breve" cor="#B45309" bg="#FEF3C7" />
        <StatCard icon={<Clock size={22} color="#F59E0B" />}     label="Aguardando aprovação" valor={stats?.pendentes ?? '—'}          sub=""  cor="#B45309" bg="#FEF3C7" />
      </div>

      {/* Alerta pendentes */}
      {stats && stats.pendentes > 0 && (
        <div style={{ background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color="#B45309" style={{ flexShrink: 0 }} />
          <span style={{ color: '#92400E', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 14, flex: 1 }}>
            {stats.pendentes} comerciante{stats.pendentes > 1 ? 's' : ''} aguardando aprovação
          </span>
          <button onClick={() => onNavigate('pendentes')} style={{ background: '#B45309', color: 'white', border: 'none', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer' }}>
            Revisar
          </button>
        </div>
      )}

      {/* Status do Bot */}
      <CardStatusBot />

      {/* Atalhos rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MapPin size={18} color="#1D4ED8" style={{ flexShrink: 0 }} />
          <span style={{ color: '#1E40AF', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 13, flex: 1 }}>
            Preencher bairros em branco
          </span>
          <a href="/admin/bairros" style={{ background: '#1D4ED8', color: 'white', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Abrir
          </a>
        </div>
        <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Store size={18} color="#16A34A" style={{ flexShrink: 0 }} />
          <span style={{ color: '#166534', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 13, flex: 1 }}>
            Editar dados de comércio
          </span>
          <a href="/admin/comercios" style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Abrir
          </a>
        </div>

        {/* Atalho — Comerciantes */}
        <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#166534' }}>
            Gerenciar comerciantes
          </span>
          <a href="/admin/comerciantes" style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Abrir
          </a>
        </div>

        {/* Atalho — Gerenciar Categorias */}
        <div style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📂</div>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#5B21B6' }}>
            Gerenciar categorias
          </span>
          <a href="/admin/categorias-crud" style={{ background: '#7C3AED', color: 'white', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Abrir
          </a>
        </div>

        {/* Atalho — Revisar Categorias */}
        <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏷️</div>
          <span style={{ color: '#9A3412', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 13, flex: 1 }}>
            Revisar categorias dos comércios
          </span>
          <a href="/admin/categorias" style={{ background: '#EA580C', color: 'white', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Abrir
          </a>
        </div>
        <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={18} color="#3B82F6" style={{ flexShrink: 0 }} />
          <span style={{ color: '#1E40AF', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 13, flex: 1 }}>
            Usuários do bot
          </span>
          <a href="/admin/usuarios" style={{ background: '#3B82F6', color: 'white', border: 'none', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Abrir
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Buscas por dia */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>Leads por dia</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>Últimos 7 dias</div>
            </div>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#16A34A' }}>{stats?.leads_mes ?? '—'}</span>
          </div>
          <MiniLineChart data={[0, 0, 0, 0, 0, 0, stats?.leads_hoje ?? 0]} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {diasSemana.map(d => <span key={d} style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>{d}</span>)}
          </div>
        </div>

        {/* Categorias mais buscadas */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 22 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>Categorias mais buscadas</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>Hoje</div>
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px 0' }}>Em breve</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Top performers */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>Comércios em Destaque</div>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>por visualizações</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Nome', 'Categoria', 'Interações', 'Plano'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topComercios.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '24px 14px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>Nenhum dado ainda</td></tr>
              )}
              {topComercios.map((c, i) => {
                const max = topComercios[0]?.total_interacoes || 1
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#111827', fontSize: 13 }}>{c.nome}</div>
                      <div style={{ width: `${(c.total_interacoes / max) * 100}%`, height: 3, background: '#DCFCE7', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: '100%', height: '100%', background: '#16A34A', borderRadius: 2 }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>{c.categorias?.icone} {c.categorias?.nome || '—'}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#111827' }}>{(c.total_interacoes || 0).toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: c.plano === 'pro' ? '#DCFCE7' : c.plano === 'basic' ? '#DBEAFE' : '#F3F4F6', color: c.plano === 'pro' ? '#16A34A' : c.plano === 'basic' ? '#1D4ED8' : '#6B7280', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'capitalize' }}>{c.plano || 'público'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Atividade recente */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>Últimos Cadastros</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {atividade.length === 0 && (
              <div style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '16px 0' }}>Nenhum cadastro ainda</div>
            )}
            {atividade.map((a, i) => {
              const cor = a.status_verificacao === 'aprovado' ? '#16A34A' : a.status_verificacao === 'rejeitado' ? '#DC2626' : '#F59E0B'
              const icone = a.status_verificacao === 'aprovado' ? '✅' : a.status_verificacao === 'rejeitado' ? '❌' : '⏳'
              return (
                <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
                  {i < atividade.length - 1 && (
                    <div style={{ position: 'absolute', left: 15, top: 28, bottom: 0, width: 1, background: '#F3F4F6' }} />
                  )}
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, zIndex: 1 }}>
                    {icone}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#111827', marginBottom: 2 }}>{a.nome_completo}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>
                      {a.comercios?.nome ? `🏪 ${a.comercios.nome} · ` : ''}{tempoRelativo(a.criado_em)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Seção Monetização ────────────────────────────────────────────
function SecaoMonetizacao() {
  const planos = [
    { nome: 'Público',  preco: 'Grátis', ativos: 1089, cor: '#6B7280', bg: '#F9FAFB' },
    { nome: 'Basic',    preco: 'R$79/mês', ativos: 34, cor: '#3B82F6', bg: '#DBEAFE' },
    { nome: 'Pro',      preco: 'R$179/mês', ativos: 18, cor: '#16A34A', bg: '#DCFCE7' },
    { nome: 'Agência',  preco: 'R$490/mês', ativos: 2, cor: '#8B5CF6', bg: '#EDE9FE' },
  ]
  const total = 34 * 79 + 18 * 179 + 2 * 490
  const funil = [
    { label: 'Comércios cadastrados', valor: 1191, pct: 100, cor: '#E5E7EB' },
    { label: 'Com conta criada', valor: 143, pct: 12, cor: '#DBEAFE' },
    { label: 'Plano pago ativo', valor: 54, pct: 4.5, cor: '#DCFCE7' },
    { label: 'Plano Pro ou Agência', valor: 20, pct: 1.7, cor: '#16A34A' },
  ]
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: 4 }}>Monetização</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Visão geral de planos, receita e funil de conversão</p>
      </div>

      {/* Receita total */}
      <div style={{ background: '#16A34A', borderRadius: 20, padding: '28px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(22,163,74,0.2)' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>Receita mensal recorrente (MRR)</div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: '2.5rem', color: 'white' }}>R${total.toLocaleString('pt-BR')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 16px', display: 'inline-block' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>Comerciantes pagantes</div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'white' }}>54</div>
          </div>
        </div>
      </div>

      {/* Cards de plano */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {planos.map(p => (
          <div key={p.nome} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <DollarSign size={18} color={p.cor} />
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: p.cor }}>{p.ativos}</div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>{p.nome}</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{p.preco}</div>
          </div>
        ))}
      </div>

      {/* Funil */}
      <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 24 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 20 }}>Funil de Conversão</div>
        {funil.map((f, i) => (
          <div key={i} style={{ marginBottom: i < funil.length - 1 ? 16 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4B5563' }}>{f.label}</span>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#111827' }}>{f.valor.toLocaleString('pt-BR')} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 11 }}>({f.pct}%)</span></span>
            </div>
            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 999 }}>
              <div style={{ height: '100%', width: `${f.pct}%`, background: f.cor === '#E5E7EB' ? '#D1D5DB' : f.cor, borderRadius: 999, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Seção IA — RAG ───────────────────────────────────────────────
function SecaoIA() {
  const [sinonimos, setSinonimos] = useState([
    { id: 1, chave: 'farmácia', valores: 'drogaria, remédio, medicamento, farmac' },
    { id: 2, chave: 'restaurante', valores: 'lanche, comida, marmita, almoço, almoçar, comer, refeição, jantar' },
    { id: 3, chave: 'açaí', valores: 'acai, geladão, ponto de açaí, açaizeiro' },
    { id: 4, chave: 'mecânica', valores: 'oficina, borracharia, carro, automóvel' },
    { id: 5, chave: 'salão', valores: 'cabeleireiro, cabelo, beleza, escova, studio' },
  ])
  const [editando, setEditando] = useState<number | null>(null)
  const [novoValor, setNovoValor] = useState('')
  const [toggles, setToggles] = useState({
    proximidade: true,
    avaliacoes: true,
    plano_pago: true,
    aberto_agora: false,
  })
  const [novoSin, setNovoSin] = useState({ chave: '', valores: '' })
  const [adicionando, setAdicionando] = useState(false)

  const salvarEdicao = (id: number) => {
    setSinonimos(s => s.map(x => x.id === id ? { ...x, valores: novoValor } : x))
    setEditando(null)
  }
  const excluir = (id: number) => setSinonimos(s => s.filter(x => x.id !== id))
  const adicionar = () => {
    if (!novoSin.chave.trim()) return
    setSinonimos(s => [...s, { id: Date.now(), ...novoSin }])
    setNovoSin({ chave: '', valores: '' }); setAdicionando(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: 4 }}>Inteligência da IA — RAG</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Configure como o bot interpreta as buscas dos usuários</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Mapeamento de sinônimos */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>Mapeamento de Sinônimos</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Palavras que mapeiam para a mesma categoria</div>
            </div>
            <button onClick={() => setAdicionando(true)} style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {adicionando && (
              <div style={{ padding: '12px 22px', background: '#F0FDF4', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input value={novoSin.chave} onChange={e => setNovoSin(n => ({ ...n, chave: e.target.value }))} placeholder="Categoria (ex: pizzaria)" style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #D1FAE5', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                  <input value={novoSin.valores} onChange={e => setNovoSin(n => ({ ...n, valores: e.target.value }))} placeholder="Sinônimos separados por vírgula" style={{ flex: 2, padding: '8px 12px', border: '1.5px solid #D1FAE5', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setAdicionando(false)} style={{ padding: '6px 14px', borderRadius: 999, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={adicionar} style={{ padding: '6px 14px', borderRadius: 999, border: 'none', background: '#16A34A', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
                </div>
              </div>
            )}
            {sinonimos.map(s => (
              <div key={s.id} style={{ padding: '14px 22px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 6 }}>
                    {s.chave} <span style={{ color: '#9CA3AF', fontWeight: 400 }}>=</span>
                  </div>
                  {editando === s.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={novoValor} onChange={e => setNovoValor(e.target.value)} style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #16A34A', borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'Inter, sans-serif' }} autoFocus />
                      <button onClick={() => salvarEdicao(s.id)} style={{ padding: '5px 12px', borderRadius: 999, border: 'none', background: '#16A34A', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}><Check size={12} /></button>
                      <button onClick={() => setEditando(null)} style={{ padding: '5px 12px', borderRadius: 999, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontSize: 11, cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {s.valores.split(',').map((v, i) => (
                        <span key={i} style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, border: '1px solid #DCFCE7', fontFamily: 'Inter, sans-serif' }}>{v.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
                {editando !== s.id && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
                    <button onClick={() => { setEditando(s.id); setNovoValor(s.valores) }} style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#9CA3AF' }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => excluir(s.id)} style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.color = '#DC2626' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#9CA3AF' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Parâmetros de busca */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>Parâmetros de Busca</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Critérios de ordenação e filtro aplicados automaticamente</div>

          <Toggle
            label="Priorizar plano pago"
            desc="Comerciantes com plano Basic/Pro aparecem primeiro"
            value={toggles.plano_pago}
            onChange={v => setToggles(t => ({ ...t, plano_pago: v }))}
          />
          <Toggle
            label="Priorizar abertos agora"
            desc="Comércios abertos sobem no ranking dos resultados"
            value={toggles.aberto_agora}
            onChange={v => setToggles(t => ({ ...t, aberto_agora: v }))}
          />
          <Toggle
            label="Priorizar avaliações"
            desc="Score = nota × log10(nº avaliações) pondera qualidade"
            value={toggles.avaliacoes}
            onChange={v => setToggles(t => ({ ...t, avaliacoes: v }))}
          />
          <Toggle
            label="Priorizar proximidade"
            desc="Bairro mencionado pelo usuário sobe resultados locais"
            value={toggles.proximidade}
            onChange={v => setToggles(t => ({ ...t, proximidade: v }))}
          />

          <div style={{ marginTop: 24, background: '#F9FAFB', borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 10 }}>Ordem atual de prioridade</div>
            {[
              { n: 1, texto: 'Plano pago + ativo', ativo: toggles.plano_pago },
              { n: 2, texto: 'Aberto agora', ativo: toggles.aberto_agora },
              { n: 3, texto: 'Tem WhatsApp', ativo: true },
              { n: 4, texto: 'Verificado', ativo: true },
              { n: 5, texto: 'Nota × volume de avaliações', ativo: toggles.avaliacoes },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: item.ativo ? '#DCFCE7' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: item.ativo ? '#16A34A' : '#9CA3AF' }}>{item.n}</span>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: item.ativo ? '#4B5563' : '#D1D5DB', textDecoration: item.ativo ? 'none' : 'line-through' }}>{item.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Seção Notificações ───────────────────────────────────────────
function SecaoNotificacoes({ pendentes }: { pendentes: number }) {
  const alertas = [
    { tipo: 'warning', icone: '⏳', titulo: `${pendentes} comerciante${pendentes !== 1 ? 's' : ''} aguardando aprovação`, tempo: 'agora', acao: 'Revisar' },
    { tipo: 'info',    icone: '💳', titulo: 'Novo pagamento recebido — Plano Pro (Açaí da Praça)', tempo: '28 min atrás', acao: 'Ver' },
    { tipo: 'success', icone: '✅', titulo: 'Broadcast enviado com sucesso para 234 usuários', tempo: '1h atrás', acao: null },
    { tipo: 'error',   icone: '❌', titulo: 'Falha no envio Z-API — verificar credenciais', tempo: '2h atrás', acao: 'Verificar' },
    { tipo: 'info',    icone: '📍', titulo: '3 novos comércios importados via Google Places', tempo: '3h atrás', acao: 'Ver' },
    { tipo: 'success', icone: '🌟', titulo: 'Meta de 50 comerciantes pagantes atingida!', tempo: 'ontem', acao: null },
  ]
  const cores: Record<string, { bg: string; border: string; dot: string }> = {
    warning: { bg: '#FEF3C7', border: '#FDE68A',  dot: '#F59E0B' },
    info:    { bg: '#DBEAFE', border: '#BFDBFE',  dot: '#3B82F6' },
    success: { bg: '#DCFCE7', border: '#BBF7D0',  dot: '#16A34A' },
    error:   { bg: '#FEE2E2', border: '#FECACA',  dot: '#DC2626' },
  }
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: 4 }}>Notificações</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Alertas e eventos do sistema</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alertas.map((a, i) => {
          const c = cores[a.tipo]
          return (
            <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icone}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#111827' }}>{a.titulo}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.tempo}</div>
              </div>
              {a.acao && (
                <button style={{ background: 'white', border: `1.5px solid ${c.border}`, borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', color: '#4B5563', flexShrink: 0 }}>
                  {a.acao}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Seção Configurações ──────────────────────────────────────────
function SecaoConfiguracoes() {
  const [preview, setPreview] = useState<{ total_com_whatsapp: number; ja_contatados: number; pendentes: number; ultimo_envio: string | null } | null>(null)
  const [limite, setLimite]   = useState(20)
  const [delayMs, setDelayMs] = useState(8000)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ enviados: number; falhas: number; total_candidatos: number; mensagem?: string } | null>(null)
  const [erro, setErro]         = useState<string | null>(null)
  const [msgPreview, setMsgPreview] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(true)

  const carregarPreview = async () => {
    setLoadingPreview(true)
    try { setPreview(await adminFetch<any>('/admin/prospeccao/preview')) }
    catch { } finally { setLoadingPreview(false) }
  }

  useEffect(() => { carregarPreview() }, [])

  const iniciarEnvio = async () => {
    if (!window.confirm(`Confirmar envio para até ${limite} estabelecimentos com intervalo de ${delayMs / 1000}s entre cada mensagem?`)) return
    setEnviando(true); setResultado(null); setErro(null)
    try {
      const r = await adminFetch<any>('/admin/prospeccao/iniciar', {
        method: 'POST',
        body: JSON.stringify({ limite, delay_ms: delayMs }),
      })
      setResultado(r)
      carregarPreview()
    } catch (e: any) { setErro(e.message) } finally { setEnviando(false) }
  }

  const mensagemExemplo = `Olá! 👋

Somos o *ZappiCidade*, o assistente digital de Barcarena pelo WhatsApp com IA.

Boa notícia: *[Nome do Estabelecimento]* já está cadastrado e aparecendo nas buscas dos moradores! 🎉

📍 Veja seu perfil:
https://zappicidade-site.vercel.app/c/[slug]

━━━━━━━━━━━━━━━━━
🤖 *Como funciona?*

Moradores mandam mensagem pro nosso bot e perguntam:
• _"Onde tem [categoria] em Barcarena?"_

A IA responde na hora com os melhores — incluindo o seu! 🏪

👉 Teste agora: https://wa.me/559193870599?text=Oi
━━━━━━━━━━━━━━━━━

Com uma conta gratuita:
✅ Edite horários de funcionamento
✅ Adicione foto e descrição
✅ Receba mais clientes

👉 Ativar conta (grátis):
https://zappicidade-painel.vercel.app/comerciante/login

— Equipe ZappiCidade`

  const card = (valor: number | string, label: string, cor: string) => (
    <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '20px 24px', flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: cor }}>{valor}</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: 4 }}>Prospecção Diária</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7280' }}>
          Envie mensagens via WhatsApp apresentando o ZappiCidade para os estabelecimentos cadastrados.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {loadingPreview ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando estatísticas...
          </div>
        ) : preview ? (
          <>
            {card(preview.total_com_whatsapp, 'Com WhatsApp', '#111827')}
            {card(preview.ja_contatados, 'Já contatados', '#16A34A')}
            {card(preview.pendentes, 'Pendentes', '#F59E0B')}
            {card(preview.ultimo_envio ? new Date(preview.ultimo_envio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—', 'Último envio', '#6B7280')}
          </>
        ) : null}
      </div>

      {/* Painel de controle */}
      <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: 28 }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 20, marginTop: 0 }}>
          Configurar Envio
        </h3>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              Limite por execução (1–50)
            </label>
            <input
              type="number" min={1} max={50} value={limite}
              onChange={e => setLimite(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#111827', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = '#16A34A')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              Intervalo entre mensagens (seg)
            </label>
            <select
              value={delayMs}
              onChange={e => setDelayMs(parseInt(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#111827', outline: 'none', background: 'white' }}
            >
              <option value={5000}>5 segundos (rápido)</option>
              <option value={8000}>8 segundos (padrão)</option>
              <option value={15000}>15 segundos (seguro)</option>
              <option value={30000}>30 segundos (muito seguro)</option>
              <option value={45000}>45 segundos (máximo seguro)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={iniciarEnvio}
            disabled={enviando || (preview?.pendentes ?? 0) === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: enviando || (preview?.pendentes ?? 0) === 0 ? '#D1FAE5' : '#16A34A',
              color: enviando || (preview?.pendentes ?? 0) === 0 ? '#6B7280' : 'white',
              border: 'none', borderRadius: 999, padding: '11px 24px',
              fontSize: 14, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
              cursor: enviando || (preview?.pendentes ?? 0) === 0 ? 'not-allowed' : 'pointer',
              boxShadow: enviando ? 'none' : '0 4px 14px rgba(22,163,74,0.3)',
              transition: 'all 0.15s',
            }}
          >
            {enviando ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
            {enviando ? `Enviando (aguarde ~${Math.round(limite * delayMs / 60000)} min)...` : `Iniciar envio — ${limite} mensagens`}
          </button>

          <button
            onClick={() => setMsgPreview(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1.5px solid #E5E7EB', borderRadius: 999, padding: '10px 18px', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', color: '#6B7280' }}
          >
            {msgPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {msgPreview ? 'Ocultar' : 'Ver'} mensagem
          </button>
        </div>

        {enviando && (
          <div style={{ marginTop: 16, background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#16A34A' }}>
            ⏳ Enviando com intervalo de {delayMs / 1000}s entre cada mensagem. Não feche esta janela.
          </div>
        )}
      </div>

      {/* Preview da mensagem */}
      {msgPreview && (
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: 28 }}>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 16, marginTop: 0 }}>
            Prévia da Mensagem
          </h3>
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {mensagemExemplo}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>
            * [Nome do Estabelecimento], [categoria] e [slug] são personalizados automaticamente para cada estabelecimento.
          </p>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div style={{ background: resultado.falhas === 0 ? '#F0FDF4' : '#FEF3C7', border: `1.5px solid ${resultado.falhas === 0 ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 8 }}>
            {resultado.mensagem || 'Envio concluído!'}
          </div>
          {resultado.total_candidatos > 0 && (
            <div style={{ display: 'flex', gap: 24, fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
              <span style={{ color: '#16A34A', fontWeight: 700 }}>✅ {resultado.enviados} enviados</span>
              {resultado.falhas > 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}>❌ {resultado.falhas} falhas</span>}
            </div>
          )}
        </div>
      )}

      {erro && (
        <div style={{ background: '#FEE2E2', border: '1.5px solid #FECACA', borderRadius: 16, padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#DC2626' }}>
          ❌ Erro: {erro}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Seção placeholder ────────────────────────────────────────────
function SecaoPlaceholder({ titulo, icone, desc }: { titulo: string; icone: string; desc: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: 20, border: '1.5px solid #E5E7EB' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icone}</div>
      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#111827', marginBottom: 8 }}>{titulo}</h3>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>{desc}</p>
      <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', borderRadius: 999, padding: '6px 16px' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Em desenvolvimento</span>
      </div>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [secao, setSecao]             = useState<Secao>('dashboard')
  const [collapsed, setCollapsed]     = useState(false)
  const [stats, setStats]             = useState<Stats | null>(null)
  const [comerciantes, setComerciantes] = useState<Comerciante[]>([])
  const [comercios, setComercios]     = useState<Comercio[]>([])
  const [busca, setBusca]             = useState('')
  const [carregando, setCarregando]   = useState(false)
  const [acao, setAcao]               = useState<string | null>(null)
  const [motivo, setMotivo]           = useState('')
  const [confirmar, setConfirmar]     = useState<{ id: string; tipo: 'aprovar' | 'rejeitar'; nome: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) router.push('/admin/login')
  }, [router])

  const carregarStats = useCallback(async () => {
    try { setStats(await adminFetch<Stats>('/admin/stats')) } catch { }
  }, [])

  const carregarComerciantes = useCallback(async (filtro = '') => {
    setCarregando(true)
    try {
      const r = await adminFetch<{ data: Comerciante[] }>(`/admin/comerciantes?status=todos&busca=${filtro}`)
      setComerciantes(r.data)
    } catch { } finally { setCarregando(false) }
  }, [])

  const carregarComercios = useCallback(async (filtro = '') => {
    setCarregando(true)
    try {
      const r = await adminFetch<{ data: Comercio[] }>(`/admin/comercios?busca=${filtro}`)
      setComercios(r.data)
    } catch { } finally { setCarregando(false) }
  }, [])

  useEffect(() => { carregarStats(); carregarComerciantes() }, [carregarStats, carregarComerciantes])

  useEffect(() => {
    if (secao === 'comercios') carregarComercios(busca)
    else if (secao === 'comerciantes' || secao === 'pendentes') carregarComerciantes(busca)
    setBusca('')
  }, [secao]) // eslint-disable-line

  const executarAcao = async () => {
    if (!confirmar) return
    setAcao(confirmar.id)
    try {
      await adminFetch(`/admin/comerciantes/${confirmar.id}/${confirmar.tipo}`, { method: 'POST', body: JSON.stringify({ motivo }) })
      setConfirmar(null); setMotivo('')
      await Promise.all([carregarStats(), carregarComerciantes(busca)])
    } catch (e: any) { alert(e.message) } finally { setAcao(null) }
  }

  const sair = () => {
    localStorage.removeItem('admin_token'); localStorage.removeItem('admin_email')
    router.push('/admin/login')
  }

  const pendentes = comerciantes.filter(c => c.status_verificacao === 'pendente')
  const listaAtual = secao === 'pendentes' ? pendentes : comerciantes

  const titulos: Record<Secao, string> = {
    dashboard: 'Dashboard', pendentes: 'Aprovações Pendentes', comerciantes: 'Comerciantes',
    comercios: 'Comércios', monetizacao: 'Monetização', anuncios: 'Anúncios',
    ia: 'IA — RAG Inteligente', relatorios: 'Relatórios', notificacoes: 'Notificações',
    configuracoes: 'Configurações', usuarios: 'Usuários do Bot',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <Sidebar secao={secao} setSecao={(s) => {
        const redirecionamentos: Partial<Record<Secao, string>> = {
          comercios:    '/admin/comercios',
          comerciantes: '/admin/comerciantes',
          usuarios:     '/admin/usuarios',
        }
        if (redirecionamentos[s]) { router.push(redirecionamentos[s]!); return }
        setSecao(s)
      }} pendentes={stats?.pendentes ?? 0} collapsed={collapsed} setCollapsed={setCollapsed} onSair={sair} />

      {/* Conteúdo principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top navbar */}
        <header style={{ background: 'white', borderBottom: '1.5px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, color: '#111827', margin: 0 }}>{titulos[secao]}</h1>
            <div style={{ flex: 1 }} />

            {/* Busca global */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text" placeholder="Buscar dados, comerciantes..."
                style={{ width: '100%', padding: '9px 14px 9px 34px', boxSizing: 'border-box', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, color: '#111827', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => (e.target.style.borderColor = '#16A34A')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* Bell */}
            <button style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', position: 'relative' }}
              onClick={() => setSecao('notificacoes')}>
              <Bell size={17} />
              {(stats?.pendentes ?? 0) > 0 && <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#F59E0B', borderRadius: '50%', border: '2px solid white' }} />}
            </button>

            {/* Refresh */}
            <button onClick={() => { carregarStats(); secao === 'comercios' ? carregarComercios(busca) : carregarComerciantes(busca) }} style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280' }}>
              <RefreshCw size={16} />
            </button>

            {/* + Criar anúncio */}
            <button onClick={() => setSecao('anuncios')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: 'white', border: 'none', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <Plus size={15} /> Criar anúncio
            </button>

            {/* Avatar */}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ShieldCheck size={16} color="#16A34A" />
            </div>
          </div>
        </header>

        {/* Conteúdo da seção */}
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

          {secao === 'dashboard' && <SecaoDashboard stats={stats} onNavigate={setSecao} />}

          {secao === 'monetizacao' && <SecaoMonetizacao />}

          {secao === 'ia' && <SecaoIA />}

          {secao === 'notificacoes' && <SecaoNotificacoes pendentes={stats?.pendentes ?? 0} />}

          {(secao === 'pendentes' || secao === 'comerciantes') && (
            <div>
              {/* Banner pendentes */}
              {secao === 'comerciantes' && stats && stats.pendentes > 0 && (
                <div style={{ background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle size={18} color="#B45309" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#92400E', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 14, flex: 1 }}>{stats.pendentes} aguardando aprovação</span>
                  <button onClick={() => setSecao('pendentes')} style={{ background: '#B45309', color: 'white', border: 'none', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer' }}>Ver agora</button>
                </div>
              )}

              {/* Busca */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" value={busca} onChange={e => { setBusca(e.target.value); carregarComerciantes(e.target.value) }}
                  placeholder="Buscar por nome ou email..."
                  style={{ width: '100%', padding: '11px 14px 11px 38px', boxSizing: 'border-box', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  onFocus={e => (e.target.style.borderColor = '#16A34A')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>

              {carregando ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ color: '#9CA3AF', fontSize: 14 }}>Carregando...</p>
                </div>
              ) : listaAtual.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '1.5px solid #E5E7EB' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{secao === 'pendentes' ? '🎉' : '👥'}</div>
                  <p style={{ color: '#4B5563', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>{secao === 'pendentes' ? 'Nenhum pendente!' : 'Nenhum comerciante encontrado'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {listaAtual.map(c => (
                    <div key={c.id} style={{ background: 'white', border: `1.5px solid ${c.status_verificacao === 'pendente' ? '#FDE68A' : '#E5E7EB'}`, borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(31,41,55,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#16A34A' }}>{(c.nome_completo || c.email).charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>{c.nome_completo || '—'}</div>
                              <div style={{ color: '#6B7280', fontSize: 12 }}>{c.email}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 10 }}>
                            {c.whatsapp && <span style={{ color: '#4B5563', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={12} color="#25D366" /> {c.whatsapp}</span>}
                            {c.comercios && <span style={{ color: '#4B5563', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Store size={12} color="#16A34A" /> {c.comercios.nome}</span>}
                            <span style={{ color: '#9CA3AF', fontSize: 11 }}>Cadastro: {formatarData(c.criado_em)}</span>
                          </div>
                          <BadgeStatus status={c.status_verificacao} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                          {c.status_verificacao === 'pendente' && (
                            <>
                              <button onClick={() => setConfirmar({ id: c.id, tipo: 'rejeitar', nome: c.nome_completo || c.email })} disabled={acao === c.id}
                                style={{ padding: '8px 16px', borderRadius: 999, border: '1.5px solid #FECACA', background: 'white', color: '#DC2626', fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <X size={14} /> Rejeitar
                              </button>
                              <button onClick={() => setConfirmar({ id: c.id, tipo: 'aprovar', nome: c.nome_completo || c.email })} disabled={acao === c.id}
                                style={{ padding: '8px 16px', borderRadius: 999, border: 'none', background: '#16A34A', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 3px 10px rgba(22,163,74,0.3)' }}>
                                <Check size={14} /> Aprovar
                              </button>
                            </>
                          )}
                          {c.comercios?.slug && (
                            <a href={`${SITE_URL}/c/${c.comercios.slug}`} target="_blank" rel="noreferrer"
                              style={{ padding: '8px 14px', borderRadius: 999, border: '1.5px solid #E5E7EB', color: '#4B5563', fontSize: 12, fontFamily: 'Poppins, sans-serif', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Ver perfil <ChevronRight size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {secao === 'comercios' && (
            <div>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" value={busca} onChange={e => { setBusca(e.target.value); carregarComercios(e.target.value) }}
                  placeholder="Buscar comércio..."
                  style={{ width: '100%', padding: '11px 14px 11px 38px', boxSizing: 'border-box', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  onFocus={e => (e.target.style.borderColor = '#16A34A')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
              {carregando ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                </div>
              ) : comercios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 16, border: '1.5px solid #E5E7EB' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
                  <p style={{ color: '#4B5563', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>Nenhum comércio encontrado</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {comercios.map(c => (
                    <div key={c.id} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{c.categorias?.icone || '🏪'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>{c.nome}</span>
                          {c.verificado && <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>✓ Verificado</span>}
                          {c.destaque && <span style={{ background: '#FEF9C3', color: '#854D0E', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>⭐ Destaque</span>}
                        </div>
                        <div style={{ color: '#6B7280', fontSize: 12, display: 'flex', gap: 10 }}>
                          <span>{c.categorias?.nome || '—'}</span>
                          {c.bairro && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {c.bairro}</span>}
                        </div>
                      </div>
                      <a href={`${SITE_URL}/c/${c.slug}`} target="_blank" rel="noreferrer"
                        style={{ padding: '7px 14px', borderRadius: 999, border: '1.5px solid #E5E7EB', color: '#4B5563', fontSize: 12, fontFamily: 'Poppins, sans-serif', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Ver <ChevronRight size={13} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {secao === 'anuncios' && <SecaoPlaceholder titulo="Gerenciamento de Anúncios" icone="📢" desc="Crie e gerencie anúncios patrocinados para comerciantes." />}
          {secao === 'relatorios' && <SecaoPlaceholder titulo="Relatórios & Analytics" icone="📊" desc="Visualize métricas detalhadas de uso, conversão e receita." />}
          {secao === 'configuracoes' && <SecaoConfiguracoes />}
        </main>
      </div>

      {/* FAB */}
      <button onClick={() => setSecao('anuncios')} style={{
        position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: '50%',
        background: '#16A34A', color: 'white', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 24px rgba(22,163,74,0.45)', zIndex: 50, transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,163,74,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(22,163,74,0.45)' }}
      >
        <Plus size={22} />
      </button>

      {/* Modal confirmação */}
      {confirmar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmar(null) }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{confirmar.tipo === 'aprovar' ? '✅' : '❌'}</div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginBottom: 6 }}>{confirmar.tipo === 'aprovar' ? 'Aprovar comerciante?' : 'Rejeitar comerciante?'}</h3>
              <p style={{ color: '#4B5563', fontSize: 14 }}><strong>{confirmar.nome}</strong> será {confirmar.tipo === 'aprovar' ? 'aprovado e notificado' : 'rejeitado'}</p>
            </div>
            {confirmar.tipo === 'rejeitar' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#111827', fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Motivo (opcional)</label>
                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Ex: Dados incompletos..."
                  style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#16A34A')}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmar(null)} style={{ flex: 1, padding: '12px', borderRadius: 999, border: '1.5px solid #E5E7EB', background: 'white', color: '#4B5563', fontSize: 14, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={executarAcao} disabled={!!acao} style={{ flex: 1, padding: '12px', borderRadius: 999, border: 'none', background: confirmar.tipo === 'aprovar' ? '#16A34A' : '#DC2626', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'Poppins, sans-serif', cursor: 'pointer', boxShadow: confirmar.tipo === 'aprovar' ? '0 4px 14px rgba(22,163,74,0.35)' : '0 4px 14px rgba(220,38,38,0.35)' }}>
                {acao ? '...' : confirmar.tipo === 'aprovar' ? 'Confirmar aprovação' : 'Confirmar rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
