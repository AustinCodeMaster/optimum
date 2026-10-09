import { useState, useEffect } from 'react'

const apiUrl = import.meta.env.VITE_API_URL

function RecentTransactions() {
    const [transactions, setTransactions] = useState([]) //this means react should remember the transactions
    const [error, setError] = useState('')

    
    useEffect( () => {
        const token = localStorage.getItem('token')

        fetch(`${apiUrl}/api/transactions`,{
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
           .then(async response => {
                const data = await response.json()
                if (!response.ok) {
                    setError(data.message || 'Unable to load recent transactions.')
                    return
                }
                setError('')
                setTransactions(data.data.slice(0,5))
           })
           .catch(() => {
                setError('Unable to contact the server or read its response. Please try again.')
           })
        
    }, [])

        return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
                Recent Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                Latest petty cash activity
            </p>
        </div>

        {error && (
            <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
            </p>
        )}

        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                            Date
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                            Type
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                            Details
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                            Amount
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {transactions.map(transaction => (
                        <tr
                            key={`${transaction.type}-${transaction.transaction_id}`}
                            className="border-b border-slate-100 transition hover:bg-slate-50"
                        >
                            <td className="px-4 py-4 text-slate-700">
                                {new Date(transaction.transaction_date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </td>

                            <td className="px-4 py-4">
                                <span
                                    className={
                                        transaction.type === 'received'
                                            ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                                            : 'inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700'
                                    }
                                >
                                    {transaction.type}
                                </span>
                            </td>

                            <td className="px-4 py-4">
                                {transaction.type === 'received' ? (
                                    transaction.received_type === 'owner_funding' ? (
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                Owner Funding
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Capital added by owner
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {transaction.patient_name}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Lab No: {transaction.lab_number}
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {transaction.description}
                                        </p>

                                        {transaction.destination && (
                                            <p className="text-xs text-slate-500">
                                                {transaction.destination}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </td>

                            <td className="px-4 py-4 text-right text-base font-semibold text-slate-900">
                                Ksh {transaction.amount}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)
}

export default RecentTransactions
