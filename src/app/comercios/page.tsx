'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import CardComercio from '@/components/CardComercio'
import { api, registrarEvento, type Comercio } from '@/lib/api'
import { SlidersHorizontal, X, Loader2 } from 'lucide-react'

const CATEGORIAS = [
  { slug: '', nome: 'Todos' },
  { slug: 'restaurantes', nome: '🍽️ Restaurantes' },
  { slug: 'mercados', nome: '🛒 Mercados' },
  { slug: 'farmacias', nome: '💊 Farmácias' },
  { slug: 'saloes', nome: '💇 Salões' },
  { slug: 'pizzarias', nome: '🍕 Pizzarias' },
  { slug: 'padarias', nome: '🥖 Padarias' },
  { slug: 'clinicas', nome: '🏥 Clínicas' },
  { slug: 'bares', nome: '🍺 Bares' },
  { slug: 'lanchonetes', nome: '🍔 Lanchonetes' },
  { slug: 'academias', nome: '💪 Academias' },
  { slug: 'oficinas', nome: '🔧 Oficinas' },
  { slug: 'eletronicos', nome: '📱 Eletrônicos' },
]

function ComerciosContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [comercios, setComercios] = useState<Comercio[]>([])
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [filtroAberto, setFiltroAberto] = useState(false)

  const busca     = searchParams.get('busca') || ''
  const categoria = searchParams.get('categoria') || ''
  const bairro    = searchParams.get('bairro') || ''
  const apenasAbertos = searchParams.get('aberto') === 'true'
  const page      = Number(searchParams.get('page') || 1)

  const atualizar = (params: Record<string, string>) => {
    const atual = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v) atual.set(k, v)
      else atual.delete(k)
    })
    atual.delete('page')
    router.push(`/comercios?${atual.toString()}`)
  }

  useEffect(() => {
    setCarregando(true)
    const params: Record<string, string | number | boolean> = { page, limit: 24 }
    if (busca)         params.busca = busca
    if (categoria)     params.categoria = categoria
    if (bairro)        params.bairro = bairro
    if (apenasAbertos) params.aberto = true

    api.comercios.listar(params)
      .then(res => {
        setComercios(res.data)
        setTotal(res.meta.total)
        setPaginas(res.meta.paginas)
        res.data.forEach(c => registrarEvento(c.id, 'impressao', busca || undefined))
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [busca, categoria, bairro, apenasAbertos, page])

  const temFiltro = busca || categoria || bairro || apenasAbertos

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: 'var(--creme)' }}>

        {/* Barra de filtros */}
        <div style={{
          background: 'white', borderBottom: '1px solid var(--borda)',
          padding: '12px 0', position: 'sticky', top: 64, zIndex: 50
        }}>
          <div className="container">
            {/* Categorias scroll horizontal */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 10,
              scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => atualizar({ categoria: cat.slug })}
                  style={{
                    padding: '6px 14px', borderRadius: 99, border: '1.5px solid',
                    borderColor: categoria === cat.slug ? 'var(--verde)' : 'var(--borda)',
                    background: categoria === cat.slug ? 'var(--verde)' : 'white',
                    color: categoria === cat.slug ? 'white' : 'var(--texto)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'nowrap', transition: 'all 0.15s',
                    fontFamily: 'DM Sans',
                  }}
                >
                  {cat.nome}
                </button>
              ))}
            </div>

            {/* Filtros rápidos */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => atualizar({ aberto: apenasAbertos ? '' : 'true' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 8, border: '1.5px solid',
                  borderColor: apenasAbertos ? '#22c55e' : 'var(--borda)',
                  background: apenasAbertos ? '#DCFCE7' : 'white',
                  color: apenasAbertos ? '#15803D' : 'var(--texto-suave)',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: apenasAbertos ? '#22c55e' : '#ccc' }} />
                Abertos agora
              </button>

              {temFiltro && (
                <button
                  onClick={() => router.push('/comercios')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 12px', borderRadius: 8,
                    border: '1.5px solid #FEE2E2', background: '#FEE2E2',
                    color: '#DC2626', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500,
                  }}
                >
                  <X size={13} /> Limpar filtros
                </button>
              )}

              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--texto-suave)' }}>
                {carregando ? '...' : `${total} resultado${total !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de comércios */}
        <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>

          {/* Título contextual */}
          {(busca || categoria) && (
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22 }}>
                {busca ? `Resultados para "${busca}"` : `Categoria: ${CATEGORIAS.find(c => c.slug === categoria)?.nome || categoria}`}
              </h1>
              <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginTop: 4 }}>
                {total} estabelecimento{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {carregando ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--verde)' }} />
              <span style={{ color: 'var(--texto-suave)' }}>Buscando comércios...</span>
            </div>
          ) : comercios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Nenhum comércio encontrado</h2>
              <p style={{ color: 'var(--texto-suave)', marginBottom: 24 }}>
                Tente outros filtros ou pergunte ao Zappi pelo WhatsApp.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => router.push('/comercios')} className="btn btn-outline" style={{ fontSize: 14 }}>
                  Ver todos os comércios
                </button>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '559291234567'}?text=${encodeURIComponent(`Olá! Não encontrei "${busca}" no site. Pode me ajudar?`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#25D366', color: 'white', padding: '10px 22px',
                    borderRadius: 999, textDecoration: 'none', fontFamily: 'Poppins',
                    fontWeight: 600, fontSize: 14,
                  }}
                >
                  💬 Perguntar ao Zappi
                </a>
              </div>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
              }}>
                {comercios.map((c, i) => (
                  <CardComercio key={c.id} comercio={c} animDelay={i * 40} />
                ))}
              </div>

              {/* Paginação */}
              {paginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
                  {page > 1 && (
                    <button
                      onClick={() => atualizar({ page: String(page - 1) })}
                      className="btn btn-outline"
                      style={{ padding: '8px 20px', fontSize: 14 }}
                    >
                      ← Anterior
                    </button>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 14, color: 'var(--texto-suave)' }}>
                    Página {page} de {paginas}
                  </span>
                  {page < paginas && (
                    <button
                      onClick={() => atualizar({ page: String(page + 1) })}
                      className="btn btn-verde"
                      style={{ padding: '8px 20px', fontSize: 14 }}
                    >
                      Próxima →
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

export default function ComerciosPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ComerciosContent />
    </Suspense>
  )
}
