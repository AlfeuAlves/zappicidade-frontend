'use client'
import { Check, Zap, Star, TrendingUp, Crown } from 'lucide-react'

// ── Dados dos planos ───────────────────────────────────────────
const PLANOS = [
  {
    id: 'basico',
    icone: <Zap size={22} color="#6B7280" />,
    nome: 'Básico',
    selo: null,
    preco: 'R$0',
    periodo: 'para sempre',
    cor: '#6B7280',
    bg: '#F9FAFB',
    borda: '#E5E7EB',
    destaque: false,
    botao: 'Começar grátis',
    botaoBg: '#F3F4F6',
    botaoCor: '#374151',
    descricao: 'Cadastro gratuito',
    recursos: [
      'Sua empresa aparece nas buscas',
      'Presença básica na plataforma',
      'Link WhatsApp para clientes',
      'QR Code do seu negócio',
    ],
  },
  {
    id: 'pro_mensal',
    icone: <TrendingUp size={22} color="#16A34A" />,
    nome: 'PRO Mensal',
    selo: null,
    preco: 'R$59,90',
    periodo: '/mês',
    cor: '#16A34A',
    bg: 'white',
    borda: '#D1FAE5',
    destaque: false,
    botao: 'Ativar plano PRO',
    botaoBg: '#16A34A',
    botaoCor: 'white',
    descricao: 'Ideal para testar',
    recursos: [
      'Mais visibilidade',
      'Melhor posicionamento nas buscas',
      'Promoções e ofertas ilimitadas',
      'Analytics de visitas',
    ],
  },
  {
    id: 'pro_3meses',
    icone: <Star size={22} color="#16A34A" />,
    nome: 'PRO – 3 Meses',
    selo: null,
    preco: 'R$149,90',
    periodo: '3 meses',
    cor: '#16A34A',
    bg: 'white',
    borda: '#D1FAE5',
    destaque: false,
    botao: 'Escolher plano',
    botaoBg: '#16A34A',
    botaoCor: 'white',
    descricao: 'Economia em relação ao mensal',
    recursos: [
      'Mais tempo aparecendo para clientes',
      'Mais chances de contato',
      'Tudo do PRO Mensal',
      'Suporte via WhatsApp',
    ],
  },
  {
    id: 'pro_6meses',
    icone: <Crown size={22} color="white" />,
    nome: 'PRO – 6 Meses',
    selo: 'MAIS ESCOLHIDO',
    preco: 'R$269,90',
    periodo: '6 meses',
    cor: 'white',
    bg: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
    borda: '#16A34A',
    destaque: true,
    botao: 'Quero mais clientes',
    botaoBg: 'white',
    botaoCor: '#16A34A',
    descricao: 'Melhor custo-benefício',
    recursos: [
      'Destaque nas buscas',
      'Maior geração de clientes',
      'Tudo do PRO 3 Meses',
      'Prioridade no suporte',
    ],
  },
  {
    id: 'pro_12meses',
    icone: <Crown size={22} color="#16A34A" />,
    nome: 'PRO – 12 Meses',
    selo: 'MELHOR CUSTO',
    preco: 'R$479,90',
    periodo: '12 meses',
    cor: '#16A34A',
    bg: 'white',
    borda: '#D1FAE5',
    destaque: false,
    botao: 'Quero o melhor plano',
    botaoBg: '#16A34A',
    botaoCor: 'white',
    descricao: 'Máxima economia',
    recursos: [
      'Presença contínua o ano todo',
      'Prioridade na plataforma',
      'Tudo do PRO 6 Meses',
      'Maior visibilidade garantida',
    ],
  },
]

const BENEFICIOS_PRO = [
  { icone: '🔝', texto: 'Sua empresa aparece primeiro' },
  { icone: '📲', texto: 'Mais cliques e contatos' },
  { icone: '🎯', texto: 'Participação em promoções' },
  { icone: '🌆', texto: 'Maior visibilidade na cidade' },
]

// ── Componente principal ───────────────────────────────────────
interface PlanosPrecosPops {
  onSelecionar?: (planoId: string) => void
  modoOnboarding?: boolean
}

