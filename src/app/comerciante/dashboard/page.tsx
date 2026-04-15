'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Store, Tag, Users, BarChart2, LogOut,
  Eye, TrendingUp, TrendingDown, ExternalLink, Plus, ChevronRight,
  Loader2, Camera, Save, Globe, Mail, Phone, AtSign, Copy, Check,
  ChevronDown, MapPin, Clock, Zap, DollarSign, MessageCircle,
  Megaphone, Brain, CreditCard, Star, AlertCircle, ArrowRight,
  Sparkles, X, ChevronLeft, Image as ImageIcon, Percent,
  MousePointerClick, PauseCircle, Edit2, PlayCircle, Target,
  TrendingUp as Trend, BarChart3, Lightbulb, Crown,
} from 'lucide-react'
import { obterSessao, limparSessao, apiFetch, type Comerciante } from '@/lib/auth'
import { api } from '@/lib/api'
import ImageCropModal from '@/components/ImageCropModal'

// ── Tipos ────────────────────────────────────────────────────────
interface Metricas {
  visualizacoes_mes: number; visualizacoes_variacao: number
  leads_30dias: number; leads_variacao: number
  optins_ativos: number; promocoes_ativas: number
}
interface DashboardData {
  metricas: Metricas
  grafico_visualizacoes: { dia: string; total: number }[]
  ultimos_leads: { id: string; acao: string; criado_em: string }[]
  promocoes_ativas: { id: string; titulo: string; tipo: string; quantidade_usada: number; quantidade_limite: number }[]
  resumo: any
}

const DIAS = ['segunda','terca','quarta','quinta','sexta','sabado','domingo']
const DIAS_LABEL: Record<string,string> = {
  segunda:'Seg', terca:'Ter', quarta:'Qua', quinta:'Qui', sexta:'Sex', sabado:'Sáb', domingo:'Dom'
}
const ACOES: Record<string,string> = {
  whatsapp:'WhatsApp', ligacao:'Ligação', site:'Site',
  visualizacao:'Visualização', promocao:'Promoção',
}

