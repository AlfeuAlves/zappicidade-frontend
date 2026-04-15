// ============================================================
// QR Code redirect — GET /qr/[codigo]
// Fallback: redireciona para o backend que processa o scan
// URL principal: www.zappicidadebarcarena.com.br/qr/[codigo]
// ============================================================
import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zappicidade-backend-production.up.railway.app'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  return NextResponse.redirect(`${BACKEND_URL}/qr/${codigo}`)
}
