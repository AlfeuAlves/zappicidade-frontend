'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Store, Tag, Users, BarChart2,
  LogOut, Eye, TrendingUp, TrendingDown,
  ExternalLink, Plus, ChevronRight, Loader2,
  Bell, Menu, Camera, Save, Globe, Mail,
  Phone, AtSign, Copy, Check, ChevronDown,
  MapPin, Clock, Move,
} from 'lucide-react'
import { obterSessao, limparSessao, apiFetch, type Comerciante } from '@/lib/auth'
import { api } from '@/lib/api'
import ImageCropModal from '@/components/ImageCropModal'

interface Metricas {
  visualizacoes_mes: number
  visualizacoes_variacao: number
  leads_30dias: number
  leads_variacao: number
  optins_ativos: number
  promocoes_ativas: number
}

interface DashboardData {
  metricas: Metricas
  grafico_visualizacoes: { dia: string; total: number }[]
  ultimos_leads: { id: string; acao: string; criado_em: string }[]
  promocoes_ativas: { id: string; titulo: string; tipo: string; quantidade_usada: number; quantidade_limite: number }[]
  resumo: any
}

const DIAS = ['segunda','terca','quarta','quinta','sexta','sabado','domingo']
const DIAS_LABEL: Record<string,string> = {
  segunda:'Seg', terca:'Ter', quarta:'Qua', quinta:'Qui', sexta:'Sex', sabado:'Sáb', domingo:'Dom'
}

