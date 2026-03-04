import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'

const ENV_FILES = ['.env', '.env.production', '.env.local']
const serverFile = fileURLToPath(import.meta.url)
const serverDir = path.dirname(serverFile)
const envSearchDirs = [
  process.cwd(),
  serverDir,
  path.resolve(serverDir, '..'),
]
const seenEnvPaths = new Set()
for (const dir of envSearchDirs) {
  for (const file of ENV_FILES) {
    const fullPath = path.resolve(dir, file)
    if (seenEnvPaths.has(fullPath)) continue
    seenEnvPaths.add(fullPath)
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: false })
    }
  }
}

function buildDatabaseUrlFromParts() {
  const host = String(process.env.DB_HOST || '').trim()
  const port = String(process.env.DB_PORT || '3306').trim()
  const database = String(process.env.DB_NAME || '').trim()
  const user = String(process.env.DB_USER || '').trim()
  const pass = String(process.env.DB_PASSWORD || '').trim()

  if (!host || !database || !user || !pass) return ''
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${database}`
}

function resolveDatabaseUrl() {
  const raw = String(process.env.DATABASE_URL || '').trim()
  if (raw) return raw
  return buildDatabaseUrlFromParts()
}

function maskDatabaseUrl(rawUrl) {
  if (!rawUrl) return ''

  try {
    const url = new URL(rawUrl)
    const user = url.username ? decodeURIComponent(url.username) : ''
    const pass = url.password ? '***' : ''
    const auth = user ? `${user}${pass ? `:${pass}` : ''}@` : ''
    const dbName = url.pathname?.replace(/^\//, '') || ''
    return `${url.protocol}//${auth}${url.hostname}${url.port ? `:${url.port}` : ''}/${dbName}`
  } catch {
    return '[invalid DATABASE_URL]'
  }
}

function resolvePort() {
  const rawPort = String(process.env.PORT || '').trim()
  if (!rawPort) return 4000

  const port = Number.parseInt(rawPort, 10)
  if (Number.isInteger(port) && port > 0) return port

  console.warn(`WARN: PORT inválido (${rawPort}). Se usará 4000.`)
  return 4000
}

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary'
}

const DATABASE_URL = resolveDatabaseUrl()
if (DATABASE_URL) {
  process.env.DATABASE_URL = DATABASE_URL
}

const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient({
  ...(DATABASE_URL ? { datasources: { db: { url: DATABASE_URL } } } : {}),
})
const app = express()

const PORT = resolvePort()
const HOST = String(process.env.HOST || '0.0.0.0').trim() || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,https://app.acompanarte.online'
const allowedOrigins = CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const dbHealth = {
  configured: Boolean(DATABASE_URL),
  connected: false,
  error: null,
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
}))
app.use(express.json({ limit: '20mb' }))

