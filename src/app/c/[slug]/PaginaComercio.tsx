'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Phone, MapPin, Clock, Globe, Star, BadgeCheck,
  MessageCircle, Share2, ChevronLeft, Tag, Calendar, Users
} from 'lucide-react'
import type { Comercio, Promocao } from '@/lib/api'
import { formatarTelefone, linkWhatsApp, formatarPreco, formatarAvaliacao } from '@/lib/utils'
import { api } from '@/lib/api'

const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
const DIAS_LABEL: Record<string, string> = {
  domingo: 'Domingo', segunda: 'Segunda-feira', terca: 'Terça-feira',
  quarta: 'Quarta-feira', quinta: 'Quinta-feira', sexta: 'Sexta-feira', sabado: 'Sábado',
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

  // Registra visualização
  useEffect(() => {
    api.leads.visualizacao({ comercio_id: comercio.id }).catch(() => {})
  }, [comercio.id])

  const whatsappLink = comercio.whatsapp
    ? linkWhatsApp(comercio.whatsapp, `Olá, ${comercio.nome}! Vi vocês no Vitrine Local e quero saber mais.`)
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
    <main style={{ background: 'var(--creme)', minHeight: '80vh' }}>

      {/* Capa */}
      <div style={{
        height: 260,
        background: `url(${comercio.capa_url || '/capa_padrao.png'}) center/cover`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }} />

        {/* Botão voltar */}
        <Link href="/comercios" style={{
          position: 'absolute', top: 20, left: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          color: 'white', padding: '8px 14px', borderRadius: 10,
          textDecoration: 'none', fontSize: 13, fontWeight: 500,
        }}>
          <ChevronLeft size={15} /> Voltar
        </Link>

        {/* Badges no topo */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8 }}>
          {comercio.verificado && (
            <span className="badge" style={{ background: 'rgba(0,87,255,0.9)', color: 'white', backdropFilter: 'blur(4px)' }}>
              <BadgeCheck size={12} /> Verificado
            </span>
          )}
          {comercio.destaque && (
            <span className="badge" style={{ background: 'rgba(255,107,0,0.9)', color: 'white' }}>⭐ Destaque</span>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container" style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

          {/* COLUNA ESQUERDA */}
          <div>
            {/* Card de identidade */}
            <div style={{
              background: 'white', borderRadius: '0 0 20px 20px',
              border: '1px solid var(--borda)', borderTop: 'none',
              padding: '24px 28px 28px', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                {/* Logo */}
                <div style={{
                  width: 72, height: 72, borderRadius: 16, flexShrink: 0,
                  background: comercio.logo_url ? `url(${comercio.logo_url}) center/cover` : 'var(--cinza)',
                  border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  marginTop: -48,
                }}>
                  {!comercio.logo_url && '🏪'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h1 style={{ fontSize: 24, lineHeight: 1.2 }}>{comercio.nome}</h1>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, color: 'var(--texto-suave)' }}>
                      {comercio.categoria_icone} {comercio.categoria_nome}
                    </span>
                    {comercio.bairro && (
                      <>
                        <span style={{ color: 'var(--borda)' }}>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--texto-suave)' }}>
                          <MapPin size={13} /> {comercio.bairro}
                        </span>
                      </>
                    )}
                    <span className={`badge ${comercio.aberto_agora ? 'tag-aberto' : 'tag-fechado'}`} style={{ fontSize: 12 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: comercio.aberto_agora ? '#22c55e' : '#ef4444', display: 'inline-block'
                      }} />
                      {comercio.aberto_agora ? 'Aberto agora' : 'Fechado agora'}
                    </span>
                  </div>
                </div>

                <button onClick={compartilhar} style={{
                  background: 'var(--cinza)', border: 'none', borderRadius: 10,
                  padding: 10, cursor: 'pointer', flexShrink: 0
                }}>
                  <Share2 size={16} color={compartilhado ? 'var(--verde)' : 'var(--texto-suave)'} />
                </button>
              </div>

              {/* Avaliação */}
              {comercio.total_avaliacoes > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 0', borderTop: '1px solid var(--borda)' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={16}
                        fill={n <= Math.round(comercio.avaliacao) ? '#FBBF24' : '#E5E7EB'}
                        color={n <= Math.round(comercio.avaliacao) ? '#FBBF24' : '#E5E7EB'}
                      />
                    ))}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{formatarAvaliacao(comercio.avaliacao)}</span>
                  <span style={{ color: 'var(--texto-suave)', fontSize: 14 }}>({comercio.total_avaliacoes} avaliações)</span>
                </div>
              )}

              {/* Descrição */}
              {comercio.descricao && (
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--texto-suave)' }}>
                  {comercio.descricao}
                </p>
              )}
            </div>

            {/* Promoções */}
            {comercio.promocoes && comercio.promocoes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={18} color="var(--laranja)" /> Promoções ativas
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comercio.promocoes.map(promo => (
                    <div key={promo.id} style={{
                      background: 'white', borderRadius: 14, padding: '18px 20px',
                      border: '1px solid var(--borda)',
                      borderLeft: '4px solid var(--laranja)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 16, marginBottom: 6 }}>{promo.titulo}</h3>
                          {promo.descricao && (
                            <p style={{ fontSize: 14, color: 'var(--texto-suave)', lineHeight: 1.5 }}>
                              {promo.descricao}
                            </p>
                          )}
                          {promo.fim && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: 'var(--texto-suave)' }}>
                              <Calendar size={12} />
                              Válido até {new Date(promo.fim).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        {(promo.percentual_desconto || promo.preco_por) && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {promo.percentual_desconto && (
                              <div style={{
                                background: 'var(--laranja)', color: 'white',
                                borderRadius: 10, padding: '6px 12px',
                                fontFamily: 'Sora', fontWeight: 800, fontSize: 18,
                              }}>
                                -{promo.percentual_desconto}%
                              </div>
                            )}
                            {promo.preco_por && (
                              <div style={{ marginTop: 4 }}>
                                {promo.preco_de && (
                                  <span style={{ fontSize: 12, color: 'var(--texto-suave)', textDecoration: 'line-through' }}>
                                    {formatarPreco(promo.preco_de)}
                                  </span>
                                )}
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--verde)' }}>
                                  {formatarPreco(promo.preco_por)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horários */}
            {comercio.horarios && Object.keys(comercio.horarios).length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--borda)', padding: '24px 28px', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color="var(--azul)" /> Horários de funcionamento
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DIAS.map(dia => {
                    const h = comercio.horarios[dia]
                    const ehHoje = dia === diaAtual
                    return (
                      <div key={dia} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderRadius: 8,
                        background: ehHoje ? 'var(--cinza)' : 'transparent',
                      }}>
                        <span style={{ fontSize: 14, fontWeight: ehHoje ? 600 : 400, color: ehHoje ? 'var(--texto)' : 'var(--texto-suave)' }}>
                          {ehHoje && '→ '}{DIAS_LABEL[dia]}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: ehHoje ? 600 : 400 }}>
                          {h ? `${h.aberto} – ${h.fechado}` : <span style={{ color: '#DC2626' }}>Fechado</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Receber promoções via WhatsApp */}
            <div style={{
              background: 'linear-gradient(135deg, #25D36615 0%, #25D36605 100%)',
              border: '1px solid #25D36630', borderRadius: 16, padding: '24px 28px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <MessageCircle size={20} color="#25D366" />
                <h2 style={{ fontSize: 17 }}>Receba promoções pelo WhatsApp</h2>
              </div>
              <p style={{ fontSize: 14, color: 'var(--texto-suave)', marginBottom: 16, lineHeight: 1.6 }}>
                Cadastre seu WhatsApp e seja o primeiro a saber das ofertas de {comercio.nome}.
              </p>

              {optinOk ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <p style={{ fontWeight: 600, color: 'var(--verde)' }}>Cadastro realizado!</p>
                  <p style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Você receberá as próximas promoções pelo WhatsApp.</p>
                </div>
              ) : (
                <form onSubmit={fazerOptin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)}
                    style={{ padding: '10px 14px', border: '1.5px solid var(--borda)', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none' }}
                  />
                  <input
                    type="tel" placeholder="WhatsApp (ex: 91 9 9999-9999)" value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)} required
                    style={{ padding: '10px 14px', border: '1.5px solid var(--borda)', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none' }}
                  />
                  <button type="submit" disabled={enviando} className="btn btn-whatsapp" style={{ width: '100%', justifyContent: 'center' }}>
                    {enviando ? 'Cadastrando...' : '📲 Quero receber promoções'}
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--texto-suave)', textAlign: 'center' }}>
                    Você pode cancelar a qualquer momento. Seus dados estão seguros.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA — sticky */}
          <div style={{ position: 'sticky', top: 120 }}>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--borda)', overflow: 'hidden' }}>

              {/* Botões de contato */}
              <div style={{ padding: '20px 20px 16px' }}>
                <h3 style={{ fontSize: 15, marginBottom: 16, color: 'var(--texto-suave)' }}>Entrar em contato</h3>

                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                    onClick={() => registrarLead('whatsapp')}
                    className="btn btn-whatsapp"
                    style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 15 }}>
                    <MessageCircle size={17} /> Falar no WhatsApp
                  </a>
                )}

                {comercio.telefone && (
                  <a href={`tel:${comercio.telefone}`}
                    onClick={() => registrarLead('ligacao')}
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 14 }}>
                    <Phone size={15} /> {formatarTelefone(comercio.telefone)}
                  </a>
                )}

                {comercio.site && (
                  <a href={comercio.site} target="_blank" rel="noopener noreferrer"
                    onClick={() => registrarLead('site')}
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}>
                    <Globe size={15} /> Visitar site
                  </a>
                )}
              </div>

              {/* Endereço */}
              {comercio.endereco && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--borda)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--verde)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 14, lineHeight: 1.5 }}>{comercio.endereco}</p>
                      {comercio.bairro && (
                        <p style={{ fontSize: 13, color: 'var(--texto-suave)' }}>{comercio.bairro}, {comercio.cidade_nome}-{comercio.estado}</p>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(`${comercio.nome} ${comercio.endereco} ${comercio.cidade_nome}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: 'var(--azul)', textDecoration: 'none', fontWeight: 500, display: 'inline-block', marginTop: 6 }}
                      >
                        Ver no mapa →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Status atual */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--borda)', background: 'var(--cinza)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Status agora</span>
                  <span className={`badge ${comercio.aberto_agora ? 'tag-aberto' : 'tag-fechado'}`} style={{ fontSize: 12 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: comercio.aberto_agora ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                    {comercio.aberto_agora ? 'Aberto agora' : 'Fechado agora'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
