// ============================================================
// QR Code redirect — GET /qr/[codigo]
// Registra o scan e redireciona para o WhatsApp do bot
// URL: painel.zappicidadebarcarena.com.br/qr/XXXXXXXX
// ============================================================
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WHATSAPP_BOT = '5591993870599'
const SITE_HOME    = 'https://www.zappicidadebarcarena.com.br'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Busca o QR e o nome do comércio
  const { data: qr, error } = await supabase
    .from('qrcodes')
    .select('id, total_scans, comercio_id, comercios(nome)')
    .eq('codigo', codigo)
    .single()

  if (error || !qr) {
    // QR inválido → redireciona para o site principal
    return NextResponse.redirect(SITE_HOME)
  }

  // Incrementa o contador e registra o horário do scan (fire-and-forget)
  supabase
    .from('qrcodes')
    .update({
      total_scans: (qr.total_scans || 0) + 1,
      ultima_vez:  new Date().toISOString(),
    })
    .eq('id', qr.id)
    .then(() => {}) // não bloqueia o redirect

  // Monta a mensagem de contexto para o bot
  const nomeComercio = (qr.comercios as { nome: string } | null)?.nome || 'o estabelecimento'
  const texto = `Oi Zappi! Quero saber sobre ${nomeComercio}`
  const waUrl = `https://wa.me/${WHATSAPP_BOT}?text=${encodeURIComponent(texto)}`

  return NextResponse.redirect(waUrl)
}
