'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Search, MapPin, Star, CheckCircle2, ChevronRight,
  Zap, ArrowLeft, Building2, Phone, Sparkles,
  Camera, Copy, Check, ChevronDown
} from 'lucide-react'
import { obterSessao, salvarSessao } from '@/lib/auth'
import { apiFetch } from '@/lib/auth'
import { api } from '@/lib/api'

// ── Tipos ──────────────────────────────────────────────────────
interface Comercio {
  id: string; nome: string; slug: string
  categoria_id?: string; categoria_nome: string; categoria_icone: string
  categoria_slug?: string
  bairro: string; endereco: string
  avaliacao: number; total_avaliacoes: number
  telefone: string; logo_url: string
}

interface Categoria {
  id: string; nome: string; slug: string; icone: string
}

const DIAS = ['segunda','terca','quarta','quinta','sexta','sabado','domingo']
const DIAS_LABEL: Record<string, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom'
}

const PLANOS = [
  {
    nome: 'Basic', preco: 0, icone: '⚡', label: 'Grátis para sempre',
    descricao: 'Ideal para quem quer aparecer no ZappiCidade sem custo.',
    recursos: [
      'Perfil público com nome e categoria',
      'Horários de funcionamento visíveis',
      'Link WhatsApp direto para clientes',
      'QR Code do seu negócio',
      'Aparece nas buscas da cidade',
    ],
    limitacoes: [
      'Sem foto de capa personalizada',
      'Sem promoções e ofertas',
      'Sem destaque na busca',
      'Sem analytics de visitas',
    ],
    destaque: false,
  },
  {
    nome: 'Pro', preco: 59.9, icone: '🚀', label: 'Mais popular',
    descricao: 'Para quem quer atrair mais clientes e vender mais todo dia.',
    recursos: [
      'Tudo do plano Basic',
      'Foto de capa e galeria de fotos',
      'Promoções e ofertas ilimitadas',
      'Destaque nas buscas — aparece antes dos concorrentes',
      'Analytics: veja quantos clientes visitaram seu perfil',
      'Disparo de promoções via WhatsApp',
      'Selo de negócio verificado ✓',
      'Suporte prioritário via WhatsApp',
    ],
    limitacoes: [],
    destaque: true,
  },
]

