'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Phone, Globe, MessageCircle,
  Clock, CheckCircle2, ChevronLeft, Tag, Star,
  Loader2, AlertCircle, ExternalLink, Share2, Check,
} from 'lucide-react'
import { api } from '@/lib/api'

// ── Helpers ──────────────────────────────────────────────────────
const DIAS_ORDER = ['domingo','segunda','terca','quarta','quinta','sexta','sabado']
const DIAS_LABEL: Record<string,string> = {
  domingo:'Domingo', segunda:'Segunda-feira', terca:'Terça-feira',
  quarta:'Quarta-feira', quinta:'Quinta-feira', sexta:'Sexta-feira', sabado:'Sábado',
}
const todayKey = () => DIAS_ORDER[new Date().getDay()]
const fmtHora  = (h: string) => h?.length === 4 ? `${h.slice(0,2)}:${h.slice(2)}` : (h ?? '--:--')
const fmtPreco = (v: number) => v?.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

function calcDesconto(de: number, por: number) {
  if (!de || !por) return null
  return Math.round((1 - por / de) * 100)
}

// ── Componentes auxiliares ───────────────────────────────────────

function Badge({ children, cor = 'green' }: { children: React.ReactNode; cor?: 'green'|'yellow'|'gray'|'red' }) {
  const cores: Record<string, React.CSSProperties> = {
    green:  { background:'#DCFCE7', color:'#15803D', border:'1px solid #BBF7D0' },
    yellow: { background:'#FEF9C3', color:'#854D0E', border:'1px solid #FDE68A' },
    gray:   { background:'#F3F4F6', color:'#4B5563', border:'1px solid #E5E7EB' },
    red:    { background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA' },
  }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:700,
      fontFamily:'Poppins', whiteSpace:'nowrap', ...cores[cor],
    }}>
      {children}
    </span>
  )
}

function InfoRow({ icon, label, href, children }: {
  icon: React.ReactNode; label: string; href?: string; children: React.ReactNode
}) {
  const content = (
    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
      <div style={{
        width:36, height:36, borderRadius:10, background:'#F0FDF4',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase',
          letterSpacing:'0.05em', fontFamily:'Poppins', margin:0 }}>{label}</p>
        <div style={{ fontSize:14, color:'#111827', fontFamily:'Inter', marginTop:2 }}>{children}</div>
      </div>
    </div>
  )
  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration:'none', display:'block',
        borderRadius:12, padding:'10px 12px', margin:'-10px -12px',
        transition:'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {content}
    </a>
  )
  return <div style={{ padding:'2px 0' }}>{content}</div>
}

