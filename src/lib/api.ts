const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição')
  return data
}

// ── Comércios ─────────────────────────────────────────────────
export interface Comercio {
  id: string
  nome: string
  slug: string
  descricao: string
  categoria_slug: string
  categoria_nome: string
  categoria_icone: string
  cidade_nome: string
  estado: string
  telefone: string
  whatsapp: string
  email: string
  site: string
  endereco: string
  bairro: string
  horarios: Record<string, { aberto: string; fechado: string } | null>
  logo_url: string
  capa_url: string
  verificado: boolean
  destaque: boolean
  avaliacao: number
  total_avaliacoes: number
  aberto_agora: boolean
  status_operacional: string
  promocoes?: Promocao[]
}

export interface Promocao {
  id: string
  titulo: string
  descricao: string
  tipo: string
  preco_de: number
  preco_por: number
  percentual_desconto: number
  imagem_url: string
  fim: string
  quantidade_limite: number
  quantidade_usada: number
}

export interface PaginaComercio {
  data: Comercio[]
  meta: { total: number; page: number; limit: number; paginas: number }
}

export function registrarEvento(
  comercio_id: string,
  tipo: 'impressao' | 'clique_whatsapp' | 'clique_perfil',
  termo_busca?: string
) {
  fetch(`${API_URL}/comercios/evento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comercio_id, tipo, termo_busca: termo_busca || undefined }),
  }).catch(() => {})
}

export const api = {
  comercios: {
    listar: (params?: Record<string, string | number | boolean>) => {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
      return apiFetch<PaginaComercio>(`/comercios${qs}`)
    },
    detalhe: (slug: string) => apiFetch<Comercio & { promocoes: Promocao[] }>(`/comercios/${slug}`),
    porCategoria: (slug: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiFetch<PaginaComercio>(`/comercios/categoria/${slug}${qs}`)
    },
    categorias: () => apiFetch<{ id: string; nome: string; slug: string; icone: string }[]>('/comercios/categorias'),
  },

  cidades: {
    listar: () => apiFetch<{ id: string; nome: string; estado: string }[]>('/cidades'),
    resumo: (nome: string) => apiFetch<any>(`/cidades/${encodeURIComponent(nome)}/resumo`),
  },

  leads: {
    registrar: (body: Record<string, string>) => apiFetch('/leads', { method: 'POST', body: JSON.stringify(body) }),
    visualizacao: (body: Record<string, string>) => apiFetch('/leads/visualizacao', { method: 'POST', body: JSON.stringify(body) }),
    optin: (body: Record<string, string>) => apiFetch('/leads/optin', { method: 'POST', body: JSON.stringify(body) }),
  },
}