function mapCaregiver(item) {
  return {
    id: item.id,
    nombre: item.nombre,
    email: item.email,
    telefono: item.telefono,
    codigo: item.codigo,
    disponibilidad: item.disponibilidad,
    estado: item.estado,
    tipoPerfil: item.tipoPerfil || 'cuidador',
    estadoProceso: item.estadoProceso || 'aprobado',
    provincia: item.provincia || null,
    zona: item.zona || null,
    zonaAmba: item.zonaAmba || null,
    zonasCobertura: Array.isArray(item.zonasCobertura) ? item.zonasCobertura : [],
    disponibilidadDias: Array.isArray(item.disponibilidadDias) ? item.disponibilidadDias : [],
    disponibilidadTurnos: Array.isArray(item.disponibilidadTurnos) ? item.disponibilidadTurnos : [],
    tarifaReferencia: item.tarifaReferencia ?? null,
    avatar: item.avatar,
    cvNombre: item.cvNombre || null,
    cvMimeType: item.cvMimeType || null,
    cvArchivo: item.cvArchivo || null,
    bio: item.bio,
    especialidades: item.especialidades,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

const CAREGIVER_ADMIN_SUMMARY_SELECT = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  codigo: true,
  disponibilidad: true,
  estado: true,
  tipoPerfil: true,
  estadoProceso: true,
  provincia: true,
  zona: true,
  zonaAmba: true,
  zonasCobertura: true,
  disponibilidadDias: true,
  disponibilidadTurnos: true,
  tarifaReferencia: true,
  cvNombre: true,
  bio: true,
  especialidades: true,
  createdAt: true,
  updatedAt: true,
}

function mapCaregiverSummary(item) {
  return {
    id: item.id,
    nombre: item.nombre,
    email: item.email,
    telefono: item.telefono,
    codigo: item.codigo,
    disponibilidad: item.disponibilidad,
    estado: item.estado,
    tipoPerfil: item.tipoPerfil || 'cuidador',
    estadoProceso: item.estadoProceso || 'aprobado',
    provincia: item.provincia || null,
    zona: item.zona || null,
    zonaAmba: item.zonaAmba || null,
    zonasCobertura: Array.isArray(item.zonasCobertura) ? item.zonasCobertura : [],
    disponibilidadDias: Array.isArray(item.disponibilidadDias) ? item.disponibilidadDias : [],
    disponibilidadTurnos: Array.isArray(item.disponibilidadTurnos) ? item.disponibilidadTurnos : [],
    tarifaReferencia: item.tarifaReferencia ?? null,
    cvNombre: item.cvNombre || null,
    hasAvatar: Boolean(item.avatar),
    hasCvArchivo: Boolean(item.cvArchivo || item.cvNombre),
    bio: item.bio,
    especialidades: item.especialidades,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapCaregiverDetail(item) {
  return {
    ...mapCaregiverSummary(item),
    avatar: item.avatar || null,
  }
}

function getCaregiverAdminScopeWhere(scope) {
  if (scope === 'base') {
    return {
      estadoProceso: {
        notIn: ['aprobado', 'descartado'],
      },
    }
  }

  return {
    estado: 'activo',
    estadoProceso: 'aprobado',
  }
}

function mapPatient(item) {
  return {
    id: item.id,
    nombre: item.nombre,
    edad: item.edad,
    tipo: item.tipo,
    condicion: item.condicion,
    direccion: item.direccion,
    contactoEmergencia: {
      nombre: item.contactoEmergenciaNombre,
      telefono: item.contactoEmergenciaTelefono,
    },
    acompananteAsignado: item.acompananteAsignadoId,
    foto: item.foto,
    notas: item.notas,
    necesidadesEspeciales: item.necesidadesEspeciales,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapPatientSummary(item) {
  return {
    id: item.id,
    nombre: item.nombre,
    edad: item.edad,
    tipo: item.tipo,
    condicion: item.condicion,
    direccion: item.direccion,
    contactoEmergencia: {
      nombre: item.contactoEmergenciaNombre,
      telefono: item.contactoEmergenciaTelefono,
    },
    acompananteAsignado: item.acompananteAsignadoId,
    hasFoto: Boolean(item.foto),
    notas: item.notas,
    necesidadesEspeciales: item.necesidadesEspeciales,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapService(item) {
  const duracionHoras = (item.duracionMinutos || 60) / 60
  const caregivers = Array.isArray(item.assignments)
    ? item.assignments
      .filter((a) => a.tipo === 'caregiver' && a.activo && a.caregiver)
      .map((a) => ({
        id: a.caregiver.id,
        nombre: a.caregiver.nombre,
        rol: a.rol,
      }))
    : []
  return {
    id: item.id,
    fechaInicio: item.fechaInicio,
    duracionMinutos: item.duracionMinutos,
    duracionHoras,
    repeatMode: item.repeatMode || 'none',
    repeatUntil: item.repeatUntil,
    repeatDays: Array.isArray(item.repeatDays) ? item.repeatDays : [],
    direccion: item.direccion || null,
    estado: item.estado,
    altaEstado: item.altaEstado || 'pendiente',
    altaRealizadaAt: item.altaRealizadaAt || null,
    notas: item.notas,
    pacienteId: item.pacienteId,
    cuidadorId: item.cuidadorId,
    caregivers,
    paciente: item.paciente ? { id: item.paciente.id, nombre: item.paciente.nombre, direccion: item.paciente.direccion || null } : null,
    cuidador: item.cuidador ? { id: item.cuidador.id, nombre: item.cuidador.nombre } : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapServiceAssignment(item) {
  return {
    id: item.id,
    serviceId: item.serviceId,
    caregiverId: item.caregiverId,
    tipo: item.tipo,
    rol: item.rol,
    nombreManual: item.nombreManual,
    activo: item.activo,
    caregiver: item.caregiver ? { id: item.caregiver.id, nombre: item.caregiver.nombre } : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapServiceEvent(item) {
  return {
    id: item.id,
    serviceId: item.serviceId,
    tipo: item.tipo,
    estadoDesde: item.estadoDesde,
    estadoHasta: item.estadoHasta,
    nota: item.nota,
    createdAt: item.createdAt,
  }
}

function mapServicePayment(item) {
  return {
    id: item.id,
    serviceId: item.serviceId,
    year: item.year,
    month: item.month,
    estado: item.estado,
    monto: item.monto,
    paidAt: item.paidAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function mapFinanceMovement(item) {
  return {
    id: item.id,
    tipo: item.tipo,
    categoria: item.categoria,
    metodo: item.metodo,
    monto: item.monto,
    fecha: item.fecha,
    fechaVencimiento: item.fechaVencimiento,
    fechaPago: item.fechaPago,
    year: item.year,
    month: item.month,
    week: item.week,
    periodType: item.periodType,
    estado: item.estado,
    registradoPor: item.registradoPor,
    notas: item.notas,
    patientId: item.patientId,
    caregiverId: item.caregiverId,
    serviceId: item.serviceId,
    patient: item.patient ? { id: item.patient.id, nombre: item.patient.nombre } : null,
    caregiver: item.caregiver ? { id: item.caregiver.id, nombre: item.caregiver.nombre } : null,
    service: item.service ? { id: item.service.id } : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function getIsoWeekInfo(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7)
  return { week, year: target.getUTCFullYear() }
}

function mapServiceModule(item) {
  const now = new Date()
  const currentPayment = item.payments?.find((p) => p.year === now.getFullYear() && p.month === now.getMonth() + 1) || null
  return {
    ...mapService(item),
    assignments: Array.isArray(item.assignments) ? item.assignments.map(mapServiceAssignment) : [],
    events: Array.isArray(item.events) ? item.events.map(mapServiceEvent) : [],
    payments: Array.isArray(item.payments) ? item.payments.map(mapServicePayment) : [],
    currentMonthPayment: currentPayment ? mapServicePayment(currentPayment) : null,
  }
}

function requireFields(payload, fields) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '')
  if (missing.length) {
    const error = new Error(`Faltan campos requeridos: ${missing.join(', ')}`)
    error.status = 400
    throw error
  }
}

function toCaregiverInput(body) {
  requireFields(body, ['nombre', 'email', 'telefono', 'codigo', 'disponibilidad'])
  const inferredZonaAmba = inferAmbaZoneGroup(body.provincia || null, body.zona || null)
  const hasAvatar = Object.prototype.hasOwnProperty.call(body, 'avatar')
  const hasCvFields = ['cvNombre', 'cvMimeType', 'cvArchivo']
    .some((field) => Object.prototype.hasOwnProperty.call(body, field))
  const data = {
    nombre: body.nombre,
    email: body.email,
    telefono: body.telefono,
    codigo: body.codigo,
    disponibilidad: body.disponibilidad,
    estado: body.estado || 'activo',
    tipoPerfil: body.tipoPerfil || 'cuidador',
    estadoProceso: body.estadoProceso || 'aprobado',
    provincia: body.provincia || null,
    zona: body.zona || null,
    zonaAmba: body.zonaAmba || inferredZonaAmba || null,
    zonasCobertura: Array.isArray(body.zonasCobertura)
      ? body.zonasCobertura.map((z) => String(z).trim()).filter(Boolean)
      : [],
    disponibilidadDias: Array.isArray(body.disponibilidadDias)
      ? body.disponibilidadDias.map((d) => String(d).trim()).filter(Boolean)
      : [],
    disponibilidadTurnos: Array.isArray(body.disponibilidadTurnos)
      ? body.disponibilidadTurnos.map((d) => String(d).trim()).filter(Boolean)
      : [],
    tarifaReferencia: body.tarifaReferencia !== undefined && body.tarifaReferencia !== null && body.tarifaReferencia !== ''
      ? Number(body.tarifaReferencia)
      : null,
    bio: body.bio || null,
    especialidades: Array.isArray(body.especialidades) ? body.especialidades : [],
  }

  if (hasAvatar) {
    data.avatar = body.avatar || null
  }

  if (hasCvFields) {
    data.cvNombre = body.cvNombre || null
    data.cvMimeType = body.cvMimeType || null
    data.cvArchivo = body.cvArchivo || null
  }

  return data
}

function mergeCaregiverForUpdate(existing, body) {
  const merged = {
    nombre: body.nombre ?? existing.nombre,
    email: body.email ?? existing.email,
    telefono: body.telefono ?? existing.telefono,
    codigo: body.codigo ?? existing.codigo,
    disponibilidad: body.disponibilidad ?? existing.disponibilidad,
    estado: body.estado ?? existing.estado,
    tipoPerfil: body.tipoPerfil ?? existing.tipoPerfil,
    estadoProceso: body.estadoProceso ?? existing.estadoProceso,
    provincia: Object.prototype.hasOwnProperty.call(body, 'provincia') ? body.provincia : existing.provincia,
    zona: Object.prototype.hasOwnProperty.call(body, 'zona') ? body.zona : existing.zona,
    zonaAmba: Object.prototype.hasOwnProperty.call(body, 'zonaAmba') ? body.zonaAmba : existing.zonaAmba,
    zonasCobertura: Object.prototype.hasOwnProperty.call(body, 'zonasCobertura') ? body.zonasCobertura : existing.zonasCobertura,
    disponibilidadDias: Object.prototype.hasOwnProperty.call(body, 'disponibilidadDias') ? body.disponibilidadDias : existing.disponibilidadDias,
    disponibilidadTurnos: Object.prototype.hasOwnProperty.call(body, 'disponibilidadTurnos') ? body.disponibilidadTurnos : existing.disponibilidadTurnos,
    tarifaReferencia: Object.prototype.hasOwnProperty.call(body, 'tarifaReferencia') ? body.tarifaReferencia : existing.tarifaReferencia,
    bio: Object.prototype.hasOwnProperty.call(body, 'bio') ? body.bio : existing.bio,
    especialidades: Object.prototype.hasOwnProperty.call(body, 'especialidades') ? body.especialidades : existing.especialidades,
  }

  if (Object.prototype.hasOwnProperty.call(body, 'avatar')) {
    merged.avatar = body.avatar
  } else {
    merged.avatar = existing.avatar
  }

  if (['cvNombre', 'cvMimeType', 'cvArchivo'].some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
    merged.cvNombre = body.cvNombre
    merged.cvMimeType = body.cvMimeType
    merged.cvArchivo = body.cvArchivo
  } else {
    merged.cvNombre = existing.cvNombre
    merged.cvMimeType = existing.cvMimeType
    merged.cvArchivo = existing.cvArchivo
  }

  return merged
}

function sanitizePhone(value = '') {
  return String(value).replace(/[^\d+]/g, '').trim()
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const AMBA_ZONE_GROUP_BY_PARTIDO = {
  'almirante brown': 'zona_sur',
  avellaneda: 'zona_sur',
  berazategui: 'zona_sur',
  berisso: 'zona_sur',
  brandsen: 'zona_sur',
  canuelas: 'zona_sur',
  campana: 'zona_norte',
  ensenada: 'zona_sur',
  escobar: 'zona_norte',
  'esteban echeverria': 'zona_sur',
  ezeiza: 'zona_sur',
  'exaltacion de la cruz': 'zona_norte',
  'florencio varela': 'zona_sur',
  'general las heras': 'zona_oeste',
  'general rodriguez': 'zona_oeste',
  'general san martin': 'zona_norte',
  hurlingham: 'zona_oeste',
  ituzaingo: 'zona_oeste',
  'jose c. paz': 'zona_norte',
  'la matanza': 'zona_oeste',
  'la plata': 'zona_sur',
  lanus: 'zona_sur',
  'lomas de zamora': 'zona_sur',
  lujan: 'zona_oeste',
  'malvinas argentinas': 'zona_norte',
  'marcos paz': 'zona_oeste',
  merlo: 'zona_oeste',
  moreno: 'zona_oeste',
  moron: 'zona_oeste',
  pilar: 'zona_norte',
  'presidente peron': 'zona_sur',
  quilmes: 'zona_sur',
  'san fernando': 'zona_norte',
  'san isidro': 'zona_norte',
  'san miguel': 'zona_norte',
  'san vicente': 'zona_sur',
  tigre: 'zona_norte',
  'tres de febrero': 'zona_oeste',
  'vicente lopez': 'zona_norte',
  zarate: 'zona_norte',
}

function inferAmbaZoneGroup(provincia, zona) {
  const provinciaNorm = normalizeText(provincia)
  const zonaNorm = normalizeText(zona)
  if (!provinciaNorm) return null
  if (provinciaNorm === 'caba') return 'caba'
  if (provinciaNorm !== 'buenos aires' && provinciaNorm !== 'provincia de buenos aires') return null
  if (!zonaNorm) return null
  return AMBA_ZONE_GROUP_BY_PARTIDO[zonaNorm] || null
}

function slugifyName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildDefaultEmail(nombre, idx = 0) {
  const base = slugifyName(nombre) || `perfil-${Date.now()}`
  return `${base}-${Date.now()}-${idx}@pendiente.local`
}

function sanitizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

function getRequestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim()
  if (forwarded) return forwarded
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

const caregiverSignupRateStore = new Map()
const CAREGIVER_SIGNUP_RATE_WINDOW_MS = 15 * 60 * 1000
const CAREGIVER_SIGNUP_RATE_MAX = 8
const CAREGIVER_SIGNUP_ALLOWED_CV_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function enforceCaregiverSignupRateLimit(req) {
  const ip = getRequestIp(req)
  const now = Date.now()
  const state = caregiverSignupRateStore.get(ip) || { count: 0, startAt: now }
  if (now - state.startAt > CAREGIVER_SIGNUP_RATE_WINDOW_MS) {
    state.count = 0
    state.startAt = now
  }
  state.count += 1
  caregiverSignupRateStore.set(ip, state)

  if (state.count > CAREGIVER_SIGNUP_RATE_MAX) {
    const error = new Error('Demasiados intentos. Probá de nuevo en unos minutos.')
    error.status = 429
    throw error
  }
}

function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

const EXTRA_HOURS_AGGREGATE_PREFIX = '[#EXH_AGG:v1]'

function roundCurrency(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

function parseExtraHoursAggregateNotes(notes) {
  const raw = String(notes || '').trim()
  if (!raw) return null
  const markerIndex = raw.indexOf(EXTRA_HOURS_AGGREGATE_PREFIX)
  if (markerIndex < 0) return null

  const encoded = raw.slice(markerIndex + EXTRA_HOURS_AGGREGATE_PREFIX.length).trim()
  if (!encoded) return null

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    const payload = JSON.parse(decoded)
    if (!payload || typeof payload !== 'object') return null
    if (payload.kind !== 'extra_hours_aggregate') return null
    return payload
  } catch {
    return null
  }
}

function buildExtraHoursAggregateNotes(payload) {
  const json = JSON.stringify(payload || {})
  const encoded = Buffer.from(json, 'utf8').toString('base64')
  return `${EXTRA_HOURS_AGGREGATE_PREFIX}${encoded}`
}

function normalizeExtraHoursDetail(detail, fallbackId = null) {
  if (!detail || typeof detail !== 'object') return null

  const parsedDate = detail.fecha ? new Date(detail.fecha) : null
  const normalizedDate = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toISOString().slice(0, 10)
    : null

  const horas = Number(detail.horas)
  const montoCobro = Number(detail.montoCobro)
  const montoPago = Number(detail.montoPago)
  const valorHoraCobro = Number(detail.valorHoraCobro)
  const valorHoraPago = Number(detail.valorHoraPago)

  return {
    id: String(detail.id || fallbackId || `det-${Date.now()}-${randomCode()}`),
    fecha: normalizedDate,
    horas: Number.isFinite(horas) ? horas : null,
    valorHoraCobro: Number.isFinite(valorHoraCobro) ? roundCurrency(valorHoraCobro) : null,
    valorHoraPago: Number.isFinite(valorHoraPago) ? roundCurrency(valorHoraPago) : null,
    montoCobro: Number.isFinite(montoCobro) ? roundCurrency(montoCobro) : 0,
    montoPago: Number.isFinite(montoPago) ? roundCurrency(montoPago) : 0,
    concepto: String(detail.concepto || '').trim(),
    createdAt: detail.createdAt ? String(detail.createdAt) : new Date().toISOString(),
    legacy: Boolean(detail.legacy),
  }
}

function getExtraHoursDetailKey(detail) {
  if (!detail || typeof detail !== 'object') return ''
  const fecha = String(detail.fecha || '')
  const horas = Number.isFinite(Number(detail.horas)) ? Number(detail.horas) : ''
  const valorHoraCobro = Number.isFinite(Number(detail.valorHoraCobro)) ? roundCurrency(detail.valorHoraCobro) : ''
  const valorHoraPago = Number.isFinite(Number(detail.valorHoraPago)) ? roundCurrency(detail.valorHoraPago) : ''
  const montoCobro = Number.isFinite(Number(detail.montoCobro)) ? roundCurrency(detail.montoCobro) : ''
  const montoPago = Number.isFinite(Number(detail.montoPago)) ? roundCurrency(detail.montoPago) : ''
  const concepto = String(detail.concepto || '').trim().toLowerCase()
  const createdAt = detail.createdAt ? String(detail.createdAt) : ''
  if (createdAt) {
    return `sig:${fecha}|${horas}|${valorHoraCobro}|${valorHoraPago}|${montoCobro}|${montoPago}|${concepto}|${createdAt}`
  }
  if (detail.id) {
    return `id:${String(detail.id)}|${fecha}|${horas}|${montoCobro}|${montoPago}|${concepto}`
  }
  return `sig:${fecha}|${horas}|${valorHoraCobro}|${valorHoraPago}|${montoCobro}|${montoPago}|${concepto}`
}

let extraHoursNormalizationPromise = null
let extraHoursLastNormalizedAt = 0
const EXTRA_HOURS_NORMALIZE_INTERVAL_MS = 45 * 1000

async function normalizeExtraHoursDuplicates({ force = false } = {}) {
  const nowTs = Date.now()
  if (!force && nowTs - extraHoursLastNormalizedAt < EXTRA_HOURS_NORMALIZE_INTERVAL_MS) return
  if (extraHoursNormalizationPromise) {
    await extraHoursNormalizationPromise
    return
  }

  extraHoursNormalizationPromise = prisma.$transaction(async (tx) => {
    const movements = await tx.financeMovement.findMany({
      where: {
        categoria: 'horas_extra',
        periodType: 'month',
        tipo: { in: ['cobro', 'pago'] },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    const scopedGroups = new Map()

    for (const movement of movements) {
      const aggregate = parseExtraHoursAggregateNotes(movement.notas || '')
      const inferredCaregiverId = movement.caregiverId || aggregate?.caregiverId || null
      const inferredYear = Number(movement.year || aggregate?.year || 0) || 0
      const inferredMonth = Number(movement.month || aggregate?.month || 0) || 0
      const scopeKey = [
        movement.tipo || 'tipo',
        movement.serviceId || 'service',
        inferredYear,
        inferredMonth,
      ].join(':')

      if (!scopedGroups.has(scopeKey)) {
        scopedGroups.set(scopeKey, { known: new Map(), unknown: [] })
      }

      const scope = scopedGroups.get(scopeKey)
      const entry = { movement, aggregate, caregiverId: inferredCaregiverId, year: inferredYear, month: inferredMonth }
      if (inferredCaregiverId) {
        if (!scope.known.has(inferredCaregiverId)) scope.known.set(inferredCaregiverId, [])
        scope.known.get(inferredCaregiverId).push(entry)
      } else {
        scope.unknown.push(entry)
      }
    }

    const pickCanonicalEntry = (entries = []) => {
      if (!Array.isArray(entries) || entries.length === 0) return null
      return [...entries].sort((a, b) => {
        const detailsA = Array.isArray(a.aggregate?.detalles) ? a.aggregate.detalles.length : 0
        const detailsB = Array.isArray(b.aggregate?.detalles) ? b.aggregate.detalles.length : 0
        if (detailsA !== detailsB) return detailsB - detailsA

        const pendingA = String(a.movement?.estado || '').toLowerCase() === 'pendiente' ? 1 : 0
        const pendingB = String(b.movement?.estado || '').toLowerCase() === 'pendiente' ? 1 : 0
        if (pendingA !== pendingB) return pendingB - pendingA

        const tsA = new Date(a.movement?.updatedAt || a.movement?.createdAt || a.movement?.fecha || 0).getTime() || 0
        const tsB = new Date(b.movement?.updatedAt || b.movement?.createdAt || b.movement?.fecha || 0).getTime() || 0
        return tsB - tsA
      })[0]
    }

    for (const scope of scopedGroups.values()) {
      const caregiverGroups = new Map(scope.known)

      if (scope.unknown.length > 0) {
        if (caregiverGroups.size === 1) {
          const [singleCaregiverId] = caregiverGroups.keys()
          caregiverGroups.get(singleCaregiverId).push(...scope.unknown)
        } else {
          const unknownKey = 'sin-cuidador'
          if (!caregiverGroups.has(unknownKey)) caregiverGroups.set(unknownKey, [])
          caregiverGroups.get(unknownKey).push(...scope.unknown)
        }
      }

      for (const [caregiverKey, groupEntries] of caregiverGroups.entries()) {
        if (!Array.isArray(groupEntries) || groupEntries.length === 0) continue

        const canonicalEntry = pickCanonicalEntry(groupEntries)
        if (!canonicalEntry) continue

        const effectiveCaregiverId = caregiverKey !== 'sin-cuidador'
          ? caregiverKey
          : (canonicalEntry.caregiverId || null)

        const detailsByKey = new Map()
        for (const entry of groupEntries) {
          const aggregateDetails = Array.isArray(entry.aggregate?.detalles) ? entry.aggregate.detalles : []

          if (aggregateDetails.length > 0) {
            for (const rawDetail of aggregateDetails) {
              const normalized = normalizeExtraHoursDetail(rawDetail, null)
              if (!normalized) continue
              const detailKey = getExtraHoursDetailKey(normalized)
              if (!detailKey) continue
              if (!detailsByKey.has(detailKey)) detailsByKey.set(detailKey, normalized)
            }
            continue
          }

          const item = entry.movement
          const fallbackDate = item.fecha instanceof Date && !Number.isNaN(item.fecha.getTime())
            ? item.fecha.toISOString().slice(0, 10)
            : null
          const legacyDetail = normalizeExtraHoursDetail({
            id: null,
            fecha: fallbackDate,
            horas: null,
            valorHoraCobro: null,
            valorHoraPago: null,
            montoCobro: item.tipo === 'cobro' ? Number(item.monto || 0) : 0,
            montoPago: item.tipo === 'pago' ? Number(item.monto || 0) : 0,
            concepto: String(item.notas || '').trim() || 'Registro legacy',
            legacy: true,
          }, null)
          if (!legacyDetail) continue
          const legacyKey = [
            'legacy',
            fallbackDate || '',
            roundCurrency(item.monto || 0),
            String(item.notas || '').trim().toLowerCase(),
          ].join('|')
          if (!detailsByKey.has(legacyKey)) detailsByKey.set(legacyKey, legacyDetail)
        }

        const details = [...detailsByKey.values()]
        const totals = details.reduce((acc, detail) => ({
          horas: acc.horas + (Number.isFinite(detail.horas) ? Number(detail.horas) : 0),
          montoCobro: acc.montoCobro + roundCurrency(detail.montoCobro || 0),
          montoPago: acc.montoPago + roundCurrency(detail.montoPago || 0),
        }), { horas: 0, montoCobro: 0, montoPago: 0 })

        totals.horas = roundCurrency(totals.horas)
        totals.montoCobro = roundCurrency(totals.montoCobro)
        totals.montoPago = roundCurrency(totals.montoPago)

        const canonical = canonicalEntry.movement
        const aggregatePayload = {
          version: 1,
          kind: 'extra_hours_aggregate',
          serviceId: canonical.serviceId || null,
          patientId: canonical.patientId || null,
          patientNombre: null,
          caregiverId: effectiveCaregiverId,
          caregiverNombre: canonicalEntry.aggregate?.caregiverNombre || null,
          year: canonicalEntry.year || canonical.year || null,
          month: canonicalEntry.month || canonical.month || null,
          detalles: details,
          totals,
        }
        const aggregateNotes = buildExtraHoursAggregateNotes(aggregatePayload)
        const groupHasPending = groupEntries.some((entry) => String(entry.movement.estado || '').toLowerCase() === 'pendiente')

        await tx.financeMovement.update({
          where: { id: canonical.id },
          data: {
            caregiverId: effectiveCaregiverId,
            monto: canonical.tipo === 'cobro' ? totals.montoCobro : totals.montoPago,
            notas: aggregateNotes,
            estado: groupHasPending ? 'pendiente' : (canonical.estado || 'pagado'),
          },
        })

        const deleteIds = groupEntries
          .map((entry) => entry.movement.id)
          .filter((id) => id !== canonical.id)

        if (deleteIds.length > 0) {
          await tx.financeMovement.deleteMany({
            where: { id: { in: deleteIds } },
          })
        }
      }
    }
  })
    .finally(() => {
      extraHoursLastNormalizedAt = Date.now()
      extraHoursNormalizationPromise = null
    })

  await extraHoursNormalizationPromise
}

function parseJsonSafe(text, fallback = {}) {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

function getOpenAiOutputText(payload) {
  if (!payload || typeof payload !== 'object') return ''
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text
  }

  const chunks = []
  const output = Array.isArray(payload.output) ? payload.output : []
  for (const entry of output) {
    const content = Array.isArray(entry?.content) ? entry.content : []
    for (const item of content) {
      if (typeof item?.text === 'string') chunks.push(item.text)
    }
  }
  return chunks.join('\n').trim()
}

function normalizeAiTipoPerfil(value = '') {
  const v = String(value || '').toLowerCase().trim()
  const allowed = ['cuidador', 'masajista', 'kinesiologo', 'enfermero', 'acompanante_terapeutico', 'otro']
  if (allowed.includes(v)) return v
  if (v.includes('masaj')) return 'masajista'
  if (v.includes('kines')) return 'kinesiologo'
  if (v.includes('enfer')) return 'enfermero'
  if (v.includes('terap')) return 'acompanante_terapeutico'
  if (v.includes('cuidad')) return 'cuidador'
  return 'cuidador'
}

function normalizeAiEspecialidades(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean)
  }
  return []
}

async function analyzeCvWithOpenAI(file) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const error = new Error('Falta OPENAI_API_KEY en backend/.env')
    error.status = 400
    throw error
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const mimeType = file.mimeType || 'application/octet-stream'
  const fileData = `data:${mimeType};base64,${file.dataBase64}`
  const systemPrompt = [
    'Sos un extractor de datos de CVs de salud en Argentina.',
    'Devolvé SOLO JSON válido (sin markdown, sin texto extra) con:',
    '{',
    '  "nombre": string,',
    '  "email": string,',
    '  "telefono": string,',
    '  "tipoPerfil": "cuidador" | "masajista" | "kinesiologo" | "enfermero" | "acompanante_terapeutico" | "otro",',
    '  "provincia": string,',
    '  "zona": string,',
    '  "especialidades": string[],',
    '  "resumen": string,',
    '  "confianza": number',
    '}',
    'Si un dato no aparece, usar cadena vacía (o [] en listas).',
    'telefono en formato argentino si es posible.',
    'confianza en rango 0-100.',
  ].join('\n')

  const payload = {
    model,
    temperature: 0.1,
    max_output_tokens: 700,
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: systemPrompt }],
      },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: `Analizá este CV: ${file.name}` },
          { type: 'input_file', filename: file.name || 'cv', file_data: fileData },
        ],
      },
    ],
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const raw = await response.text()
  const json = parseJsonSafe(raw, null)
  if (!response.ok) {
    const message = json?.error?.message || `OpenAI error (${response.status})`
    const error = new Error(message)
    error.status = 502
    throw error
  }

  const outputText = getOpenAiOutputText(json)
  const extracted = parseJsonSafe(outputText, {})

  const confianzaRaw = Number(extracted?.confianza)
  const confianza = Number.isFinite(confianzaRaw)
    ? Math.max(0, Math.min(100, Math.round(confianzaRaw)))
    : 40

  return {
    nombre: String(extracted?.nombre || '').trim(),
    email: String(extracted?.email || '').trim().toLowerCase(),
    telefono: String(extracted?.telefono || '').trim(),
    tipoPerfil: normalizeAiTipoPerfil(extracted?.tipoPerfil),
    provincia: String(extracted?.provincia || '').trim(),
    zona: String(extracted?.zona || '').trim(),
    especialidades: normalizeAiEspecialidades(extracted?.especialidades),
    bio: String(extracted?.resumen || '').trim(),
    confianza,
  }
}

function toPatientInput(body) {
  requireFields(body, ['nombre', 'edad', 'tipo', 'condicion', 'direccion'])
  const hasFoto = Object.prototype.hasOwnProperty.call(body, 'foto')

  const data = {
    nombre: body.nombre,
    edad: Number(body.edad),
    tipo: body.tipo,
    condicion: body.condicion,
    direccion: body.direccion,
    contactoEmergenciaNombre: body.contactoEmergencia?.nombre || '',
    contactoEmergenciaTelefono: body.contactoEmergencia?.telefono || '',
    acompananteAsignadoId: body.acompananteAsignado || null,
    notas: body.notas || null,
    necesidadesEspeciales: Array.isArray(body.necesidadesEspeciales) ? body.necesidadesEspeciales : [],
  }

  if (hasFoto) {
    data.foto = body.foto || null
  }

  return data
}

function toServiceInput(body) {
  requireFields(body, ['pacienteId', 'cuidadorId', 'fechaInicio'])
  const duracionHoras =
    body.duracionHoras !== undefined && body.duracionHoras !== null
      ? Number(body.duracionHoras)
      : null
  const duracionMinutosFromHours = duracionHoras
    ? Math.max(60, Math.min(1440, Math.round(duracionHoras * 60)))
    : null
  const duracionMinutos = duracionMinutosFromHours ?? Math.max(60, Math.min(1440, Number(body.duracionMinutos || 60)))
  const repeatMode = body.repeatMode || 'none'
  const repeatUntil = repeatMode !== 'none' && body.repeatUntil ? new Date(body.repeatUntil) : null
  const repeatDays = repeatMode === 'custom' && Array.isArray(body.repeatDays)
    ? body.repeatDays.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : []

  return {
    pacienteId: body.pacienteId,
    cuidadorId: body.cuidadorId,
    fechaInicio: new Date(body.fechaInicio),
    duracionMinutos,
    repeatMode,
    repeatUntil,
    repeatDays,
    direccion: body.direccion || null,
    estado: body.estado || 'pendiente',
    notas: body.notas || null,
  }
}

function includeServiceModule() {
  return {
    paciente: { select: { id: true, nombre: true, direccion: true } },
    cuidador: { select: { id: true, nombre: true } },
    assignments: {
      orderBy: { createdAt: 'desc' },
      include: { caregiver: { select: { id: true, nombre: true } } },
    },
    events: { orderBy: { createdAt: 'desc' } },
    payments: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
  }
}

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res)
    } catch (error) {
      next(error)
    }
  }
}

app.get('/api/health', (_req, res) => {
  const status = dbHealth.configured && !dbHealth.connected && dbHealth.error ? 503 : 200
  res.status(status).json({
    ok: status === 200,
    database: dbHealth,
  })
})

app.post('/api/public/caregiver-signups', asyncHandler(async (req, res) => {
  enforceCaregiverSignupRateLimit(req)

  const honeypot = String(req.body?.website || '').trim()
  if (honeypot) {
    res.status(202).json({ ok: true })
    return
  }

  const nombre = String(req.body?.nombre || '').trim()
  const email = sanitizeEmail(req.body?.email || '')
  const telefono = sanitizePhone(req.body?.telefono || '')
  const tipoPerfil = String(req.body?.tipoPerfil || 'cuidador').trim()
  const provincia = String(req.body?.provincia || '').trim()
  const zona = String(req.body?.zona || '').trim()
  const bio = String(req.body?.bio || '').trim()
  const aceptaTerminos = Boolean(req.body?.aceptaTerminos)
  const cvNombre = String(req.body?.cvNombre || '').trim()
  const cvMimeType = String(req.body?.cvMimeType || '').trim().toLowerCase()
  const cvArchivo = String(req.body?.cvArchivo || '').trim()

  const disponibilidadDias = Array.isArray(req.body?.disponibilidadDias)
    ? req.body.disponibilidadDias.map((d) => String(d).trim()).filter(Boolean)
    : []
  const disponibilidadTurnos = Array.isArray(req.body?.disponibilidadTurnos)
    ? req.body.disponibilidadTurnos.map((d) => String(d).trim()).filter(Boolean)
    : []
  const especialidades = Array.isArray(req.body?.especialidades)
    ? req.body.especialidades.map((d) => String(d).trim()).filter(Boolean)
    : []
  const zonasCobertura = Array.isArray(req.body?.zonasCobertura)
    ? req.body.zonasCobertura.map((d) => String(d).trim()).filter(Boolean)
    : []
  const tarifaReferencia = req.body?.tarifaReferencia !== undefined && req.body?.tarifaReferencia !== null && req.body?.tarifaReferencia !== ''
    ? Number(req.body.tarifaReferencia)
    : null

  const missing = []
  if (!nombre) missing.push('nombre')
  if (!email) missing.push('email')
  if (!telefono) missing.push('telefono')
  if (!provincia) missing.push('provincia')
  if (!zona) missing.push('zona')
  if (!tipoPerfil) missing.push('tipoPerfil')
  if (!disponibilidadTurnos.length) missing.push('disponibilidadTurnos')
  if (!aceptaTerminos) missing.push('aceptaTerminos')

  if (missing.length) {
    const error = new Error(`Faltan campos requeridos: ${missing.join(', ')}`)
    error.status = 400
    throw error
  }

  if (!isValidEmail(email)) {
    const error = new Error('El email no tiene formato válido.')
    error.status = 400
    throw error
  }

  if (telefono.length < 8) {
    const error = new Error('El teléfono no parece válido.')
    error.status = 400
    throw error
  }

  if ((cvNombre || cvMimeType || cvArchivo) && (!cvNombre || !cvMimeType || !cvArchivo)) {
    const error = new Error('Para adjuntar CV se requieren nombre, tipo y archivo.')
    error.status = 400
    throw error
  }

  if (cvMimeType && !CAREGIVER_SIGNUP_ALLOWED_CV_MIME.has(cvMimeType)) {
    const error = new Error('Tipo de archivo no permitido para CV.')
    error.status = 400
    throw error
  }

  if (cvArchivo && cvArchivo.length > 11_000_000) {
    const error = new Error('El archivo de CV supera el tamaño permitido.')
    error.status = 400
    throw error
  }

  const duplicate = await prisma.caregiver.findFirst({
    where: {
      OR: [
        { email },
        { telefono },
      ],
    },
    select: { id: true },
  })

  if (duplicate) {
    const error = new Error('Ya existe un perfil cargado con ese email o teléfono.')
    error.status = 409
    throw error
  }

  const disponibilidad = [
    disponibilidadDias.length ? `Días: ${disponibilidadDias.join(', ')}` : '',
    disponibilidadTurnos.length ? `Turnos: ${disponibilidadTurnos.join(', ')}` : '',
  ].filter(Boolean).join(' · ') || 'a coordinar'

  const inferredZonaAmba = inferAmbaZoneGroup(provincia, zona)

  const created = await prisma.caregiver.create({
    data: {
      nombre,
      email,
      telefono,
      codigo: `POST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomCode()}`,
      disponibilidad,
      estado: 'inactivo',
      tipoPerfil: normalizeAiTipoPerfil(tipoPerfil),
      estadoProceso: 'en_evaluacion',
      provincia,
      zona,
      zonaAmba: inferredZonaAmba,
      zonasCobertura: Array.from(new Set([zona, ...zonasCobertura].filter(Boolean))),
      disponibilidadDias,
      disponibilidadTurnos,
      tarifaReferencia: Number.isFinite(tarifaReferencia) ? tarifaReferencia : null,
      bio: bio || null,
      cvNombre: cvNombre || null,
      cvMimeType: cvMimeType || null,
      cvArchivo: cvArchivo || null,
      especialidades,
    },
  })

  res.status(201).json({
    ok: true,
    id: created.id,
    message: 'Postulación enviada. Un administrador revisará tus datos.',
  })
}))

app.get('/api/admin/acompanantes', asyncHandler(async (_req, res) => {
  const scope = String(_req.query?.scope || 'activos').trim().toLowerCase()
  const items = await prisma.caregiver.findMany({
    select: CAREGIVER_ADMIN_SUMMARY_SELECT,
    where: getCaregiverAdminScopeWhere(scope),
    orderBy: { nombre: 'asc' },
  })
  res.json(items.map(mapCaregiverSummary))
}))

app.get('/api/admin/acompanantes/:id', asyncHandler(async (req, res) => {
  const item = await prisma.caregiver.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(mapCaregiverDetail(item))
}))

app.get('/api/admin/acompanantes/:id/cv', asyncHandler(async (req, res) => {
  const item = await prisma.caregiver.findUniqueOrThrow({
    where: { id: req.params.id },
    select: {
      cvNombre: true,
      cvMimeType: true,
      cvArchivo: true,
    },
  })

  if (!item.cvArchivo) {
    const error = new Error('Este acompañante no tiene un CV adjunto.')
    error.status = 404
    throw error
  }

  res.json({
    cvNombre: item.cvNombre || null,
    cvMimeType: item.cvMimeType || null,
    cvArchivo: item.cvArchivo,
  })
}))

app.post('/api/admin/acompanantes', asyncHandler(async (req, res) => {
  const data = toCaregiverInput(req.body)
  const item = await prisma.caregiver.create({ data })
  res.status(201).json(mapCaregiverSummary(item))
}))

app.put('/api/admin/acompanantes/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.caregiver.findUniqueOrThrow({ where: { id: req.params.id } })
  const data = toCaregiverInput(mergeCaregiverForUpdate(existing, req.body || {}))
  const item = await prisma.caregiver.update({ where: { id: req.params.id }, data })
  res.json(mapCaregiverSummary(item))
}))

app.post('/api/admin/acompanantes/import-bulk', asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : []
  if (!rows.length) {
    const error = new Error('No se recibieron registros para importar.')
    error.status = 400
    throw error
  }

  const results = []
  for (let idx = 0; idx < rows.length; idx += 1) {
    const row = rows[idx] || {}
    const nombre = String(row.nombre || '').trim()
    if (!nombre) {
      results.push({ index: idx, status: 'skipped', reason: 'Nombre requerido' })
      continue
    }

    const emailCandidate = String(row.email || '').trim().toLowerCase()
    const telefonoCandidate = sanitizePhone(row.telefono || '')
    const email = emailCandidate || buildDefaultEmail(nombre, idx)
    const inferredZonaAmba = inferAmbaZoneGroup(row.provincia || null, row.zona || null)

    const duplicate = await prisma.caregiver.findFirst({
      where: {
        OR: [
          { email },
          ...(telefonoCandidate ? [{ telefono: telefonoCandidate }] : []),
        ],
      },
      select: { id: true, nombre: true, email: true, telefono: true },
    })

    if (duplicate) {
      results.push({
        index: idx,
        status: 'duplicate',
        duplicateId: duplicate.id,
        duplicateNombre: duplicate.nombre,
        reason: 'Email o teléfono ya existente',
      })
      continue
    }

    const created = await prisma.caregiver.create({
      data: {
        nombre,
        email,
        telefono: telefonoCandidate || 'Pendiente',
        codigo: String(row.codigo || randomCode()),
        disponibilidad: String(row.disponibilidad || 'a coordinar'),
        estado: String(row.estado || 'inactivo'),
        tipoPerfil: String(row.tipoPerfil || 'cuidador'),
        estadoProceso: String(row.estadoProceso || 'base_datos'),
        provincia: row.provincia ? String(row.provincia) : null,
        zona: row.zona ? String(row.zona) : null,
        zonaAmba: row.zonaAmba ? String(row.zonaAmba) : inferredZonaAmba,
        zonasCobertura: Array.isArray(row.zonasCobertura) ? row.zonasCobertura.map((z) => String(z).trim()).filter(Boolean) : [],
        disponibilidadDias: Array.isArray(row.disponibilidadDias) ? row.disponibilidadDias.map((z) => String(z).trim()).filter(Boolean) : [],
        disponibilidadTurnos: Array.isArray(row.disponibilidadTurnos) ? row.disponibilidadTurnos.map((z) => String(z).trim()).filter(Boolean) : [],
        tarifaReferencia: row.tarifaReferencia !== undefined && row.tarifaReferencia !== null && row.tarifaReferencia !== ''
          ? Number(row.tarifaReferencia)
          : null,
        avatar: row.avatar || null,
        cvNombre: row.cvNombre || null,
        cvMimeType: row.cvMimeType || null,
        cvArchivo: row.cvArchivo || null,
        bio: row.bio || null,
        especialidades: Array.isArray(row.especialidades) ? row.especialidades.map((e) => String(e).trim()).filter(Boolean) : [],
      },
    })
    results.push({ index: idx, status: 'created', id: created.id })
  }

  res.json({
    total: rows.length,
    created: results.filter((r) => r.status === 'created').length,
    duplicates: results.filter((r) => r.status === 'duplicate').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    results,
  })
}))

