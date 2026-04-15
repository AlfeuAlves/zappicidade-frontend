'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Phone, MapPin, Clock, Globe, Star, BadgeCheck,
  MessageCircle, Share2, ChevronLeft, Tag, Calendar
} from 'lucide-react'
import type { Comercio, Promocao } from '@/lib/api'
import { formatarTelefone, linkWhatsApp, formatarPreco, formatarAvaliacao } from '@/lib/utils'
import { api } from '@/lib/api'

const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
const DIAS_LABEL: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter',
  quarta: 'Qua', quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

interface Props {
  comercio: Comercio & { promocoes: Promocao[] }
}

export default function PaginaComercio({ comercio }: Props) {
  const [optinModal, setOptinModal] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [nome, setNome] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [optinOk, setOptinOk] = useState(false)
  const [compartilhado, setCompartilhado] = useState(false)
  const diaAtual = DIAS[new Date().getDay()]

  useEffect(() => {
    api.leads.visualizacao({ comercio_id: comercio.id }).catch(() => {})
  }, [comercio.id])

  const whatsappLink = comercio.whatsapp
    ? linkWhatsApp(comercio.whatsapp, `Olá, ${comercio.nome}! Vi vocês no ZappiCidade e quero saber mais.`)
    : null

  const compartilhar = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: comercio.nome, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCompartilhado(true)
      setTimeout(() => setCompartilhado(false), 2000)
    }
  }

  const registrarLead = async (acao: string) => {
    await api.leads.registrar({ comercio_id: comercio.id, acao }).catch(() => {})
  }

  const fazerOptin = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.leads.optin({
        comercio_id: comercio.id,
        whatsapp: whatsapp.replace(/\D/g, ''),
        nome,
        origem: 'pagina_publica',
      })
      setOptinOk(true)
    } catch {
      alert('Erro ao registrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <main style={{ background: '#F9FAFB', minHeight: '100vh', paddingBottom: whatsappLink ? 90 : 32 }}>

        {/* ── CAPA ── */}
        <div style={{ height: 220, background: `url(${comercio.capa_url || '/capa_padrao.png'}) center/cover`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)' }} />

          <Link href="/comercios" style={{
            position: 'absolute', top: 16, left: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            color: 'white', padding: '8px 14px', borderRadius: 99,
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>
            <ChevronLeft size={16} /> Voltar
          </Link>

          <button onClick={compartilhar} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            border: 'none', borderRadius: 99, padding: '8px 14px',
            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 600,
          }}>
            <Share2 size={15} /> {compartilhado ? 'Copiado!' : 'Compartilhar'}
          </button>
        </div>

        {/* ── CARD PRINCIPAL ── */}
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>

          {/* Identidade */}
          <div style={{ background: 'white', borderRadius: 20, padding: '20px 20px 24px', marginTop: -32, position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', marginBottom: 16 }}>

            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Logo */}
              <div style={{
                width: 72, height: 72, borderRadius: 16, flexShrink: 0,
                background: comercio.logo_url ? `url(${comercio.logo_url}) center/cover` : '#F3F4F6',
                border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                marginTop: -52,
              }}>
                {!comercio.logo_url && '🏪'}
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  {comercio.verificado && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      <BadgeCheck size={11} /> Verificado
                    </span>
                  )}
                  {comercio.destaque && (
                    <span style={{ background: '#FFF7ED', color: '#C2410C', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>⭐ Destaque</span>
                  )}
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, color: '#111827', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>{comercio.nome}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{comercio.categoria_icone} {comercio.categoria_nome}</span>
                  {comercio.bairro && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, color: '#6B7280' }}>
                      <MapPin size={12} /> {comercio.bairro}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status aberto/fechado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: comercio.aberto_agora ? '#F0FDF4' : '#FEF2F2',
                color: comercio.aberto_agora ? '#16A34A' : '#DC2626',
                borderRadius: 99, padding: '5px 12px', fontSize: 13, fontWeight: 700,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: comercio.aberto_agora ? '#16A34A' : '#DC2626', display: 'inline-block' }} />
                {comercio.aberto_agora ? 'Aberto agora' : 'Fechado agora'}
              </span>
              {comercio.total_avaliacoes > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280', marginLeft: 'auto' }}>
                  <Star size={14} fill="#FBBF24" color="#FBBF24" />
                  <strong style={{ color: '#111827' }}>{formatarAvaliacao(comercio.avaliacao)}</strong>
                  <span>({comercio.total_avaliacoes})</span>
                </span>
              )}
            </div>

            {/* Descrição */}
            {comercio.descricao && (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6B7280', marginTop: 14 }}>
                {comercio.descricao}
              </p>
            )}
          </div>

          {/* ── CONTATO ── */}
          <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14, fontFamily: 'Poppins, sans-serif' }}>Entrar em contato</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  onClick={() => registrarLead('whatsapp')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#25D366', color: 'white', borderRadius: 12, padding: '14px',
                    fontWeight: 700, fontSize: 15, textDecoration: 'none', fontFamily: 'Poppins, sans-serif',
                    boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                  }}>
                  <MessageCircle size={18} /> Falar no WhatsApp
                </a>
              )}
              {comercio.telefone && (
                <a href={`tel:${comercio.telefone}`} onClick={() => registrarLead('ligacao')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px',
                    color: '#374151', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  }}>
                  <Phone size={16} color="#6B7280" /> {formatarTelefone(comercio.telefone)}
                </a>
              )}
              {comercio.site && (
                <a href={comercio.site} target="_blank" rel="noopener noreferrer" onClick={() => registrarLead('site')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px',
                    color: '#374151', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  }}>
                  <Globe size={16} color="#6B7280" /> Visitar site
                </a>
              )}
            </div>
          </div>

          {/* ── ENDEREÇO ── */}
          {comercio.endereco && (
            <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14, fontFamily: 'Poppins, sans-serif' }}>
                <MapPin size={16} color="#16A34A" style={{ display: 'inline', marginRight: 6 }} />Localização
              </h2>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>{comercio.endereco}</p>
              {comercio.bairro && (
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{comercio.bairro}, {comercio.cidade_nome}-{comercio.estado}</p>
              )}
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(`${comercio.nome} ${comercio.endereco} ${comercio.cidade_nome}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
                Ver no Google Maps →
              </a>
            </div>
          )}

          {/* ── PROMOÇÕES ── */}
          {comercio.promocoes && comercio.promocoes.length > 0 && (
            <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Poppins, sans-serif' }}>
                <Tag size={16} color="#EA580C" /> Promoções ativas
                <span style={{ marginLeft: 'auto', background: '#FFF7ED', color: '#EA580C', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                  {comercio.promocoes.length} oferta{comercio.promocoes.length > 1 ? 's' : ''}
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comercio.promocoes.map(promo => {
                  const precoPor = promo.preco_por ?? (
                    promo.preco_de && promo.percentual_desconto
                      ? promo.preco_de * (1 - promo.percentual_desconto / 100)
                      : null
                  )
                  return (
                    <div key={promo.id} style={{
                      borderRadius: 14, overflow: 'hidden',
                      border: '1.5px solid #FED7AA',
                      background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                    }}>
                      {/* Header laranja */}
                      <div style={{ background: '#EA580C', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: 'white' }}>
                          🎯 {promo.titulo}
                        </span>
                        {promo.percentual_desconto && (
                          <span style={{ background: 'white', color: '#EA580C', borderRadius: 99, padding: '2px 10px', fontWeight: 800, fontSize: 14 }}>
                            -{promo.percentual_desconto}%
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div style={{ padding: '14px 16px' }}>
                        {promo.descricao && (
                          <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5, marginBottom: 10 }}>{promo.descricao}</p>
                        )}

                        {/* Preços */}
                        {promo.preco_de && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>
                              De R$ {promo.preco_de.toFixed(2).replace('.', ',')}
                            </span>
                            {precoPor && (
                              <>
                                <span style={{ color: '#EA580C', fontWeight: 700 }}>→</span>
                                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 20, color: '#16A34A' }}>
                                  R$ {precoPor.toFixed(2).replace('.', ',')}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Validade */}
                        {promo.fim && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#92400E' }}>
                            <Calendar size={12} />
                            Válido até {new Date(promo.fim).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── HORÁRIOS ── */}
          {comercio.horarios && Object.keys(comercio.horarios).length > 0 && (
            <div style={{ background: 'white', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Poppins, sans-serif' }}>
                <Clock size={16} color="#2563EB" /> Horários
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DIAS.map(dia => {
                  const h = comercio.horarios[dia]
                  const ehHoje = dia === diaAtual
                  return (
                    <div key={dia} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 12px', borderRadius: 10,
                      background: ehHoje ? '#F0FDF4' : 'transparent',
                      border: ehHoje ? '1px solid #BBF7D0' : '1px solid transparent',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: ehHoje ? 700 : 400, color: ehHoje ? '#16A34A' : '#6B7280' }}>
                        {ehHoje && '→ '}{DIAS_LABEL[dia]}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: ehHoje ? 700 : 400, color: h ? (ehHoje ? '#16A34A' : '#374151') : '#DC2626' }}>
                        {h ? `${h.aberto} – ${h.fechado}` : 'Fechado'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── OPT-IN PROMOÇÕES ── */}
          <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #BBF7D0', borderRadius: 20, padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <MessageCircle size={20} color="#16A34A" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'Poppins, sans-serif' }}>Receba promoções pelo WhatsApp</h2>
            </div>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>
              Seja o primeiro a saber das ofertas de {comercio.nome}.
            </p>
            {optinOk ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <p style={{ fontWeight: 700, color: '#16A34A' }}>Cadastro realizado!</p>
                <p style={{ fontSize: 13, color: '#6B7280' }}>Você receberá as próximas promoções pelo WhatsApp.</p>
              </div>
            ) : (
              <form onSubmit={fazerOptin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)}
                  style={{ padding: '12px 14px', border: '1.5px solid #D1FAE5', borderRadius: 12, fontSize: 14, outline: 'none', background: 'white' }} />
                <input type="tel" placeholder="WhatsApp (ex: 91 9 9999-9999)" value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)} required
                  style={{ padding: '12px 14px', border: '1.5px solid #D1FAE5', borderRadius: 12, fontSize: 14, outline: 'none', background: 'white' }} />
                <button type="submit" disabled={enviando} style={{
                  background: '#16A34A', color: 'white', border: 'none', borderRadius: 12,
                  padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif',
                }}>
                  {enviando ? 'Cadastrando...' : '📲 Quero receber promoções'}
                </button>
                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>
                  Você pode cancelar a qualquer momento.
                </p>
              </form>
            )}
          </div>

          {/* Dono deste negócio? */}
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>É o dono deste negócio?</p>
            <Link href="/comerciante/login" style={{ fontSize: 13, color: '#16A34A', fontWeight: 700, textDecoration: 'none' }}>
              Reivindique gratuitamente e receba clientes pelo WhatsApp →
            </Link>
          </div>
        </div>
      </main>

      {/* ── BARRA FIXA INFERIOR (mobile) ── */}
      {whatsappLink && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'white', borderTop: '1px solid #E5E7EB',
          padding: '12px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
        }}>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            onClick={() => registrarLead('whatsapp_fixo')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#25D366', color: 'white', borderRadius: 12, padding: '14px',
              fontWeight: 700, fontSize: 15, textDecoration: 'none', fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 4px 16px rgba(37,211,102,0.40)',
            }}>
            <MessageCircle size={18} /> Falar no WhatsApp com {comercio.nome}
          </a>
        </div>
      )}
    </>
  )
}
