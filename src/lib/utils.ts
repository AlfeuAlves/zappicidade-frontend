import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarTelefone(tel: string): string {
  const n = tel.replace(/\D/g, '')
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`
  return tel
}

export function formatarWhatsApp(tel: string): string {
  const n = tel.replace(/\D/g, '')
  return n.startsWith('55') ? n : `55${n}`
}

export function linkWhatsApp(tel: string, mensagem?: string): string {
  const n = formatarWhatsApp(tel)
  const msg = mensagem ? encodeURIComponent(mensagem) : ''
  return `https://wa.me/${n}${msg ? `?text=${msg}` : ''}`
}

export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export function formatarAvaliacao(nota: number): string {
  return nota.toFixed(1).replace('.', ',')
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
