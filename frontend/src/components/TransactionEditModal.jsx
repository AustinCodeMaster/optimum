import { useEffect, useRef, useState } from 'react'

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500'

function formatDate(value) {
    // Preserve dates entered in the form without converting their timezone.
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    if (!value) return ''

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function InputField({ label, ...props }) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
            <input className={inputClass} {...props} />
        </label>
    )
}

function TransactionEditForm({ transaction, onClose, onSaved }) {
    const [form, setForm] = useState(() => ({
        ...transaction,
        transaction_date: formatDate(transaction.transaction_date),
    }))
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const submissionLocked = useRef(false)
    const dialogRef = useRef(null)
    const isReceived = transaction.type === 'received'

    useEffect(() => {
        const dialog = dialogRef.current
        const previousFocus = document.activeElement
        dialog.showModal()

        return () => {
            dialog.close()
            previousFocus?.focus()
        }
    }, [])

    function handleChange(event) {
        const { name, value } = event.target
        setForm(previous => ({ ...previous, [name]: value }))
    }

    function fieldProps(name) {
        return { name, value: form[name] ?? '', onChange: handleChange }
    }

    function handleClose() {
        if (submissionLocked.current && !saved) return
        onClose?.()
    }

    async function handleSubmit(event) {
        event.preventDefault()
        // A ref blocks a second submit immediately, before React renders again.
        if (submissionLocked.current) return
        setError('')

        const amount = Number(form.amount)
        if (!Number.isInteger(amount) || amount <= 0) {
            setError('Amount must be a positive whole number.')
            return
        }

        const text = name => String(form[name] ?? '').trim()
        const body = isReceived ? {
            received_type: transaction.received_type,
            patient_name: transaction.received_type === 'patient_payment' ? text('patient_name') : null,
            doctor_name: transaction.received_type === 'patient_payment' ? text('doctor_name') : null,
            lab_number: transaction.received_type === 'patient_payment' ? text('lab_number') : null,
            amount,
            payment_method: form.payment_method,
            receipt_number: form.payment_method === 'cash' ? text('receipt_number') : null,
            mpesa_transaction_number: form.payment_method === 'mpesa' ? text('mpesa_transaction_number') : null,
            date_received: form.transaction_date,
        } : {
            amount,
            expenditure_type: form.expenditure_type,
            description: text('description'),
            destination: form.expenditure_type === 'transport' ? text('destination') : null,
            receipt_id: form.expenditure_type === 'transport' ? null : text('receipt_id') || null,
            date_of_expense: form.transaction_date,
        }

        const apiUrl = import.meta.env.VITE_API_URL
        const token = localStorage.getItem('token')
        if (!apiUrl || !token) {
            setError(!apiUrl ? 'The server address is not configured.' : 'Please log in again before saving.')
            return
        }

        submissionLocked.current = true
        setIsSaving(true)
        let succeeded = false

        try {
            const response = await fetch(`${apiUrl}/api/${transaction.type}/${transaction.transaction_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            })
            const data = await response.json().catch(() => null)

            if (!response.ok) {
                setError(data?.message || 'Unable to update the transaction.')
            } else {
                succeeded = true
                setSaved(true)
            }
        } catch {
            setError('Unable to contact the server. Please check your connection and try again.')
        } finally {
            // Successful saves stay locked until this editor is closed.
            if (!succeeded) submissionLocked.current = false
            setIsSaving(false)
        }

        if (succeeded) {
            try {
                await onSaved?.()
                onClose?.()
            } catch {
                setError('Your changes were saved, but the list could not refresh. Close this window and reload the page.')
            }
        }
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="edit-transaction-title"
            aria-modal="true"
            onCancel={event => {
                event.preventDefault()
                handleClose()
            }}
            className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm sm:p-6"
        >
            <h2 id="edit-transaction-title" className="mb-5 border-b border-slate-200 pb-4 text-xl font-bold">
                {isReceived ? 'Edit Received Transaction' : 'Edit Expense'}
            </h2>

            <form onSubmit={handleSubmit} aria-busy={isSaving}>
                {error && (
                    <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}
                {saved && (
                    <p role="status" className="mb-5 text-sm font-medium text-emerald-700">Changes saved successfully.</p>
                )}

                <fieldset disabled={isSaving || saved} className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <legend className="sr-only">Transaction details</legend>
                    {isReceived && (
                        <>
                            <div className="md:col-span-2">
                                <InputField label="Received Type" type="text" readOnly value={transaction.received_type === 'patient_payment' ? 'Patient Payment' : 'Owner Funding'} />
                            </div>
                            {transaction.received_type === 'patient_payment' && (
                                <>
                                    <InputField label="Patient Name" type="text" maxLength={100} required {...fieldProps('patient_name')} />
                                    <InputField label="Doctor Name" type="text" maxLength={100} required {...fieldProps('doctor_name')} />
                                    <InputField label="Lab Number" type="text" maxLength={50} required {...fieldProps('lab_number')} />
                                </>
                            )}
                        </>
                    )}

                    <InputField label="Amount" type="number" min={1} step={1} required {...fieldProps('amount')} />
                    <InputField label="Date" type="date" required {...fieldProps('transaction_date')} />

                    {isReceived ? (
                        <>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-slate-700">Payment Method</span>
                                <select className={inputClass} required {...fieldProps('payment_method')}>
                                    <option value="cash">Cash</option>
                                    <option value="mpesa">M-Pesa</option>
                                </select>
                            </label>
                            {form.payment_method === 'cash' ? (
                                <InputField label="Receipt Number" type="text" maxLength={50} required {...fieldProps('receipt_number')} />
                            ) : (
                                <InputField label="M-Pesa Transaction Number" type="text" maxLength={50} required {...fieldProps('mpesa_transaction_number')} />
                            )}
                        </>
                    ) : (
                        <>
                            <div className="md:col-span-2">
                                <InputField label="Description" type="text" maxLength={100} required {...fieldProps('description')} />
                            </div>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-slate-700">Expense Type</span>
                                <select className={inputClass} required {...fieldProps('expenditure_type')}>
                                    <option value="transport">Transport</option>
                                    <option value="supplies">Supplies</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>
                            {form.expenditure_type === 'transport' ? (
                                <InputField label="Destination" type="text" maxLength={100} required {...fieldProps('destination')} />
                            ) : (
                                <InputField label={form.expenditure_type === 'supplies' ? 'Receipt ID' : 'Receipt ID (optional)'} type="text" maxLength={50} required={form.expenditure_type === 'supplies'} {...fieldProps('receipt_id')} />
                            )}
                        </>
                    )}
                </fieldset>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                    <button type="button" disabled={isSaving} onClick={handleClose} className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        {saved ? 'Close' : 'Cancel'}
                    </button>
                    <button type="submit" disabled={isSaving || saved} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </dialog>
    )
}

// Changing the selected transaction starts a fresh form without mutating the table row.
export default function TransactionEditModal({ transaction, onClose, onSaved }) {
    if (!transaction) return null

    return (
        <TransactionEditForm
            key={`${transaction.type}-${transaction.transaction_id}`}
            transaction={transaction}
            onClose={onClose}
            onSaved={onSaved}
        />
    )
}