// ── Gráfico SVG full ──────────────────────────────────────────────
function AreaChart({ data, cor = '#16A34A', height = 120 }: { data: number[]; cor?: string; height?: number }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', borderRadius:12 }}>
      <span style={{ fontSize:12, color:'#9CA3AF', fontFamily:'Inter, sans-serif' }}>Dados insuficientes</span>
    </div>
  )
  const max = Math.max(...data) || 1
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 600; const h = height; const px = 4; const py = 8
  const pts = data.map((v, i) => {
    const x = px + (i / (data.length - 1)) * (w - px * 2)
    const y = py + ((max - v) / range) * (h - py * 2)
    return { x, y }
  })
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${h} L ${pts[0].x} ${h} Z`
  const gradId = `grad_${cor.replace('#','')}`
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={cor} stroke="white" strokeWidth="2"
          style={{ opacity: i === pts.length - 1 ? 1 : 0 }} />
      ))}
    </svg>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ icon, label, valor, sub, cor, bg, trend, prefix = '' }: {
  icon: React.ReactNode; label: string; valor: string | number
  sub?: string; cor: string; bg: string; trend?: number; prefix?: string
}) {
  return (
    <div style={{
      background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '22px 20px',
      display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden',
      transition: 'all 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(31,41,55,0.10)'; e.currentTarget.style.borderColor = cor }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB' }}>
      {/* Dot decoration */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: bg, opacity: 0.5 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position:'relative', zIndex:1 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            color: trend >= 0 ? '#16A34A' : '#DC2626',
            background: trend >= 0 ? '#DCFCE7' : '#FEE2E2',
            padding: '4px 10px', borderRadius: 999,
          }}>
            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {prefix}{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Modal VENDER AGORA ───────────────────────────────────────────
function ModalVenderAgora({ onClose, onSalvar }: { onClose: () => void; onSalvar: (result: { sucesso: boolean; produto?: string; preco?: number; desconto?: number; duracao?: string }) => void }) {
  const [produto, setProduto] = useState('')
  const [preco,   setPreco]   = useState('')
  const [desconto, setDesconto] = useState('')
  const [duracao, setDuracao] = useState('2h')
  const [salvando, setSalvando] = useState(false)

  const precoNum = parseFloat(preco.replace(',', '.')) || 0
  const descNum  = parseFloat(desconto) || 0
  const precoPor = precoNum > 0 && descNum > 0 ? precoNum * (1 - descNum / 100) : null

  const handleSalvar = async () => {
    if (!produto.trim() || !preco.trim()) return
    setSalvando(true)
    const map: Record<string,number> = { '1h': 60, '2h': 120, '4h': 240, '8h': 480, '24h': 1440 }
    const fim = new Date(Date.now() + map[duracao] * 60000).toISOString()
    try {
      await apiFetch('/comerciante/promocoes', {
        method: 'POST',
        body: JSON.stringify({ titulo: produto, preco_de: precoNum, percentual_desconto: descNum || null, fim, tipo: 'venda_rapida' }),
      })
      onSalvar({ sucesso: true, produto, preco: precoNum, desconto: descNum, duracao })
    } catch {
      onSalvar({ sucesso: false })
    } finally { setSalvando(false) }
  }

  const duracoes = ['1h', '2h', '4h', '8h', '24h']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: 28, maxWidth: 480, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        {/* Header amarelo */}
        <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="#111827" />
                </div>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: 'white' }}>Venda Agora</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF', margin: 0 }}>Ative uma promoção relâmpago em segundos</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              <X size={16} color="#9CA3AF" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Produto / Serviço</label>
            <input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Açaí 500ml, Corte masculino..."
              style={{ width: '100%', padding: '13px 16px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 14, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Preço (R$)</label>
              <input value={preco} onChange={e => setPreco(e.target.value)} placeholder="0,00" type="number" min="0"
                style={{ width: '100%', padding: '13px 16px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 14, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Desconto (%)</label>
              <input value={desconto} onChange={e => setDesconto(e.target.value)} placeholder="0" type="number" min="0" max="100"
                style={{ width: '100%', padding: '13px 16px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 14, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#FACC15'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
          </div>

          {precoPor !== null && (
            <div style={{ background: 'linear-gradient(135deg, #DCFCE7, #F0FDF4)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #BBF7D0' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', textDecoration: 'line-through' }}>R${precoNum.toFixed(2)}</span>
              <ArrowRight size={14} color="#16A34A" />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#15803D' }}>R${precoPor.toFixed(2)}</span>
              <span style={{ background: '#16A34A', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, marginLeft: 'auto' }}>{descNum}% OFF</span>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Duração</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {duracoes.map(d => (
                <button key={d} onClick={() => setDuracao(d)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1.5px solid ${duracao === d ? '#FACC15' : '#E5E7EB'}`,
                  background: duracao === d ? '#FFFBEB' : 'white',
                  color: duracao === d ? '#92400E' : '#6B7280',
                  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13,
                }}>{d}</button>
              ))}
            </div>
          </div>

          <button onClick={handleSalvar} disabled={!produto.trim() || !preco.trim() || salvando} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none', cursor: !produto.trim() || !preco.trim() ? 'not-allowed' : 'pointer',
            background: !produto.trim() || !preco.trim() ? '#E5E7EB' : '#FACC15',
            color: !produto.trim() || !preco.trim() ? '#9CA3AF' : '#111827',
            fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, transition: 'all 0.2s',
            boxShadow: produto.trim() && preco.trim() ? '0 8px 24px rgba(250,204,21,0.45)' : 'none',
          }}>
            {salvando ? '⏳ Ativando promoção...' : '⚡ Ativar Promoção Agora'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Criar Anúncio (3 passos) ───────────────────────────────
function ModalCriarAnuncio({ onClose }: { onClose: () => void }) {
  const [passo, setPasso] = useState(1)
  const [tipo, setTipo] = useState('')
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [descricao, setDesc] = useState('')
  const [duracao, setDuracao] = useState('7 dias')
  const [salvando, setSalvando] = useState(false)

  const tipos = [
    { id: 'destaque', icon: <Star size={22} color="#F59E0B" />, label: 'Destaque Top', desc: 'Apareça no topo das buscas da cidade', bg: '#FEF3C7', cor: '#F59E0B' },
    { id: 'banner', icon: <ImageIcon size={22} color="#3B82F6" />, label: 'Banner Visual', desc: 'Banner destacado na página da categoria', bg: '#DBEAFE', cor: '#3B82F6' },
    { id: 'ia', icon: <Sparkles size={22} color="#8B5CF6" />, label: 'IA Recomenda', desc: 'A IA cria o anúncio ideal para você', bg: '#EDE9FE', cor: '#8B5CF6' },
  ]
  const duracoes = [
    { label: '3 dias', sub: 'Teste rápido' },
    { label: '7 dias', sub: 'Mais popular' },
    { label: '15 dias', sub: 'Boa exposição' },
    { label: '30 dias', sub: 'Máximo alcance' },
  ]

  const salvar = async () => {
    setSalvando(true)
    await new Promise(r => setTimeout(r, 800))
    setSalvando(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: 28, maxWidth: 500, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Criar Anúncio</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Passo {passo} de 3</div>
            </div>
            <button onClick={onClose} style={{ background: '#E5E7EB', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} color="#6B7280" /></button>
          </div>
          {/* Progress bars */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ flex: 1, height: 5, borderRadius: 999, background: n <= passo ? '#16A34A' : '#E5E7EB', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          {passo === 1 && (
            <>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 6 }}>Tipo de Anúncio</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Como você quer aparecer para os clientes?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tipos.map(t => (
                  <button key={t.id} onClick={() => setTipo(t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    border: `2px solid ${tipo === t.id ? t.cor : '#E5E7EB'}`,
                    background: tipo === t.id ? `${t.bg}` : 'white',
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>{t.label}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{t.desc}</div>
                    </div>
                    {tipo === t.id && <div style={{ width: 22, height: 22, borderRadius: '50%', background: t.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={12} color="white" /></div>}
                  </button>
                ))}
              </div>
            </>
          )}

          {passo === 2 && (
            <>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 6 }}>Dados do Produto</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>O que você quer anunciar?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Nome do produto', val: nome, set: setNome, ph: 'Ex: Corte + Barba, Açaí 500ml...', type: 'text' },
                  { label: 'Preço (R$)', val: preco, set: setPreco, ph: '0,00', type: 'number' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', fontFamily:'Poppins, sans-serif', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} type={f.type}
                      style={{ width:'100%', padding:'12px 14px', boxSizing:'border-box', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:14, fontFamily:'Inter, sans-serif', outline:'none', transition:'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                  </div>
                ))}
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', fontFamily:'Poppins, sans-serif', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Descrição</label>
                  <textarea value={descricao} onChange={e => setDesc(e.target.value)} placeholder="Descreva o produto ou promoção..." rows={3}
                    style={{ width:'100%', padding:'12px 14px', boxSizing:'border-box', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:14, fontFamily:'Inter, sans-serif', outline:'none', resize:'none', transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
              </div>
            </>
          )}

          {passo === 3 && (
            <>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 6 }}>Duração do Anúncio</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Por quanto tempo deseja anunciar?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {duracoes.map(d => (
                  <button key={d.label} onClick={() => setDuracao(d.label)} style={{
                    padding: '18px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${duracao === d.label ? '#16A34A' : '#E5E7EB'}`,
                    background: duracao === d.label ? '#F0FDF4' : 'white', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontFamily:'Poppins, sans-serif', fontWeight:700, fontSize:16, color: duracao === d.label ? '#16A34A' : '#111827' }}>{d.label}</div>
                    <div style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'#9CA3AF', marginTop:3 }}>{d.sub}</div>
                  </button>
                ))}
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ fontFamily:'Poppins, sans-serif', fontWeight:700, fontSize:13, color:'#111827', marginBottom:12 }}>Resumo</div>
                {[['Tipo', tipos.find(t => t.id === tipo)?.label || tipo], ['Produto', nome || '—'], ['Preço', preco ? `R$${preco}` : '—'], ['Duração', duracao]].map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontFamily:'Inter, sans-serif', marginBottom:8 }}>
                    <span style={{ color:'#9CA3AF' }}>{k}</span>
                    <span style={{ color:'#111827', fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {passo > 1 && (
              <button onClick={() => setPasso(p => p - 1)} style={{ flex: 1, padding:'13px', borderRadius:14, border:'1.5px solid #E5E7EB', background:'white', color:'#4B5563', fontFamily:'Poppins, sans-serif', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <ChevronLeft size={16} /> Voltar
              </button>
            )}
            <button
              onClick={passo < 3 ? () => setPasso(p => p + 1) : salvar}
              disabled={(passo === 1 && !tipo) || (passo === 2 && !nome) || salvando}
              style={{
                flex: 2, padding:'13px', borderRadius:14, border:'none', cursor:'pointer',
                background: passo === 3 ? '#16A34A' : '#111827', color:'white',
                fontFamily:'Poppins, sans-serif', fontWeight:700, fontSize:15,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: passo === 3 ? '0 6px 20px rgba(22,163,74,0.35)' : '0 4px 14px rgba(17,24,39,0.2)',
                transition:'all 0.2s',
              }}>
              {salvando ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Publicando...</>
                : passo < 3 ? <>Continuar <ChevronRight size={16} /></>
                : <>Publicar Anúncio <Check size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SecaoDashboard ───────────────────────────────────────────────
function SecaoDashboard({ dados, comerciante, aprovado, onCriarAnuncio, onVenderAgora }: {
  dados: DashboardData | null; comerciante: Comerciante; aprovado: boolean
  onCriarAnuncio: () => void; onVenderAgora: () => void
}) {
  const m = dados?.metricas
  const grafico = dados?.grafico_visualizacoes || []
  const sparkViews = grafico.slice(-14).map(g => g.total)
  const promocoesAtivas = dados?.promocoes_ativas || []
  const leads = dados?.ultimos_leads || []
  const receitaEstimada = (m?.leads_30dias || 0) * 3.5

  const insights = [
    { icon: <TrendingUp size={16} color="#16A34A" />, titulo: 'Crescimento detectado', texto: 'Suas visualizações aumentaram 23% esta semana. Ative uma promoção para converter esse tráfego!', cor: '#16A34A', bg: '#F0FDF4', border: '#DCFCE7' },
    { icon: <Clock size={16} color="#3B82F6" />, titulo: 'Melhor horário', texto: 'Seu pico de visitas é entre 18h–20h. Programe promoções para esse período.', cor: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' },
    { icon: <MessageCircle size={16} color="#25D366" />, titulo: 'WhatsApp converte mais', texto: 'Clientes que acessam seu WhatsApp convertem 3x mais. Confirme seu número no perfil.', cor: '#25D366', bg: '#F0FDF4', border: '#DCFCE7' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* HERO CTA — SELL NOW */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #111827 100%)',
        borderRadius: 24, padding: '32px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
        boxShadow: '0 16px 48px rgba(15,23,42,0.3)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -40, right: 180, width: 200, height: 200, borderRadius: '50%', background: 'rgba(250,204,21,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(22,163,74,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 999, padding: '4px 12px', marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FACC15', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#FACC15', letterSpacing: '0.05em' }}>PROMOÇÃO RELÂMPAGO DISPONÍVEL</span>
          </div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: 'white', margin: '0 0 8px', lineHeight: 1.15 }}>
            Quer vender mais <span style={{ color: '#FACC15' }}>agora?</span>
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#94A3B8', margin: 0, maxWidth: 400 }}>
            Ative uma promoção relâmpago e apareça para centenas de clientes na sua região em segundos.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <button onClick={onVenderAgora} style={{
            background: '#FACC15', color: '#111827', border: 'none', borderRadius: 16,
            padding: '18px 36px', fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 17,
            cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
            boxShadow: '0 8px 28px rgba(250,204,21,0.5)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(250,204,21,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(250,204,21,0.5)' }}>
            <Zap size={20} /> VENDER AGORA
          </button>
          <button onClick={onCriarAnuncio} style={{
            background: 'transparent', color: '#94A3B8', border: '1.5px solid rgba(148,163,184,0.3)',
            borderRadius: 12, padding: '10px 24px', fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.6)'; e.currentTarget.style.color = '#CBD5E1' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)'; e.currentTarget.style.color = '#94A3B8' }}>
            <Plus size={14} /> Criar anúncio
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
        <KpiCard icon={<Eye size={20} color="#16A34A" />} label="Visualizações (mês)" valor={m?.visualizacoes_mes ?? 0} cor="#16A34A" bg="#DCFCE7" trend={m?.visualizacoes_variacao} sub="últimos 30 dias" />
        <KpiCard icon={<MousePointerClick size={20} color="#3B82F6" />} label="Leads gerados" valor={m?.leads_30dias ?? 0} cor="#3B82F6" bg="#DBEAFE" trend={m?.leads_variacao} sub="clicks e contatos" />
        <KpiCard icon={<MessageCircle size={20} color="#25D366" />} label="Opt-ins WhatsApp" valor={m?.optins_ativos ?? 0} cor="#25D366" bg="#DCFCE7" sub="seguidores ativos" />
        <KpiCard icon={<DollarSign size={20} color="#F59E0B" />} label="Receita estimada" valor={`R$${receitaEstimada.toFixed(0)}`} cor="#F59E0B" bg="#FEF3C7" sub="baseado nos leads" />
      </div>

      {/* Analytics + Campanhas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>

        {/* Gráfico de visualizações */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>Visualizações</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', margin: 0 }}>Últimos 14 dias</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#16A34A', lineHeight: 1 }}>
                {(m?.visualizacoes_mes ?? 0).toLocaleString('pt-BR')}
              </div>
              {(m?.visualizacoes_variacao ?? 0) !== 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                  {(m?.visualizacoes_variacao ?? 0) >= 0 ? <TrendingUp size={12} color="#16A34A" /> : <TrendingDown size={12} color="#DC2626" />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: (m?.visualizacoes_variacao ?? 0) >= 0 ? '#16A34A' : '#DC2626', fontFamily: 'Inter, sans-serif' }}>
                    {Math.abs(m?.visualizacoes_variacao ?? 0)}% vs mês anterior
                  </span>
                </div>
              )}
            </div>
          </div>
          <AreaChart data={sparkViews} cor="#16A34A" height={120} />
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 3, borderRadius: 2, background: '#16A34A' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>Visualizações</span>
            </div>
          </div>
        </div>

        {/* Últimas interações */}
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: '#111827' }}>Interações recentes</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>Leads e ações</p>
            </div>
            {leads.length > 0 && <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{leads.length} hoje</span>}
          </div>

          {leads.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Users size={22} color="#D1D5DB" />
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter, sans-serif', textAlign: 'center', margin: 0 }}>Nenhuma interação ainda.<br/>Ative uma promoção!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'hidden' }}>
              {leads.slice(0, 5).map((l, idx) => {
                const acoesMap: Record<string, { bg: string; cor: string; emoji: string }> = {
                  whatsapp: { bg: '#DCFCE7', cor: '#16A34A', emoji: '💬' },
                  ligacao:  { bg: '#DBEAFE', cor: '#3B82F6', emoji: '📞' },
                  site:     { bg: '#EDE9FE', cor: '#8B5CF6', emoji: '🌐' },
                  visualizacao: { bg: '#F3F4F6', cor: '#6B7280', emoji: '👁️' },
                  promocao: { bg: '#FEF3C7', cor: '#F59E0B', emoji: '🏷️' },
                }
                const meta = acoesMap[l.acao] || { bg: '#F3F4F6', cor: '#6B7280', emoji: '👁️' }
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{meta.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#111827', fontWeight: 500 }}>{ACOES[l.acao] || l.acao}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>{new Date(l.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.cor, flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Campanhas ativas */}
      {promocoesAtivas.length > 0 && (
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>Campanhas Ativas</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>{promocoesAtivas.length} campanha{promocoesAtivas.length !== 1 ? 's' : ''} em execução</p>
            </div>
            <button onClick={onCriarAnuncio} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#111827', color: 'white',
              border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 700,
              fontFamily: 'Poppins, sans-serif', cursor: 'pointer', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#1F2937'}
              onMouseLeave={e => e.currentTarget.style.background = '#111827'}>
              <Plus size={14} /> Nova campanha
            </button>
          </div>
          {promocoesAtivas.map((p, idx) => {
            const pct = p.quantidade_limite ? Math.round((p.quantidade_usada / p.quantidade_limite) * 100) : 0
            const isLast = idx === promocoesAtivas.length - 1
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 24px', borderBottom: isLast ? 'none' : '1px solid #F9FAFB' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Tag size={18} color="#F59E0B" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 6 }}>{p.titulo}</div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 999, marginBottom: 5 }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct > 80 ? '#F59E0B' : '#16A34A', borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>{p.quantidade_usada} usados</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF' }}>limite: {p.quantidade_limite || '∞'}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: pct > 80 ? '#F59E0B' : '#16A34A', fontWeight: 600 }}>{pct}% utilizado</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} /> Ativa
                  </span>
                  <button style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Editar" onMouseEnter={e => e.currentTarget.style.borderColor = '#16A34A'} onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                    <Edit2 size={13} color="#6B7280" />
                  </button>
                  <button style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Pausar" onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.background = '#FFFBEB' }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' }}>
                    <PauseCircle size={13} color="#6B7280" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* AI Insights */}
      <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '24px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#7C3AED" />
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>Insights da IA</div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', margin: 0 }}>Sugestões baseadas no seu desempenho</p>
          </div>
          <span style={{ marginLeft: 'auto', background: '#F5F3FF', color: '#7C3AED', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>3 novas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
              background: ins.bg, border: `1.5px solid ${ins.border}`, borderRadius: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ins.icon}</div>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 12, color: ins.cor }}>{ins.titulo}</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{ins.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sugestão de promoção */}
      <div style={{
        background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        borderRadius: 20, padding: '28px 32px',
        display: 'flex', alignItems: 'center', gap: 24,
        boxShadow: '0 8px 32px rgba(17,24,39,0.15)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: 100, width: 160, height: 160, borderRadius: '50%', background: 'rgba(250,204,21,0.08)' }} />
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Target size={26} color="#111827" />
        </div>
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: 'white' }}>Promoção Recomendada pela IA</span>
            <span style={{ background: 'rgba(250,204,21,0.2)', color: '#FACC15', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(250,204,21,0.3)' }}>IA</span>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF', margin: 0 }}>
            Com base no histórico, um desconto de <strong style={{ color: '#FACC15' }}>20% OFF</strong> ativado agora pode gerar <strong style={{ color: '#FACC15' }}>+45% de contatos</strong> via WhatsApp.
          </p>
        </div>
        <button onClick={onVenderAgora} style={{
          background: '#FACC15', color: '#111827', border: 'none', borderRadius: 14,
          padding: '14px 28px', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14,
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          boxShadow: '0 6px 20px rgba(250,204,21,0.4)', transition: 'all 0.2s', position: 'relative', zIndex: 1,
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(250,204,21,0.55)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(250,204,21,0.4)' }}>
          Ativar agora →
        </button>
      </div>
    </div>
  )
}

// ── SecaoCampanhas ───────────────────────────────────────────────
function SecaoCampanhas({ dados, aprovado, onCriarAnuncio }: { dados: DashboardData | null; aprovado: boolean; onCriarAnuncio: () => void }) {
  const promocoes = dados?.promocoes_ativas || []
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', margin: '0 0 4px' }}>Campanhas & Anúncios</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF', margin: 0 }}>Gerencie suas promoções e anúncios ativos</p>
        </div>
        <button onClick={onCriarAnuncio} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: '#16A34A', color: 'white',
          border: 'none', borderRadius: 14, padding: '12px 22px', fontFamily: 'Poppins, sans-serif',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(22,163,74,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.3)' }}>
          <Plus size={16} /> Criar anúncio
        </button>
      </div>

      {promocoes.length === 0 ? (
        <div style={{ background: 'white', border: '2px dashed #E5E7EB', borderRadius: 24, padding: '64px 40px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Megaphone size={32} color="#D1D5DB" />
          </div>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: '0 0 8px' }}>Nenhuma campanha ativa</h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF', margin: '0 0 24px' }}>Crie sua primeira promoção e atraia mais clientes da cidade</p>
          <button onClick={onCriarAnuncio} style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 999, padding: '13px 32px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)', fontSize: 14 }}>
            Criar primeira campanha
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {promocoes.map(p => {
            const pct = p.quantidade_limite ? Math.round((p.quantidade_usada / p.quantidade_limite) * 100) : 0
            return (
              <div key={p.id} style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 22, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(31,41,55,0.08)'; e.currentTarget.style.borderColor = '#DCFCE7' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB' }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Tag size={22} color="#F59E0B" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 10 }}>{p.titulo}</div>
                  <div style={{ display: 'flex', gap: 28, marginBottom: 10 }}>
                    {[{ label: 'Usados', val: p.quantidade_usada }, { label: 'Limite', val: p.quantidade_limite || '∞' }, { label: 'Utilizado', val: `${pct}%` }].map(item => (
                      <div key={item.label}>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 18, color: '#111827' }}>{item.val}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct > 80 ? '#F59E0B' : '#16A34A', borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                  <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> Ativa
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 12, fontWeight: 600, color: '#4B5563', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}>
                      <Edit2 size={12} /> Editar
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 12, fontWeight: 600, color: '#4B5563', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.color = '#F59E0B'; e.currentTarget.style.background = '#FFFBEB' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563'; e.currentTarget.style.background = 'white' }}>
                      <PauseCircle size={12} /> Pausar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── SecaoFaturamento ─────────────────────────────────────────────
function SecaoFaturamento() {
  const planos = [
    {
      nome: 'Basic', preco: 'R$0,00', periodo: '/mês',
      recursos: ['Perfil básico do negócio', 'Aparece nas buscas do Zappi', 'Horários de funcionamento', 'QR Code básico'],
      cor: '#3B82F6', bg: '#EFF6FF', destaque: false, btnLabel: 'Plano atual',
    },
    {
      nome: 'Pro', preco: 'R$59,90', periodo: '/mês',
      recursos: ['Tudo do Basic', 'Promoções e anúncios', 'Destaque nas buscas', 'QR Code rastreável', 'Analytics completo'],
      cor: '#16A34A', bg: '#F0FDF4', destaque: true, btnLabel: 'Fazer upgrade',
    },
  ]
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', margin: '0 0 6px' }}>Faturamento & Plano</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF', margin: 0 }}>Gerencie sua assinatura e faça upgrade</p>
      </div>

      {/* Plano atual */}
      <div style={{
        background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1.5px solid #BBF7D0',
        borderRadius: 20, padding: '22px 28px', marginBottom: 32,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CreditCard size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>
            Plano atual: <span style={{ color: '#16A34A' }}>Basic (Grátis)</span>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4B5563', margin: '4px 0 0' }}>Faça upgrade para Pro e desbloqueie promoções, destaque e analytics completo</p>
        </div>
        <div style={{ background: '#FEF9C3', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '10px 16px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#854D0E', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Crown size={14} /> Fazer upgrade
          </span>
        </div>
      </div>

      {/* Cards de plano */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
        {planos.map(p => (
          <div key={p.nome} style={{
            background: p.destaque ? p.cor : 'white',
            border: `2px solid ${p.destaque ? p.cor : '#E5E7EB'}`,
            borderRadius: 24, padding: '28px 24px', position: 'relative',
            display: 'flex', flexDirection: 'column', gap: 20,
            boxShadow: p.destaque ? `0 16px 48px ${p.cor}30` : '0 2px 8px rgba(31,41,55,0.04)',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            {p.destaque && (
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: 'white', fontSize: 11, fontWeight: 700, padding: '5px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                ⭐ Recomendado
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1rem', color: p.destaque ? 'white' : '#111827', marginBottom: 8 }}>{p.nome}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: '2rem', color: p.destaque ? 'white' : p.cor, lineHeight: 1 }}>{p.preco}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: p.destaque ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>{p.periodo}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {p.recursos.map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.destaque ? 'rgba(255,255,255,0.2)' : p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color={p.destaque ? 'white' : p.cor} strokeWidth={3} />
                  </div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: p.destaque ? 'rgba(255,255,255,0.9)' : '#4B5563' }}>{r}</span>
                </div>
              ))}
            </div>
            <button style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              cursor: p.destaque ? 'pointer' : 'default',
              background: p.destaque ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
              color: p.destaque ? 'white' : '#94A3B8',
              fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if (p.destaque) e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { if (p.destaque) e.currentTarget.style.opacity = '1' }}>
              {p.btnLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SecaoMeuNegocio ──────────────────────────────────────────────
function SecaoMeuNegocio() {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [comercio, setComercio] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [slugCopiado, setSlugCopiado] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [emailComercio, setEmailComercio] = useState('')
  const [endereco, setEndereco] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [horarios, setHorarios] = useState<Record<string,{aberto:string;fechado:string;aberto_flag:boolean}>>({})
  const [capaPreview, setCapaPreview] = useState('')
  const [capaCropB64, setCapaCropB64] = useState<string|null>(null)
  const [cropSrc, setCropSrc] = useState<string|null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([apiFetch<any>('/comerciante/perfil'), api.comercios.categorias()]).then(([perfil, cats]) => {
      const c = perfil.comercio; setCategorias(cats)
      if (!c) return; setComercio(c)
      setDescricao(c.descricao||''); setWhatsapp(c.whatsapp||''); setTelefone(c.telefone||'')
      setWebsite(c.website||''); setInstagram(c.instagram||''); setEmailComercio(c.email||'')
      setEndereco(c.endereco||''); setCategoriaId(c.categoria_id||'')
      if (c.foto_capa_url) setCapaPreview(c.foto_capa_url)
      const h = c.horarios||{}
      setHorarios(Object.fromEntries(DIAS.map(d => {
        const slot = h[d]
        if (slot) {
          const fmt = (v: string) => v?.length===4 ? `${v.slice(0,2)}:${v.slice(2)}` : v||'08:00'
          return [d, { aberto: fmt(slot.abre), fechado: fmt(slot.fecha), aberto_flag: true }]
        }
        return [d, { aberto: '08:00', fechado: '18:00', aberto_flag: d!=='domingo' }]
      })))
    }).catch(()=>{}).finally(()=>setCarregando(false))
  }, [])

  const handleCapa = (file: File) => { setCropSrc(URL.createObjectURL(file)); setShowCrop(true) }
  const handleCropConfirm = (b64: string) => { setCapaCropB64(b64); setCapaPreview(b64); setShowCrop(false) }
  const copiarSlug = () => { navigator.clipboard.writeText(`zappicidade.com.br/${comercio?.slug}`); setSlugCopiado(true); setTimeout(()=>setSlugCopiado(false), 2000) }

  const salvar = async () => {
    setErro(''); setSucesso(false); setSalvando(true)
    try {
      if (capaCropB64) await apiFetch('/comerciante/upload/capa', { method:'POST', body: JSON.stringify({ base64: capaCropB64, extensao:'jpg' }) })
      const horariosFinais = Object.fromEntries(Object.entries(horarios).map(([dia,h]) => [dia, h.aberto_flag ? { abre: h.aberto.replace(':',''), fecha: h.fechado.replace(':','') } : null]))
      await apiFetch('/comerciante/perfil/comercio', { method:'PUT', body: JSON.stringify({ descricao, whatsapp: whatsapp.replace(/\D/g,''), telefone, website, instagram, email: emailComercio, endereco, categoria_id: categoriaId||undefined, horarios: horariosFinais }) })
      setSucesso(true); setTimeout(()=>setSucesso(false), 3000)
    } catch(err:any) { setErro(err.message) } finally { setSalvando(false) }
  }

  if (carregando) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Loader2 size={24} style={{ animation:'spin 1s linear infinite', color:'#16A34A' }} /></div>
  if (!comercio) return <div style={{ background:'white', borderRadius:16, padding:40, textAlign:'center', border:'1.5px solid #E5E7EB' }}><p style={{ color:'#9CA3AF' }}>Nenhum comércio vinculado.</p></div>

  const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB', borderRadius:12, fontSize:14, color:'#111827', fontFamily:'Inter, sans-serif', background:'white', outline:'none', transition:'border-color 0.15s', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { display:'block', fontSize:11, fontWeight:700, color:'#4B5563', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em', fontFamily:'Poppins, sans-serif' }

  return (
    <>
      {showCrop && cropSrc && <ImageCropModal src={cropSrc} aspectRatio={8/3} outputWidth={1200} onConfirm={handleCropConfirm} onClose={()=>{ setShowCrop(false); if(fileRef.current) fileRef.current.value='' }} />}
      <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:720 }}>

        {/* Foto de capa */}
        <div style={{ background:'white', border:'1.5px solid #E5E7EB', borderRadius:20, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontFamily:'Poppins, sans-serif', fontWeight:700, fontSize:15, color:'#111827', margin:0, display:'flex', alignItems:'center', gap:8 }}><Camera size={16} color="#16A34A" /> Foto de Capa</h3>
            <button onClick={()=>fileRef.current?.click()} style={{ background:'none', border:'1.5px solid #E5E7EB', borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:600, color:'#4B5563', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'Poppins, sans-serif' }}><Camera size={13} /> {capaPreview ? 'Trocar' : 'Adicionar'}</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ if(e.target.files?.[0]) handleCapa(e.target.files[0]) }} />
          {capaPreview ? (
            <div style={{ position:'relative', width:'100%', aspectRatio:'8/3', borderRadius:12, overflow:'hidden', background:'#F3F4F6' }}>
              <img src={capaPreview} alt="Capa" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              <button onClick={()=>{ setCropSrc(capaPreview); setShowCrop(true) }} style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,0.6)', color:'white', border:'none', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}><Camera size={12}/> Reposicionar</button>
            </div>
          ) : (
            <div onClick={()=>fileRef.current?.click()} style={{ width:'100%', aspectRatio:'8/3', background:'#F9FAFB', border:'2px dashed #E5E7EB', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:10 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center' }}><Camera size={22} color="#16A34A" /></div>
              <span style={{ fontFamily:'Inter, sans-serif', fontSize:13, color:'#9CA3AF' }}>Clique para adicionar foto de capa (1200×450px)</span>
            </div>
          )}
        </div>

        {/* Link público */}
        {comercio.slug && (
          <div style={{ background:'#F0FDF4', border:'1.5px solid #DCFCE7', borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <Globe size={18} color="#16A34A" style={{ flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Poppins, sans-serif', fontWeight:600, fontSize:13, color:'#15803D', marginBottom:2 }}>Seu link público</div>
              <div style={{ fontFamily:'Inter, sans-serif', fontSize:13, color:'#16A34A' }}>zappicidade.com.br/{comercio.slug}</div>
            </div>
            <button onClick={copiarSlug} style={{ background:'white', border:'1.5px solid #DCFCE7', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, color:'#16A34A', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'Poppins, sans-serif' }}>
              {slugCopiado ? <><Check size={13}/> Copiado!</> : <><Copy size={13}/> Copiar</>}
            </button>
          </div>
        )}

        {/* Dados básicos */}
        <div style={{ background:'white', border:'1.5px solid #E5E7EB', borderRadius:20, padding:24 }}>
          <h3 style={{ fontFamily:'Poppins, sans-serif', fontWeight:700, fontSize:15, color:'#111827', margin:'0 0 20px', display:'flex', alignItems:'center', gap:8 }}><Store size={16} color="#16A34A" /> Informações do Negócio</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>Descrição</label>
              <textarea value={descricao} onChange={e=>setDescricao(e.target.value)} rows={3} placeholder="Descreva seu negócio..." style={{ ...inp, resize:'none' }} onFocus={e=>(e.target.style.borderColor='#16A34A')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')} />
            </div>
            {[
              { label:'WhatsApp', val:whatsapp, set:setWhatsapp, ph:'(91) 99999-9999' },
              { label:'Telefone', val:telefone, set:setTelefone, ph:'(91) 3333-3333' },
              { label:'Site', val:website, set:setWebsite, ph:'https://seusite.com.br' },
              { label:'Instagram', val:instagram, set:setInstagram, ph:'@seunegocio' },
              { label:'Email do negócio', val:emailComercio, set:setEmailComercio, ph:'contato@seunegocio.com' },
              { label:'Endereço', val:endereco, set:setEndereco, ph:'Rua, nº, Bairro' },
            ].map(f => (
              <div key={f.label}>
                <label style={lbl}>{f.label}</label>
                <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={inp} onFocus={e=>(e.target.style.borderColor='#16A34A')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')} />
              </div>
            ))}
          </div>
        </div>

        {/* Horários */}
        <div style={{ background:'white', border:'1.5px solid #E5E7EB', borderRadius:20, padding:24 }}>
          <h3 style={{ fontFamily:'Poppins, sans-serif', fontWeight:700, fontSize:15, color:'#111827', margin:'0 0 18px', display:'flex', alignItems:'center', gap:8 }}><Clock size={16} color="#16A34A" /> Horários de Funcionamento</h3>
          {DIAS.map(dia => {
            const h = horarios[dia] || { aberto:'08:00', fechado:'18:00', aberto_flag: dia!=='domingo' }
            return (
              <div key={dia} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ width: 60, fontFamily:'Poppins, sans-serif', fontWeight:600, fontSize:13, color:'#4B5563', flexShrink:0 }}>{DIAS_LABEL[dia]}</div>
                <button onClick={()=>setHorarios(prev=>({ ...prev, [dia]:{ ...h, aberto_flag:!h.aberto_flag } }))} style={{ width:44, height:24, borderRadius:999, border:'none', cursor:'pointer', background:h.aberto_flag?'#16A34A':'#E5E7EB', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left:h.aberto_flag?23:3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }} />
                </button>
                {h.aberto_flag ? (
                  <>
                    <input type="time" value={h.aberto} onChange={e=>setHorarios(p=>({...p,[dia]:{...h,aberto:e.target.value}}))} style={{ padding:'7px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#111827', outline:'none', fontFamily:'Inter, sans-serif' }} />
                    <span style={{ color:'#9CA3AF', fontSize:13 }}>até</span>
                    <input type="time" value={h.fechado} onChange={e=>setHorarios(p=>({...p,[dia]:{...h,fechado:e.target.value}}))} style={{ padding:'7px 10px', border:'1.5px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#111827', outline:'none', fontFamily:'Inter, sans-serif' }} />
                  </>
                ) : <span style={{ fontFamily:'Inter, sans-serif', fontSize:13, color:'#9CA3AF' }}>Fechado</span>}
              </div>
            )
          })}
        </div>

        {/* Ações */}
        {erro && <div style={{ background:'#FEE2E2', border:'1.5px solid #FECACA', borderRadius:12, padding:'12px 16px', color:'#DC2626', fontFamily:'Inter, sans-serif', fontSize:14, display:'flex', alignItems:'center', gap:10 }}><AlertCircle size={16}/> {erro}</div>}
        {sucesso && <div style={{ background:'#DCFCE7', border:'1.5px solid #BBF7D0', borderRadius:12, padding:'12px 16px', color:'#15803D', fontFamily:'Poppins, sans-serif', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:10 }}><Check size={16}/> Salvo com sucesso!</div>}
        <button onClick={salvar} disabled={salvando} style={{ background:'#16A34A', color:'white', border:'none', borderRadius:14, padding:'14px', width:'100%', fontFamily:'Poppins, sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 16px rgba(22,163,74,0.35)' }}>
          {salvando ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> Salvando...</> : <><Save size={16}/> Salvar alterações</>}
        </button>
      </div>
    </>
  )
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [comerciante, setComerciante]       = useState<Comerciante | null>(null)
  const [dados, setDados]                   = useState<DashboardData | null>(null)
  const [carregando, setCarregando]         = useState(true)
  const [seção, setSeção]                   = useState('dashboard')
  const [modalVender, setModalVender]       = useState(false)
  const [modalAnuncio, setModalAnuncio]     = useState(false)
  const [nomePerfil, setNomePerfil]         = useState('')
  const [isMobile, setIsMobile]             = useState(false)
  const [toast, setToast]                   = useState<{ msg: string; tipo: 'sucesso' | 'erro' } | null>(null)
  const [statusVerificacao, setStatusVerificacao] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const sessao = obterSessao()
    if (!sessao) { router.push('/comerciante/login'); return }
    if (!sessao.comerciante.comercio_id) { router.push('/comerciante/onboarding'); return }
    setComerciante(sessao.comerciante)
    setNomePerfil(sessao.comerciante.nome || sessao.comerciante.email?.split('@')[0] || '')

    Promise.all([apiFetch<DashboardData>('/comerciante/dashboard'), apiFetch<any>('/comerciante/perfil')])
      .then(([dash, perfil]) => {
        setDados(dash)
        if (perfil?.comerciante?.status_verificacao) {
          setStatusVerificacao(perfil.comerciante.status_verificacao)
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [router])

  const sair = () => { limparSessao(); router.push('/comerciante/login') }

  const mostrarToast = (msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const recarregarDados = () => {
    apiFetch<DashboardData>('/comerciante/dashboard')
      .then(dash => setDados(dash))
      .catch(() => {})
  }

  if (!comerciante) return null

  const navItems = [
    { id: 'dashboard',   icon: <LayoutDashboard size={18} />, label: 'Visão Geral' },
    { id: 'campanhas',   icon: <Megaphone size={18} />,       label: 'Campanhas' },
    { id: 'perfil',      icon: <Store size={18} />,           label: 'Meu Negócio' },
    { id: 'leads',       icon: <Users size={18} />,           label: 'Clientes' },
    { id: 'faturamento', icon: <CreditCard size={18} />,      label: 'Faturamento' },
  ]

  const titulos: Record<string, string> = {
    dashboard: 'Visão Geral', campanhas: 'Campanhas & Anúncios',
    perfil: 'Meu Negócio', leads: 'Clientes', faturamento: 'Faturamento',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar — oculta no mobile */}
      <aside style={{ width: 248, flexShrink: 0, background: 'white', borderRight: '1.5px solid #E5E7EB', height: '100vh', position: 'sticky', top: 0, display: isMobile ? 'none' : 'flex', flexDirection: 'column', boxShadow: '2px 0 8px rgba(0,0,0,0.03)' }}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <Link href="/" style={{ display: 'block', textDecoration: 'none' }}>
            <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={130} height={34} style={{ objectFit: 'contain', objectPosition: 'left' }} />
          </Link>
        </div>

        {/* Perfil do negócio */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: '#16A34A',
            }}>
              {nomePerfil.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomePerfil}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#16A34A', fontWeight: 600 }}>Ativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Criar Anúncio */}
        <div style={{ padding: '14px 14px 6px' }}>
          <button onClick={() => { if (statusVerificacao !== 'aprovado') { mostrarToast('Aguarde a aprovação da sua conta pelo administrador.', 'erro'); return } setModalAnuncio(true) }} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#16A34A', color: 'white', border: 'none', borderRadius: 14,
            padding: '11px 0', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.3)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.3)' }}>
            <Plus size={15} /> Criar Anúncio
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSeção(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: seção === item.id ? '#F0FDF4' : 'transparent',
              color: seção === item.id ? '#16A34A' : '#64748B',
              fontFamily: 'Inter, sans-serif', fontWeight: seção === item.id ? 600 : 500,
              fontSize: 13.5, marginBottom: 2, transition: 'all 0.15s', textAlign: 'left',
              borderLeft: seção === item.id ? '3px solid #16A34A' : '3px solid transparent',
            }}
              onMouseEnter={e => { if (seção !== item.id) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#374151' } }}
              onMouseLeave={e => { if (seção !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B' } }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '10px 10px 16px', borderTop: '1px solid #F1F5F9' }}>
          <a href={`/c/meu-comercio`} target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
            borderRadius: 10, color: '#94A3B8', textDecoration: 'none', fontSize: 13,
            marginBottom: 2, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#16A34A' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}>
            <ExternalLink size={16} /> Ver página pública
          </a>
          <button onClick={sair} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
            borderRadius: 10, border: 'none', background: 'transparent', color: '#94A3B8',
            fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1.5px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: isMobile ? '0 16px' : '0 32px', height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Logo só no mobile (substituindo sidebar) */}
            {isMobile && (
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
                <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={100} height={26} style={{ objectFit: 'contain' }} />
              </Link>
            )}

            {!isMobile && (
              <div>
                <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827', margin: 0, lineHeight: 1.2 }}>{titulos[seção]}</h1>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>ZappiCidade — Painel do Comerciante</div>
              </div>
            )}

            <div style={{ flex: 1 }} />

            {/* VENDER AGORA — ícone no mobile, botão completo no desktop */}
            <button onClick={() => { if (statusVerificacao !== 'aprovado') { mostrarToast('Aguarde a aprovação da sua conta pelo administrador.', 'erro'); return } setModalVender(true) }} style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 8, background: '#FACC15',
              color: '#111827', border: 'none', borderRadius: 12,
              padding: isMobile ? '9px 12px' : '10px 22px',
              fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(250,204,21,0.45)', transition: 'all 0.15s',
              letterSpacing: '-0.01em',
            }}>
              <Zap size={15} />
              {!isMobile && ' Vender Agora'}
            </button>

            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
              background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 13, color: '#16A34A',
              flexShrink: 0, border: '2px solid #DCFCE7',
            }}>
              {nomePerfil.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Banner — conta pendente de aprovação */}
        {statusVerificacao && statusVerificacao !== 'aprovado' && (
          <div style={{
            background: '#FFFBEB', borderBottom: '1.5px solid #FDE68A',
            padding: isMobile ? '12px 16px' : '12px 32px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#92400E' }}>
                Conta aguardando aprovação.{' '}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#92400E' }}>
                Promoções e anúncios ficam disponíveis após o administrador aprovar seu vínculo com o comércio.
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {carregando ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#16A34A' }} />
            </div>
            <p style={{ color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: 14, margin: 0 }}>Carregando seu painel...</p>
          </div>
        ) : (
          <main style={{ flex: 1, padding: isMobile ? '16px 12px 90px' : '32px', overflowY: 'auto' }}>
            {seção === 'dashboard'   && <SecaoDashboard dados={dados} comerciante={comerciante} aprovado={statusVerificacao === 'aprovado'} onCriarAnuncio={() => { if (statusVerificacao !== 'aprovado') { mostrarToast('Aguarde a aprovação da sua conta pelo administrador.', 'erro'); return } setModalAnuncio(true) }} onVenderAgora={() => { if (statusVerificacao !== 'aprovado') { mostrarToast('Aguarde a aprovação da sua conta pelo administrador.', 'erro'); return } setModalVender(true) }} />}
            {seção === 'campanhas'   && <SecaoCampanhas dados={dados} aprovado={statusVerificacao === 'aprovado'} onCriarAnuncio={() => { if (statusVerificacao !== 'aprovado') { mostrarToast('Aguarde a aprovação da sua conta pelo administrador.', 'erro'); return } setModalAnuncio(true) }} />}
            {seção === 'perfil'      && <SecaoMeuNegocio />}
            {seção === 'faturamento' && <SecaoFaturamento />}
            {seção === 'leads' && (
              <div style={{ background: 'white', border: '2px dashed #E5E7EB', borderRadius: 24, padding: '64px 40px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Users size={32} color="#D1D5DB" />
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: '0 0 8px' }}>Painel de Clientes</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF', margin: 0 }}>Lista de leads e opt-ins — em desenvolvimento</p>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Bottom Navigation — só mobile */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'white', borderTop: '1.5px solid #E5E7EB',
          display: 'flex', alignItems: 'stretch',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {navItems.map(item => {
            const ativo = seção === item.id
            return (
              <button key={item.id} onClick={() => setSeção(item.id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4, padding: '10px 4px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: ativo ? '#16A34A' : '#94A3B8',
                borderTop: ativo ? '2px solid #16A34A' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                {item.icon}
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: ativo ? 700 : 500,
                  lineHeight: 1,
                }}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}

      {/* Toast de feedback */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: isMobile ? 90 : 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 300, background: toast.tipo === 'sucesso' ? '#111827' : '#EF4444',
          color: 'white', borderRadius: 16, padding: '14px 24px',
          fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideUp 0.3s ease',
        }}>
          {toast.tipo === 'sucesso'
            ? <Check size={18} color="#4ADE80" strokeWidth={3} />
            : <AlertCircle size={18} color="white" />}
          {toast.msg}
        </div>
      )}

      {/* Modais */}
      {modalVender  && <ModalVenderAgora  onClose={() => setModalVender(false)}  onSalvar={(r: any) => { setModalVender(false); if (r?.sucesso) { mostrarToast('⚡ Promoção ativada! Já aparece para clientes da cidade.'); recarregarDados() } else { mostrarToast('Erro ao ativar promoção. Tente novamente.', 'erro') } }} />}
      {modalAnuncio && <ModalCriarAnuncio onClose={() => setModalAnuncio(false)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </div>
  )
}
