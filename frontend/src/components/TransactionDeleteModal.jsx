import { useEffect, useRef, useState } from 'react'

function DeleteConfirmation({ transaction, onClose, onDeleted }) {
    const [reason, setReason] = useState('')
    const [error, setError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleted, setDeleted] = useState(false)
    const submissionLocked = useRef(false)
    const dialogRef = useRef(null)
    const label = transaction.type === 'expense' ? 'expense' : 'received payment'

    useEffect(() => {
        const dialog = dialogRef.current
        const previousFocus = document.activeElement
        dialog.showModal()

        return () => {
            dialog.close()
            previousFocus?.focus()
        }
    }, [])

    function handleClose() {
        if (submissionLocked.current && !deleted) return
        onClose?.()
    }

    async function handleDelete(event) {
        event.preventDefault()
        if (submissionLocked.current) return
        setError('')

        const trimmedReason = reason.trim()
        if (!trimmedReason || trimmedReason.length > 255) {
            setError('Enter a reason between 1 and 255 characters.')
            return
        }

        const apiUrl = import.meta.env.VITE_API_URL
        const token = localStorage.getItem('token')
        if (!apiUrl || !token) {
            setError(!apiUrl ? 'The server address is not configured.' : 'Please log in again before deleting.')
            return
        }

        submissionLocked.current = true
        setIsDeleting(true)
        let succeeded = false

        try {
            const response = await fetch(`${apiUrl}/api/${transaction.type}/${transaction.transaction_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: trimmedReason }),
            })
            const data = await response.json().catch(() => null)

            if (!response.ok) {
                setError(data?.message || 'Unable to delete the transaction.')
            } else {
                succeeded = true
                setDeleted(true)
            }
        } catch {
            setError('Unable to contact the server. Check the transaction list before trying again.')
        } finally {
            if (!succeeded) submissionLocked.current = false
            setIsDeleting(false)
        }

        if (succeeded) {
            try {
                await onDeleted?.()
                onClose?.()
            } catch {
                setError('The transaction was deleted, but the list could not refresh. Close this window and reload the page.')
            }
        }
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="delete-transaction-title"
            aria-describedby="delete-transaction-description"
            aria-modal="true"
            onCancel={event => {
                event.preventDefault()
                handleClose()
            }}
            className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
        >
            <h2 id="delete-transaction-title" className="text-xl font-bold">Delete {label}?</h2>
            <p id="delete-transaction-description" className="mt-2 text-sm text-slate-600">
                This transaction will be removed from the transaction list and balance.
            </p>
            <div className="my-5 rounded-lg bg-slate-50 p-4">
                <p className="font-medium">
                    {transaction.type === 'expense' ? transaction.description : transaction.received_type === 'owner_funding' ? 'Owner Funding' : transaction.patient_name}
                </p>
                <p className="mt-1 text-sm text-slate-600">Ksh {Number(transaction.amount).toLocaleString('en-KE')}</p>
            </div>

            <form onSubmit={handleDelete} aria-busy={isDeleting}>
                {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                {deleted && <p role="status" className="mb-4 text-sm font-medium text-emerald-700">Transaction deleted successfully.</p>}
                <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Reason for deletion</span>
                    <textarea
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                        required
                        maxLength={255}
                        rows={3}
                        disabled={isDeleting || deleted}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                </label>
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button type="button" autoFocus disabled={isDeleting} onClick={handleClose} className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        {deleted ? 'Close' : 'Cancel'}
                    </button>
                    <button type="submit" disabled={isDeleting || deleted || !reason.trim()} className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {isDeleting ? 'Deleting…' : deleted ? 'Deleted' : 'Confirm Delete'}
                    </button>
                </div>
            </form>
        </dialog>
    )
}

export default function TransactionDeleteModal({ transaction, onClose, onDeleted }) {
    if (!transaction) return null

    return (
        <DeleteConfirmation
            key={`${transaction.type}-${transaction.transaction_id}`}
            transaction={transaction}
            onClose={onClose}
            onDeleted={onDeleted}
        />
    )
}
