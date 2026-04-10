'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [busca, setBusca] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const router = useRouter()

  const pesquisar = (e: React.FormEvent) => {
    e.preventDefault()
    if (busca.trim()) router.push(`/comercios?busca=${encodeURIComponent(busca.trim())}`)
  }

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid var(--borda)',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 16px rgba(0,0,0,0.07)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', height: 84 }}>

        {/* Logo ZappiCidade */}
        <Link href={process.env.NEXT_PUBLIC_SITE_URL || 'https://site-deploy-azure.vercel.app'} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, textDecoration: 'none' }}>
          <Image
            src="/logo_zappicidade.png"
            alt="ZappiCidade"
            width={160}
            height={40}
            style={{ objectFit: 'contain', objectPosition: 'left' }}
            priority
            quality={100}
          />
        </Link>

        {/* Cidade */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--cinza)', borderRadius: 99, padding: '5px 12px',
          fontSize: 13, color: 'var(--texto-suave)', flexShrink: 0,
        }}>
          <MapPin size={13} style={{ color: 'var(--verde)' }} />
          <span style={{ fontWeight: 500 }}>Barcarena, PA</span>
        </div>

        {/* Busca */}
        <form onSubmit={pesquisar} style={{ flex: 1, maxWidth: 480 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--texto-suave)', pointerEvents: 'none'
            }} />
            <input
              type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Restaurante, farmácia, salão..."
              style={{
                width: '100%', padding: '10px 14px 10px 40px',
                border: '1.5px solid var(--borda)', borderRadius: 12,
                fontSize: 14, fontFamily: 'Inter', background: 'var(--cinza)',
                outline: 'none', transition: 'all 0.15s', color: 'var(--texto)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--verde)'; e.target.style.background = 'white' }}
              onBlur={e => { e.target.style.borderColor = 'var(--borda)'; e.target.style.background = 'var(--cinza)' }}
            />
          </div>
        </form>

        {/* Nav desktop */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', flexShrink: 0 }}>
          <Link href="/comercios"
            style={{ color: 'var(--texto-suave)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: 'Inter' }}
            className="hidden md:block">
            Explorar
          </Link>
          <Link href="/comerciante"
            style={{ color: 'var(--texto-suave)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: 'Inter' }}
            className="hidden md:block">
            Sou Comerciante
          </Link>
          <Link href="/comerciante/login"
            className="btn btn-verde"
            style={{ padding: '8px 20px', fontSize: 13, borderRadius: 10 }}>
            Entrar
          </Link>
        </nav>

        {/* Hambúrguer mobile */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'none' }}
          className="md:hidden"
        >
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div style={{
          background: 'white', borderTop: '1px solid var(--borda)',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <Link href="/comercios" style={{ color: 'var(--texto)', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}
            onClick={() => setMenuAberto(false)}>Explorar Comércios</Link>
          <Link href="/comerciante" style={{ color: 'var(--texto)', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}
            onClick={() => setMenuAberto(false)}>Sou Comerciante</Link>
          <Link href="/comerciante/login" style={{ color: 'var(--verde)', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}
            onClick={() => setMenuAberto(false)}>Fazer Login</Link>
        </div>
      )}
    </header>
  )
}