app.post('/api/admin/acompanantes/import-ai-parse', asyncHandler(async (req, res) => {
  const files = Array.isArray(req.body?.files) ? req.body.files : []
  if (!files.length) {
    const error = new Error('No se recibieron archivos para analizar.')
    error.status = 400
    throw error
  }

  const rows = []
  for (let idx = 0; idx < files.length; idx += 1) {
    const file = files[idx] || {}
    const name = String(file.name || `archivo_${idx + 1}`).trim()
    const dataBase64 = String(file.dataBase64 || '').trim()
    if (!dataBase64) {
      rows.push({
        index: idx,
        fileName: name,
        error: 'Archivo vacío',
        suggestion: {
          nombre: name.replace(/\.[^.]+$/, ''),
          email: '',
          telefono: '',
          tipoPerfil: 'cuidador',
          estadoProceso: 'base_datos',
          estado: 'inactivo',
          disponibilidad: 'a coordinar',
          provincia: '',
          zona: '',
          especialidades: [],
          bio: 'No se pudo analizar el archivo.',
          confidence: 0,
        },
      })
      continue
    }

    try {
      const ai = await analyzeCvWithOpenAI({
        name,
        mimeType: String(file.mimeType || 'application/octet-stream'),
        dataBase64,
      })

      rows.push({
        index: idx,
        fileName: name,
        suggestion: {
          nombre: ai.nombre || name.replace(/\.[^.]+$/, ''),
          email: ai.email || '',
          telefono: ai.telefono || '',
          tipoPerfil: ai.tipoPerfil || 'cuidador',
          estadoProceso: 'base_datos',
          estado: 'inactivo',
          disponibilidad: 'a coordinar',
          provincia: ai.provincia || '',
          zona: ai.zona || '',
          especialidades: ai.especialidades || [],
          bio: ai.bio || 'Extracción asistida con IA. Revisar antes de crear.',
          confidence: ai.confianza,
        },
      })
    } catch (error) {
      rows.push({
        index: idx,
        fileName: name,
        error: error.message || 'No se pudo analizar con IA',
        suggestion: {
          nombre: name.replace(/\.[^.]+$/, ''),
          email: '',
          telefono: '',
          tipoPerfil: 'cuidador',
          estadoProceso: 'base_datos',
          estado: 'inactivo',
          disponibilidad: 'a coordinar',
          provincia: '',
          zona: '',
          especialidades: [],
          bio: 'No se pudo analizar con IA. Completar manualmente.',
          confidence: 0,
        },
      })
    }
  }

  res.json({
    total: files.length,
    parsed: rows.filter((r) => !r.error).length,
    failed: rows.filter((r) => Boolean(r.error)).length,
    rows,
  })
}))

