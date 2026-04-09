import Link from 'next/link'
import { Star, MapPin, Clock, BadgeCheck, Phone } from 'lucide-react'
import type { Comercio } from '@/lib/api'
import { formatarAvaliacao, linkWhatsApp } from '@/lib/utils'

interface Props {
  comercio: Comercio
  animDelay?: number
}

const ICONES_CATEGORIA: Record<string, string> = {
  restaurantes: '🍽️', mercados: '🛒', farmacias: '💊', saloes: '💇',
  bares: '🍺', pizzarias: '🍕', padarias: '🥖', lanchonetes: '🍔',
  clinicas: '🏥', academias: '💪', oficinas: '🔧', eletronicos: '📱',
  roupas: '👕', calcados: '👟', moveis: '🛋️', materiais: '🔨',
  posto: '⛽', hotel: '🏨', pet: '🐾', outros: '🏪',
}

export default function CardComercio({ comercio, animDelay = 0 }: Props) {
  const icone = ICONES_CATEGORIA[comercio.categoria_slug] || '🏪'
  const whatsappLink = comercio.whatsapp ? linkWhatsApp(comercio.whatsapp, `Olá! Vi seu estabelecimento no Vitrine Local.`) : null

  return (
    <article
      className="card-hover animate-fade-up"
      style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid var(--borda)',
        overflow: 'hidden',
        animationDelay: `${animDelay}ms`,
        opacity: 0,
      }}
    >
      {/* Capa / imagem */}
      <Link href={`/c/${comercio.slug}`} style={{ display: 'block', position: 'relative' }}>
        <div style={{
          height: 140,
          background: comercio.capa_url
            ? `url(${comercio.capa_url}) center/cover`
            : `linear-gradient(135deg, #00C85322 0%, #0057FF11 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48
        }}>
          {!comercio.capa_url && icone}
        </div>

        {/* Badges sobrepostos */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {comercio.destaque && (
            <span className="badge" style={{ background: 'var(--laranja)', color: 'white', fontSize: 11 }}>
              ⭐ Destaque
            </span>
          )}
          {comercio.verificado && (
            <span className="badge" style={{ background: '#EFF6FF', color: 'var(--azul)', fontSize: 11 }}>
              <BadgeCheck size={11} /> Verificado
            </span>
          )}
        </div>

        {/* Status aberto/fechado */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className={`badge ${comercio.aberto_agora ? 'tag-aberto' : 'tag-fechado'}`} style={{ fontSize: 11 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: comercio.aberto_agora ? '#22c55e' : '#ef4444',
              display: 'inline-block'
            }} />
            {comercio.aberto_agora ? 'Aberto' : 'Fechado'}
          </span>
        </div>
      </Link>

      {/* Conteúdo */}
      <div style={{ padding: '14px 16px 16px' }}>

        {/* Logo + nome */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          {comercio.logo_url ? (
            <img src={comercio.logo_url} alt={comercio.nome}
              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--borda)' }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'var(--cinza)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>{icone}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/c/${comercio.slug}`} style={{ textDecoration: 'none' }}>
              <h3 style={{
                fontFamily: 'Sora', fontWeight: 700, fontSize: 15,
                color: 'var(--texto)', lineHeight: 1.3,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {comercio.nome}
              </h3>
            </Link>
            <span style={{ fontSize: 12, color: 'var(--texto-suave)', fontWeight: 500 }}>
              {icone} {comercio.categoria_nome}
            </span>
          </div>
        </div>

        {/* Avaliação */}
        {comercio.total_avaliacoes > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Star size={13} fill="#FBBF24" color="#FBBF24" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--texto)' }}>
              {formatarAvaliacao(comercio.avaliacao)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
              ({comercio.total_avaliacoes} avaliações)
            </span>
          </div>
        )}

        {/* Bairro */}
        {comercio.bairro && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <MapPin size={12} color="var(--texto-suave)" />
            <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{comercio.bairro}</span>
          </div>
        )}

        {/* Botões */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/c/${comercio.slug}`}
            className="btn btn-outline"
            style={{ flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 8, textAlign: 'center' }}
          >
            Ver mais
          </Link>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
              style={{ flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 8 }}
            >
              <Phone size={13} /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
