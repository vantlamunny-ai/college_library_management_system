import { useCallback, useEffect, useRef, useState } from 'react'

export function useApi(
  apiFunction,
  dependencies = [],
  options = {}
) {
  const { enabled = true } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const apiFunctionRef = useRef(apiFunction)

  useEffect(() => {
    apiFunctionRef.current = apiFunction
  }, [apiFunction])

  const execute = useCallback(async () => {
    if (!enabled) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiFunctionRef.current()
      // Backend wraps everything as {success, data, ...} — unwrap it here,
      // once, so every component that uses this hook gets the plain
      // array/object directly instead of having to reach into `.data`.
      const unwrapped = response && typeof response === 'object' && 'data' in response
        ? response.data
        : response
      setData(unwrapped)
      return unwrapped
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    execute()
  }, [execute, enabled, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch: execute,
  }
}


// ========================================
// useMutation
// ========================================

export function useMutation(mutationFunction) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutationFunctionRef = useRef(mutationFunction)

  useEffect(() => {
    mutationFunctionRef.current = mutationFunction
  }, [mutationFunction])

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)

    try {
      const response = await mutationFunctionRef.current(...args)
      const unwrapped = response && typeof response === 'object' && 'data' in response
        ? response.data
        : response
      setData(unwrapped)
      return unwrapped
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return [
    mutate,
    {
      data,
      loading,
      error,
    },
  ]
}

export default useApi