// ── Step Indicator ─────────────────────────────────────────────
function StepIndicator({ passo, total }: { passo: number; total: number }) {
  const labels = ['Encontrar', 'Confirmar', 'Personalizar', 'Ativar']
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 40 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.3s ease',
              background: i < passo ? '#16A34A' : i === passo ? 'white' : '#F9FAFB',
              color: i < passo ? 'white' : i === passo ? '#16A34A' : '#9CA3AF',
              border: i === passo ? '2px solid #16A34A' : i < passo ? 'none' : '1.5px solid #E5E7EB',
              boxShadow: i < passo ? '0 4px 12px rgba(22,163,74,0.3)' : i === passo ? '0 0 0 4px rgba(22,163,74,0.12)' : 'none',
            }}>
              {i < passo ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
              color: i === passo ? '#16A34A' : i < passo ? '#16A34A' : '#9CA3AF',
              whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{labels[i]}</span>
          </div>
          {i < total - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '0 8px', marginBottom: 22, borderRadius: 99,
              background: i < passo ? '#16A34A' : '#E5E7EB',
              transition: 'background 0.4s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Passo 1: Buscar negócio ────────────────────────────────────
function Passo1({ onSelecionar }: { onSelecionar: (c: Comercio) => void }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Comercio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (busca.length < 2) { setResultados([]); setBuscado(false); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setCarregando(true)
      try {
        const res = await api.comercios.listar({ busca, limit: 6 })
        setResultados(res.data)
        setBuscado(true)
      } catch { setResultados([]) }
      finally { setCarregando(false) }
    }, 400)
  }, [busca])

  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 28 }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
          background: '#DCFCE7', border: '1px solid rgba(22,163,74,0.2)',
          borderRadius: 999, padding: '6px 14px',
        }}>
          <Sparkles size={13} color="#16A34A" />
          <span style={{ color: '#16A34A', fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Já temos seu negócio cadastrado!
          </span>
        </div>

        <h2 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: '#111827',
          fontFamily: 'Poppins, sans-serif', fontWeight: 800, lineHeight: 1.15, marginBottom: 12,
        }}>
          Vamos encontrar<br />seu estabelecimento
        </h2>
        <p style={{ color: '#4B5563', fontSize: 15, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
          Digite o nome do seu negócio. Temos mais de 1.191 estabelecimentos de Barcarena no nosso banco.
        </p>
      </div>

      {/* Search bar */}
      <div style={{
        background: 'white', border: '2px solid #E5E7EB', borderRadius: 16,
        boxShadow: '0 4px 16px rgba(31,41,55,0.06)', marginBottom: 20,
        transition: 'border-color 0.2s',
      }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = '#16A34A')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
          <Search size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Ex: Farmácia Popular, Restaurante do João..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: '#111827', fontFamily: 'Inter, sans-serif',
            }}
          />
          {carregando && (
            <div style={{
              width: 16, height: 16, border: '2px solid #E5E7EB',
              borderTopColor: '#16A34A', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite', flexShrink: 0,
            }} />
          )}
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resultados.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSelecionar(c)}
              style={{
                background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 16,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                animation: `fadeUp 0.3s ease ${i * 0.05}s forwards`, opacity: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#16A34A'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.12)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: '#F9FAFB', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, overflow: 'hidden',
              }}>
                {c.logo_url
                  ? <img src={c.logo_url} alt="" style={{ width: 44, height: 44, objectFit: 'cover' }} />
                  : c.categoria_icone || '🏪'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#111827', fontWeight: 600, fontSize: 14, fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>
                  {c.nome}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#4B5563', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{c.categoria_nome}</span>
                  {c.bairro && (
                    <>
                      <span style={{ color: '#E5E7EB' }}>·</span>
                      <span style={{ color: '#4B5563', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Inter, sans-serif' }}>
                        <MapPin size={10} /> {c.bairro}
                      </span>
                    </>
                  )}
                  {c.avaliacao && (
                    <>
                      <span style={{ color: '#E5E7EB' }}>·</span>
                      <span style={{ color: '#854D0E', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Star size={10} fill="#FACC15" color="#FACC15" /> {c.avaliacao}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {buscado && resultados.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          background: '#F9FAFB', borderRadius: 16,
          border: '1.5px dashed #E5E7EB',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#4B5563', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
            Nenhum resultado para <strong style={{ color: '#111827' }}>"{busca}"</strong>
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8, fontFamily: 'Inter, sans-serif' }}>
            Tente um nome mais curto ou diferente
          </p>
        </div>
      )}
    </div>
  )
}

// ── Passo 2: Confirmar negócio ─────────────────────────────────
function Passo2({ comercio, onConfirmar, onVoltar, carregando }: {
  comercio: Comercio; onConfirmar: () => void; onVoltar: () => void; carregando: boolean
}) {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#111827',
          fontFamily: 'Poppins, sans-serif', fontWeight: 800, lineHeight: 1.15, marginBottom: 10,
        }}>
          É este o seu negócio?
        </h2>
        <p style={{ color: '#4B5563', fontSize: 15, fontFamily: 'Inter, sans-serif' }}>
          Confirme que este é o seu estabelecimento para continuar.
        </p>
      </div>

      {/* Card do comércio */}
      <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(31,41,55,0.06)' }}>
        <div style={{
          height: 90, background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 48 }}>{comercio.categoria_icone || '🏪'}</span>
        </div>

        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <h3 style={{ color: '#111827', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                {comercio.nome}
              </h3>
              <span style={{
                display: 'inline-block', background: '#DCFCE7', color: '#16A34A',
                fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
                padding: '3px 12px', borderRadius: 999,
              }}>
                {comercio.categoria_nome}
              </span>
            </div>
            {comercio.avaliacao && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 999, padding: '5px 12px',
              }}>
                <Star size={12} fill="#FACC15" color="#FACC15" />
                <span style={{ color: '#854D0E', fontSize: 12, fontWeight: 700 }}>{comercio.avaliacao}</span>
                <span style={{ color: '#9CA3AF', fontSize: 11 }}>({comercio.total_avaliacoes})</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comercio.bairro && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                <MapPin size={13} color="#16A34A" />
                <span>{comercio.bairro}, Barcarena-PA</span>
              </div>
            )}
            {comercio.endereco && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#4B5563', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                <Building2 size={13} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{comercio.endereco}</span>
              </div>
            )}
            {comercio.telefone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4B5563', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                <Phone size={13} color="#9CA3AF" />
                <span>{comercio.telefone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onConfirmar}
          disabled={carregando}
          style={{
            width: '100%', padding: '15px', borderRadius: 999, border: 'none',
            background: carregando ? 'rgba(22,163,74,0.6)' : '#16A34A',
            color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
            cursor: carregando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!carregando) { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
          onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {carregando ? (
            <>
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Vinculando...
            </>
          ) : (
            <><CheckCircle2 size={16} /> Sim, é o meu negócio!</>
          )}
        </button>
        <button
          onClick={onVoltar}
          style={{
            width: '100%', padding: '14px', borderRadius: 999,
            background: 'transparent', border: '2px solid #E5E7EB',
            color: '#4B5563', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Poppins, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}
        >
          <ArrowLeft size={14} /> Não é esse, buscar outro
        </button>
      </div>
    </div>
  )
}

// ── Passo 3: Personalizar ──────────────────────────────────────
function Passo3({ comercio, onContinuar }: { comercio: Comercio; onContinuar: () => void }) {
  const [whatsapp, setWhatsapp] = useState(comercio.telefone || '')
  const [descricao, setDescricao] = useState('')
  const [endereco, setEndereco] = useState(comercio.endereco || '')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState(comercio.categoria_id || '')
  const [capaFile, setCapaFile] = useState<File | null>(null)
  const [capaPreview, setCapaPreview] = useState('')
  const [slugCopiado, setSlugCopiado] = useState(false)
  const [horarios, setHorarios] = useState<Record<string, { aberto: string; fechado: string; aberto_flag: boolean }>>(() =>
    Object.fromEntries(DIAS.map(d => [d, { aberto: '08:00', fechado: '18:00', aberto_flag: d !== 'domingo' }]))
  )
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.comercios.categorias().then(setCategorias).catch(() => {})
  }, [])

  const handleCapa = (file: File) => {
    const MAX_MB = 8
    if (file.size > MAX_MB * 1024 * 1024) {
      setErro(`A imagem é muito grande. Máximo ${MAX_MB}MB.`)
      return
    }
    setErro('')
    setCapaFile(file)
    setCapaPreview(URL.createObjectURL(file))
  }

  const copiarSlug = () => {
    navigator.clipboard.writeText(`zappicidade.com.br/${comercio.slug}`)
    setSlugCopiado(true)
    setTimeout(() => setSlugCopiado(false), 2000)
  }

  const salvar = async () => {
    setErro('')
    setCarregando(true)
    try {
      if (capaFile) {
        const base64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = rej
          reader.readAsDataURL(capaFile)
        })
        const extensao = capaFile.name.split('.').pop() || 'jpg'
        await apiFetch('/comerciante/upload/capa', { method: 'POST', body: JSON.stringify({ base64, extensao }) })
      }
      const horariosFinais = Object.fromEntries(
        Object.entries(horarios).map(([dia, h]) => [
          dia,
          h.aberto_flag ? { abre: h.aberto.replace(':', ''), fecha: h.fechado.replace(':', '') } : null
        ])
      )
      await apiFetch('/comerciante/perfil/comercio', {
        method: 'PUT',
        body: JSON.stringify({ whatsapp: whatsapp.replace(/\D/g, ''), descricao, endereco, categoria_id: categoriaId || undefined, horarios: horariosFinais }),
      })
      onContinuar()
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'white', border: '1.5px solid #E5E7EB',
    borderRadius: 12, fontSize: 14, color: '#111827',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#111827', fontSize: 11, fontWeight: 700,
    fontFamily: 'Poppins, sans-serif', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const categoriaSelecionada = categorias.find(c => c.id === categoriaId)

  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#111827',
          fontFamily: 'Poppins, sans-serif', fontWeight: 800, lineHeight: 1.15, marginBottom: 10,
        }}>
          Personalize seu perfil
        </h2>
        <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
          Essas informações aparecem para os clientes quando pesquisam pelo seu negócio.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Foto de capa */}
        <div>
          <label style={labelStyle}>Foto de capa</label>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) handleCapa(e.target.files[0]) }} />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 130, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              border: '2px dashed #E5E7EB', background: capaPreview ? 'transparent' : '#F9FAFB',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.background = capaPreview ? 'transparent' : '#F0FDF4' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = capaPreview ? 'transparent' : '#F9FAFB' }}
          >
            {capaPreview ? (
              <img src={capaPreview} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Camera size={26} color="#9CA3AF" style={{ marginBottom: 8 }} />
                <p style={{ color: '#4B5563', fontSize: 13, fontFamily: 'Inter, sans-serif', margin: 0 }}>Clique para enviar uma foto de capa</p>
                <p style={{ color: '#9CA3AF', fontSize: 11, margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>JPG, PNG ou WebP — recomendado 1200×400px</p>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label style={labelStyle}>WhatsApp para contato</label>
          <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
            placeholder="(91) 99999-9999" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#16A34A')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
        </div>

        {/* Sobre o negócio */}
        <div>
          <label style={labelStyle}>
            Sobre o negócio <span style={{ textTransform: 'none', fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
          </label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
            placeholder="Ex: Restaurante familiar com especialidade em frango no tucupi..." rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={e => (e.target.style.borderColor = '#16A34A')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
        </div>

        {/* Endereço */}
        <div>
          <label style={labelStyle}>Confirme o endereço</label>
          <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)}
            placeholder="Ex: Rua das Flores, 123 — Centro" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#16A34A')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
        </div>

        {/* Categoria */}
        {categorias.length > 0 && (
          <div>
            <label style={labelStyle}>Categoria</label>
            <div style={{ position: 'relative' }}>
              {categoriaSelecionada && (
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', zIndex: 1 }}>
                  {categoriaSelecionada.icone}
                </span>
              )}
              <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', paddingRight: 40, cursor: 'pointer', paddingLeft: categoriaSelecionada ? 40 : 14 }}
                onFocus={e => (e.target.style.borderColor = '#16A34A')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              >
                <option value="">Selecione a categoria</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
              </select>
              <ChevronDown size={15} color="#9CA3AF" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Horários */}
        <div>
          <label style={labelStyle}>Horário de funcionamento</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DIAS.map(dia => (
              <div key={dia} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: horarios[dia].aberto_flag ? '#F0FDF4' : '#F9FAFB',
                border: `1.5px solid ${horarios[dia].aberto_flag ? 'rgba(22,163,74,0.2)' : '#E5E7EB'}`,
                transition: 'all 0.2s',
              }}>
                <button
                  onClick={() => setHorarios(h => ({ ...h, [dia]: { ...h[dia], aberto_flag: !h[dia].aberto_flag } }))}
                  style={{
                    width: 36, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: horarios[dia].aberto_flag ? '#16A34A' : '#E5E7EB',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%',
                    background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    left: horarios[dia].aberto_flag ? 19 : 3, transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{
                  width: 28, fontSize: 12, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
                  color: horarios[dia].aberto_flag ? '#111827' : '#9CA3AF',
                }}>
                  {DIAS_LABEL[dia]}
                </span>
                {horarios[dia].aberto_flag ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <input type="time" value={horarios[dia].aberto}
                      onChange={e => setHorarios(h => ({ ...h, [dia]: { ...h[dia], aberto: e.target.value } }))}
                      style={{ ...inputStyle, width: 'auto', padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                      onFocus={e => (e.target.style.borderColor = '#16A34A')}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>às</span>
                    <input type="time" value={horarios[dia].fechado}
                      onChange={e => setHorarios(h => ({ ...h, [dia]: { ...h[dia], fechado: e.target.value } }))}
                      style={{ ...inputStyle, width: 'auto', padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                      onFocus={e => (e.target.style.borderColor = '#16A34A')}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                  </div>
                ) : (
                  <span style={{ color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Fechado</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Slug */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: '#F0FDF4', border: '1.5px solid rgba(22,163,74,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <p style={{ color: '#16A34A', fontSize: 10, fontFamily: 'Poppins, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Seu link no ZappiCidade
            </p>
            <span style={{ color: '#16A34A', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
              zappicidade.com.br/<strong>{comercio.slug}</strong>
            </span>
          </div>
          <button onClick={copiarSlug} style={{
            background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
            color: slugCopiado ? '#16A34A' : '#9CA3AF',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            fontFamily: 'Poppins, sans-serif', fontWeight: 600, transition: 'color 0.2s',
          }}>
            {slugCopiado ? <><Check size={13} /> Copiado!</> : <><Copy size={13} /> Copiar</>}
          </button>
        </div>

        {erro && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', color: '#DC2626', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
            {erro}
          </div>
        )}

        <button onClick={salvar} disabled={carregando} style={{
          width: '100%', padding: '15px', borderRadius: 999, border: 'none',
          background: carregando ? 'rgba(22,163,74,0.6)' : '#16A34A',
          color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
          cursor: carregando ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(22,163,74,0.35)', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (!carregando) { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
          onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {carregando
            ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Salvando...</>
            : <><Sparkles size={16} /> Ficou ótimo! Próximo passo</>}
        </button>
      </div>
    </div>
  )
}

// ── Passo 4: Escolher plano ────────────────────────────────────
function Passo4({ onAtivar }: { onAtivar: (plano: string) => void }) {
  const [selecionado, setSelecionado] = useState('Pro')
  const planoAtual = PLANOS.find(p => p.nome === selecionado)!

  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12,
          background: '#DCFCE7', border: '1px solid rgba(22,163,74,0.2)',
          borderRadius: 999, padding: '5px 13px',
        }}>
          <Zap size={12} color="#16A34A" />
          <span style={{ color: '#16A34A', fontSize: 11, fontWeight: 700, fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Último passo
          </span>
        </div>
        <h2 style={{
          fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#111827',
          fontFamily: 'Poppins, sans-serif', fontWeight: 800, lineHeight: 1.15, marginBottom: 8,
        }}>
          Escolha seu plano
        </h2>
        <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
          Comece grátis. Faça upgrade quando quiser crescer mais.
        </p>
      </div>

      {/* Cards dos planos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>

        {/* Basic */}
        {(() => {
          const plano = PLANOS[0]
          const ativo = selecionado === plano.nome
          return (
            <button onClick={() => setSelecionado(plano.nome)} style={{
              padding: '18px 20px', borderRadius: 18, border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.2s',
              background: ativo ? '#F0FDF4' : 'white',
              outline: `2px solid ${ativo ? '#16A34A' : '#E5E7EB'}`,
              boxShadow: ativo ? '0 4px 16px rgba(22,163,74,0.12)' : '0 1px 4px rgba(31,41,55,0.05)',
            }}>
              {/* Topo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 18 }}>{plano.icone}</span>
                  <span style={{ color: '#111827', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 15 }}>{plano.nome}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ color: '#16A34A', fontWeight: 800, fontFamily: 'Poppins, sans-serif', fontSize: 18 }}>R$0</span>
                  <span style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>/mês</span>
                </div>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'Inter, sans-serif', marginBottom: 10, lineHeight: 1.5 }}>
                {plano.descricao}
              </p>
              {/* Recursos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {plano.recursos.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={9} color="#16A34A" strokeWidth={3} />
                    </div>
                    <span style={{ color: '#4B5563', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{r}</span>
                  </div>
                ))}
                {plano.limitacoes.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#9CA3AF', fontSize: 10, lineHeight: 1 }}>✕</span>
                    </div>
                    <span style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{r}</span>
                  </div>
                ))}
              </div>
            </button>
          )
        })()}

        {/* Pro */}
        {(() => {
          const plano = PLANOS[1]
          const ativo = selecionado === plano.nome
          return (
            <button onClick={() => setSelecionado(plano.nome)} style={{
              padding: '20px 22px', borderRadius: 18, border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              background: ativo ? '#16A34A' : '#1F2937',
              outline: `2px solid ${ativo ? '#16A34A' : '#374151'}`,
              boxShadow: ativo ? '0 8px 32px rgba(22,163,74,0.30)' : '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              {/* Badge */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: '#FACC15', color: '#111827',
                fontSize: 10, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
                padding: '4px 12px', borderBottomLeftRadius: 12,
              }}>
                ⭐ MAIS POPULAR
              </div>

              {/* Topo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 18 }}>{plano.icone}</span>
                  <span style={{ color: 'white', fontWeight: 700, fontFamily: 'Poppins, sans-serif', fontSize: 15 }}>{plano.nome}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ color: 'white', fontWeight: 800, fontFamily: 'Poppins, sans-serif', fontSize: 20 }}>R$59,90</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>/mês</span>
                </div>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter, sans-serif', marginBottom: 14, lineHeight: 1.5 }}>
                {plano.descricao}
              </p>

              {/* Recursos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {plano.recursos.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} color="white" strokeWidth={3} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{r}</span>
                  </div>
                ))}
              </div>

              {/* Garantia */}
              <div style={{
                marginTop: 16, padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
                  <strong style={{ color: 'white' }}>30 dias grátis.</strong> Sem cartão agora. Cancele quando quiser.
                </span>
              </div>
            </button>
          )
        })()}
      </div>

      {/* Botão CTA */}
      {selecionado === 'Pro' ? (
        <button onClick={() => onAtivar(selecionado)} style={{
          width: '100%', padding: '16px', borderRadius: 999, border: 'none',
          background: '#16A34A', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <Zap size={16} /> Começar 30 dias grátis no Pro
        </button>
      ) : (
        <button onClick={() => onAtivar(selecionado)} style={{
          width: '100%', padding: '16px', borderRadius: 999,
          background: 'transparent', border: '2px solid #E5E7EB',
          color: '#4B5563', fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#16A34A' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}
        >
          Continuar com o Basic gratuito
        </button>
      )}

      <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 12, fontFamily: 'Inter, sans-serif' }}>
        {selecionado === 'Pro' ? 'Nenhuma cobrança hoje. Cancele quando quiser.' : 'Você pode fazer upgrade para o Pro a qualquer momento.'}
      </p>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [passo, setPasso] = useState(0)
  const [comercioSelecionado, setComercioSelecionado] = useState<Comercio | null>(null)
  const [vinculando, setVinculando] = useState(false)
  const [erroVinculo, setErroVinculo] = useState('')

  useEffect(() => {
    const sessao = obterSessao()
    if (!sessao) router.push('/comerciante/login')
  }, [router])

  const handleSelecionar = (c: Comercio) => { setComercioSelecionado(c); setPasso(1) }

  const handleVincular = async () => {
    if (!comercioSelecionado) return
    setVinculando(true); setErroVinculo('')
    try {
      await apiFetch('/comerciante/perfil/vincular', { method: 'POST', body: JSON.stringify({ comercio_id: comercioSelecionado.id }) })
      const sessao = obterSessao()
      if (sessao) salvarSessao({ ...sessao, comerciante: { ...sessao.comerciante, comercio_id: comercioSelecionado.id } })
      setPasso(2)
    } catch (err: any) { setErroVinculo(err.message) }
    finally { setVinculando(false) }
  }

  const handleAtivar = (_plano: string) => { router.push('/comerciante/dashboard') }

  return (
    <div style={{
      minHeight: '100vh', background: '#F9FAFB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Blobs decorativos */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,252,231,0.7) 0%, transparent 70%)',
          top: -180, left: -150, filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(254,249,195,0.5) 0%, transparent 70%)',
          bottom: -120, right: -100, filter: 'blur(40px)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: 520, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={160} height={40}
            style={{ objectFit: 'contain' }} />
        </div>

        {/* Card principal */}
        <div style={{
          background: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: 28, padding: 'clamp(24px, 5vw, 40px)',
          boxShadow: '0 8px 40px rgba(31,41,55,0.08)',
        }}>
          <StepIndicator passo={passo} total={4} />

          {passo === 0 && <Passo1 onSelecionar={handleSelecionar} />}
          {passo === 1 && comercioSelecionado && (
            <>
              {erroVinculo && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
                  {erroVinculo}
                </div>
              )}
              <Passo2 comercio={comercioSelecionado} onConfirmar={handleVincular} onVoltar={() => { setComercioSelecionado(null); setPasso(0) }} carregando={vinculando} />
            </>
          )}
          {passo === 2 && comercioSelecionado && <Passo3 comercio={comercioSelecionado} onContinuar={() => setPasso(3)} />}
          {passo === 3 && <Passo4 onAtivar={handleAtivar} />}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 20, fontFamily: 'Inter, sans-serif' }}>
          Já tem conta?{' '}
          <a href="/comerciante/login" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
            Fazer login
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type="time"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        input::placeholder, textarea::placeholder { color: #9CA3AF; }
        select option { color: #111827; }
      `}</style>
    </div>
  )
}