export default function PlanosPrecos({ onSelecionar, modoOnboarding = false }: PlanosPrecosPops) {
  return (
    <div style={{ width: '100%', fontFamily: 'Inter, sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 16px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#DCFCE7', borderRadius: 999, padding: '4px 14px',
          marginBottom: 16,
        }}>
          <Zap size={13} color="#16A34A" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.06em' }}>
            PLANOS ZAPPICIDADE
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#111827',
          margin: '0 0 12px', lineHeight: 1.25,
        }}>
          Escolha como sua empresa vai<br />aparecer para seus clientes
        </h1>

        <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 480, margin: '0 auto 16px', lineHeight: 1.6 }}>
          Mais visibilidade, mais contatos e mais vendas todos os dias
        </p>

        <p style={{
          fontSize: 14, color: '#374151', maxWidth: 560, margin: '0 auto',
          background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12,
          padding: '12px 20px', lineHeight: 1.7,
        }}>
          O ZappiCidade conecta clientes da sua cidade diretamente ao seu negócio.
          Você pode <strong>começar gratuitamente</strong> ou escolher um plano para aumentar sua visibilidade e atrair mais clientes.
        </p>
      </div>

      {/* Grade de planos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 40,
        padding: '0 4px',
      }}>
        {PLANOS.map(p => (
          <div
            key={p.id}
            style={{
              background: p.bg,
              border: `2px solid ${p.borda}`,
              borderRadius: 20,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: p.destaque ? '0 12px 40px rgba(22,163,74,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
              transform: p.destaque ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {/* Selo */}
            {p.selo && (
              <div style={{
                position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                background: p.destaque ? 'white' : '#16A34A',
                color: p.destaque ? '#16A34A' : 'white',
                fontSize: 10, fontWeight: 800, fontFamily: 'Poppins, sans-serif',
                letterSpacing: '0.08em', padding: '4px 14px', borderRadius: 999,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}>
                {p.selo}
              </div>
            )}

            {/* Ícone + nome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: p.destaque ? 'rgba(255,255,255,0.2)' : '#F0FDF4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {p.icone}
              </div>
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 14, color: p.cor, lineHeight: 1.2 }}>
                  {p.nome}
                </div>
                <div style={{ fontSize: 11, color: p.destaque ? 'rgba(255,255,255,0.75)' : '#9CA3AF', marginTop: 1 }}>
                  {p.descricao}
                </div>
              </div>
            </div>

            {/* Preço */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: p.cor, lineHeight: 1 }}>
                {p.preco}
              </span>
              <span style={{ fontSize: 12, color: p.destaque ? 'rgba(255,255,255,0.7)' : '#9CA3AF', marginLeft: 4 }}>
                {p.periodo}
              </span>
            </div>

            {/* Recursos */}
            <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {p.recursos.map((r, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: p.destaque ? 'rgba(255,255,255,0.25)' : '#DCFCE7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={10} color={p.destaque ? 'white' : '#16A34A'} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: p.destaque ? 'rgba(255,255,255,0.9)' : '#374151', lineHeight: 1.4 }}>
                    {r}
                  </span>
                </li>
              ))}
            </ul>

            {/* Botão */}
            <button
              onClick={() => onSelecionar?.(p.id)}
              style={{
                width: '100%', padding: '13px 16px',
                background: p.botaoBg, color: p.botaoCor,
                border: p.id === 'basico' ? '1.5px solid #E5E7EB' : 'none',
                borderRadius: 12, fontSize: 13, fontWeight: 700,
                fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {p.botao}
            </button>
          </div>
        ))}
      </div>

      {/* Por que escolher o PRO */}
      <div style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        border: '1.5px solid #BBF7D0', borderRadius: 20, padding: '28px 28px',
        marginBottom: 24,
      }}>
        <h2 style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.15rem',
          color: '#111827', margin: '0 0 20px', textAlign: 'center',
        }}>
          Por que escolher o PRO?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {BENEFICIOS_PRO.map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'white', borderRadius: 12, padding: '12px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <span style={{ fontSize: 22 }}>{b.icone}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                {b.texto}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Frase de impacto */}
      <div style={{ textAlign: 'center', padding: '8px 16px' }}>
        <p style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 17px)',
          color: '#16A34A', margin: 0, lineHeight: 1.5,
          fontStyle: 'italic',
        }}>
          "Quanto mais tempo sua empresa aparece,<br />mais clientes você conquista — e menos você paga por isso."
        </p>
      </div>

    </div>
  )
}