app.delete('/api/admin/acompanantes/:id', asyncHandler(async (req, res) => {
  await prisma.caregiver.delete({ where: { id: req.params.id } })
  res.status(204).send()
}))

app.get('/api/admin/clientes', asyncHandler(async (_req, res) => {
  const items = await prisma.patient.findMany({ orderBy: { nombre: 'asc' } })
  res.json(items.map(mapPatientSummary))
}))

app.get('/api/admin/clientes/:id', asyncHandler(async (req, res) => {
  const item = await prisma.patient.findUniqueOrThrow({ where: { id: req.params.id } })
  res.json(mapPatientSummary(item))
}))

app.post('/api/admin/clientes', asyncHandler(async (req, res) => {
  const data = toPatientInput(req.body)
  const item = await prisma.patient.create({ data })
  res.status(201).json(mapPatientSummary(item))
}))

app.put('/api/admin/clientes/:id', asyncHandler(async (req, res) => {
  const data = toPatientInput(req.body)
  const item = await prisma.patient.update({ where: { id: req.params.id }, data })
  res.json(mapPatientSummary(item))
}))

app.delete('/api/admin/clientes/:id', asyncHandler(async (req, res) => {
  await prisma.$transaction(async (tx) => {
    await tx.service.deleteMany({ where: { pacienteId: req.params.id } })
    await tx.patient.delete({ where: { id: req.params.id } })
  })
  res.status(204).send()
}))