// ── Página principal ─────────────────────────────────────────────
export default function PaginaComercio() {
  const params   = useParams<{ slug: string }>()
  const router   = useRouter()
  const [dados,  setDados]  = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro,   setErro]   = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!params?.slug) return
    api.comercios.detalhe(params.slug)
      .then(setDados)
      .catch(() => setErro('Comércio não encontrado'))
      .finally(() => setCarregando(false))
  }, [params?.slug])

  if (carregando) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB' }}>
      <Loader2 size={32} style={{ animation:'spin 1s linear infinite', color:'#16A34A' }} />
    </div>
  )

  if (erro || !dados) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#F9FAFB' }}>
      <AlertCircle size={48} color="#9CA3AF" />
      <h1 style={{ fontFamily:'Poppins', fontWeight:700, fontSize:22, color:'#111827', margin:0 }}>Comércio não encontrado</h1>
      <p style={{ color:'#6B7280', fontFamily:'Inter', margin:0 }}>O link pode estar incorreto ou o negócio foi removido.</p>
      <Link href="/" style={{
        background:'#16A34A', color:'white', padding:'11px 24px', borderRadius:999,
        textDecoration:'none', fontFamily:'Poppins', fontWeight:600, fontSize:14,
        boxShadow:'0 4px 16px rgba(22,163,74,0.35)',
      }}>
        Voltar ao início
      </Link>
    </div>
  )

  const d = dados
  const today = todayKey()
  const horarioHoje = d.horarios?.[today]
  // No Brasil todo celular tem WhatsApp — usa whatsapp explícito ou qualquer número com 11 dígitos
  const toDigits = (n: string) => n.replace(/\D/g, '')
  const whatsappMsg = encodeURIComponent(`Olá! Vi seu perfil no ZappiCidade e gostaria de mais informações.`)
  const resolveWhatsapp = () => {
    const wNum = d.whatsapp ? toDigits(d.whatsapp) : null
    if (wNum && wNum.length >= 10) return `https://wa.me/55${wNum}?text=${whatsappMsg}`
    const tNum = d.telefone ? toDigits(d.telefone) : null
    if (tNum && tNum.length >= 10) return `https://wa.me/55${tNum}?text=${whatsappMsg}`
    return null
  }
  const whatsappUrl = resolveWhatsapp()

  const compartilhar = () => {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: d.nome, url })
    else { navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2500) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:'Inter' }}>

      {/* ── Navbar simples ── */}
      <header style={{
        background:'white', borderBottom:'1px solid #E5E7EB',
        height:64, display:'flex', alignItems:'center',
        padding:'0 24px', position:'sticky', top:0, zIndex:50,
        boxShadow:'0 1px 8px rgba(0,0,0,0.05)',
      }}>
        <button onClick={() => router.back()} style={{
          display:'flex', alignItems:'center', gap:8, background:'none', border:'none',
          cursor:'pointer', color:'#4B5563', fontFamily:'Inter', fontSize:14,
          padding:'8px 12px', borderRadius:8, transition:'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background='#F9FAFB'; e.currentTarget.style.color='#111827' }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#4B5563' }}
        >
          <ChevronLeft size={18} /> Voltar
        </button>

        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          <Link href="/" style={{ textDecoration:'none' }}>
            <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={130} height={32}
              style={{ objectFit:'contain' }} priority />
          </Link>
        </div>

        <button onClick={compartilhar} style={{
          display:'flex', alignItems:'center', gap:7, background:'none',
          border:'1px solid #E5E7EB', cursor:'pointer', color:'#4B5563',
          fontFamily:'Poppins', fontWeight:600, fontSize:13,
          padding:'7px 14px', borderRadius:999, transition:'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#16A34A'; e.currentTarget.style.color='#16A34A' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.color='#4B5563' }}
        >
          {copiado ? <Check size={15} color="#16A34A" /> : <Share2 size={15} />}
          {copiado ? 'Copiado!' : 'Compartilhar'}
        </button>
      </header>

      {/* ── Capa ── */}
      <div style={{ position:'relative', width:'100%', height:'clamp(220px,30vw,380px)', background:'#1F2937' }}>
        {d.foto_capa_url && (
          <img src={d.foto_capa_url} alt={d.nome}
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
        )}
        {/* Gradiente */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(17,24,39,0.85) 0%, rgba(17,24,39,0.3) 50%, transparent 100%)',
        }} />

        {/* Info sobre a capa */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          padding:'clamp(16px,3vw,32px) clamp(16px,3vw,40px)',
          display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12,
        }}>
          <div>
            {/* Categoria */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6, marginBottom:10,
              background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(255,255,255,0.2)', borderRadius:999,
              padding:'5px 12px',
            }}>
              <span style={{ fontSize:15 }}>{d.categoria_icone}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'white', fontFamily:'Poppins' }}>
                {d.categoria_nome}
              </span>
            </div>

            {/* Nome */}
            <h1 style={{
              fontFamily:'Poppins', fontWeight:800,
              fontSize:'clamp(1.4rem,3.5vw,2.4rem)',
              color:'white', lineHeight:1.15, margin:0,
              textShadow:'0 2px 8px rgba(0,0,0,0.4)',
            }}>
              {d.nome}
            </h1>

            {/* Localização */}
            {(d.bairro || d.cidade_nome) && (
              <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, fontFamily:'Inter', margin:'6px 0 0', display:'flex', alignItems:'center', gap:5 }}>
                <MapPin size={13} /> {[d.bairro, d.cidade_nome, d.estado].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {/* Badges direita */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
            {/* Aberto/Fechado */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background: d.aberto_agora ? 'rgba(22,163,74,0.9)' : 'rgba(239,68,68,0.85)',
              backdropFilter:'blur(8px)', borderRadius:999,
              padding:'6px 14px',
            }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'white',
                display:'inline-block', animation: d.aberto_agora ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontSize:12, fontWeight:700, color:'white', fontFamily:'Poppins' }}>
                {d.funciona_24h ? 'Aberto 24h' : d.aberto_agora ? 'Aberto agora' : 'Fechado agora'}
              </span>
              {horarioHoje && !d.funciona_24h && (
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.85)', fontFamily:'Inter' }}>
                  · até {fmtHora(horarioHoje.fecha)}
                </span>
              )}
            </div>

            {/* Verificado */}
            {d.verificado && (
              <div style={{
                display:'inline-flex', alignItems:'center', gap:5,
                background:'rgba(250,204,21,0.9)', borderRadius:999,
                padding:'5px 12px',
              }}>
                <CheckCircle2 size={13} color="#111827" />
                <span style={{ fontSize:11, fontWeight:700, color:'#111827', fontFamily:'Poppins' }}>Verificado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── WhatsApp CTA mobile (abaixo da capa) ── */}
      {whatsappUrl && (
        <div style={{
          background:'white', borderBottom:'1px solid #E5E7EB',
          padding:'14px 20px', display:'flex', gap:10,
        }} className="mobile-cta">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            background:'#25D366', color:'white', borderRadius:999,
            padding:'12px 20px', textDecoration:'none',
            fontFamily:'Poppins', fontWeight:700, fontSize:14,
            boxShadow:'0 4px 16px rgba(37,211,102,0.35)',
          }}>
            <MessageCircle size={18} /> Chamar no WhatsApp
          </a>
          {d.telefone && (
            <a href={`tel:${d.telefone.replace(/\D/g,'')}`} style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'#F3F4F6', color:'#111827', borderRadius:999,
              padding:'12px 16px', textDecoration:'none',
              border:'1px solid #E5E7EB',
            }}>
              <Phone size={18} />
            </a>
          )}
        </div>
      )}

      {/* ── Conteúdo principal ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'clamp(20px,3vw,40px) clamp(16px,3vw,24px)' }}>
        <div style={{
          display:'grid',
          gridTemplateColumns:'minmax(0,1fr) 340px',
          gap:28, alignItems:'start',
        }} className="main-grid">

          {/* ── Coluna esquerda ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

            {/* Sobre */}
            {d.descricao && (
              <section style={{
                background:'white', borderRadius:20,
                border:'1px solid #E5E7EB', padding:'24px 28px',
              }}>
                <h2 style={{ fontFamily:'Poppins', fontWeight:700, fontSize:16, color:'#111827', margin:'0 0 14px', display:'flex', alignItems:'center', gap:8 }}>
                  Sobre o negócio
                </h2>
                <p style={{ color:'#4B5563', fontSize:15, lineHeight:1.75, margin:0, fontFamily:'Inter' }}>
                  {d.descricao}
                </p>
              </section>
            )}

            {/* Tags de serviço */}
            {(d.aceita_delivery || d.aceita_retirada || d.funciona_24h) && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {d.funciona_24h    && <Badge cor="green">🕐 Aberto 24h</Badge>}
                {d.aceita_delivery && <Badge cor="green">🛵 Delivery disponível</Badge>}
                {d.aceita_retirada && <Badge cor="yellow">📦 Retirada no local</Badge>}
              </div>
            )}

            {/* Promoções */}
            {d.promocoes?.length > 0 && (
              <section style={{
                background:'white', borderRadius:20,
                border:'1px solid #E5E7EB', padding:'24px 28px',
              }}>
                <h2 style={{ fontFamily:'Poppins', fontWeight:700, fontSize:16, color:'#111827', margin:'0 0 16px', display:'flex', alignItems:'center', gap:8 }}>
                  <Tag size={17} color="#16A34A" /> Promoções ativas
                  <span style={{
                    background:'#DCFCE7', color:'#15803D', borderRadius:999,
                    padding:'2px 10px', fontSize:12, fontWeight:700,
                  }}>{d.promocoes.length}</span>
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {d.promocoes.map((p: any) => {
                    const descPct = calcDesconto(p.preco_de, p.preco_por)
                    return (
                      <div key={p.id} style={{
                        border:'1px solid #E5E7EB', borderRadius:16,
                        overflow:'hidden', display:'flex',
                        background:'#FAFAFA',
                      }}>
                        {/* Imagem da promoção */}
                        {p.imagem_url && (
                          <div style={{ width:100, flexShrink:0 }}>
                            <img src={p.imagem_url} alt={p.titulo}
                              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          </div>
                        )}
                        <div style={{ padding:'14px 16px', flex:1 }}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
                            <h3 style={{ fontFamily:'Poppins', fontWeight:700, fontSize:14, color:'#111827', margin:0 }}>
                              {p.titulo}
                            </h3>
                            {descPct && (
                              <span style={{
                                background:'#DCFCE7', color:'#15803D', borderRadius:999,
                                padding:'3px 10px', fontSize:12, fontWeight:800,
                                fontFamily:'Poppins', flexShrink:0,
                              }}>
                                -{descPct}%
                              </span>
                            )}
                          </div>
                          {p.descricao && (
                            <p style={{ color:'#6B7280', fontSize:13, lineHeight:1.5, margin:'0 0 8px', fontFamily:'Inter' }}>
                              {p.descricao}
                            </p>
                          )}
                          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                            {p.preco_por > 0 && (
                              <span style={{ fontFamily:'Poppins', fontWeight:800, fontSize:16, color:'#16A34A' }}>
                                {fmtPreco(p.preco_por)}
                              </span>
                            )}
                            {p.preco_de > 0 && (
                              <span style={{ fontFamily:'Inter', fontSize:13, color:'#9CA3AF', textDecoration:'line-through' }}>
                                {fmtPreco(p.preco_de)}
                              </span>
                            )}
                            {p.fim && (
                              <span style={{ fontSize:11, color:'#9CA3AF', fontFamily:'Inter' }}>
                                · válido até {new Date(p.fim).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* CTA pegar promoção */}
                {whatsappUrl && (
                  <a href={`${whatsappUrl}&text=${encodeURIComponent('Olá! Vi a promoção no ZappiCidade e tenho interesse!')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      marginTop:16, background:'#25D366', color:'white',
                      padding:'12px', borderRadius:999, textDecoration:'none',
                      fontFamily:'Poppins', fontWeight:700, fontSize:14,
                      boxShadow:'0 4px 16px rgba(37,211,102,0.3)',
                      transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='#1ebe5d'; e.currentTarget.style.transform='translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='#25D366'; e.currentTarget.style.transform='translateY(0)' }}
                  >
                    <MessageCircle size={18} /> Pegar promoção via WhatsApp
                  </a>
                )}
              </section>
            )}

            {/* Horários */}
            {d.horarios && Object.keys(d.horarios).length > 0 && (
              <section style={{
                background:'white', borderRadius:20,
                border:'1px solid #E5E7EB', padding:'24px 28px',
              }}>
                <h2 style={{ fontFamily:'Poppins', fontWeight:700, fontSize:16, color:'#111827', margin:'0 0 16px', display:'flex', alignItems:'center', gap:8 }}>
                  <Clock size={17} color="#16A34A" /> Horário de funcionamento
                </h2>

                {d.funciona_24h ? (
                  <div style={{
                    background:'#F0FDF4', border:'1px solid #BBF7D0',
                    borderRadius:12, padding:'14px 18px',
                    display:'flex', alignItems:'center', gap:10,
                  }}>
                    <span style={{ fontSize:20 }}>🕐</span>
                    <div>
                      <p style={{ fontFamily:'Poppins', fontWeight:700, color:'#15803D', margin:0, fontSize:14 }}>Aberto 24 horas</p>
                      <p style={{ fontFamily:'Inter', color:'#4B5563', margin:0, fontSize:13 }}>Todos os dias da semana</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {DIAS_ORDER.map((dia, i) => {
                      const slot = d.horarios?.[dia]
                      const isToday = dia === today
                      return (
                        <div key={dia} style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'10px 14px', borderRadius:10,
                          background: isToday ? '#F0FDF4' : 'transparent',
                          border: isToday ? '1px solid #BBF7D0' : '1px solid transparent',
                          marginBottom: i < 6 ? 4 : 0,
                          transition:'background 0.15s',
                        }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            {isToday && (
                              <span style={{ width:7, height:7, borderRadius:'50%', background:'#16A34A', display:'inline-block' }} />
                            )}
                            <span style={{
                              fontFamily: isToday ? 'Poppins' : 'Inter',
                              fontWeight: isToday ? 700 : 500,
                              fontSize:14,
                              color: isToday ? '#15803D' : '#374151',
                            }}>
                              {DIAS_LABEL[dia]}
                              {isToday && <span style={{ fontSize:11, marginLeft:6, fontWeight:600, color:'#16A34A' }}>(hoje)</span>}
                            </span>
                          </div>
                          {slot ? (
                            <span style={{
                              fontFamily:'Poppins', fontWeight:600, fontSize:14,
                              color: isToday ? '#15803D' : '#111827',
                            }}>
                              {fmtHora(slot.abre)} – {fmtHora(slot.fecha)}
                            </span>
                          ) : (
                            <span style={{ fontFamily:'Inter', fontSize:13, color:'#9CA3AF' }}>Fechado</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Mapa */}
            {d.maps_url && (
              <section style={{
                background:'white', borderRadius:20,
                border:'1px solid #E5E7EB', padding:'24px 28px',
              }}>
                <h2 style={{ fontFamily:'Poppins', fontWeight:700, fontSize:16, color:'#111827', margin:'0 0 16px', display:'flex', alignItems:'center', gap:8 }}>
                  <MapPin size={17} color="#16A34A" /> Localização
                </h2>
                <p style={{ color:'#4B5563', fontSize:14, fontFamily:'Inter', margin:'0 0 14px', lineHeight:1.6 }}>
                  {d.endereco}
                </p>
                <a href={d.maps_url} target="_blank" rel="noopener noreferrer" style={{
                  display:'inline-flex', alignItems:'center', gap:7,
                  background:'#F9FAFB', border:'1px solid #E5E7EB',
                  color:'#374151', padding:'10px 18px', borderRadius:999,
                  textDecoration:'none', fontFamily:'Poppins', fontWeight:600, fontSize:13,
                  transition:'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#16A34A'; e.currentTarget.style.color='#16A34A' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.color='#374151' }}
                >
                  <ExternalLink size={14} /> Ver no Google Maps
                </a>
              </section>
            )}
          </div>

          {/* ── Coluna direita — Card de contato ── */}
          <div style={{ position:'sticky', top:80 }}>
            <div style={{
              background:'white', borderRadius:20,
              border:'1px solid #E5E7EB', padding:'24px',
              boxShadow:'0 4px 24px rgba(31,41,55,0.07)',
            }}>
              {/* Avaliação */}
              {d.avaliacao > 0 && (
                <div style={{
                  display:'flex', alignItems:'center', gap:6, marginBottom:20,
                  paddingBottom:20, borderBottom:'1px solid #F3F4F6',
                }}>
                  <Star size={18} fill="#FACC15" color="#FACC15" />
                  <span style={{ fontFamily:'Poppins', fontWeight:800, fontSize:18, color:'#111827' }}>
                    {d.avaliacao.toFixed(1)}
                  </span>
                  <span style={{ fontFamily:'Inter', fontSize:13, color:'#9CA3AF' }}>
                    ({d.total_avaliacoes} avaliação{d.total_avaliacoes !== 1 ? 'ões' : ''})
                  </span>
                </div>
              )}

              {/* WhatsApp — CTA principal */}
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  width:'100%', background:'#25D366', color:'white',
                  padding:'14px', borderRadius:999, textDecoration:'none',
                  fontFamily:'Poppins', fontWeight:700, fontSize:15,
                  boxShadow:'0 4px 20px rgba(37,211,102,0.4)',
                  transition:'all 0.2s', marginBottom:14,
                  boxSizing:'border-box',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background='#1ebe5d'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#25D366'; e.currentTarget.style.transform='translateY(0)' }}
                >
                  <MessageCircle size={20} /> Chamar no WhatsApp
                </a>
              ) : d.telefone && (
                <a href={`tel:${toDigits(d.telefone)}`} style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  width:'100%', background:'#25D366', color:'white',
                  padding:'14px', borderRadius:999, textDecoration:'none',
                  fontFamily:'Poppins', fontWeight:700, fontSize:15,
                  boxShadow:'0 4px 20px rgba(37,211,102,0.4)',
                  transition:'all 0.2s', marginBottom:14,
                  boxSizing:'border-box',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)' }}
                >
                  <MessageCircle size={20} /> Chamar no WhatsApp
                </a>
              )}

              {/* Contatos */}
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {d.telefone && (
                  <InfoRow icon={<Phone size={16} color="#16A34A" />} label="Telefone"
                    href={`tel:${d.telefone.replace(/\D/g,'')}`}>
                    {d.telefone}
                  </InfoRow>
                )}
                {d.website && (
                  <InfoRow icon={<Globe size={16} color="#16A34A" />} label="Site"
                    href={d.website.startsWith('http') ? d.website : `https://${d.website}`}>
                    <span style={{ color:'#16A34A' }}>{d.website.replace(/^https?:\/\//,'')}</span>
                  </InfoRow>
                )}
                {d.instagram && (
                  <InfoRow icon={<span style={{ fontSize:16 }}>📸</span>} label="Instagram"
                    href={`https://instagram.com/${d.instagram.replace('@','')}`}>
                    <span style={{ color:'#16A34A' }}>@{d.instagram.replace('@','')}</span>
                  </InfoRow>
                )}
                {d.endereco && (
                  <InfoRow icon={<MapPin size={16} color="#16A34A" />} label="Endereço"
                    href={d.maps_url}>
                    <span style={{ lineHeight:1.5 }}>{d.endereco}</span>
                  </InfoRow>
                )}
              </div>

              {/* Linha divisória */}
              <div style={{ height:1, background:'#F3F4F6', margin:'18px 0' }} />

              {/* Status */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{
                    width:9, height:9, borderRadius:'50%',
                    background: d.aberto_agora ? '#16A34A' : '#EF4444',
                    display:'inline-block',
                    boxShadow: d.aberto_agora ? '0 0 0 3px rgba(22,163,74,0.2)' : 'none',
                  }} />
                  <span style={{ fontFamily:'Poppins', fontWeight:600, fontSize:14,
                    color: d.aberto_agora ? '#15803D' : '#EF4444' }}>
                    {d.funciona_24h ? 'Aberto 24h' : d.aberto_agora ? 'Aberto agora' : 'Fechado'}
                  </span>
                </div>
                {horarioHoje && !d.funciona_24h && (
                  <span style={{ fontSize:12, color:'#6B7280', fontFamily:'Inter' }}>
                    {fmtHora(horarioHoje.abre)} – {fmtHora(horarioHoje.fecha)}
                  </span>
                )}
              </div>

              {/* Rodapé do card */}
              <div style={{
                marginTop:16, padding:'12px 14px', background:'#F9FAFB',
                borderRadius:12, display:'flex', alignItems:'center', gap:8,
              }}>
                <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={80} height={20}
                  style={{ objectFit:'contain', objectPosition:'left', opacity:0.7 }} />
                <span style={{ fontSize:11, color:'#9CA3AF', fontFamily:'Inter', lineHeight:1.4 }}>
                  Perfil verificado no ZappiCidade
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 860px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .mobile-cta { display: flex !important; }
        }
        @media (min-width: 861px) {
          .mobile-cta { display: none !important; }
        }
      `}</style>
    </div>
  )
}
