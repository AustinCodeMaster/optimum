import { useState, useEffect } from 'react'

const apiUrl = import.meta.env.VITE_API_URL

function formatDate(value) {
    return new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    })
}

function TransactionType({ type }) {
    return (
        <span className={type === 'received'
            ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
            : 'inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700'}>
            {type}
        </span>
    )
}

// Share the details between the mobile cards and the larger-screen table.
function TransactionDetails({ transaction }) {
    const isOwnerFunding = transaction.type === 'received' && transaction.received_type === 'owner_funding'
    const title = transaction.type === 'received'
        ? (isOwnerFunding ? 'Owner Funding' : transaction.patient_name)
        : transaction.description
    const subtitle = transaction.type === 'received'
        ? (isOwnerFunding ? 'Capital added by owner' : `Lab No: ${transaction.lab_number ?? ''}`)
        : transaction.destination

    return (
        <div className="min-w-0 break-words">
            <p className="font-medium text-slate-800">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
    )
}

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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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

        {/* Cards keep each transaction readable without sideways scrolling on phones. */}
        <ul className="space-y-3 md:hidden">
            {transactions.map(transaction => (
                <li key={`${transaction.type}-${transaction.transaction_id}`} className="rounded-xl border border-slate-200 p-4 text-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <time className="text-slate-600">{formatDate(transaction.transaction_date)}</time>
                        <TransactionType type={transaction.type} />
                    </div>
                    <TransactionDetails transaction={transaction} />
                    <p className="mt-3 break-words text-base font-semibold text-slate-900">
                        Ksh {transaction.amount}
                    </p>
                </li>
            ))}
        </ul>

        {/* From md upwards, retain the table and its horizontal-scroll fallback. */}
        <div className="hidden overflow-x-auto md:block">
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
                                {formatDate(transaction.transaction_date)}
                            </td>

                            <td className="px-4 py-4">
                                <TransactionType type={transaction.type} />
                            </td>

                            <td className="px-4 py-4">
                                <TransactionDetails transaction={transaction} />
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