app.get('/api/admin/servicios', asyncHandler(async (_req, res) => {
  const items = await prisma.service.findMany({
    orderBy: { fechaInicio: 'asc' },
    include: {
      paciente: { select: { id: true, nombre: true, direccion: true } },
      cuidador: { select: { id: true, nombre: true } },
      assignments: {
        where: { tipo: 'caregiver' },
        include: { caregiver: { select: { id: true, nombre: true } } },
      },
    },
  })
  res.json(items.map(mapService))
}))

app.post('/api/admin/servicios', asyncHandler(async (req, res) => {
  const data = toServiceInput(req.body)
  const item = await prisma.$transaction(async (tx) => {
    const requestedCaregiverIds = Array.isArray(req.body?.caregiverIds)
      ? req.body.caregiverIds.filter(Boolean)
      : []
    const caregiverIds = Array.from(new Set([data.cuidadorId, ...requestedCaregiverIds].filter(Boolean)))

    const created = await tx.service.create({
      data,
      include: {
        paciente: { select: { id: true, nombre: true, direccion: true } },
        cuidador: { select: { id: true, nombre: true } },
        assignments: {
          where: { tipo: 'caregiver' },
          include: { caregiver: { select: { id: true, nombre: true } } },
        },
      },
    })
    await tx.serviceEvent.create({
      data: {
        serviceId: created.id,
        tipo: 'created',
        estadoHasta: created.estado,
        nota: 'Alta de servicio',
      },
    })
    await tx.serviceAssignment.createMany({
      data: (caregiverIds.length ? caregiverIds : [created.cuidadorId]).map((caregiverId, idx) => ({
        serviceId: created.id,
        caregiverId,
        tipo: 'caregiver',
        rol: idx === 0 ? 'Cuidador principal' : 'Cuidador',
        activo: true,
      })),
    })
    return created
  })
  res.status(201).json(mapService(item))
}))

app.put('/api/admin/servicios/:id', asyncHandler(async (req, res) => {
  const data = toServiceInput(req.body)
  const item = await prisma.$transaction(async (tx) => {
    const requestedCaregiverIds = Array.isArray(req.body?.caregiverIds)
      ? Array.from(new Set(req.body.caregiverIds.filter(Boolean)))
      : null

    if (requestedCaregiverIds && requestedCaregiverIds.length === 0) {
      const error = new Error('Debés enviar al menos un cuidador.')
      error.status = 400
      throw error
    }

    const updateData = { ...data }
    if (requestedCaregiverIds && requestedCaregiverIds.length > 0) {
      updateData.cuidadorId = requestedCaregiverIds[0]
    }

    const updated = await tx.service.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        paciente: { select: { id: true, nombre: true, direccion: true } },
        cuidador: { select: { id: true, nombre: true } },
        assignments: {
          where: { tipo: 'caregiver' },
          include: { caregiver: { select: { id: true, nombre: true } } },
        },
      },
    })

    if (requestedCaregiverIds) {
      await tx.serviceAssignment.updateMany({
        where: { serviceId: req.params.id, tipo: 'caregiver' },
        data: { activo: false },
      })

      for (let index = 0; index < requestedCaregiverIds.length; index += 1) {
        const caregiverId = requestedCaregiverIds[index]
        const existing = await tx.serviceAssignment.findFirst({
          where: {
            serviceId: req.params.id,
            tipo: 'caregiver',
            caregiverId,
          },
        })
        const rol = index === 0 ? 'Cuidador principal' : 'Cuidador'
        if (existing) {
          await tx.serviceAssignment.update({
            where: { id: existing.id },
            data: { activo: true, rol },
          })
        } else {
          await tx.serviceAssignment.create({
            data: {
              serviceId: req.params.id,
              caregiverId,
              tipo: 'caregiver',
              rol,
              activo: true,
            },
          })
        }
      }
    }

    return updated
  })
  res.json(mapService(item))
}))

