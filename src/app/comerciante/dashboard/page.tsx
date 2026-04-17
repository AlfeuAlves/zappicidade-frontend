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
  TrendingUp as Trend, BarChart3, Lightbulb, Crown, Move,
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
function ModalVenderAgora({ onClose, onSalvar }: { onClose: () => void; onSalvar: (result: { sucesso: boolean; produto?: string; preco?: number; desconto?: number; duracao?: string; erro?: string }) => void }) {
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
        body: JSON.stringify({ titulo: produto, preco_de: precoNum, preco_por: precoPor ?? null, percentual_desconto: descNum || null, fim, tipo: 'venda_rapida' }),
      })
      onSalvar({ sucesso: true, produto, preco: precoNum, desconto: descNum, duracao })
    } catch (err: any) {
      onSalvar({ sucesso: false, erro: err.message })
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

// ── DestaqueTopForm ──────────────────────────────────────────────
// Proporção da imagem do Destaque TOP: 16:9 (padrão WhatsApp/social)
const DESTAQUE_ASPECT = 16 / 9
const DESTAQUE_OUTPUT_W = 1280

function DestaqueTopForm({ isPro, onFechar }: { isPro: boolean; onFechar?: () => void }) {
  const [texto, setTexto] = useState('')
  const [publico, setPublico] = useState<'cidade' | 'bairro'>('cidade')
  const [imagem, setImagem] = useState<string | null>(null)       // base64 final (recortado)
  const [srcCrop, setSrcCrop] = useState<string | null>(null)     // src original para o modal de crop
  const [imagemDims, setImagemDims] = useState<{ w: number; h: number } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setSrcCrop(ev.target?.result as string) // abre modal de crop
    reader.readAsDataURL(file)
    // limpa o input para permitir re-selecionar o mesmo arquivo
    e.target.value = ''
  }

  const handleCropConfirm = (croppedBase64: string) => {
    setImagem(croppedBase64)
    setSrcCrop(null)
    // lê dimensões reais do canvas gerado
    const img = new window.Image()
    img.onload = () => setImagemDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = croppedBase64
  }

  const [erro, setErro] = useState<string | null>(null)

  const handleEnviar = async () => {
    if (!texto.trim()) return
    setEnviando(true)
    setErro(null)
    try {
      await apiFetch('/comerciante/promocoes/broadcast', {
        method: 'POST',
        body: JSON.stringify({ texto, publico, imagem }),
      })
      setEnviado(true)
    } catch (e: any) {
      setErro(e?.message || 'Erro ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (!isPro) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '2px solid #BBF7D0', borderRadius: 24, padding: '32px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(22,163,74,0.15)' }}>
          <Crown size={28} color="#16A34A" />
        </div>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: '0 0 8px' }}>Recurso exclusivo PRO</h3>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#4B5563', margin: '0 0 20px', lineHeight: 1.6 }}>
          O Destaque TOP envia sua promoção diretamente no WhatsApp de quem autorizou receber.<br />Faça upgrade para PRO e comece a usar agora.
        </p>
        <Link href="/comerciante/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #16A34A, #15803D)', color: 'white', borderRadius: 12, padding: '12px 24px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}>
          <Crown size={16} /> Assinar PRO
        </Link>
      </div>
    )
  }

  // Auto-limpa o banner de sucesso após 6 segundos
  useEffect(() => {
    if (!enviado) return
    const t = setTimeout(() => setEnviado(false), 6000)
    return () => clearTimeout(t)
  }, [enviado])

  return (
    <>
      {/* Modal de recorte — abre quando srcCrop está definido */}
      {srcCrop && (
        <ImageCropModal
          src={srcCrop}
          aspectRatio={DESTAQUE_ASPECT}
          outputWidth={DESTAQUE_OUTPUT_W}
          onConfirm={handleCropConfirm}
          onClose={() => setSrcCrop(null)}
        />
      )}

    <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 24, overflow: 'hidden' }}>
      {/* Header do form */}
      <div style={{ background: 'linear-gradient(135deg, #111827, #1F2937)', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, color: 'white' }}>Criar Destaque TOP</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Mensagem push no WhatsApp dos clientes</div>
          </div>
        </div>
        {onFechar && (
          <button onClick={onFechar} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={18} color="white" />
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Editor */}
        <div style={{ padding: '28px', borderRight: '1px solid #F3F4F6' }}>

          {/* Upload de imagem */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#374151', display: 'block', marginBottom: 10 }}>
              Imagem <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12 }}>(opcional · 16:9 · {DESTAQUE_OUTPUT_W}×{Math.round(DESTAQUE_OUTPUT_W / DESTAQUE_ASPECT)}px)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImagem} style={{ display: 'none' }} />
            {imagem ? (
              <div style={{ position: 'relative' }}>
                <img src={imagem} alt="preview" style={{ width: '100%', aspectRatio: `${DESTAQUE_ASPECT}`, objectFit: 'cover', borderRadius: 14, border: '1.5px solid #E5E7EB', display: 'block' }} />
                {/* Dimensões no canto inferior esquerdo */}
                {imagemDims && (
                  <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ImageIcon size={10} color="rgba(255,255,255,0.8)" />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'white', fontWeight: 600 }}>{imagemDims.w}×{imagemDims.h}px</span>
                  </div>
                )}
                {/* Botões no canto superior direito */}
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  <button onClick={() => { setSrcCrop(imagem); setImagem(null); setImagemDims(null) }} style={{ background: 'rgba(17,24,39,0.75)', border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)' }}>
                    <Move size={11} /> Ajustar
                  </button>
                  <button onClick={() => { setImagem(null); setImagemDims(null) }} style={{ background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{ width: '100%', aspectRatio: `${DESTAQUE_ASPECT}`, border: '2px dashed #D1D5DB', borderRadius: 14, background: '#F9FAFB', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.background = '#F0FDF4' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#F9FAFB' }}>
                <ImageIcon size={24} color="#9CA3AF" />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Clique para adicionar imagem</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#D1D5DB' }}>16:9 · {DESTAQUE_OUTPUT_W}×{Math.round(DESTAQUE_OUTPUT_W / DESTAQUE_ASPECT)}px</span>
              </button>
            )}
          </div>

          {/* Texto da mensagem */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#374151', display: 'block', marginBottom: 10 }}>
              Mensagem <span style={{ color: '#EF4444', fontSize: 12 }}>*</span>
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              maxLength={500}
              placeholder="Ex: 🔥 PROMOÇÃO RELÂMPAGO! Shampoo Clear a partir de R$17,99. Venha aproveitar hoje!"
              style={{ width: '100%', height: 120, border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#111827', resize: 'none', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#16A34A'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{texto.length}/500</div>
          </div>

          {/* Público */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#374151', display: 'block', marginBottom: 10 }}>Público-alvo</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {([['cidade', '🌆 Toda a cidade'], ['bairro', '📍 Por bairro']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setPublico(val)} style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `2px solid ${publico === val ? '#16A34A' : '#E5E7EB'}`, background: publico === val ? '#F0FDF4' : 'white', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: publico === val ? '#16A34A' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {enviado && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={15} color="#16A34A" />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#15803D', fontWeight: 600 }}>Destaque TOP enviado com sucesso!</span>
            </div>
          )}
          {erro && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} color="#EF4444" />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#DC2626' }}>{erro}</span>
            </div>
          )}
          <button onClick={handleEnviar} disabled={!texto.trim() || enviando} style={{ width: '100%', padding: '14px', background: texto.trim() ? 'linear-gradient(135deg, #16A34A, #15803D)' : '#E5E7EB', color: texto.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: 14, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, cursor: texto.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: texto.trim() ? '0 4px 16px rgba(22,163,74,0.35)' : 'none', transition: 'all 0.2s' }}>
            {enviando ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Megaphone size={18} /> Enviar Destaque TOP</>}
          </button>
        </div>

        {/* Preview WhatsApp */}
        <div style={{ padding: '28px', background: '#F0F2F5' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 14 }}>Preview</div>
          <div style={{ background: '#E5DDD5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            {/* Header do "WhatsApp" */}
            <div style={{ background: '#075E54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>🤖</span>
              </div>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: 'white' }}>Zappi Cidade</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>online</div>
              </div>
            </div>
            {/* Mensagem */}
            <div style={{ padding: '16px 12px', minHeight: 180 }}>
              <div style={{ background: 'white', borderRadius: '0 12px 12px 12px', overflow: 'hidden', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                {imagem && <img src={imagem} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />}
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#111827', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {texto || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Sua mensagem aparecerá aqui...</span>}
                  </p>
                  {texto && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                      <button style={{ width: '100%', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: '#16A34A', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <ExternalLink size={12} /> Quero garantir
                      </button>
                    </div>
                  )}
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#9CA3AF', textAlign: 'right', marginTop: 4 }}>
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7280', margin: '8px 0 0 4px' }}>
                Digite SAIR para não receber mais comunicações.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

// ── SecaoCampanhas ───────────────────────────────────────────────
function SecaoCampanhas({ dados, aprovado, onCriarAnuncio }: { dados: DashboardData | null; aprovado: boolean; onCriarAnuncio: () => void }) {
  const promocoes = dados?.promocoes_ativas || []
  const [mostrarDestaque, setMostrarDestaque] = useState(false)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    apiFetch<{ assinatura: { status: string } | null }>('/pagamento/status')
      .then(r => setIsPro(r.assinatura?.status === 'ativa'))
      .catch(() => {})
  }, [])

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

      {/* Destaque TOP */}
      {!mostrarDestaque ? (
        <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)', borderRadius: 24, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Megaphone size={24} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: 'white' }}>Destaque TOP</span>
              {isPro && <span style={{ background: '#16A34A', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 999, fontFamily: 'Poppins, sans-serif' }}>PRO</span>}
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
              Envie sua promoção diretamente no WhatsApp de quem autorizou receber. Alta conversão, entrega garantida.
            </p>
          </div>
          <button onClick={() => setMostrarDestaque(true)} style={{ background: 'white', color: '#111827', border: 'none', borderRadius: 12, padding: '11px 20px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Zap size={14} color="#16A34A" /> Criar Destaque TOP
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <DestaqueTopForm isPro={isPro} onFechar={() => setMostrarDestaque(false)} />
        </div>
      )}

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
interface Assinatura {
  status: string
  plano_slug: string
  valor: number
  inicio: string
  fim: string | null
}

// ── SecaoFundador ────────────────────────────────────────────────
interface VagaFundador {
  categoria_id: string
  categoria_nome: string
  categoria_slug: string
  categoria_icone: string
  maximo: number
  tomadas: number
  disponiveis: number
  esgotado: boolean
}
interface StatusFundador {
  tem_selo: boolean
  prazo_encerrado: boolean
  prazo_fim: string
  valor: number
  selo: {
    id: string
    status: string
    beneficio_fim: string | null
    categorias: { nome: string; slug: string; icone: string } | null
  } | null
}

function SecaoFundador() {
  const [status, setStatus]         = useState<StatusFundador | null>(null)
  const [vagas, setVagas]           = useState<VagaFundador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [checkout, setCheckout]     = useState<string | null>(null) // categoria_id selecionada
  const [salvando, setSalvando]     = useState(false)
  const [urlPag, setUrlPag]         = useState<string | null>(null)
  const [erro, setErro]             = useState<string | null>(null)
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      try {
        const [st, vg] = await Promise.all([
          apiFetch<StatusFundador>('/fundador/status'),
          apiFetch<{ vagas: VagaFundador[] }>('/fundador/vagas'),
        ])
        setStatus(st)
        setVagas(vg.vagas || [])
      } catch { /* ignora */ }
      finally { setCarregando(false) }
    }
    carregar()
  }, [])

  const handleCheckout = async () => {
    if (!checkout) return
    setSalvando(true)
    setErro(null)
    try {
      const r = await apiFetch<{ ok: boolean; url: string }>('/fundador/checkout', {
        method: 'POST',
        body: JSON.stringify({ categoria_id: checkout }),
      })
      setUrlPag(r.url)
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar pagamento')
    } finally { setSalvando(false) }
  }

  const handleVerificar = async () => {
    setVerificando(true)
    try {
      const r = await apiFetch<{ ativo: boolean; beneficio_fim?: string }>('/fundador/verificar')
      if (r.ativo) {
        const [st] = await Promise.all([apiFetch<StatusFundador>('/fundador/status')])
        setStatus(st)
        setUrlPag(null)
        setCheckout(null)
      }
    } catch { /* ignora */ }
    finally { setVerificando(false) }
  }

  if (carregando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <Loader2 size={28} color="#F59E0B" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  const prazoFim = status ? new Date(status.prazo_fim) : new Date('2026-06-16T23:59:59-03:00')
  const diasRestantes = Math.max(0, Math.ceil((prazoFim.getTime() - Date.now()) / 86400000))

  // Se já tem selo ativo
  if (status?.selo?.status === 'ativo') {
    const fim = status.selo.beneficio_fim ? new Date(status.selo.beneficio_fim) : null
    const diasBeneficio = fim ? Math.max(0, Math.ceil((fim.getTime() - Date.now()) / 86400000)) : 0
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ background: 'linear-gradient(135deg, #78350F, #92400E)', borderRadius: 24, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🥇</div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, color: '#FEF3C7', marginBottom: 8 }}>
            Você é um Fundador!
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(254,243,199,0.8)', marginBottom: 20 }}>
            Categoria: {status.selo.categorias?.icone} {status.selo.categorias?.nome}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, color: '#FDE68A' }}>{diasBeneficio}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(254,243,199,0.7)' }}>dias de benefício</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#FDE68A' }}>Topo da busca</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(254,243,199,0.7)' }}>sempre no 1º lugar</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 14, color: '#FDE68A' }}>🥇 Vitalício</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(254,243,199,0.7)' }}>badge permanente</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Aguardando pagamento
  if (urlPag) {
    return (
      <div style={{ maxWidth: 540 }}>
        <div style={{ background: '#FFFBEB', border: '2px solid #FDE68A', borderRadius: 20, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 18, color: '#92400E', marginBottom: 8 }}>
            Finalize o pagamento
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#78350F', marginBottom: 20 }}>
            Clique abaixo para pagar via PIX, cartão ou boleto. Após confirmar, volte aqui e clique em "Já paguei".
          </p>
          <a href={urlPag} target="_blank" rel="noreferrer" style={{
            display: 'block', background: '#F59E0B', color: '#111827',
            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15,
            borderRadius: 12, padding: '14px 24px', textDecoration: 'none', marginBottom: 12,
          }}>
            Ir para pagamento →
          </a>
          <button onClick={handleVerificar} disabled={verificando} style={{
            background: 'transparent', border: '2px solid #D97706', borderRadius: 12,
            color: '#92400E', fontFamily: 'Poppins, sans-serif', fontWeight: 600,
            fontSize: 14, padding: '12px 24px', cursor: verificando ? 'not-allowed' : 'pointer', width: '100%',
          }}>
            {verificando ? 'Verificando...' : 'Já paguei — verificar'}
          </button>
        </div>
      </div>
    )
  }

  // Prazo encerrado
  if (status?.prazo_encerrado) {
    return (
      <div style={{ maxWidth: 540 }}>
        <div style={{ background: '#F3F4F6', border: '2px solid #E5E7EB', borderRadius: 20, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 18, color: '#6B7280' }}>
            Período Fundador encerrado
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF', marginTop: 8 }}>
            As vagas de Fundador estavam disponíveis até 16/06/2026.
          </p>
        </div>
      </div>
    )
  }

  // Tela principal — lista de categorias
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Banner explicativo */}
      <div style={{ background: 'linear-gradient(135deg, #78350F, #B45309)', borderRadius: 20, padding: '24px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 52, flexShrink: 0 }}>🥇</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#FEF3C7', marginBottom: 6 }}>
              Seja um dos primeiros — Fundador {diasRestantes > 0 ? `(${diasRestantes} dias restantes)` : ''}
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(254,243,199,0.85)', margin: 0, lineHeight: 1.6 }}>
              Apenas <strong style={{ color: '#FDE68A' }}>2 vagas por categoria</strong>. Pagamento único de <strong style={{ color: '#FDE68A' }}>R$197</strong>. Seu comércio aparece sempre no topo das buscas por 6 meses + badge 🥇 vitalício no perfil. Depois que as vagas acabarem, esta opção some para sempre.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 20px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 26, color: '#FDE68A' }}>R$197</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(254,243,199,0.7)' }}>pagamento único</div>
          </div>
        </div>
      </div>

      {/* Benefícios em linha */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { icon: '🏆', titulo: 'Topo da busca', sub: '6 meses de ranking prioritário' },
          { icon: '🥇', titulo: 'Badge vitalício', sub: 'Aparece no perfil para sempre' },
          { icon: '📣', titulo: 'Social proof', sub: '"Fundador do ZappiCidade"' },
          { icon: '🔒', titulo: 'Máx. 2 por cat.', sub: 'Exclusividade garantida' },
        ].map(b => (
          <div key={b.titulo} style={{ flex: '1 1 180px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24 }}>{b.icon}</span>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, color: '#111827' }}>{b.titulo}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7280' }}>{b.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Seleção de categoria */}
      <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: '24px 28px' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>
          Escolha sua categoria
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
          Selecione a categoria em que seu negócio compete. Você garante posição de destaque exclusiva nela.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
          {vagas.map(v => {
            const selecionada = checkout === v.categoria_id
            const esgotado    = v.esgotado
            return (
              <button
                key={v.categoria_id}
                disabled={esgotado}
                onClick={() => !esgotado && setCheckout(v.categoria_id)}
                style={{
                  padding: '12px 14px', borderRadius: 12, cursor: esgotado ? 'not-allowed' : 'pointer',
                  border: `2px solid ${selecionada ? '#D97706' : esgotado ? '#F3F4F6' : '#E5E7EB'}`,
                  background: selecionada ? '#FEF3C7' : esgotado ? '#F9FAFB' : 'white',
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  opacity: esgotado ? 0.6 : 1, transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 22 }}>{v.categoria_icone}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: esgotado ? '#9CA3AF' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.categoria_nome}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: esgotado ? '#EF4444' : '#16A34A', fontWeight: 600, marginTop: 2 }}>
                    {esgotado ? 'Esgotado' : `${v.disponiveis} vaga${v.disponiveis !== 1 ? 's' : ''}`}
                  </div>
                </div>
                {selecionada && <Check size={16} color="#D97706" style={{ flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>

        {erro && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#DC2626' }}>
            {erro}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={!checkout || salvando}
          style={{
            background: checkout && !salvando ? '#F59E0B' : '#E5E7EB',
            color: checkout && !salvando ? '#111827' : '#9CA3AF',
            border: 'none', borderRadius: 14, padding: '16px 32px',
            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15,
            cursor: checkout && !salvando ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
          }}>
          {salvando ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Crown size={18} />}
          {salvando ? 'Gerando...' : `Garantir minha vaga — R$197`}
        </button>
      </div>
    </div>
  )
}

// ── SecaoDestaqueTop ─────────────────────────────────────────────
function SecaoDestaqueTop() {
  const [isPro, setIsPro] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await apiFetch('/pagamento/status') as any
        const assinatura = res?.assinatura
        setIsPro(assinatura?.status === 'ativa')
      } catch {
        setIsPro(false)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  if (carregando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <Loader2 size={28} color="#16A34A" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Explicação */}
      <div style={{ background: 'linear-gradient(135deg, #111827, #1F2937)', borderRadius: 20, padding: '24px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Megaphone size={26} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 18, color: 'white', marginBottom: 4 }}>
            O que é o Destaque TOP?
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
            Envie sua promoção ou mensagem diretamente no WhatsApp dos clientes que autorizaram receber novidades do seu negócio. É a forma mais direta de alcançar quem já tem interesse.
          </p>
        </div>
      </div>

      <DestaqueTopForm isPro={isPro} />
    </div>
  )
}

const PLANO_INFO: Record<string, { label: string; preco: string; periodo: string; recursos: string[] }> = {
  basico:      { label: 'Básico',       preco: 'R$ 0',      periodo: 'grátis',   recursos: ['Perfil básico do negócio', 'Aparece nas buscas do Zappi', 'Horários de funcionamento', 'QR Code básico'] },
  pro_mensal:  { label: 'PRO Mensal',   preco: 'R$59,90',   periodo: '/mês',     recursos: ['Galeria de 4 fotos', 'Destaque nas buscas', 'Promoções ilimitadas', '📣 Destaque TOP incluso', 'Analytics completo', '🥇 Elegível ao Selo Fundador'] },
  pro_3meses:  { label: 'PRO 3 Meses', preco: 'R$149,90',  periodo: '/3 meses', recursos: ['Galeria de 4 fotos', 'Destaque nas buscas', 'Promoções ilimitadas', '📣 Destaque TOP incluso', 'Analytics completo', '🥇 Elegível ao Selo Fundador'] },
  pro_6meses:  { label: 'PRO 6 Meses', preco: 'R$269,90',  periodo: '/6 meses', recursos: ['Galeria de 4 fotos', 'Destaque nas buscas', 'Promoções ilimitadas', '📣 Destaque TOP incluso', 'Analytics completo', '🥇 Elegível ao Selo Fundador'] },
  pro_12meses: { label: 'PRO 12 Meses', preco: 'R$479,90', periodo: '/12 meses', recursos: ['Galeria de 4 fotos', 'Destaque nas buscas', 'Promoções ilimitadas', '📣 Destaque TOP incluso', 'Analytics completo', '🥇 Elegível ao Selo Fundador'] },
}

function SecaoFaturamento() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        // Primeiro tenta ativar consultando o Asaas (resolve casos em que webhook falhou)
        const verificado = await apiFetch<{ ativa: boolean }>('/pagamento/verificar').catch(() => null)
        // Depois busca o status atualizado
        const r = await apiFetch<{ assinatura: Assinatura | null }>('/pagamento/status')
        setAssinatura(r.assinatura)
      } catch {
        // ignora — mostra básico
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const isPro = assinatura?.status === 'ativa'
  const slugAtual = isPro ? assinatura!.plano_slug : 'basico'
  const infoAtual = PLANO_INFO[slugAtual] ?? PLANO_INFO.basico

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const planosGrid = [
    { slug: 'basico', cor: '#3B82F6', bg: '#EFF6FF' },
    { slug: 'pro_mensal', cor: '#16A34A', bg: '#F0FDF4', destaque: true },
    { slug: 'pro_3meses', cor: '#7C3AED', bg: '#F5F3FF' },
    { slug: 'pro_6meses', cor: '#EA580C', bg: '#FFF7ED', featured: true },
    { slug: 'pro_12meses', cor: '#0891B2', bg: '#F0FDFA' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', margin: '0 0 6px' }}>Faturamento & Plano</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF', margin: 0 }}>Gerencie sua assinatura e mude de plano</p>
      </div>

      {/* Plano atual */}
      {carregando ? (
        <div style={{ background: '#F9FAFB', borderRadius: 20, padding: '28px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Loader2 size={20} color="#9CA3AF" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9CA3AF' }}>Carregando assinatura...</span>
        </div>
      ) : (
        <div style={{
          background: isPro ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' : 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
          border: isPro ? '1.5px solid #BBF7D0' : '1.5px solid #E2E8F0',
          borderRadius: 20, padding: '22px 28px', marginBottom: 32,
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: isPro ? '#16A34A' : '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isPro ? <Crown size={24} color="white" /> : <CreditCard size={24} color="white" />}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>
              Plano atual:{' '}
              <span style={{ color: isPro ? '#16A34A' : '#3B82F6' }}>{infoAtual.label}</span>
              {isPro && (
                <span style={{ marginLeft: 8, background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 999, fontFamily: 'Poppins, sans-serif' }}>ATIVO</span>
              )}
            </div>
            {isPro && assinatura?.inicio && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4B5563', margin: '4px 0 0' }}>
                Ativo desde {formatarData(assinatura.inicio)}
                {assinatura.fim ? ` · Válido até ${formatarData(assinatura.fim)}` : ' · Renovação automática mensal'}
              </p>
            )}
            {!isPro && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4B5563', margin: '4px 0 0' }}>
                Mude para PRO e desbloqueie galeria, promoções e destaque nas buscas
              </p>
            )}
          </div>
          {!isPro && (
            <Link href="/comerciante/onboarding" style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', color: 'white', borderRadius: 12, padding: '10px 18px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Crown size={14} /> Assinar PRO
            </Link>
          )}
        </div>
      )}

      {/* Cards de plano */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {planosGrid.map(({ slug, cor, bg, destaque, featured }) => {
          const info = PLANO_INFO[slug]
          const ativo = slug === slugAtual && isPro || (slug === 'basico' && !isPro)
          return (
            <div key={slug} style={{
              background: ativo ? cor : 'white',
              border: `2px solid ${ativo ? cor : destaque ? cor + '60' : '#E5E7EB'}`,
              borderRadius: 20, padding: '20px 16px', position: 'relative',
              display: 'flex', flexDirection: 'column', gap: 14,
              boxShadow: ativo ? `0 12px 36px ${cor}35` : '0 2px 8px rgba(31,41,55,0.04)',
              transition: 'transform 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {featured && !ativo && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#EA580C', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap', fontFamily: 'Poppins, sans-serif' }}>
                  MAIS ESCOLHIDO
                </div>
              )}
              {ativo && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap', fontFamily: 'Poppins, sans-serif' }}>
                  PLANO ATUAL
                </div>
              )}
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.85rem', color: ativo ? 'white' : '#111827', marginBottom: 6 }}>{info.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: ativo ? 'white' : cor, lineHeight: 1 }}>{info.preco}</span>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: ativo ? 'rgba(255,255,255,0.75)' : '#9CA3AF' }}>{info.periodo}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {info.recursos.map(r => (
                  <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: ativo ? 'rgba(255,255,255,0.25)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={9} color={ativo ? 'white' : cor} strokeWidth={3} />
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: ativo ? 'rgba(255,255,255,0.9)' : '#4B5563', lineHeight: 1.4 }}>{r}</span>
                  </div>
                ))}
              </div>
              {ativo ? (
                <div style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
                  Ativo ✓
                </div>
              ) : slug === 'basico' ? (
                <div style={{ width: '100%', padding: '10px', borderRadius: 12, background: '#F1F5F9', color: '#94A3B8', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
                  Plano grátis
                </div>
              ) : (
                <Link href="/comerciante/onboarding" style={{ width: '100%', padding: '10px', borderRadius: 12, background: cor, color: 'white', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                  Assinar
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── GaleriaFotos ─────────────────────────────────────────────────
function GaleriaFotos({ isPro, comercioId }: { isPro: boolean; comercioId: string }) {
  const [fotos, setFotos] = useState<string[]>(['', '', '', ''])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState<number | null>(null)
  const [slide, setSlide] = useState(0)
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    apiFetch<any>('/comerciante/perfil').then(p => {
      const g = p.comercio?.fotos_galeria
      if (Array.isArray(g)) {
        const arr = [...g]
        while (arr.length < 4) arr.push('')
        setFotos(arr)
      }
    }).catch(() => {}).finally(() => setCarregando(false))
  }, [comercioId])

  const uploadFoto = async (indice: number, file: File) => {
    setEnviando(indice)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      try {
        const r = await apiFetch<any>('/comerciante/upload/galeria', {
          method: 'POST',
          body: JSON.stringify({ base64, extensao: 'jpg', indice }),
        })
        const arr = Array.isArray(r.galeria) ? r.galeria : [...fotos]
        while (arr.length < 4) arr.push('')
        setFotos(arr)
        setSlide(indice)
      } catch {
        alert('Erro ao enviar foto.')
      } finally { setEnviando(null) }
    }
    reader.readAsDataURL(file)
  }

  const removerFoto = async (indice: number) => {
    setEnviando(indice)
    try {
      const r = await apiFetch<any>(`/comerciante/upload/galeria/${indice}`, { method: 'DELETE' })
      const arr = Array.isArray(r.galeria) ? r.galeria : [...fotos]
      while (arr.length < 4) arr.push('')
      setFotos(arr)
      if (slide >= indice && slide > 0) setSlide(slide - 1)
    } catch {
      alert('Erro ao remover foto.')
    } finally { setEnviando(null) }
  }

  const fotosPreenchidas = fotos.filter(f => f).length

  // --- Locked (plano básico) ---
  if (!isPro) {
    return (
      <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}>
        {/* Fundo desfocado simulando galeria */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, opacity: 0.15, marginBottom: -120, pointerEvents: 'none' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ aspectRatio: '4/3', background: '#F3F4F6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={28} color="#9CA3AF" />
            </div>
          ))}
        </div>
        {/* Overlay de bloqueio */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.85)', borderRadius: 14, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #16A34A, #15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 8px 20px rgba(22,163,74,0.3)' }}>
            <Crown size={24} color="white" />
          </div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 8 }}>
            Galeria de Fotos — Recurso PRO
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', maxWidth: 300, lineHeight: 1.6, margin: '0 0 20px' }}>
            Adicione até 4 fotos do seu negócio para mostrar produtos, ambiente e diferenciais aos seus clientes.
          </p>
          <a href="/planos" style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
            Ver planos PRO →
          </a>
        </div>
      </div>
    )
  }

  // --- PRO: carrossel + upload ---
  if (carregando) return <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#16A34A' }} /></div>

  const fotoAtual = fotos[slide]

  return (
    <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={16} color="#16A34A" /> Galeria de Fotos
          <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, fontFamily: 'Poppins, sans-serif', letterSpacing: '0.05em' }}>PRO</span>
        </h3>
        <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>{fotosPreenchidas}/4 fotos</span>
      </div>

      {/* Carrossel principal */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden', background: '#F9FAFB', marginBottom: 12, border: '1.5px solid #E5E7EB' }}>
        {fotoAtual ? (
          <>
            <img src={fotoAtual} alt={`Foto ${slide + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Botão remover */}
            <button
              onClick={() => removerFoto(slide)}
              disabled={enviando !== null}
              style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {enviando === slide ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={14} />}
            </button>
          </>
        ) : (
          <div
            onClick={() => enviando === null && fileRefs[slide].current?.click()}
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 10 }}
          >
            {enviando === slide ? (
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#16A34A' }} />
            ) : (
              <>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={22} color="#16A34A" />
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>Clique para adicionar foto {slide + 1}</span>
              </>
            )}
          </div>
        )}

        {/* Setas de navegação */}
        {slide > 0 && (
          <button onClick={() => setSlide(s => s - 1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} />
          </button>
        )}
        {slide < 3 && (
          <button onClick={() => setSlide(s => s + 1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} />
          </button>
        )}

        {/* Indicador de slide */}
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
          {[0,1,2,3].map(i => (
            <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 6, height: 6, borderRadius: 999, border: 'none', cursor: 'pointer', background: i === slide ? 'white' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s', padding: 0 }} />
          ))}
        </div>
      </div>

      {/* Miniaturas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[0,1,2,3].map(i => {
          const foto = fotos[i]
          const ativo = i === slide
          return (
            <div
              key={i}
              onClick={() => { setSlide(i); if (!foto && enviando === null) fileRefs[i].current?.click() }}
              style={{ aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${ativo ? '#16A34A' : '#E5E7EB'}`, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'border-color 0.15s' }}
            >
              {foto ? (
                <img src={foto} alt={`Miniatura ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : enviando === i ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#16A34A' }} />
              ) : (
                <Plus size={16} color="#9CA3AF" />
              )}
              {/* Inputs ocultos */}
              <input
                ref={fileRefs[i]}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) uploadFoto(i, e.target.files[0]); e.target.value = '' }}
              />
            </div>
          )
        })}
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9CA3AF', margin: '10px 0 0', textAlign: 'center' }}>
        Clique em uma miniatura vazia para adicionar. Clique no ✕ para remover.
      </p>
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
  const [isPro, setIsPro] = useState(false)
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
      // Verifica se tem assinatura PRO ativa
      setIsPro(!!perfil.assinatura)
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

        {/* Galeria de fotos (PRO) */}
        <GaleriaFotos isPro={isPro} comercioId={comercio.id} />

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
    const params = new URLSearchParams(window.location.search)
    if (params.get('setup') === '1') {
      setSeção('perfil')
      setToast({ msg: '🎉 Conta ativada! Complete as informações do seu negócio abaixo.', tipo: 'sucesso' })
      setTimeout(() => setToast(null), 5000)
      window.history.replaceState({}, '', '/comerciante/dashboard')
    }
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
    { id: 'dashboard',    icon: <LayoutDashboard size={18} />, label: 'Visão Geral' },
    { id: 'campanhas',    icon: <Megaphone size={18} />,       label: 'Campanhas' },
    { id: 'destaque_top', icon: <Zap size={18} />,             label: 'Destaque TOP', badge: 'PRO' },
    { id: 'fundador',     icon: <Crown size={18} />,           label: 'Selo Fundador', badge: 'NOVO' },
    { id: 'perfil',       icon: <Store size={18} />,           label: 'Meu Negócio' },
    { id: 'leads',        icon: <Users size={18} />,           label: 'Clientes' },
    { id: 'faturamento',  icon: <CreditCard size={18} />,      label: 'Faturamento' },
  ]

  const titulos: Record<string, string> = {
    dashboard: 'Visão Geral', campanhas: 'Campanhas & Anúncios',
    destaque_top: 'Destaque TOP',
    fundador: 'Selo Fundador',
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
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {'badge' in item && item.badge && (
                <span style={{ background: '#16A34A', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999, fontFamily: 'Poppins, sans-serif', letterSpacing: '0.04em' }}>
                  {item.badge}
                </span>
              )}
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
            {seção === 'campanhas'    && <SecaoCampanhas dados={dados} aprovado={statusVerificacao === 'aprovado'} onCriarAnuncio={() => { if (statusVerificacao !== 'aprovado') { mostrarToast('Aguarde a aprovação da sua conta pelo administrador.', 'erro'); return } setModalAnuncio(true) }} />}
            {seção === 'destaque_top' && <SecaoDestaqueTop />}
            {seção === 'fundador'     && <SecaoFundador />}
            {seção === 'perfil'       && <SecaoMeuNegocio />}
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
      {modalVender  && <ModalVenderAgora  onClose={() => setModalVender(false)}  onSalvar={(r: any) => { setModalVender(false); if (r?.sucesso) { mostrarToast('⚡ Promoção ativada! Já aparece para clientes da cidade.'); recarregarDados() } else { mostrarToast(r?.erro || 'Erro ao ativar promoção. Tente novamente.', 'erro') } }} />}
      {modalAnuncio && <ModalCriarAnuncio onClose={() => setModalAnuncio(false)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </div>
  )
}
