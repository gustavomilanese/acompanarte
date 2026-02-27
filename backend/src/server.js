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

  return {
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
    avatar: body.avatar || null,
    cvNombre: body.cvNombre || null,
    cvMimeType: body.cvMimeType || null,
    cvArchivo: body.cvArchivo || null,
    bio: body.bio || null,
    especialidades: Array.isArray(body.especialidades) ? body.especialidades : [],
  }
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

  return {
    nombre: body.nombre,
    edad: Number(body.edad),
    tipo: body.tipo,
    condicion: body.condicion,
    direccion: body.direccion,
    contactoEmergenciaNombre: body.contactoEmergencia?.nombre || '',
    contactoEmergenciaTelefono: body.contactoEmergencia?.telefono || '',
    acompananteAsignadoId: body.acompananteAsignado || null,
    foto: body.foto || null,
    notas: body.notas || null,
    necesidadesEspeciales: Array.isArray(body.necesidadesEspeciales) ? body.necesidadesEspeciales : [],
  }
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
  const items = await prisma.caregiver.findMany({ orderBy: { nombre: 'asc' } })
  res.json(items.map(mapCaregiver))
}))

app.post('/api/admin/acompanantes', asyncHandler(async (req, res) => {
  const data = toCaregiverInput(req.body)
  const item = await prisma.caregiver.create({ data })
  res.status(201).json(mapCaregiver(item))
}))

app.put('/api/admin/acompanantes/:id', asyncHandler(async (req, res) => {
  const data = toCaregiverInput(req.body)
  const item = await prisma.caregiver.update({ where: { id: req.params.id }, data })
  res.json(mapCaregiver(item))
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
  res.json(items.map(mapPatient))
}))

app.post('/api/admin/clientes', asyncHandler(async (req, res) => {
  const data = toPatientInput(req.body)
  const item = await prisma.patient.create({ data })
  res.status(201).json(mapPatient(item))
}))

app.put('/api/admin/clientes/:id', asyncHandler(async (req, res) => {
  const data = toPatientInput(req.body)
  const item = await prisma.patient.update({ where: { id: req.params.id }, data })
  res.json(mapPatient(item))
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
  const tipo = req.query?.tipo
  const periodType = req.query?.periodType
  const year = req.query?.year ? Number(req.query.year) : null
  const month = req.query?.month ? Number(req.query.month) : null
  const week = req.query?.week ? Number(req.query.week) : null

  const where = {}
  if (tipo && ['cobro', 'pago'].includes(String(tipo))) where.tipo = String(tipo)
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
  if (!['cobro', 'pago'].includes(tipo)) {
    const error = new Error('Tipo inválido. Debe ser cobro o pago.')
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
        patientId: req.body.patientId || null,
        caregiverId: req.body.caregiverId || null,
        serviceId: req.body.serviceId || null,
      },
      include: {
        patient: { select: { id: true, nombre: true } },
        caregiver: { select: { id: true, nombre: true } },
        service: { select: { id: true } },
      },
    })

    if (created.serviceId && created.tipo === 'cobro') {
      const syncYear = Number(created.year || year)
      const syncMonth = Number(created.month || (created.fechaPago ? new Date(created.fechaPago).getMonth() + 1 : new Date(created.fecha).getMonth() + 1))
      if (Number.isInteger(syncYear) && Number.isInteger(syncMonth) && syncMonth >= 1 && syncMonth <= 12) {
        await tx.servicePayment.upsert({
          where: { serviceId_year_month: { serviceId: created.serviceId, year: syncYear, month: syncMonth } },
          update: {
            estado: String(created.estado).toLowerCase() === 'pendiente' ? 'pendiente' : 'pagado',
            paidAt: String(created.estado).toLowerCase() === 'pendiente' ? null : (created.fechaPago || new Date()),
          },
          create: {
            serviceId: created.serviceId,
            year: syncYear,
            month: syncMonth,
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

    if (updated.serviceId && updated.tipo === 'cobro') {
      const syncYear = Number(updated.year || new Date().getFullYear())
      const syncMonth = Number(updated.month || (updated.fechaPago ? new Date(updated.fechaPago).getMonth() + 1 : new Date(updated.fecha).getMonth() + 1))
      if (Number.isInteger(syncYear) && Number.isInteger(syncMonth) && syncMonth >= 1 && syncMonth <= 12) {
        await tx.servicePayment.upsert({
          where: { serviceId_year_month: { serviceId: updated.serviceId, year: syncYear, month: syncMonth } },
          update: {
            estado: String(updated.estado).toLowerCase() === 'pendiente' ? 'pendiente' : 'pagado',
            paidAt: String(updated.estado).toLowerCase() === 'pendiente' ? null : (updated.fechaPago || new Date()),
          },
          create: {
            serviceId: updated.serviceId,
            year: syncYear,
            month: syncMonth,
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

  res.json({
    period: { year, month },
    cobrosPendientes: pendingCobrosServicio.length,
    pagosPendientesCuidadores: caregiversPendingWithAdvance.length,
    cobrosPendientesRegistrados: pendingCobrosServicio.length,
    pagosPendientesRegistrados: pendingPagos.length,
    totalCobradoMes,
    totalPagadoMes,
    totalAdelantosMes,
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
