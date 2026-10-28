import { useRef, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL

export default function useTransactionSave(endpoint, successMessage) {
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const submissionLocked = useRef(false)
    const pendingRequest = useRef(null)

    async function save(body) {
        // Block repeated clicks immediately, before the disabled button renders.
        if (submissionLocked.current) return false
        setError('')
        setSuccess('')

        const token = localStorage.getItem('token')
        if (!apiUrl || !token) {
            setError(!apiUrl ? 'The server address is not configured.' : 'Please log in again before saving.')
            return false
        }

        submissionLocked.current = true
        setIsSaving(true)

        try {
            const payload = JSON.stringify(body)
            // Retrying unchanged data reuses the key if the first response was lost.
            if (pendingRequest.current?.payload !== payload) {
                pendingRequest.current = { payload, id: crypto.randomUUID() }
            }

            const response = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...body, request_id: pendingRequest.current.id }),
            })
            const data = await response.json().catch(() => null)

            if (!response.ok) {
                setError(data?.message || 'Unable to save the transaction.')
                return false
            }

            pendingRequest.current = null
            setSuccess(successMessage)
            return true
        } catch {
            setError('Unable to confirm the save. Check your connection and retry with the same details.')
            return false
        } finally {
            submissionLocked.current = false
            setIsSaving(false)
        }
    }

    return { save, isSaving, error, success }
}
