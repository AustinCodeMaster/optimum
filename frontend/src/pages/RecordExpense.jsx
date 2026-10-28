import Sidebar from '../components/Sidebar.jsx'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useTransactionSave from '../hooks/useTransactionSave.js'

function RecordExpense() {
    const [amount, setAmount] = useState('')
    const [expenseType, setExpenseType] = useState('')
    const [description, setDescription] = useState('')
    const [destination, setDestination] = useState('')
    const [receiptId, setReceiptId] = useState('')
    const [dateOfExpense, setDateOfExpense] = useState('')
    const { save, isSaving, error, success } = useTransactionSave('/api/expense', 'Expense recorded successfully')

    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        if (isSaving) return

        const saved = await save({
            amount: Number(amount),
            expenditure_type: expenseType,
            description,
            destination: expenseType === 'transport' ? destination : null,
            receipt_id: expenseType === 'supplies' || expenseType === 'other' ? receiptId || null : null,
            date_of_expense: dateOfExpense,
        })

        if (saved) {
            setAmount('')
            setExpenseType('')
            setDescription('')
            setDestination('')
            setReceiptId('')
            setDateOfExpense('')
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />

            <main className="min-w-0 flex-1 p-6 lg:p-8">

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Record Expense
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Enter details of the expense
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    aria-busy={isSaving}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                    {success && <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
                    <fieldset disabled={isSaving} className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <legend className="sr-only">Expense details</legend>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Amount
                        </label>

                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            required
                            placeholder="Enter amount"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Expense Category
                        </label>

                        <select
                            value={expenseType}
                            onChange={(e) => setExpenseType(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">
                                Select category
                            </option>

                            <option value="transport">
                                Transport
                            </option>

                            <option value="supplies">
                                Supplies
                            </option>

                            <option value="other">
                                Other
                            </option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Description
                        </label>

                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            placeholder="Enter expense description"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {expenseType === 'transport' && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Destination
                            </label>

                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                required
                                placeholder="Enter destination"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    )}

                    {(expenseType === 'supplies' || expenseType === 'other') && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Receipt ID
                            </label>

                            <input
                                type="text"
                                value={receiptId}
                                onChange={(e) => setReceiptId(e.target.value)}
                                required={expenseType === 'supplies'}
                                placeholder="Enter receipt ID"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Date of Expense
                        </label>

                        <input
                            type="date"
                            value={dateOfExpense}
                            onChange={(e) => setDateOfExpense(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="flex justify-end gap-3 md:col-span-2">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => navigate('/staff/dashboard')}
                            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSaving ? 'Saving…' : 'Save Expense'}
                        </button>
                    </div>
                    </fieldset>
                </form>
            </main>
        </div>
    )
}

export default RecordExpense
