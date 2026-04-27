import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import PaginaComercio from './PaginaComercio'
import { api } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const comercio = await api.comercios.detalhe(slug)
    return {
      title: comercio.nome,
      description: comercio.descricao || `${comercio.nome} em ${comercio.cidade_nome}. Horários, contato e promoções.`,
      openGraph: {
        title: comercio.nome,
        description: comercio.descricao,
        images: comercio.capa_url ? [comercio.capa_url] : [],
      },
    }
  } catch {
    return { title: 'Comércio não encontrado' }
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params

  let comercio: any
  try {
    comercio = await api.comercios.detalhe(slug)
  } catch {
    notFound()
  }

  return (
    <>
      <Header />
      <PaginaComercio
        comercio={comercio}
        temProAtivo={!!comercio.tem_pro_ativo}
        temFundadorAtivo={!!comercio.tem_fundador_ativo}
      />
    </>
  )
}
