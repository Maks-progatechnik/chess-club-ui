interface IApiError {
  error?: string
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

export async function clubGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const errorBody = (await response.json()) as IApiError
    throw new Error(errorBody.error ?? 'The club API did not accept this session.')
  }

  return (await response.json()) as T
}
