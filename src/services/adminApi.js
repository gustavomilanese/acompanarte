const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://acompanarte-production.up.railway.app' : 'http://localhost:4000')
const GET_CACHE_TTL_MS = 30_000
const responseCache = new Map()

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clonePayload(value) {
  if (value === null || value === undefined) return value

  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value))
  }
}

function clearRequestCache() {
  responseCache.clear()
}

async function request(path, options = {}) {
  const {
    useCache = true,
    forceFresh = false,
    cacheTtl = GET_CACHE_TTL_MS,
    ...fetchOptions
  } = options
  const method = String(options.method || 'GET').toUpperCase()
  const canRetry = method === 'GET'
  const maxAttempts = canRetry ? 4 : 1
  const retryableStatuses = new Set([429, 502, 503, 504])
  const shouldUseCache = method === 'GET' && useCache
  const cacheKey = shouldUseCache ? `${method}:${path}` : null
  const now = Date.now()

  if (shouldUseCache && !forceFresh) {
    const cached = responseCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      if (cached.promise) {
        return cached.promise
      }
      return clonePayload(cached.data)
    }
  }

  const buildFetchOptions = () => ({
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    },
    cache: 'no-store',
    ...fetchOptions,
  })

  const requestPromise = (async () => {
    let response = null
    let lastError = null

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        response = await fetch(`${API_BASE_URL}${path}`, buildFetchOptions())
        if (retryableStatuses.has(response.status) && attempt < maxAttempts) {
          await sleep(600 * attempt)
          continue
        }
        break
      } catch (error) {
        lastError = error
        if (attempt < maxAttempts) {
          await sleep(600 * attempt)
          continue
        }
      }
    }

    if (!response) {
      throw new Error(lastError?.message || 'Error de comunicación con el servidor')
    }

    if (response.status === 204) {
      if (shouldUseCache) {
        responseCache.set(cacheKey, {
          data: null,
          expiresAt: Date.now() + cacheTtl,
        })
      } else if (method !== 'GET') {
        clearRequestCache()
      }
      return null
    }

    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      const message = payload?.error || 'Error de comunicación con el servidor'
      throw new Error(message)
    }

    if (shouldUseCache) {
      responseCache.set(cacheKey, {
        data: payload,
        expiresAt: Date.now() + cacheTtl,
      })
    } else if (method !== 'GET') {
      clearRequestCache()
    }

    return clonePayload(payload)
  })()

  if (shouldUseCache) {
    responseCache.set(cacheKey, {
      promise: requestPromise,
      expiresAt: now + cacheTtl,
    })
  }

  try {
    return await requestPromise
  } catch (error) {
    if (shouldUseCache) {
      responseCache.delete(cacheKey)
    }
    throw error
  }
}

export const adminApi = {
  getAcompanantes() {
    return request('/api/admin/acompanantes')
  },
  createAcompanante(data) {
    return request('/api/admin/acompanantes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateAcompanante(id, data) {
    return request(`/api/admin/acompanantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteAcompanante(id) {
    return request(`/api/admin/acompanantes/${id}`, {
      method: 'DELETE',
    })
  },
  importAcompanantesBulk(rows) {
    return request('/api/admin/acompanantes/import-bulk', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    })
  },
  parseAcompanantesCvAI(files) {
    return request('/api/admin/acompanantes/import-ai-parse', {
      method: 'POST',
      body: JSON.stringify({ files }),
    })
  },
  getClientes() {
    return request('/api/admin/clientes')
  },
  createCliente(data) {
    return request('/api/admin/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateCliente(id, data) {
    return request(`/api/admin/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteCliente(id) {
    return request(`/api/admin/clientes/${id}`, {
      method: 'DELETE',
    })
  },
  getServicios() {
    return request('/api/admin/servicios')
  },
  createServicio(data) {
    return request('/api/admin/servicios', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateServicio(id, data) {
    return request(`/api/admin/servicios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteServicio(id) {
    return request(`/api/admin/servicios/${id}`, {
      method: 'DELETE',
    })
  },
  updateServicioAltaEstado(id, estado) {
    return request(`/api/admin/servicios/${id}/alta-state`, {
      method: 'POST',
      body: JSON.stringify({ estado }),
    })
  },
  deleteSerieServicio(id) {
    return request(`/api/admin/servicios/${id}/delete-series`, {
      method: 'POST',
    })
  },
  getServiciosModulo() {
    return request('/api/admin/servicios-modulo')
  },
  getServicioModulo(id) {
    return request(`/api/admin/servicios-modulo/${id}`)
  },
  pauseServicioModulo(id, nota = '') {
    return request(`/api/admin/servicios-modulo/${id}/pause`, {
      method: 'POST',
      body: JSON.stringify({ nota }),
    })
  },
  resumeServicioModulo(id, nota = '') {
    return request(`/api/admin/servicios-modulo/${id}/resume`, {
      method: 'POST',
      body: JSON.stringify({ nota }),
    })
  },
  updateServicioPagoMesActual(id, payload) {
    return request(`/api/admin/servicios-modulo/${id}/payments/current-month`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateServicioPagoMes(id, payload) {
    return request(`/api/admin/servicios-modulo/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  createServicioAssignment(id, payload) {
    return request(`/api/admin/servicios-modulo/${id}/assignments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateServicioAssignment(id, assignmentId, payload) {
    return request(`/api/admin/servicios-modulo/${id}/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  getFinanzasResumen() {
    return request('/api/admin/finanzas/resumen')
  },
  getFinanzasMovimientos(params = {}) {
    const search = new URLSearchParams()
    if (params.tipo) search.set('tipo', params.tipo)
    if (params.periodType) search.set('periodType', params.periodType)
    if (params.year) search.set('year', String(params.year))
    if (params.month) search.set('month', String(params.month))
    if (params.week) search.set('week', String(params.week))
    const qs = search.toString() ? `?${search.toString()}` : ''
    return request(`/api/admin/finanzas/movimientos${qs}`)
  },
  createFinanzasMovimiento(payload) {
    return request('/api/admin/finanzas/movimientos', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateFinanzasMovimiento(id, payload) {
    return request(`/api/admin/finanzas/movimientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  deleteFinanzasMovimiento(id) {
    return request(`/api/admin/finanzas/movimientos/${id}`, {
      method: 'DELETE',
    })
  },
  submitPublicCaregiverSignup(payload) {
    return request('/api/public/caregiver-signups', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  clearCache() {
    clearRequestCache()
  },
}

export default adminApi
