import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'ZappiCidade Barcarena', template: '%s | ZappiCidade' },
  description: 'Descubra os melhores comércios de Barcarena-PA. Promoções, horários e contato direto pelo WhatsApp.',
  keywords: ['ZappiCidade', 'comércio local', 'promoções', 'whatsapp', 'barcarena', 'pará'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'ZappiCidade',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