app.post('/api/admin/servicios/:id/delete-series', asyncHandler(async (req, res) => {
  const current = await prisma.service.findUnique({
    where: { id: req.params.id },
  })

  if (!current) {
    const error = new Error('Registro no encontrado.')
    error.status = 404
    throw error
  }

  let idsToDelete = [current.id]

  if ((current.repeatMode || 'none') === 'none') {
    const baseDate = new Date(current.fechaInicio)
    const baseHour = baseDate.getHours()
    const baseMinute = baseDate.getMinutes()

    const candidates = await prisma.service.findMany({
      where: {
        pacienteId: current.pacienteId,
        cuidadorId: current.cuidadorId,
        duracionMinutos: current.duracionMinutos,
        fechaInicio: { gte: current.fechaInicio },
      },
      select: { id: true, fechaInicio: true },
    })

    idsToDelete = candidates
      .filter((item) => {
        const dt = new Date(item.fechaInicio)
        return dt.getHours() === baseHour && dt.getMinutes() === baseMinute
      })
      .map((item) => item.id)

    if (!idsToDelete.length) {
      idsToDelete = [current.id]
    }
  }

  const result = await prisma.service.deleteMany({
    where: { id: { in: idsToDelete } },
  })

  res.json({ deletedCount: result.count })
}))

app.delete('/api/admin/servicios/:id', asyncHandler(async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } })
  res.status(204).send()
}))

app.post('/api/admin/servicios/:id/alta-state', asyncHandler(async (req, res) => {
  const nextAltaEstado = req.body?.estado === 'realizada' ? 'realizada' : 'pendiente'
  const item = await prisma.service.update({
    where: { id: req.params.id },
    data: {
      altaEstado: nextAltaEstado,
      altaRealizadaAt: nextAltaEstado === 'realizada' ? new Date() : null,
    },
    include: {
      paciente: { select: { id: true, nombre: true, direccion: true } },
      cuidador: { select: { id: true, nombre: true } },
    },
  })
  res.json(mapService(item))
}))

app.get('/api/admin/servicios-modulo', asyncHandler(async (_req, res) => {
  const items = await prisma.service.findMany({
    orderBy: { createdAt: 'desc' },
    include: includeServiceModule(),
  })
  res.json(items.map(mapServiceModule))
}))

app.get('/api/admin/servicios-modulo/:id', asyncHandler(async (req, res) => {
  const item = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: includeServiceModule(),
  })
  if (!item) {
    const error = new Error('Servicio no encontrado.')
    error.status = 404
    throw error
  }
  res.json(mapServiceModule(item))
}))

app.post('/api/admin/servicios-modulo/:id/pause', asyncHandler(async (req, res) => {
  const note = req.body?.nota || 'Pausa de servicio'
  const item = await prisma.$transaction(async (tx) => {
    const current = await tx.service.findUnique({ where: { id: req.params.id } })
    if (!current) {
      const error = new Error('Servicio no encontrado.')
      error.status = 404
      throw error
    }
    await tx.serviceEvent.create({
      data: {
        serviceId: req.params.id,
        tipo: 'paused',
        estadoDesde: current.estado,
        estadoHasta: 'pausado',
        nota: note,
      },
    })
    const updated = await tx.service.update({
      where: { id: req.params.id },
      data: { estado: 'pausado' },
      include: includeServiceModule(),
    })
    return updated
  })
  res.json(mapServiceModule(item))
}))

app.post('/api/admin/servicios-modulo/:id/resume', asyncHandler(async (req, res) => {
  const note = req.body?.nota || 'Reanudación de servicio'
  const item = await prisma.$transaction(async (tx) => {
    const current = await tx.service.findUnique({ where: { id: req.params.id } })
    if (!current) {
      const error = new Error('Servicio no encontrado.')
      error.status = 404
      throw error
    }
    await tx.serviceEvent.create({
      data: {
        serviceId: req.params.id,
        tipo: 'resumed',
        estadoDesde: current.estado,
        estadoHasta: 'en_curso',
        nota: note,
      },
    })
    const updated = await tx.service.update({
      where: { id: req.params.id },
      data: { estado: 'en_curso' },
      include: includeServiceModule(),
    })
    return updated
  })
  res.json(mapServiceModule(item))
}))

app.post('/api/admin/servicios-modulo/:id/payments/current-month', asyncHandler(async (req, res) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const estado = req.body?.estado === 'pagado' ? 'pagado' : 'pendiente'
  const monto = req.body?.monto !== undefined && req.body?.monto !== null ? Number(req.body.monto) : null

  const payment = await prisma.servicePayment.upsert({
    where: { serviceId_year_month: { serviceId: req.params.id, year, month } },
    update: {
      estado,
      monto,
      paidAt: estado === 'pagado' ? new Date() : null,
    },
    create: {
      serviceId: req.params.id,
      year,
      month,
      estado,
      monto,
      paidAt: estado === 'pagado' ? new Date() : null,
    },
  })
  res.json(mapServicePayment(payment))
}))

app.post('/api/admin/servicios-modulo/:id/payments', asyncHandler(async (req, res) => {
  requireFields(req.body, ['year', 'month'])
  const year = Number(req.body.year)
  const month = Number(req.body.month)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    const error = new Error('Período inválido. year/month requeridos.')
    error.status = 400
    throw error
  }

  const estado = req.body?.estado === 'pagado' ? 'pagado' : 'pendiente'
  const monto = req.body?.monto !== undefined && req.body?.monto !== null ? Number(req.body.monto) : null

  const payment = await prisma.servicePayment.upsert({
    where: { serviceId_year_month: { serviceId: req.params.id, year, month } },
    update: {
      estado,
      monto,
      paidAt: estado === 'pagado' ? new Date() : null,
    },
    create: {
      serviceId: req.params.id,
      year,
      month,
      estado,
      monto,
      paidAt: estado === 'pagado' ? new Date() : null,
    },
  })
  res.json(mapServicePayment(payment))
}))

