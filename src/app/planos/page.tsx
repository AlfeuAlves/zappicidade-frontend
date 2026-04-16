import PlanosPrecos from '@/components/PlanosPrecos'
import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Planos — ZappiCidade',
  description: 'Escolha o plano ideal para sua empresa aparecer para mais clientes em Barcarena.',
}

export default function PlanosPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: 'white', borderBottom: '1px solid #E5E7EB',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/">
          <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={130} height={32} style={{ objectFit: 'contain' }} />
        </Link>
        <Link href="/comerciante/onboarding" style={{
          background: '#16A34A', color: 'white', padding: '10px 22px',
          borderRadius: 999, fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
          textDecoration: 'none',
        }}>
          Cadastrar minha empresa
        </Link>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 80px' }}>
        <PlanosPrecos />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E5E7EB', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
          © 2025 ZappiCidade · Barcarena, Pará ·{' '}
          <Link href="/" style={{ color: '#16A34A', textDecoration: 'none' }}>Início</Link>
        </p>
      </footer>

    </div>
  )
}