// ── Seção Meu Negócio ──────────────────────────────────────────
function SecaoMeuNegocio() {
  const [carregando, setCarregando]   = useState(true)
  const [salvando, setSalvando]       = useState(false)
  const [sucesso, setSucesso]         = useState(false)
  const [erro, setErro]               = useState('')
  const [comercio, setComercio]       = useState<any>(null)
  const [categorias, setCategorias]   = useState<any[]>([])
  const [slugCopiado, setSlugCopiado] = useState(false)

  // Campos editáveis
  const [descricao,    setDescricao]   = useState('')
  const [whatsapp,     setWhatsapp]    = useState('')
  const [telefone,     setTelefone]    = useState('')
  const [website,      setWebsite]     = useState('')
  const [instagram,    setInstagram]   = useState('')
  const [emailComercio,setEmailComercio] = useState('')
  const [endereco,     setEndereco]    = useState('')
  const [categoriaId,  setCategoriaId] = useState('')
  const [horarios, setHorarios] = useState<Record<string,{aberto:string;fechado:string;aberto_flag:boolean}>>({})
  const [capaPreview,   setCapaPreview]   = useState('')
  const [capaCropB64,   setCapaCropB64]   = useState<string|null>(null)
  const [cropSrc,       setCropSrc]       = useState<string|null>(null)
  const [showCrop,      setShowCrop]      = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/comerciante/perfil'),
      api.comercios.categorias(),
    ]).then(([perfil, cats]) => {
      const c = perfil.comercio
      setCategorias(cats)
      if (!c) return
      setComercio(c)
      setDescricao(c.descricao || '')
      setWhatsapp(c.whatsapp || '')
      setTelefone(c.telefone || '')
      setWebsite(c.website || '')
      setInstagram(c.instagram || '')
      setEmailComercio(c.email || '')
      setEndereco(c.endereco || '')
      setCategoriaId(c.categoria_id || '')
      if (c.foto_capa_url) setCapaPreview(c.foto_capa_url)
      // Converte horários do banco (abre:"0800") para input (aberto:"08:00")
      const h = c.horarios || {}
      setHorarios(Object.fromEntries(DIAS.map(d => {
        const slot = h[d]
        if (slot) {
          const fmt = (v: string) => v?.length === 4 ? `${v.slice(0,2)}:${v.slice(2)}` : v || '08:00'
          return [d, { aberto: fmt(slot.abre), fechado: fmt(slot.fecha), aberto_flag: true }]
        }
        return [d, { aberto: '08:00', fechado: '18:00', aberto_flag: d !== 'domingo' }]
      })))
    }).catch(() => {}).finally(() => setCarregando(false))
  }, [])

  const handleCapa = (file: File) => {
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    setShowCrop(true)
  }

  const handleCropConfirm = (croppedB64: string) => {
    setCapaCropB64(croppedB64)
    setCapaPreview(croppedB64)
    setShowCrop(false)
  }

  const copiarSlug = () => {
    navigator.clipboard.writeText(`zappicidade.com.br/${comercio?.slug}`)
    setSlugCopiado(true); setTimeout(() => setSlugCopiado(false), 2000)
  }

  const salvar = async () => {
    setErro(''); setSucesso(false); setSalvando(true)
    try {
      if (capaCropB64) {
        await apiFetch('/comerciante/upload/capa', {
          method: 'POST', body: JSON.stringify({ base64: capaCropB64, extensao: 'jpg' }),
        })
      }
      const horariosFinais = Object.fromEntries(
        Object.entries(horarios).map(([dia, h]) => [
          dia, h.aberto_flag ? { abre: h.aberto.replace(':',''), fecha: h.fechado.replace(':','') } : null
        ])
      )
      await apiFetch('/comerciante/perfil/comercio', {
        method: 'PUT',
        body: JSON.stringify({
          descricao, whatsapp: whatsapp.replace(/\D/g,''), telefone,
          website, instagram, email: emailComercio, endereco,
          categoria_id: categoriaId || undefined, horarios: horariosFinais,
        }),
      })
      setSucesso(true); setTimeout(() => setSucesso(false), 3000)
    } catch (err: any) { setErro(err.message) }
    finally { setSalvando(false) }
  }

  if (carregando) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:300 }}>
      <Loader2 size={24} style={{ animation:'spin 1s linear infinite', color:'var(--verde)' }} />
    </div>
  )
  if (!comercio) return (
    <div style={{ background:'white', borderRadius:16, padding:40, textAlign:'center', border:'1px solid var(--borda)' }}>
      <p style={{ color:'var(--texto-suave)' }}>Nenhum comércio vinculado à sua conta.</p>
    </div>
  )

  const inp: React.CSSProperties = {
    width:'100%', padding:'10px 12px', border:'1.5px solid var(--borda)',
    borderRadius:10, fontSize:14, color:'var(--texto)', fontFamily:'DM Sans',
    background:'white', outline:'none', transition:'border-color 0.15s',
    boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:600, color:'var(--texto-suave)',
    marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em',
  }
  const card: React.CSSProperties = {
    background:'white', borderRadius:16, padding:'22px 24px',
    border:'1px solid var(--borda)', display:'flex', flexDirection:'column', gap:16,
  }
  const catSel = categorias.find(c => c.id === categoriaId)

  return (
    <>
    {/* Modal de crop */}
    {showCrop && cropSrc && (
      <ImageCropModal
        src={cropSrc}
        aspectRatio={8 / 3}
        outputWidth={1200}
        onConfirm={handleCropConfirm}
        onClose={() => {
          setShowCrop(false)
          // Reset file input para permitir re-selecionar o mesmo arquivo
          if (fileRef.current) fileRef.current.value = ''
        }}
      />
    )}

    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:760 }}>

      {/* Foto de capa */}
      <div style={card}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8, margin:0 }}>
            <Camera size={16} color="var(--verde)" /> Foto de Capa
          </h3>
          {capaPreview && (
            <button
              onClick={() => { if (cropSrc) setShowCrop(true); else fileRef.current?.click() }}
              style={{
                background:'none', border:'1px solid var(--borda)', borderRadius:8,
                padding:'5px 12px', fontSize:12, fontWeight:600, color:'var(--texto-suave)',
                cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                fontFamily:'Poppins', transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--verde)'; e.currentTarget.style.color='var(--verde)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--borda)'; e.currentTarget.style.color='var(--texto-suave)' }}
            >
              <Move size={12} /> Reposicionar
            </button>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => { if (e.target.files?.[0]) handleCapa(e.target.files[0]) }} />

        {/* Preview / Upload area */}
        <div
          onClick={() => !capaPreview && fileRef.current?.click()}
          style={{
            height: capaPreview ? 160 : 200, borderRadius: 12, overflow: 'hidden',
            cursor: capaPreview ? 'default' : 'pointer',
            position: 'relative',
            border: capaPreview ? '1px solid var(--borda)' : '1.5px dashed var(--borda)',
            background: 'var(--cinza)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {capaPreview ? (
            <>
              <img src={capaPreview} alt="Capa" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              {/* Overlay com ações */}
              <div style={{
                position:'absolute', inset:0, background:'rgba(0,0,0,0.45)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                opacity:0, transition:'opacity 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                onMouseLeave={e => (e.currentTarget.style.opacity='0')}
              >
                <button
                  onClick={e => { e.stopPropagation(); if (cropSrc) setShowCrop(true); else fileRef.current?.click() }}
                  style={{
                    background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
                    border:'1px solid rgba(255,255,255,0.3)', borderRadius:10,
                    padding:'8px 14px', color:'white', fontSize:12, fontWeight:600,
                    cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                    fontFamily:'Poppins',
                  }}
                >
                  <Move size={13} /> Reposicionar
                </button>
                <button
                  onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
                  style={{
                    background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
                    border:'1px solid rgba(255,255,255,0.3)', borderRadius:10,
                    padding:'8px 14px', color:'white', fontSize:12, fontWeight:600,
                    cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                    fontFamily:'Poppins',
                  }}
                >
                  <Camera size={13} /> Trocar foto
                </button>
              </div>
            </>
          ) : (
            /* ── Estado vazio: diagrama de dimensões ── */
            <div style={{ width:'100%', height:'100%', position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none', padding:'12px 16px', boxSizing:'border-box' }}>

              {/* Diagrama proporcional */}
              <div style={{ position:'relative', width:'72%', maxWidth:280 }}>

                {/* Seta de largura (topo) */}
                <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:5 }}>
                  <div style={{ flex:1, height:1, background:'#D1D5DB' }} />
                  <span style={{ fontSize:10, fontWeight:700, color:'#6B7280', fontFamily:'Inter', whiteSpace:'nowrap' }}>1200 px</span>
                  <div style={{ flex:1, height:1, background:'#D1D5DB' }} />
                </div>

                {/* Caixa proporcional (8:3) */}
                <div style={{
                  width:'100%', paddingBottom:`${(3/8)*100}%`,
                  position:'relative', borderRadius:6,
                  border:'1.5px dashed #9CA3AF',
                  background:'rgba(22,163,74,0.04)',
                }}>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Camera size={16} color="#9CA3AF" />
                    <span style={{ fontSize:11, color:'#9CA3AF', fontFamily:'Inter' }}>Foto de capa</span>
                  </div>
                </div>

                {/* Seta de altura (direita) */}
                <div style={{
                  position:'absolute', right:-36, top:0, bottom:0,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
                }}>
                  <div style={{ flex:1, width:1, background:'#D1D5DB' }} />
                  <span style={{ fontSize:10, fontWeight:700, color:'#6B7280', fontFamily:'Inter', writingMode:'vertical-rl', transform:'rotate(180deg)', whiteSpace:'nowrap' }}>450 px</span>
                  <div style={{ flex:1, width:1, background:'#D1D5DB' }} />
                </div>
              </div>

              {/* Legenda */}
              <p style={{ fontSize:12, color:'#6B7280', margin:'10px 0 0', fontFamily:'Inter', textAlign:'center' }}>
                Clique para enviar · <strong style={{ color:'#111827' }}>JPG ou PNG</strong> · máx. 10 MB
              </p>
              <p style={{ fontSize:11, color:'#9CA3AF', margin:'3px 0 0', fontFamily:'Inter' }}>
                ✂️ Você poderá recortar após o upload
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Identificação */}
      <div style={card}>
        <h3 style={{ fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8, margin:0 }}>
          <Store size={16} color="var(--verde)" /> Identificação
        </h3>

        {/* Nome (read-only) */}
        <div>
          <label style={label}>Nome do estabelecimento</label>
          <div style={{ ...inp, background:'var(--cinza)', color:'var(--texto-suave)', cursor:'not-allowed' }}>
            {comercio.nome}
          </div>
          <p style={{ fontSize:11, color:'var(--texto-suave)', marginTop:4 }}>
            Para alterar o nome, entre em contato com o suporte.
          </p>
        </div>

        {/* Categoria */}
        <div>
          <label style={label}>Categoria</label>
          <div style={{ position:'relative' }}>
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
              style={{ ...inp, appearance:'none', paddingRight:36, paddingLeft: catSel ? 36 : 12, cursor:'pointer' }}
              onFocus={e => e.target.style.borderColor='var(--verde)'}
              onBlur={e => e.target.style.borderColor='var(--borda)'}
            >
              <option value="">Selecione a categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
            </select>
            {catSel && <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>{catSel.icone}</span>}
            <ChevronDown size={14} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--texto-suave)', pointerEvents:'none' }} />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label style={label}>Descrição do negócio</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
            placeholder="Ex: Restaurante familiar com pratos típicos da região..."
            style={{ ...inp, resize:'vertical', lineHeight:1.6 }}
            onFocus={e => e.target.style.borderColor='var(--verde)'}
            onBlur={e => e.target.style.borderColor='var(--borda)'}
          />
        </div>

        {/* Slug */}
        <div style={{ background:'#F0FDF4', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:600, color:'#166534', margin:'0 0 3px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Seu link público</p>
            <span style={{ color:'#16A34A', fontSize:13, fontFamily:'DM Sans' }}>
              zappicidade.com.br/<strong>{comercio.slug}</strong>
            </span>
          </div>
          <button onClick={copiarSlug} style={{
            background:'none', border:'none', cursor:'pointer', color: slugCopiado ? '#16A34A' : 'var(--texto-suave)',
            display:'flex', alignItems:'center', gap:4, fontSize:12, fontFamily:'Poppins', fontWeight:600, flexShrink:0,
          }}>
            {slugCopiado ? <><Check size={13}/>Copiado!</> : <><Copy size={13}/>Copiar</>}
          </button>
        </div>
      </div>

      {/* Contato */}
      <div style={card}>
        <h3 style={{ fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8, margin:0 }}>
          <Phone size={16} color="var(--verde)" /> Contato
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={label}>WhatsApp</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>📱</span>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(91) 99999-9999"
                style={{ ...inp, paddingLeft:34 }}
                onFocus={e => e.target.style.borderColor='var(--verde)'}
                onBlur={e => e.target.style.borderColor='var(--borda)'}
              />
            </div>
          </div>
          <div>
            <label style={label}>Telefone fixo</label>
            <div style={{ position:'relative' }}>
              <Phone size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--texto-suave)' }} />
              <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(91) 3333-4444"
                style={{ ...inp, paddingLeft:32 }}
                onFocus={e => e.target.style.borderColor='var(--verde)'}
                onBlur={e => e.target.style.borderColor='var(--borda)'}
              />
            </div>
          </div>
          <div>
            <label style={label}>E-mail</label>
            <div style={{ position:'relative' }}>
              <Mail size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--texto-suave)' }} />
              <input type="email" value={emailComercio} onChange={e => setEmailComercio(e.target.value)} placeholder="contato@seunegocio.com"
                style={{ ...inp, paddingLeft:32 }}
                onFocus={e => e.target.style.borderColor='var(--verde)'}
                onBlur={e => e.target.style.borderColor='var(--borda)'}
              />
            </div>
          </div>
          <div>
            <label style={label}>Website</label>
            <div style={{ position:'relative' }}>
              <Globe size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--texto-suave)' }} />
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.seunegocio.com.br"
                style={{ ...inp, paddingLeft:32 }}
                onFocus={e => e.target.style.borderColor='var(--verde)'}
                onBlur={e => e.target.style.borderColor='var(--borda)'}
              />
            </div>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={label}>Instagram</label>
            <div style={{ position:'relative' }}>
              <AtSign size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--texto-suave)' }} />
              <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="seunegocio"
                style={{ ...inp, paddingLeft:32 }}
                onFocus={e => e.target.style.borderColor='var(--verde)'}
                onBlur={e => e.target.style.borderColor='var(--borda)'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Localização */}
      <div style={card}>
        <h3 style={{ fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8, margin:0 }}>
          <MapPin size={16} color="var(--verde)" /> Localização
        </h3>
        <div>
          <label style={label}>Endereço</label>
          <input value={endereco} onChange={e => setEndereco(e.target.value)}
            placeholder="Rua das Flores, 123 — Centro"
            style={inp}
            onFocus={e => e.target.style.borderColor='var(--verde)'}
            onBlur={e => e.target.style.borderColor='var(--borda)'}
          />
        </div>
      </div>

      {/* Horários */}
      <div style={card}>
        <h3 style={{ fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8, margin:0 }}>
          <Clock size={16} color="var(--verde)" /> Horários de funcionamento
        </h3>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {Object.keys(horarios).length > 0 && DIAS.map(dia => {
            const h = horarios[dia]
            if (!h) return null
            return (
              <div key={dia} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10,
                background: h.aberto_flag ? '#F0FDF4' : '#FAFAFA',
                border:`1px solid ${h.aberto_flag ? '#BBF7D0' : 'var(--borda)'}`,
              }}>
                <button onClick={() => setHorarios(prev => ({ ...prev, [dia]: { ...prev[dia], aberto_flag: !prev[dia].aberto_flag } }))}
                  style={{
                    width:36, height:20, borderRadius:99, border:'none', cursor:'pointer', flexShrink:0,
                    background: h.aberto_flag ? '#16A34A' : '#D1D5DB', position:'relative', transition:'background 0.2s',
                  }}
                >
                  <div style={{
                    position:'absolute', top:3, width:14, height:14, borderRadius:'50%', background:'white',
                    left: h.aberto_flag ? 19 : 3, transition:'left 0.2s',
                  }} />
                </button>
                <span style={{ width:30, fontSize:13, fontWeight:600, color: h.aberto_flag ? 'var(--texto)' : 'var(--texto-suave)' }}>
                  {DIAS_LABEL[dia]}
                </span>
                {h.aberto_flag ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                    <input type="time" value={h.aberto}
                      onChange={e => setHorarios(prev => ({ ...prev, [dia]: { ...prev[dia], aberto: e.target.value } }))}
                      style={{ ...inp, width:'auto', padding:'5px 10px', fontSize:13 }}
                    />
                    <span style={{ fontSize:12, color:'var(--texto-suave)' }}>até</span>
                    <input type="time" value={h.fechado}
                      onChange={e => setHorarios(prev => ({ ...prev, [dia]: { ...prev[dia], fechado: e.target.value } }))}
                      style={{ ...inp, width:'auto', padding:'5px 10px', fontSize:13 }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize:13, color:'var(--texto-suave)' }}>Fechado</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Feedback + Botão */}
      {erro && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 16px', color:'#DC2626', fontSize:14 }}>
          {erro}
        </div>
      )}
      {sucesso && (
        <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'12px 16px', color:'#16A34A', fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
          <Check size={16} /> Informações salvas com sucesso!
        </div>
      )}

      <button onClick={salvar} disabled={salvando} style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        padding:'14px 24px', borderRadius:12, border:'none',
        background: salvando ? 'rgba(22,163,74,0.5)' : '#16A34A',
        color:'white', fontSize:15, fontWeight:700, fontFamily:'Poppins',
        cursor: salvando ? 'not-allowed' : 'pointer', transition:'all 0.2s',
        alignSelf:'flex-start',
      }}>
        {salvando
          ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Salvando...</>
          : <><Save size={16} /> Salvar alterações</>
        }
      </button>
    </div>
    </>
  )
}