app.post('/api/admin/servicios-modulo/:id/extra-hours', asyncHandler(async (req, res) => {
  requireFields(req.body, ['caregiverId', 'fecha', 'horas'])

  const horas = Number(req.body.horas)
  const fecha = new Date(req.body.fecha)

  const valorHoraCobroInput = req.body.valorHoraCobro !== undefined
    ? Number(req.body.valorHoraCobro)
    : (req.body.montoCobro !== undefined && horas > 0 ? Number(req.body.montoCobro) / horas : Number.NaN)
  const valorHoraPagoInput = req.body.valorHoraPago !== undefined
    ? Number(req.body.valorHoraPago)
    : (req.body.montoPago !== undefined && horas > 0 ? Number(req.body.montoPago) / horas : Number.NaN)

  if (!Number.isFinite(horas) || horas <= 0) {
    const error = new Error('La cantidad de horas extra es inválida.')
    error.status = 400
    throw error
  }
  if (!Number.isFinite(valorHoraCobroInput) || valorHoraCobroInput < 0) {
    const error = new Error('El valor hora de cobro es inválido.')
    error.status = 400
    throw error
  }
  if (!Number.isFinite(valorHoraPagoInput) || valorHoraPagoInput < 0) {
    const error = new Error('El costo hora de pago es inválido.')
    error.status = 400
    throw error
  }
  if (Number.isNaN(fecha.getTime())) {
    const error = new Error('La fecha de la hora extra es inválida.')
    error.status = 400
    throw error
  }

  const valorHoraCobro = roundCurrency(valorHoraCobroInput)
  const valorHoraPago = roundCurrency(valorHoraPagoInput)
  const montoCobroLinea = roundCurrency(horas * valorHoraCobro)
  const montoPagoLinea = roundCurrency(horas * valorHoraPago)

  if (!Number.isFinite(montoCobroLinea) || montoCobroLinea < 0) {
    const error = new Error('El monto de cobro es inválido.')
    error.status = 400
    throw error
  }
  if (!Number.isFinite(montoPagoLinea) || montoPagoLinea < 0) {
    const error = new Error('El monto de pago es inválido.')
    error.status = 400
    throw error
  }

  const detail = String(req.body.detalle || req.body.concepto || '').trim()

  const result = await prisma.$transaction(async (tx) => {
    const service = await tx.service.findUnique({
      where: { id: req.params.id },
      include: {
        paciente: { select: { id: true, nombre: true } },
        assignments: {
          where: { caregiverId: req.body.caregiverId, tipo: 'caregiver', activo: true },
          select: { id: true },
        },
      },
    })

    if (!service) {
      const error = new Error('Servicio no encontrado.')
      error.status = 404
      throw error
    }

    const caregiver = await tx.caregiver.findUnique({
      where: { id: req.body.caregiverId },
      select: { id: true, nombre: true, estado: true },
    })

    if (!caregiver) {
      const error = new Error('Cuidador no encontrado.')
      error.status = 404
      throw error
    }

    const isAssignedCaregiver = service.cuidadorId === caregiver.id || service.assignments.length > 0
    if (!isAssignedCaregiver) {
      const error = new Error('El cuidador no está asignado a este servicio.')
      error.status = 400
      throw error
    }

    const year = fecha.getFullYear()
    const month = fecha.getMonth() + 1

    const whereAggregate = {
      categoria: 'horas_extra',
      serviceId: service.id,
      caregiverId: caregiver.id,
      year,
      month,
      periodType: 'month',
    }

    const [existingCobros, existingPagos] = await Promise.all([
      tx.financeMovement.findMany({
        where: { ...whereAggregate, tipo: 'cobro' },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      tx.financeMovement.findMany({
        where: { ...whereAggregate, tipo: 'pago' },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    const pickExistingMovement = (items) => {
      if (!Array.isArray(items) || items.length === 0) return null
      const pending = items.find((item) => String(item.estado || '').toLowerCase() === 'pendiente')
      return pending || items[0]
    }

    const existingCobro = pickExistingMovement(existingCobros)
    const existingPago = pickExistingMovement(existingPagos)

    const aggregateFromCobro = parseExtraHoursAggregateNotes(existingCobro?.notas || '')
    const aggregateFromPago = parseExtraHoursAggregateNotes(existingPago?.notas || '')
    const currentAggregate = aggregateFromCobro || aggregateFromPago

    const detalles = Array.isArray(currentAggregate?.detalles)
      ? currentAggregate.detalles
        .map((item, idx) => normalizeExtraHoursDetail(item, `det-${idx + 1}`))
        .filter(Boolean)
      : []

    if (detalles.length === 0 && (existingCobro || existingPago)) {
      const montoCobroLegacy = roundCurrency(existingCobro?.monto || 0)
      const montoPagoLegacy = roundCurrency(existingPago?.monto || 0)
      if (montoCobroLegacy > 0 || montoPagoLegacy > 0) {
        const fallbackDate = existingCobro?.fecha || existingPago?.fecha || fecha
        const normalizedFallbackDate = fallbackDate instanceof Date && !Number.isNaN(fallbackDate.getTime())
          ? fallbackDate.toISOString().slice(0, 10)
          : fecha.toISOString().slice(0, 10)
        const legacyDetail = normalizeExtraHoursDetail({
          id: `legacy-${Date.now()}-${randomCode()}`,
          fecha: normalizedFallbackDate,
          horas: null,
          valorHoraCobro: null,
          valorHoraPago: null,
          montoCobro: montoCobroLegacy,
          montoPago: montoPagoLegacy,
          concepto: 'Saldo previo',
          legacy: true,
        })
        if (legacyDetail) detalles.push(legacyDetail)
      }
    }

    const detailEntry = normalizeExtraHoursDetail({
      id: `det-${Date.now()}-${randomCode()}`,
      fecha: fecha.toISOString().slice(0, 10),
      horas,
      valorHoraCobro,
      valorHoraPago,
      montoCobro: montoCobroLinea,
      montoPago: montoPagoLinea,
      concepto: detail,
    })

    if (!detailEntry) {
      const error = new Error('No se pudo procesar el detalle de horas extra.')
      error.status = 400
      throw error
    }
    detalles.push(detailEntry)

    const totals = detalles.reduce((acc, item) => ({
      horas: acc.horas + (Number.isFinite(item.horas) ? Number(item.horas) : 0),
      montoCobro: acc.montoCobro + roundCurrency(item.montoCobro || 0),
      montoPago: acc.montoPago + roundCurrency(item.montoPago || 0),
    }), { horas: 0, montoCobro: 0, montoPago: 0 })

    totals.horas = roundCurrency(totals.horas)
    totals.montoCobro = roundCurrency(totals.montoCobro)
    totals.montoPago = roundCurrency(totals.montoPago)

    const aggregatePayload = {
      version: 1,
      kind: 'extra_hours_aggregate',
      serviceId: service.id,
      patientId: service.pacienteId,
      patientNombre: service.paciente?.nombre || null,
      caregiverId: caregiver.id,
      caregiverNombre: caregiver.nombre || null,
      year,
      month,
      detalles,
      totals,
    }
    const aggregateNotes = buildExtraHoursAggregateNotes(aggregatePayload)

    const sharedBaseData = {
      categoria: 'horas_extra',
      metodo: 'transferencia',
      fecha,
      fechaPago: null,
      year,
      month,
      week: null,
      periodType: 'month',
      estado: 'pendiente',
      registradoPor: req.body.registradoPor || null,
      notas: aggregateNotes,
      caregiverId: caregiver.id,
      serviceId: service.id,
    }

    const cobro = existingCobro
      ? await tx.financeMovement.update({
        where: { id: existingCobro.id },
        data: {
          ...sharedBaseData,
          tipo: 'cobro',
          monto: totals.montoCobro,
          patientId: service.pacienteId,
        },
        include: {
          patient: { select: { id: true, nombre: true } },
          caregiver: { select: { id: true, nombre: true } },
          service: { select: { id: true } },
        },
      })
      : await tx.financeMovement.create({
        data: {
          ...sharedBaseData,
          tipo: 'cobro',
          monto: totals.montoCobro,
          patientId: service.pacienteId,
        },
        include: {
          patient: { select: { id: true, nombre: true } },
          caregiver: { select: { id: true, nombre: true } },
          service: { select: { id: true } },
        },
      })

    const pago = existingPago
      ? await tx.financeMovement.update({
        where: { id: existingPago.id },
        data: {
          ...sharedBaseData,
          tipo: 'pago',
          monto: totals.montoPago,
          patientId: null,
        },
        include: {
          patient: { select: { id: true, nombre: true } },
          caregiver: { select: { id: true, nombre: true } },
          service: { select: { id: true } },
        },
      })
      : await tx.financeMovement.create({
        data: {
          ...sharedBaseData,
          tipo: 'pago',
          monto: totals.montoPago,
          patientId: null,
        },
        include: {
          patient: { select: { id: true, nombre: true } },
          caregiver: { select: { id: true, nombre: true } },
          service: { select: { id: true } },
        },
      })

    const duplicateCobroIds = existingCobros
      .map((item) => item.id)
      .filter((id) => id !== cobro.id)
    if (duplicateCobroIds.length > 0) {
      await tx.financeMovement.deleteMany({
        where: { id: { in: duplicateCobroIds } },
      })
    }

    const duplicatePagoIds = existingPagos
      .map((item) => item.id)
      .filter((id) => id !== pago.id)
    if (duplicatePagoIds.length > 0) {
      await tx.financeMovement.deleteMany({
        where: { id: { in: duplicatePagoIds } },
      })
    }

    await tx.serviceEvent.create({
      data: {
        serviceId: service.id,
        tipo: 'assignment_changed',
        nota: `Horas extra acumuladas: ${horas} hs · ${caregiver.nombre} (${month}/${year})`,
      },
    })

    return {
      aggregate: aggregatePayload,
      cobro: mapFinanceMovement(cobro),
      pago: mapFinanceMovement(pago),
    }
  })

  res.status(201).json(result)
}))

app.post('/api/admin/servicios-modulo/:id/assignments', asyncHandler(async (req, res) => {
  requireFields(req.body, ['tipo', 'rol'])
  if (req.body.tipo === 'caregiver' && !req.body.caregiverId) {
    const error = new Error('Para asignación de cuidador, caregiverId es requerido.')
    error.status = 400
    throw error
  }
  if (req.body.tipo !== 'caregiver' && !req.body.nombreManual) {
    const error = new Error('Para profesional externo, nombre es requerido.')
    error.status = 400
    throw error
  }

  const assignment = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceAssignment.create({
      data: {
        serviceId: req.params.id,
        caregiverId: req.body.caregiverId || null,
        tipo: req.body.tipo,
        rol: req.body.rol,
        nombreManual: req.body.nombreManual || null,
        activo: true,
      },
      include: { caregiver: { select: { id: true, nombre: true } } },
    })
    await tx.serviceEvent.create({
      data: {
        serviceId: req.params.id,
        tipo: 'assignment_changed',
        nota: `Asignación: ${created.rol}`,
      },
    })
    return created
  })

  res.status(201).json(mapServiceAssignment(assignment))
}))

app.put('/api/admin/servicios-modulo/:id/assignments/:assignmentId', asyncHandler(async (req, res) => {
  const assignment = await prisma.$transaction(async (tx) => {
    const updated = await tx.serviceAssignment.update({
      where: { id: req.params.assignmentId },
      data: {
        caregiverId: req.body.caregiverId !== undefined ? req.body.caregiverId : undefined,
        tipo: req.body.tipo !== undefined ? req.body.tipo : undefined,
        rol: req.body.rol !== undefined ? req.body.rol : undefined,
        nombreManual: req.body.nombreManual !== undefined ? req.body.nombreManual : undefined,
        activo: req.body.activo !== undefined ? Boolean(req.body.activo) : undefined,
      },
      include: { caregiver: { select: { id: true, nombre: true } } },
    })
    await tx.serviceEvent.create({
      data: {
        serviceId: req.params.id,
        tipo: 'assignment_changed',
        nota: `Cambio de asignación: ${updated.rol}`,
      },
    })
    return updated
  })
  res.json(mapServiceAssignment(assignment))
}))

app.get('/api/admin/finanzas/movimientos', asyncHandler(async (req, res) => {
  await normalizeExtraHoursDuplicates()

  const tipo = req.query?.tipo
  const periodType = req.query?.periodType
  const year = req.query?.year ? Number(req.query.year) : null
  const month = req.query?.month ? Number(req.query.month) : null
  const week = req.query?.week ? Number(req.query.week) : null

  const where = {}
  if (tipo && ['cobro', 'pago', 'retiro', 'gasto'].includes(String(tipo))) where.tipo = String(tipo)
  if (periodType && ['month', 'week'].includes(String(periodType))) where.periodType = String(periodType)
  if (year) where.year = year
  if (month) where.month = month
  if (week) where.week = week

  const items = await prisma.financeMovement.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: {
      patient: { select: { id: true, nombre: true } },
      caregiver: { select: { id: true, nombre: true } },
      service: { select: { id: true } },
    },
  })
  res.json(items.map(mapFinanceMovement))
}))

app.post('/api/admin/finanzas/movimientos', asyncHandler(async (req, res) => {
  requireFields(req.body, ['tipo', 'metodo', 'monto'])
  const tipo = String(req.body.tipo)
  if (!['cobro', 'pago', 'retiro', 'gasto'].includes(tipo)) {
    const error = new Error('Tipo inválido. Debe ser cobro, pago, retiro o gasto.')
    error.status = 400
    throw error
  }
  if (tipo === 'cobro' && !req.body.serviceId) {
    const error = new Error('Para cobro, serviceId es requerido.')
    error.status = 400
    throw error
  }
  if (tipo === 'pago' && (!req.body.serviceId || !req.body.caregiverId)) {
    const error = new Error('Para pago, serviceId y caregiverId son requeridos.')
    error.status = 400
    throw error
  }

  const fecha = req.body.fecha ? new Date(req.body.fecha) : new Date()
  const periodType = req.body.periodType === 'week' ? 'week' : 'month'
  const isoInfo = getIsoWeekInfo(fecha)
  const year = req.body.year !== undefined ? Number(req.body.year) : (periodType === 'week' ? isoInfo.year : fecha.getFullYear())
  const month = periodType === 'month'
    ? (req.body.month !== undefined ? Number(req.body.month) : fecha.getMonth() + 1)
    : null
  const week = periodType === 'week'
    ? (req.body.week !== undefined ? Number(req.body.week) : isoInfo.week)
    : null

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.financeMovement.create({
      data: {
        tipo,
        categoria: req.body.categoria || null,
        metodo: String(req.body.metodo),
        monto: Number(req.body.monto),
        fecha,
        fechaVencimiento: req.body.fechaVencimiento ? new Date(req.body.fechaVencimiento) : null,
        fechaPago: req.body.fechaPago ? new Date(req.body.fechaPago) : null,
        year,
        month,
        week,
        periodType,
        estado: req.body.estado || 'registrado',
        registradoPor: req.body.registradoPor || null,
        notas: req.body.notas || null,
        patientId: tipo === 'cobro' ? (req.body.patientId || null) : null,
        caregiverId: tipo === 'pago' ? (req.body.caregiverId || null) : null,
        serviceId: ['cobro', 'pago'].includes(tipo) ? (req.body.serviceId || null) : null,
      },
      include: {
        patient: { select: { id: true, nombre: true } },
        caregiver: { select: { id: true, nombre: true } },
        service: { select: { id: true } },
      },
    })

    const shouldSyncServicePayment = (
      created.serviceId &&
      created.tipo === 'cobro' &&
      String(created.categoria || '').toLowerCase() !== 'horas_extra'
    )

    if (shouldSyncServicePayment) {
      const syncYear = Number(created.year || year)
      const syncMonth = Number(created.month || (created.fechaPago ? new Date(created.fechaPago).getMonth() + 1 : new Date(created.fecha).getMonth() + 1))
      if (Number.isInteger(syncYear) && Number.isInteger(syncMonth) && syncMonth >= 1 && syncMonth <= 12) {
        await tx.servicePayment.upsert({
          where: { serviceId_year_month: { serviceId: created.serviceId, year: syncYear, month: syncMonth } },
          update: {
            monto: Number(created.monto || 0),
            estado: String(created.estado).toLowerCase() === 'pendiente' ? 'pendiente' : 'pagado',
            paidAt: String(created.estado).toLowerCase() === 'pendiente' ? null : (created.fechaPago || new Date()),
          },
          create: {
            serviceId: created.serviceId,
            year: syncYear,
            month: syncMonth,
            monto: Number(created.monto || 0),
            estado: String(created.estado).toLowerCase() === 'pendiente' ? 'pendiente' : 'pagado',
            paidAt: String(created.estado).toLowerCase() === 'pendiente' ? null : (created.fechaPago || new Date()),
          },
        })
      }
    }

    return created
  })
  res.status(201).json(mapFinanceMovement(item))
}))

