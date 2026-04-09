'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Loader2, AlertCircle,
  BarChart2, MessageCircle, Tag, ArrowRight, Check,
} from 'lucide-react'
import { login, registro, salvarSessao } from '@/lib/auth'

type Aba = 'login' | 'cadastro'

const BENEFICIOS = [
  {
    icone: <BarChart2 size={20} color="#16A34A" />,
    titulo: 'Dashboard em tempo real',
    desc: 'Veja quantos clientes encontraram seu negócio hoje',
  },
  {
    icone: <MessageCircle size={20} color="#16A34A" />,
    titulo: 'WhatsApp direto',
    desc: 'Clientes falam com você com um clique, sem fricção',
  },
  {
    icone: <Tag size={20} color="#16A34A" />,
    titulo: 'Promoções que vendem',
    desc: 'Dispare ofertas para quem já demonstrou interesse',
  },
]

const STATS = [
  { valor: '927+', label: 'Estabelecimentos' },
  { valor: '20', label: 'Categorias' },
  { valor: 'Grátis', label: 'Para começar' },
]

export default function LoginPage() {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('login')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [nome, setNome]           = useState('')
  const [emailCad, setEmailCad]   = useState('')
  const [whatsapp, setWhatsapp]   = useState('')
  const [senhaCad, setSenhaCad]   = useState('')

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setErro(''); setCarregando(true)
    try {
      const auth = await login(email, senha)
      salvarSessao(auth)
      router.push('/comerciante/dashboard')
    } catch (err: any) { setErro(err.message) }
    finally { setCarregando(false) }
  }

  const fazerCadastro = async (e: React.FormEvent) => {
    e.preventDefault(); setErro(''); setCarregando(true)
    try {
      const auth = await registro({ nome, email: emailCad, senha: senhaCad, whatsapp })
      salvarSessao(auth)
      router.push('/comerciante/onboarding')
    } catch (err: any) { setErro(err.message) }
    finally { setCarregando(false) }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'white',
    border: '1.5px solid #E5E7EB',
    borderRadius: 12, fontSize: 14,
    color: '#111827', fontFamily: 'Inter', outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelBase: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: '#6B7280', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Poppins',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Navbar mínima ── */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={150} height={38}
            style={{ objectFit: 'contain', objectPosition: 'left' }} priority quality={100} />
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#6B7280', fontSize: 14, fontFamily: 'Inter' }}>
            Já tem conta?
          </span>
          <button
            onClick={() => setAba('login')}
            style={{
              background: '#16A34A', color: 'white',
              border: 'none', borderRadius: 999, padding: '8px 20px',
              fontSize: 13, fontWeight: 600, fontFamily: 'Poppins',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
              transition: 'all 0.15s',
            }}
          >
            Entrar
          </button>
        </div>
      </header>

      {/* ── Corpo ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 1100,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 40,
          alignItems: 'center',
        }}>

          {/* ── Coluna esquerda — Apresentação ── */}
          <div style={{ padding: '0 8px' }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#FEF9C3', border: '1px solid #FDE68A',
              borderRadius: 999, padding: '6px 14px', marginBottom: 24,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#854D0E',
                textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Poppins' }}>
                📍 Barcarena, Pará · Área do Comerciante
              </span>
            </div>

            {/* Título */}
            <h1 style={{
              fontFamily: 'Poppins', fontWeight: 800,
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              lineHeight: 1.15, color: '#111827',
              marginBottom: 16,
            }}>
              Seu negócio<br />
              <span style={{ color: '#16A34A' }}>visível pra cidade</span><br />
              toda
            </h1>
            <p style={{
              fontFamily: 'Inter', fontSize: 16, color: '#4B5563',
              lineHeight: 1.7, maxWidth: 440, marginBottom: 32,
            }}>
              Cadastre seu estabelecimento e conecte-se a clientes que estão
              buscando exatamente o que você oferece — via WhatsApp.
            </p>

            {/* Benefícios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
              {BENEFICIOS.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Ícone em círculo verde claro */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: '#DCFCE7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {b.icone}
                  </div>
                  <div>
                    <p style={{
                      color: '#111827', fontSize: 14, fontWeight: 600,
                      fontFamily: 'Poppins', marginBottom: 2,
                    }}>
                      {b.titulo}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: 13, fontFamily: 'Inter', lineHeight: 1.55 }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex', gap: 0,
              borderTop: '1px solid #E5E7EB', paddingTop: 24,
            }}>
              {STATS.map((s, i) => (
                <div key={i} style={{
                  flex: 1,
                  borderRight: i < STATS.length - 1 ? '1px solid #E5E7EB' : 'none',
                  padding: '0 20px 0 0', marginRight: i < STATS.length - 1 ? 20 : 0,
                }}>
                  <div style={{
                    fontFamily: 'Poppins', fontWeight: 800, fontSize: 24,
                    color: '#111827', lineHeight: 1,
                  }}>
                    {s.valor}
                  </div>
                  <div style={{
                    fontSize: 11, color: '#9CA3AF', marginTop: 4,
                    fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.05em', fontFamily: 'Inter',
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Coluna direita — Formulário ── */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 24,
            padding: 'clamp(28px, 5vw, 44px)',
            boxShadow: '0 12px 48px rgba(31,41,55,0.10)',
          }}>

            {/* Abas */}
            <div style={{
              display: 'flex', gap: 4, marginBottom: 28,
              background: '#F3F4F6', borderRadius: 14, padding: 4,
            }}>
              {(['login', 'cadastro'] as Aba[]).map(a => (
                <button key={a} onClick={() => { setAba(a); setErro('') }} style={{
                  flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Poppins',
                  transition: 'all 0.2s',
                  background: aba === a ? 'white' : 'transparent',
                  color: aba === a ? '#16A34A' : '#6B7280',
                  boxShadow: aba === a ? '0 2px 8px rgba(31,41,55,0.10)' : 'none',
                }}>
                  {a === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>

            {/* Título do card */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontFamily: 'Poppins', fontWeight: 800, fontSize: 22,
                color: '#111827', marginBottom: 6,
              }}>
                {aba === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta grátis'}
              </h2>
              <p style={{ fontFamily: 'Inter', fontSize: 14, color: '#6B7280' }}>
                {aba === 'login'
                  ? 'Acesse o painel do seu negócio'
                  : 'Comece a atrair mais clientes hoje'}
              </p>
            </div>

            {/* Erro */}
            {erro && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
                fontSize: 13, color: '#DC2626', fontFamily: 'Inter',
              }}>
                <AlertCircle size={15} color="#DC2626" /> {erro}
              </div>
            )}

            {/* ─ Login ─ */}
            {aba === 'login' && (
              <form onSubmit={fazerLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelBase}>E-mail</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" required style={inputBase}
                    onFocus={e => (e.target.style.borderColor = '#16A34A')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
                <div>
                  <label style={labelBase}>Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={mostrarSenha ? 'text' : 'password'} value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="••••••••" required style={{ ...inputBase, paddingRight: 44 }}
                      onFocus={e => (e.target.style.borderColor = '#16A34A')}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{
                      position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9CA3AF', padding: 0, display: 'flex',
                    }}>
                      {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 6 }}>
                    <Link href="/comerciante/esqueci-senha" style={{
                      fontSize: 12, color: '#6B7280', textDecoration: 'none',
                      fontFamily: 'Inter', transition: 'color 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#16A34A')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                </div>

                <button type="submit" disabled={carregando} style={{
                  width: '100%', padding: '13px', borderRadius: 999, border: 'none',
                  background: carregando ? '#86EFAC' : '#16A34A',
                  color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins',
                  cursor: carregando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', marginTop: 4,
                  boxShadow: carregando ? 'none' : '0 4px 20px rgba(22,163,74,0.35)',
                }}
                  onMouseEnter={e => { if (!carregando) { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = carregando ? '#86EFAC' : '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {carregando
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Entrando...</>
                    : <>Entrar no painel <ArrowRight size={16} /></>
                  }
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter', marginTop: 4 }}>
                  Não tem conta?{' '}
                  <button type="button" onClick={() => { setAba('cadastro'); setErro('') }} style={{
                    background: 'none', border: 'none', color: '#16A34A',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', fontSize: 13,
                  }}>
                    Criar gratuitamente
                  </button>
                </p>
              </form>
            )}

            {/* ─ Cadastro ─ */}
            {aba === 'cadastro' && (
              <form onSubmit={fazerCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelBase}>Seu nome</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                    placeholder="João Silva" required style={inputBase}
                    onFocus={e => (e.target.style.borderColor = '#16A34A')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
                <div>
                  <label style={labelBase}>E-mail</label>
                  <input type="email" value={emailCad} onChange={e => setEmailCad(e.target.value)}
                    placeholder="seu@email.com" required style={inputBase}
                    onFocus={e => (e.target.style.borderColor = '#16A34A')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelBase}>WhatsApp</label>
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                      placeholder="(91) 9 9999-9999" required style={inputBase}
                      onFocus={e => (e.target.style.borderColor = '#16A34A')}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                  <div>
                    <label style={labelBase}>Senha</label>
                    <div style={{ position: 'relative' }}>
                      <input type={mostrarSenha ? 'text' : 'password'} value={senhaCad}
                        onChange={e => setSenhaCad(e.target.value)} minLength={6}
                        placeholder="Mín. 6 chars" required style={{ ...inputBase, paddingRight: 40 }}
                        onFocus={e => (e.target.style.borderColor = '#16A34A')}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      />
                      <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{
                        position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#9CA3AF', padding: 0, display: 'flex',
                      }}>
                        {mostrarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mini checklist de benefícios */}
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: 12, padding: '12px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {['Cadastro 100% gratuito', 'Configuração em menos de 5 min', 'Apareça nas buscas da cidade'].map((txt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Check size={11} color="#16A34A" strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 12, color: '#15803D', fontFamily: 'Inter', fontWeight: 500 }}>{txt}</span>
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={carregando} style={{
                  width: '100%', padding: '13px', borderRadius: 999, border: 'none',
                  background: carregando ? '#86EFAC' : '#16A34A',
                  color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Poppins',
                  cursor: carregando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: carregando ? 'none' : '0 4px 20px rgba(22,163,74,0.35)',
                }}
                  onMouseEnter={e => { if (!carregando) { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = carregando ? '#86EFAC' : '#16A34A'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {carregando
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Criando conta...</>
                    : <>Criar conta grátis <ArrowRight size={16} /></>
                  }
                </button>

                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6, fontFamily: 'Inter' }}>
                  Ao criar sua conta você concorda com os{' '}
                  <Link href="/termos" style={{ color: '#6B7280', textDecoration: 'underline' }}>Termos de Uso</Link>
                  {' '}e{' '}
                  <Link href="/privacidade" style={{ color: '#6B7280', textDecoration: 'underline' }}>Privacidade</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Rodapé mínimo ── */}
      <footer style={{
        borderTop: '1px solid #E5E7EB',
        background: 'white',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: 13, fontFamily: 'Inter' }}>
          ← Voltar para a página inicial
        </Link>
        <span style={{ color: '#D1D5DB', fontSize: 12, fontFamily: 'Inter' }}>
          © {new Date().getFullYear()} ZappiCidade · Barcarena, PA
        </span>
      </footer>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #9CA3AF; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px white inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
        @media (max-width: 680px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .left-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