const ACOES: Record<string, string> = {
  whatsapp: '💬 WhatsApp',
  ligacao: '📞 Ligação',
  site: '🌐 Site',
  visualizacao: '👁️ Visualização',
  promocao: '🏷️ Promoção',
}

export default function DashboardPage() {
  const router = useRouter()
  const [comerciante, setComerciante] = useState<Comerciante | null>(null)
  const [dados, setDados] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)
  const [seção, setSeção] = useState('dashboard')
  const [statusVerificacao, setStatusVerificacao] = useState<string>('pendente')

  useEffect(() => {
    const sessao = obterSessao()
    if (!sessao) { router.push('/comerciante/login'); return }
    if (!sessao.comerciante.comercio_id) { router.push('/comerciante/onboarding'); return }
    setComerciante(sessao.comerciante)

    Promise.all([
      apiFetch<DashboardData>('/comerciante/dashboard'),
      apiFetch<any>('/comerciante/perfil'),
    ]).then(([dash, perfil]) => {
      setDados(dash)
      setStatusVerificacao(perfil.comerciante?.status_verificacao || 'pendente')
    }).catch(() => {})
      .finally(() => setCarregando(false))
  }, [router])

  const sair = () => { limparSessao(); router.push('/comerciante/login') }

  if (!comerciante) return null

  const navItems = [
    { id: 'dashboard', icone: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'perfil',    icone: <Store size={18} />,           label: 'Meu Negócio' },
    { id: 'promocoes', icone: <Tag size={18} />,             label: 'Promoções' },
    { id: 'leads',     icone: <Users size={18} />,           label: 'Clientes' },
    { id: 'analytics', icone: <BarChart2 size={18} />,       label: 'Analytics' },
  ]

  const Variacao = ({ valor }: { valor: number }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 12, fontWeight: 600,
      color: valor >= 0 ? '#15803D' : '#DC2626',
    }}>
      {valor >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(valor)}% vs mês anterior
    </span>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--creme)' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: 240, background: '#0A0A0A', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: menuAberto ? 0 : -240, bottom: 0,
        zIndex: 200, transition: 'left 0.25s ease',
      }}
        className="lg:!left-0"
      >
        {/* Logo */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid #1E293B' }}>
          <Link href="/" style={{ display: 'block', textDecoration: 'none' }}>
            <Image src="/logo_zappicidade.png" alt="ZappiCidade" width={150} height={50}
              style={{ objectFit: 'contain', objectPosition: 'left' }} />
          </Link>
        </div>

        {/* Comerciante */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, marginBottom: 8
          }}>👤</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 2 }}>
            {comerciante.nome}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>{comerciante.email}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setSeção(item.id); setMenuAberto(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: seção === item.id ? 'rgba(0,200,83,0.15)' : 'transparent',
              color: seção === item.id ? 'var(--verde)' : '#888',
              fontSize: 14, fontWeight: seção === item.id ? 600 : 400,
              transition: 'all 0.15s', textAlign: 'left', width: '100%',
              fontFamily: 'DM Sans',
            }}>
              {item.icone} {item.label}
            </button>
          ))}
        </nav>

        {/* Rodapé sidebar */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {comerciante.comercio_id && (
            <Link href={`/c/meu-comercio`} target="_blank" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 8, color: '#666',
              textDecoration: 'none', fontSize: 13,
            }}>
              <ExternalLink size={16} /> Ver página pública
            </Link>
          )}
          <button onClick={sair} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 8, border: 'none',
            background: 'none', cursor: 'pointer', color: '#666', fontSize: 13, fontFamily: 'DM Sans',
          }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {menuAberto && (
        <div onClick={() => setMenuAberto(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199
        }} />
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column' }} className="lg:ml-[240px] ml-0">

        {/* Topbar */}
        <header style={{
          background: 'white', borderBottom: '1px solid var(--borda)',
          padding: '0 24px', height: 60, display: 'flex', alignItems: 'center',
          gap: 16, position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setMenuAberto(true)} className="lg:hidden" style={{
            background: 'none', border: 'none', cursor: 'pointer'
          }}>
            <Menu size={20} />
          </button>

          <h1 style={{ fontSize: 17, fontFamily: 'Sora', flex: 1 }}>
            {navItems.find(n => n.id === seção)?.label || 'Dashboard'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!comerciante.comercio_id && (
              <Link href="/comerciante/vincular" className="btn btn-verde" style={{ fontSize: 13, padding: '7px 14px', borderRadius: 8 }}>
                <Plus size={14} /> Vincular negócio
              </Link>
            )}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 6 }}>
              <Bell size={18} color="var(--texto-suave)" />
            </button>
          </div>
        </header>

        {/* Banner verificação pendente */}
        {statusVerificacao === 'pendente' && comerciante.comercio_id && (
          <div style={{
            background: '#FFF7ED', borderBottom: '1px solid #FED7AA',
            padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E', margin: 0 }}>
                Verificação pendente
              </p>
              <p style={{ fontSize: 13, color: '#B45309', margin: 0 }}>
                Recebemos sua solicitação e estamos verificando se você é o proprietário do estabelecimento. Você será notificado pelo WhatsApp em breve.
              </p>
            </div>
          </div>
        )}

        {/* Banner aprovado */}
        {statusVerificacao === 'aprovado' && (
          <div style={{
            background: '#F0FDF4', borderBottom: '1px solid #BBF7D0',
            padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>
              Conta verificada — seu estabelecimento está ativo no ZappiCidade!
            </p>
          </div>
        )}

        {/* Aviso sem comércio */}
        {!comerciante.comercio_id && (
          <div style={{
            background: '#FFF7ED', border: '1px solid #FED7AA',
            margin: 24, borderRadius: 12, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>Nenhum negócio vinculado</p>
              <p style={{ fontSize: 13, color: '#B45309' }}>
                Vincule seu estabelecimento para acompanhar as métricas e publicar promoções.
              </p>
            </div>
            <Link href="/comerciante/vincular" style={{
              fontSize: 13, color: '#92400E', textDecoration: 'none', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              Vincular <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* CONTEÚDO POR SEÇÃO */}
        <div style={{ padding: 24, flex: 1 }}>

          {seção === 'dashboard' && (
            carregando ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--verde)' }} />
                <span style={{ color: 'var(--texto-suave)' }}>Carregando métricas...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Cards de métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    {
                      icone: '👁️', titulo: 'Visualizações', cor: 'var(--azul)',
                      valor: dados?.metricas.visualizacoes_mes || 0,
                      variacao: dados?.metricas.visualizacoes_variacao || 0,
                      sub: 'este mês',
                    },
                    {
                      icone: '🎯', titulo: 'Leads', cor: 'var(--verde)',
                      valor: dados?.metricas.leads_30dias || 0,
                      variacao: dados?.metricas.leads_variacao || 0,
                      sub: 'últimos 30 dias',
                    },
                    {
                      icone: '📲', titulo: 'Opt-ins WhatsApp', cor: '#25D366',
                      valor: dados?.metricas.optins_ativos || 0,
                      variacao: null,
                      sub: 'contatos ativos',
                    },
                    {
                      icone: '🏷️', titulo: 'Promoções', cor: 'var(--laranja)',
                      valor: dados?.metricas.promocoes_ativas || 0,
                      variacao: null,
                      sub: 'ativas agora',
                    },
                  ].map((card, i) => (
                    <div key={i} style={{
                      background: 'white', borderRadius: 16, padding: '20px 22px',
                      border: '1px solid var(--borda)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: card.cor + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>
                          {card.icone}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{card.sub}</span>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Sora', marginBottom: 4 }}>
                        {card.valor.toLocaleString('pt-BR')}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: card.variacao !== null ? 8 : 0 }}>
                        {card.titulo}
                      </div>
                      {card.variacao !== null && <Variacao valor={card.variacao} />}
                    </div>
                  ))}
                </div>

                {/* Gráfico simplificado + Últimos leads */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

                  {/* Gráfico de visualizações */}
                  <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid var(--borda)' }}>
                    <h3 style={{ fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarChart2 size={16} color="var(--azul)" /> Visualizações — últimos 30 dias
                    </h3>
                    {dados?.grafico_visualizacoes && dados.grafico_visualizacoes.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                        {(() => {
                          const max = Math.max(...dados.grafico_visualizacoes.map(d => d.total), 1)
                          return dados.grafico_visualizacoes.slice(-30).map((d, i) => (
                            <div key={i} title={`${d.dia}: ${d.total}`} style={{
                              flex: 1, background: 'var(--azul)', borderRadius: '3px 3px 0 0',
                              height: `${Math.max((d.total / max) * 100, 4)}%`,
                              opacity: 0.7 + (i / 30) * 0.3, cursor: 'default',
                              transition: 'opacity 0.2s',
                            }} />
                          ))
                        })()}
                      </div>
                    ) : (
                      <div style={{
                        height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--texto-suave)', fontSize: 14,
                        background: 'var(--cinza)', borderRadius: 10,
                      }}>
                        Ainda sem dados de visualização
                      </div>
                    )}
                  </div>

                  {/* Últimas interações */}
                  <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid var(--borda)' }}>
                    <h3 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={16} color="var(--verde)" /> Últimas interações
                      </span>
                      <button onClick={() => setSeção('leads')} style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--verde)', fontWeight: 600
                      }}>Ver todas</button>
                    </h3>
                    {dados?.ultimos_leads && dados.ultimos_leads.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {dados.ultimos_leads.slice(0, 6).map(lead => (
                          <div key={lead.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0', borderBottom: '1px solid var(--borda)',
                          }}>
                            <span style={{ fontSize: 13 }}>
                              {ACOES[lead.acao] || lead.acao}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--texto-suave)' }}>
                              {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '24px 0', color: 'var(--texto-suave)', fontSize: 13, gap: 8
                      }}>
                        <span style={{ fontSize: 28 }}>👋</span>
                        Nenhuma interação ainda
                      </div>
                    )}
                  </div>
                </div>

                {/* Promoções ativas */}
                {dados?.promocoes_ativas && dados.promocoes_ativas.length > 0 && (
                  <div style={{ background: 'white', borderRadius: 16, padding: '22px 24px', border: '1px solid var(--borda)' }}>
                    <h3 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag size={16} color="var(--laranja)" /> Promoções ativas
                      </span>
                      <button onClick={() => setSeção('promocoes')} style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--verde)', fontWeight: 600
                      }}>Gerenciar</button>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {dados.promocoes_ativas.map(p => (
                        <div key={p.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 14px', borderRadius: 10, background: 'var(--cinza)',
                        }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>{p.titulo}</p>
                            <p style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{p.tipo}</p>
                          </div>
                          {p.quantidade_limite && (
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 13, fontWeight: 600 }}>{p.quantidade_usada}/{p.quantidade_limite}</p>
                              <p style={{ fontSize: 11, color: 'var(--texto-suave)' }}>usados</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )
          )}

          {seção === 'perfil' && <SecaoMeuNegocio />}

          {/* Placeholder para seções ainda não implementadas */}
          {seção !== 'dashboard' && seção !== 'perfil' && (
            <div style={{
              background: 'white', borderRadius: 16, padding: 48,
              border: '1px solid var(--borda)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>
                {navItems.find(n => n.id === seção)?.label} — Em breve
              </h2>
              <p style={{ color: 'var(--texto-suave)', fontSize: 15 }}>
                Esta seção está sendo desenvolvida. Volte em breve!
              </p>
              <button onClick={() => setSeção('dashboard')} className="btn btn-verde" style={{ marginTop: 20 }}>
                Voltar ao Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @media (min-width: 1024px) {
          .lg\\:\\!left-0 { left: 0 !important; }
          .lg\\:ml-\\[240px\\] { margin-left: 240px; }
          .ml-0 { margin-left: 0; }
        }
        @media (max-width: 1023px) {
          .lg\\:hidden { display: flex; }
        }
        @media (min-width: 1024px) {
          .lg\\:hidden { display: none; }
        }
      `}</style>
    </div>
  )
}