app.put('/api/admin/finanzas/movimientos/:id', asyncHandler(async (req, res) => {
  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.financeMovement.update({
      where: { id: req.params.id },
      data: {
        categoria: req.body.categoria !== undefined ? req.body.categoria : undefined,
        metodo: req.body.metodo !== undefined ? req.body.metodo : undefined,
        monto: req.body.monto !== undefined ? Number(req.body.monto) : undefined,
        fecha: req.body.fecha ? new Date(req.body.fecha) : undefined,
        fechaVencimiento: req.body.fechaVencimiento !== undefined
          ? (req.body.fechaVencimiento ? new Date(req.body.fechaVencimiento) : null)
          : undefined,
        fechaPago: req.body.fechaPago !== undefined
          ? (req.body.fechaPago ? new Date(req.body.fechaPago) : null)
          : undefined,
        estado: req.body.estado !== undefined ? req.body.estado : undefined,
        registradoPor: req.body.registradoPor !== undefined ? req.body.registradoPor : undefined,
        notas: req.body.notas !== undefined ? req.body.notas : undefined,
      },
      include: {
        patient: { select: { id: true, nombre: true } },
        caregiver: { select: { id: true, nombre: true } },
        service: { select: { id: true } },
      },
    })

    const shouldSyncServicePayment = (
      updated.serviceId &&
      updated.tipo === 'cobro' &&
      String(updated.categoria || '').toLowerCase() !== 'horas_extra'
    )

    if (shouldSyncServicePayment) {
      const syncYear = Number(updated.year || new Date().getFullYear())
      const syncMonth = Number(updated.month || (updated.fechaPago ? new Date(updated.fechaPago).getMonth() + 1 : new Date(updated.fecha).getMonth() + 1))
      if (Number.isInteger(syncYear) && Number.isInteger(syncMonth) && syncMonth >= 1 && syncMonth <= 12) {
        await tx.servicePayment.upsert({
          where: { serviceId_year_month: { serviceId: updated.serviceId, year: syncYear, month: syncMonth } },
          update: {
            monto: Number(updated.monto || 0),
            estado: String(updated.estado).toLowerCase() === 'pendiente' ? 'pendiente' : 'pagado',
            paidAt: String(updated.estado).toLowerCase() === 'pendiente' ? null : (updated.fechaPago || new Date()),
          },
          create: {
            serviceId: updated.serviceId,
            year: syncYear,
            month: syncMonth,
            monto: Number(updated.monto || 0),
            estado: String(updated.estado).toLowerCase() === 'pendiente' ? 'pendiente' : 'pagado',
            paidAt: String(updated.estado).toLowerCase() === 'pendiente' ? null : (updated.fechaPago || new Date()),
          },
        })
      }
    }
    return updated
  })
  res.json(mapFinanceMovement(item))
}))

app.delete('/api/admin/finanzas/movimientos/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.financeMovement.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  })
  if (!existing) {
    const error = new Error('Movimiento no encontrado')
    error.status = 404
    throw error
  }
  await prisma.financeMovement.delete({ where: { id: req.params.id } })
  res.status(204).send()
}))

app.get('/api/admin/finanzas/resumen', asyncHandler(async (_req, res) => {
  await normalizeExtraHoursDuplicates()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const movements = await prisma.financeMovement.findMany({
    include: {
      patient: { select: { id: true, nombre: true } },
      caregiver: { select: { id: true, nombre: true } },
    },
  })

  const pendingCobrosServicio = movements.filter(
    (m) =>
      m.tipo === 'cobro' &&
      String(m.estado).toLowerCase() === 'pendiente' &&
      Boolean(m.serviceId)
  )
  const pendingPagos = movements.filter((m) => m.tipo === 'pago' && String(m.estado).toLowerCase() === 'pendiente')

  const debtByPatient = new Map()
  pendingCobrosServicio.forEach((m) => {
    const patientId = m.patientId
    if (!patientId) return
    const nombre = m.patient?.nombre || 'Paciente'
    const prev = debtByPatient.get(patientId) || {
      patientId,
      nombre,
      serviciosPendientes: 0,
      montoPendiente: 0,
    }
    prev.serviciosPendientes += 1
    prev.montoPendiente += Number(m.monto || 0)
    debtByPatient.set(patientId, prev)
  })

  const caregiversPendingMap = new Map()
  pendingPagos.forEach((m) => {
    if (!m.caregiverId) return
    const prev = caregiversPendingMap.get(m.caregiverId) || {
      caregiverId: m.caregiverId,
      nombre: m.caregiver?.nombre || 'Cuidador',
      pagosPendientes: 0,
    }
    prev.pagosPendientes += 1
    caregiversPendingMap.set(m.caregiverId, prev)
  })

  const caregiversPendingWithAdvance = [...caregiversPendingMap.values()].map((c) => {
    const advances = movements
      .filter((m) => m.tipo === 'pago' && m.categoria === 'adelanto' && m.caregiverId === c.caregiverId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    return {
      caregiverId: c.caregiverId,
      nombre: c.nombre,
      pagosPendientes: c.pagosPendientes,
      adelantoMonto: advances[0]?.monto || 0,
      adelantoFecha: advances[0]?.fecha || null,
    }
  })

  const movementsCurrentMonth = movements.filter((m) => {
    const ref = m.fechaPago ? new Date(m.fechaPago) : new Date(m.fecha)
    return ref >= monthStart && ref <= monthEnd
  })

  const totalCobradoMes = movementsCurrentMonth
    .filter((m) => m.tipo === 'cobro' && String(m.estado).toLowerCase() !== 'pendiente')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0)
  const totalPagadoMes = movementsCurrentMonth
    .filter((m) => m.tipo === 'pago' && String(m.estado).toLowerCase() !== 'pendiente')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0)
  const totalAdelantosMes = movementsCurrentMonth
    .filter((m) => m.tipo === 'pago' && m.categoria === 'adelanto')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0)
  const totalGastosMes = movementsCurrentMonth
    .filter((m) => m.tipo === 'gasto' && String(m.estado).toLowerCase() !== 'pendiente')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0)

  res.json({
    period: { year, month },
    cobrosPendientes: pendingCobrosServicio.length,
    pagosPendientesCuidadores: caregiversPendingWithAdvance.length,
    cobrosPendientesRegistrados: pendingCobrosServicio.length,
    pagosPendientesRegistrados: pendingPagos.length,
    totalCobradoMes,
    totalPagadoMes,
    totalAdelantosMes,
    totalGastosMes,
    pacientesConDeuda: [...debtByPatient.values()],
    cuidadoresPendientePago: caregiversPendingWithAdvance,
  })
}))

app.use((error, _req, res, _next) => {
  const status = error.status || 500

  if (error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : null
    if (target?.includes('email')) {
      return res.status(409).json({ error: 'Ya existe un cuidador con ese email.' })
    }
    return res.status(409).json({ error: `Ya existe un registro con un valor único repetido${target ? ` (${target})` : ''}.` })
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado.' })
  }

  return res.status(status).json({ error: error.message || 'Error interno del servidor.' })
})

async function start() {
  console.log(`[startup] cwd=${process.cwd()}`)
  console.log(`[startup] env=${process.env.NODE_ENV || 'development'}`)
  console.log(`[startup] port=${PORT}`)
  console.log(`[startup] host=${HOST}`)

  if (!DATABASE_URL) {
    console.warn('[startup] DATABASE_URL no está configurada. Las rutas con base de datos van a fallar.')
  } else {
    console.log(`[startup] database=${maskDatabaseUrl(DATABASE_URL)}`)
    try {
      await prisma.$queryRaw`SELECT 1`
      dbHealth.connected = true
      dbHealth.error = null
      console.log('[startup] database connection OK')
    } catch (error) {
      dbHealth.connected = false
      dbHealth.error = error.message
      console.error(`[startup] database connection failed: ${error.message}`)
    }
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`API running on http://${HOST}:${PORT}`)
  })

  server.on('error', (error) => {
    console.error('[fatal] server listen failed', error)
    process.exit(1)
  })
}

process.on('unhandledRejection', (error) => {
  console.error('[fatal] unhandledRejection', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('[fatal] uncaughtException', error)
  process.exit(1)
})

start().catch((error) => {
  console.error('[fatal] startup failed', error)
  process.exit(1)
})
