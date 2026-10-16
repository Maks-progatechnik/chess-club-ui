interface IApiError {
  error?: string
}

interface IClubRequest {
  path: string
  token: string
  method: 'GET' | 'POST' | 'PUT'
  body?: unknown
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

export function clubGet<T>(path: string, token: string): Promise<T> {
  return clubRequest<T>({ path, token, method: 'GET' })
}

export function clubPost<T>(path: string, token: string, body: unknown): Promise<T> {
  return clubRequest<T>({ path, token, method: 'POST', body })
}

export function clubPut<T>(path: string, token: string, body: unknown): Promise<T> {
  return clubRequest<T>({ path, token, method: 'PUT', body })
}

async function clubRequest<T>(request: IClubRequest): Promise<T> {
  const { path, token, method, body } = request
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = (await response.json()) as IApiError
    throw new Error(errorBody.error ?? 'The club API did not accept this session.')
  }

  return (await response.json()) as T
}
