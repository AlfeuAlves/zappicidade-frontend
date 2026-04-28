'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  Search, MapPin, Star, CheckCircle2, ChevronRight,
  Zap, ArrowLeft, Building2, Phone, Sparkles,
  Camera, Copy, Check, ChevronDown
} from 'lucide-react'
import { obterSessao, salvarSessao } from '@/lib/auth'
import { apiFetch } from '@/lib/auth'
import { api } from '@/lib/api'
import PlanosPrecos from '@/components/PlanosPrecos'

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
  const labels = ['Encontrar', 'Confirmar', 'Ativar']
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
function Passo1({ onSelecionar, onCadastrado }: { onSelecionar: (c: Comercio) => void; onCadastrado: (comercioId: string) => void }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Comercio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Estado do formulário de cadastro
  const [mostraCadastro, setMostraCadastro] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cadNome, setCadNome] = useState('')
  const [cadCategoria, setCadCategoria] = useState('')
  const [cadBairro, setCadBairro] = useState('')
  const [cadEndereco, setCadEndereco] = useState('')
  const [cadTelefone, setCadTelefone] = useState('')
  const [cadWhatsapp, setCadWhatsapp] = useState('')
  const [cadSalvando, setCadSalvando] = useState(false)
  const [cadErro, setCadErro] = useState('')

  useEffect(() => {
    api.comercios.categorias().then(setCategorias).catch(() => {})
  }, [])

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

      {/* Botão flutuante cadastrar */}
      {!mostraCadastro && (
        <button
          onClick={() => setMostraCadastro(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1.5px solid #16A34A', borderRadius: 999,
            padding: '10px 18px', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(22,163,74,0.2)',
            color: '#16A34A', fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
          }}
        >
          <Building2 size={15} /> Cadastrar novo
        </button>
      )}

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

      {buscado && resultados.length === 0 && !mostraCadastro && (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#F9FAFB', borderRadius: 16, border: '1.5px dashed #E5E7EB' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#4B5563', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
            Nenhum resultado para <strong style={{ color: '#111827' }}>"{busca}"</strong>
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8, fontFamily: 'Inter, sans-serif' }}>
            Seu estabelecimento ainda não está cadastrado?
          </p>
          <button
            onClick={() => { setCadNome(busca); setMostraCadastro(true) }}
            style={{ marginTop: 16, background: '#16A34A', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} /> Cadastrar meu estabelecimento
          </button>
        </div>
      )}

      {/* Formulário de cadastro */}
      {mostraCadastro && (
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 20, padding: 24, animation: 'fadeUp 0.3s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setMostraCadastro(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={15} color="#6B7280" />
            </button>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#111827' }}>Cadastrar estabelecimento</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>Preencha os dados do seu negócio</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Nome do estabelecimento *', val: cadNome, set: setCadNome, ph: 'Ex: Farmácia Popular, Restaurante do João...' },
              { label: 'Bairro', val: cadBairro, set: setCadBairro, ph: 'Ex: Centro, Murucupi...' },
              { label: 'Endereço', val: cadEndereco, set: setCadEndereco, ph: 'Rua, número...' },
              { label: 'Telefone', val: cadTelefone, set: setCadTelefone, ph: '(91) 99999-0000' },
              { label: 'WhatsApp', val: cadWhatsapp, set: setCadWhatsapp, ph: '(91) 99999-0000' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  style={{ width: '100%', padding: '11px 14px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#16A34A'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'Poppins, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Categoria</label>
              <select value={cadCategoria} onChange={e => setCadCategoria(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', background: 'white' }}>
                <option value="">Selecione uma categoria</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
              </select>
            </div>

            {cadErro && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>
                {cadErro}
              </div>
            )}

            <button
              disabled={!cadNome.trim() || cadSalvando}
              onClick={async () => {
                setCadErro(''); setCadSalvando(true)
                try {
                  const res = await apiFetch<{ ok: boolean; comercio: { id: string } }>('/comerciante/perfil/criar-comercio', {
                    method: 'POST',
                    body: JSON.stringify({
                      nome: cadNome.trim(),
                      categoria_id: cadCategoria || undefined,
                      bairro: cadBairro || undefined,
                      endereco: cadEndereco || undefined,
                      telefone: cadTelefone.replace(/\D/g,'') || undefined,
                      whatsapp: cadWhatsapp.replace(/\D/g,'') || undefined,
                    }),
                  })
                  onCadastrado(res.comercio.id)
                } catch (e: any) {
                  setCadErro(e?.message || 'Erro ao cadastrar. Tente novamente.')
                } finally { setCadSalvando(false) }
              }}
              style={{ width: '100%', padding: '14px', background: cadSalvando ? '#9CA3AF' : '#16A34A', color: 'white', border: 'none', borderRadius: 14, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, cursor: cadSalvando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {cadSalvando ? 'Cadastrando...' : <><CheckCircle2 size={16} /> Cadastrar e continuar</>}
            </button>
          </div>
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
function Passo4({ onAtivar, carregando }: { onAtivar: (plano: string) => void; carregando?: boolean }) {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards', position: 'relative' }}>
      <PlanosPrecos onSelecionar={onAtivar} modoOnboarding />
      {carregando && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(249,250,251,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 20, backdropFilter: 'blur(4px)', zIndex: 10 }}>
          <div style={{ width: 48, height: 48, border: '4px solid #DCFCE7', borderTop: '4px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
          <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 15, color: '#16A34A', margin: 0 }}>Preparando pagamento...</p>
        </div>
      )}
    </div>
  )
}

// ── Tela aguardando pagamento ──────────────────────────────────
function TelaAguardandoPagamento({
  urlPagamento, onVerificar, verificando, confirmado, onReabrirJanela,
}: {
  urlPagamento: string
  onVerificar: () => void
  verificando: boolean
  confirmado: boolean
  onReabrirJanela: () => void
}) {
  if (confirmado) {
    return (
      <div style={{ animation: 'fadeUp 0.4s ease forwards', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #16A34A, #15803D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(22,163,74,0.35)', fontSize: 32,
        }}>✅</div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: 12 }}>
          Pagamento confirmado!
        </h2>
        <p style={{ color: '#4B5563', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
          Seu plano PRO está ativo. Redirecionando para o painel...
        </p>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: '#EEF2FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 32,
        }}>💳</div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#111827', marginBottom: 10 }}>
          Finalize o pagamento
        </h2>
        <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          A janela de pagamento foi aberta. Conclua o pagamento por lá e volte aqui para confirmar.
        </p>
      </div>

      <div style={{
        background: '#F0FDF4', border: '1.5px solid rgba(22,163,74,0.2)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 20,
      }}>
        <p style={{ color: '#15803D', fontSize: 13, fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.6 }}>
          💡 Pague via <strong>PIX</strong>, <strong>boleto</strong> ou <strong>cartão</strong> na janela que abriu. Depois clique em <strong>Verificar pagamento</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onVerificar}
          disabled={verificando}
          style={{
            width: '100%', padding: '15px', borderRadius: 999, border: 'none',
            background: verificando ? 'rgba(22,163,74,0.6)' : '#16A34A',
            color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
            cursor: verificando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(22,163,74,0.3)',
          }}
        >
          {verificando
            ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Verificando...</>
            : '✅ Já paguei — verificar'}
        </button>

        <button
          onClick={onReabrirJanela}
          style={{
            width: '100%', padding: '13px', borderRadius: 999,
            border: '1.5px solid #E5E7EB', background: 'white',
            color: '#374151', fontSize: 14, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
            cursor: 'pointer',
          }}
        >
          🔗 Reabrir janela de pagamento
        </button>
      </div>
    </div>
  )
}

// ── Tela de espera de aprovação ────────────────────────────────
function TelaAguardandoAprovacao({ onVerificar, verificando, onVoltar, onFechar }: { onVerificar: () => void; verificando: boolean; onVoltar: () => void; onFechar: () => void }) {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#FEF3C7', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 24px', fontSize: 32,
      }}>⏳</div>
      <h2 style={{
        fontSize: '1.5rem', fontFamily: 'Poppins, sans-serif', fontWeight: 800,
        color: '#111827', marginBottom: 12,
      }}>
        Aguardando aprovação
      </h2>
      <p style={{ color: '#4B5563', fontSize: 14, lineHeight: 1.7, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
        Sua solicitação foi enviada. Nossa equipe irá verificar os dados do seu estabelecimento e te avisar pelo WhatsApp assim que for aprovado.
      </p>
      <p style={{ color: '#6B7280', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 32 }}>
        Normalmente isso leva menos de 24 horas.
      </p>
      <button
        onClick={onVerificar}
        disabled={verificando}
        style={{
          width: '100%', padding: '14px', borderRadius: 999, border: '1.5px solid #16A34A',
          background: 'white', color: '#16A34A', fontSize: 14, fontWeight: 700,
          fontFamily: 'Poppins, sans-serif', cursor: verificando ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {verificando
          ? <><div style={{ width: 14, height: 14, border: '2px solid #DCFCE7', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Verificando...</>
          : '🔄 Verificar status da aprovação'}
      </button>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          onClick={onVoltar}
          style={{
            flex: 1, padding: '12px', borderRadius: 999, border: '1.5px solid #E5E7EB',
            background: 'white', color: '#374151', fontSize: 13, fontWeight: 600,
            fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
          }}
        >
          ← Voltar
        </button>
        <button
          onClick={onFechar}
          style={{
            flex: 1, padding: '12px', borderRadius: 999, border: 'none',
            background: '#F3F4F6', color: '#374151', fontSize: 13, fontWeight: 600,
            fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [passo, setPasso]                 = useState(0)
  const [statusVerificacao, setStatusVerificacao] = useState<string>('pendente')
  const [verificandoStatus, setVerificandoStatus] = useState(false)
  const [comercioSelecionado, setComercioSelecionado] = useState<Comercio | null>(null)
  const [vinculando, setVinculando]       = useState(false)
  const [erroVinculo, setErroVinculo]     = useState('')
  const [processandoPagamento, setProcessandoPagamento] = useState(false)
  const [aguardandoPagamento, setAguardandoPagamento] = useState(false)
  const [urlPagamento, setUrlPagamento]   = useState('')
  const [verificandoPagamento, setVerificandoPagamento] = useState(false)
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false)
  const [popupRef, setPopupRef]           = useState<Window | null>(null)
  const [modalCpf, setModalCpf]           = useState<{ planoId: string } | null>(null)
  const [cpf, setCpf]                     = useState('')
  const [erroCpf, setErroCpf]             = useState('')

  useEffect(() => {
    const sessao = obterSessao()
    if (!sessao) { router.push('/comerciante/login'); return }
    if (sessao.comerciante?.comercio_id) {
      const sv = (sessao.comerciante as any).status_verificacao || 'pendente'
      setStatusVerificacao(sv)
      setPasso(2)
      if (sv === 'aprovado') {
        const plano = new URLSearchParams(window.location.search).get('plano')
        if (plano && plano !== 'basico') setModalCpf({ planoId: plano })
      }
    }
  }, [router])

  const verificarStatusAprovacao = async () => {
    setVerificandoStatus(true)
    try {
      const perfil = await apiFetch<any>('/comerciante/perfil')
      const sv = perfil.status_verificacao || 'pendente'
      setStatusVerificacao(sv)
      const sessao = obterSessao()
      if (sessao) salvarSessao({ ...sessao, comerciante: { ...sessao.comerciante, status_verificacao: sv } as any })
      if (sv === 'aprovado') {
        const plano = new URLSearchParams(window.location.search).get('plano')
        if (plano && plano !== 'basico') setModalCpf({ planoId: plano })
      }
    } catch { /* silencioso */ }
    finally { setVerificandoStatus(false) }
  }

  const handleSelecionar = (c: Comercio) => { setComercioSelecionado(c); setPasso(1) }

  const handleCadastrado = (comercioId: string) => {
    const sessao = obterSessao()
    if (sessao) salvarSessao({ ...sessao, comerciante: { ...sessao.comerciante, comercio_id: comercioId } as any })
    setStatusVerificacao('pendente')
    setPasso(2)
  }

  const handleVincular = async () => {
    if (!comercioSelecionado) return
    setVinculando(true); setErroVinculo('')
    try {
      await apiFetch('/comerciante/perfil/vincular', { method: 'POST', body: JSON.stringify({ comercio_id: comercioSelecionado.id }) })
      const sessao = obterSessao()
      if (sessao) salvarSessao({ ...sessao, comerciante: { ...sessao.comerciante, comercio_id: comercioSelecionado.id } as any })
      setStatusVerificacao('pendente')
      setPasso(2)
    } catch (err: any) { setErroVinculo(err.message) }
    finally { setVinculando(false) }
  }

  const formatarCpfCnpj = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 14)
    if (n.length <= 11)
      return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
        .replace(/(\d{3})(\d{1,3})/, '$1.$2')
    return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      .replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4')
      .replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3')
      .replace(/(\d{2})(\d{1,3})/, '$1.$2')
  }

  const abrirPopupPagamento = (url: string) => {
    const w = 900, h = 680
    const left = Math.max(0, (window.screen.width - w) / 2)
    const top  = Math.max(0, (window.screen.height - h) / 2)
    const popup = window.open(url, 'pagamento_zappicidade', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`)
    setPopupRef(popup)
    return popup
  }

  const verificarPagamento = async () => {
    setVerificandoPagamento(true)
    try {
      const r = await apiFetch<{ ativa: boolean }>('/pagamento/verificar')
      if (r.ativa) {
        setPagamentoConfirmado(true)
        popupRef?.close()
        setTimeout(() => router.push('/comerciante/dashboard?setup=1'), 2500)
      } else {
        alert('Pagamento ainda não confirmado. Se já pagou, aguarde alguns instantes e tente novamente.')
      }
    } catch (err: any) {
      alert('Erro ao verificar: ' + err.message)
    } finally {
      setVerificandoPagamento(false)
    }
  }

  const iniciarCheckout = async (planoId: string, cpfValor: string) => {
    setProcessandoPagamento(true)
    setModalCpf(null)
    try {
      const r = await apiFetch<{ url: string; gratuito?: boolean }>('/pagamento/checkout', {
        method: 'POST',
        body: JSON.stringify({ plano_id: planoId, cpf: cpfValor.replace(/\D/g, '') }),
      })
      if (r.gratuito || !r.url) {
        router.push('/comerciante/dashboard?setup=1')
      } else {
        setUrlPagamento(r.url)
        abrirPopupPagamento(r.url)
        setAguardandoPagamento(true)
        setProcessandoPagamento(false)
      }
    } catch (err: any) {
      alert('Erro ao iniciar pagamento: ' + err.message)
      setProcessandoPagamento(false)
    }
  }

  const handleAtivar = (planoId: string) => {
    if (planoId === 'basico') {
      router.push('/comerciante/dashboard?setup=1')
      return
    }
    setCpf(''); setErroCpf('')
    setModalCpf({ planoId })
  }

  const confirmarCpf = () => {
    const numeros = cpf.replace(/\D/g, '')
    if (numeros.length !== 11 && numeros.length !== 14) {
      setErroCpf('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }
    iniciarCheckout(modalCpf!.planoId, numeros)
  }

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
          <StepIndicator passo={passo} total={3} />

          {passo === 0 && <Passo1 onSelecionar={handleSelecionar} onCadastrado={handleCadastrado} />}
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
          {passo === 2 && statusVerificacao === 'aprovado' && !aguardandoPagamento && (
            <Passo4 onAtivar={handleAtivar} carregando={processandoPagamento} />
          )}
          {passo === 2 && statusVerificacao === 'aprovado' && aguardandoPagamento && (
            <TelaAguardandoPagamento
              urlPagamento={urlPagamento}
              onVerificar={verificarPagamento}
              verificando={verificandoPagamento}
              confirmado={pagamentoConfirmado}
              onReabrirJanela={() => abrirPopupPagamento(urlPagamento)}
            />
          )}
          {passo === 2 && statusVerificacao !== 'aprovado' && (
            <TelaAguardandoAprovacao
              onVerificar={verificarStatusAprovacao}
              verificando={verificandoStatus}
              onVoltar={() => { setComercioSelecionado(null); setPasso(0); }}
              onFechar={() => router.push('/')}
            />
          )}
        </div>

        {/* Modal CPF */}
        {modalCpf && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24, backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setModalCpf(null) }}>
            <div style={{ background: 'white', borderRadius: 24, padding: '36px 32px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>🔒</span>
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#111827', margin: '0 0 8px' }}>
                Informe seu CPF ou CNPJ
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.6 }}>
                Necessário para emissão do recibo de pagamento. Seus dados são protegidos.
              </p>
              <input
                value={cpf}
                onChange={e => { setCpf(formatarCpfCnpj(e.target.value)); setErroCpf('') }}
                placeholder="000.000.000-00"
                style={{ width: '100%', padding: '13px 16px', border: `1.5px solid ${erroCpf ? '#DC2626' : '#E5E7EB'}`, borderRadius: 12, fontSize: 16, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.05em' }}
                onKeyDown={e => e.key === 'Enter' && confirmarCpf()}
                autoFocus
              />
              {erroCpf && <p style={{ color: '#DC2626', fontSize: 12, fontFamily: 'Inter, sans-serif', margin: '6px 0 0' }}>{erroCpf}</p>}
              <button
                onClick={confirmarCpf}
                style={{ width: '100%', marginTop: 16, padding: '14px', background: 'linear-gradient(135deg, #16A34A, #15803D)', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
              >
                Continuar para pagamento →
              </button>
              <button onClick={() => setModalCpf(null)} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: 'none', color: '#9CA3AF', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

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
