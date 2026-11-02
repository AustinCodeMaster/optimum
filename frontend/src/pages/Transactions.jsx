import Sidebar from '../components/Sidebar.jsx'
import TransactionEditModal from '../components/TransactionEditModal.jsx'
import { useState, useEffect} from 'react'

const apiUrl = import.meta.env.VITE_API_URL

function Transactions() {
    const [transactions, setTransactions] = useState([])
    const [error, setError] = useState('')
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [user] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'))
        } catch {
            return null
        }
    })
    const currentUserId = Number(user?.user_id)
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0
    })
    const[search, setSearch] = useState('')
    const[type, setType] = useState('')
    const [paymentCategory, setPaymentCategory] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Staff can edit only transactions recorded by their own account.
    function canEditTransaction(transaction) {
        return user?.role === 'staff' && currentUserId > 0 && currentUserId === Number(transaction.user_id)
    }
    
    function fetchTransactions(page = 1) {
        //gets the JWT token of the logged_in user from localStorage
        const token = localStorage.getItem('token')
        
        //creates an object that helps us build URL filter parameters
        //it is an inbuild  webapi constructoe that helps create and manage query parameters
        const params = new URLSearchParams()

        params.append('page', page)
        
        if(search) params.append('search', search)
        if(type) params.append('type',type)
        if(startDate) params.append('start_date', startDate)
        if(endDate) params.append('end_date', endDate)

        if(paymentCategory === 'cash' || paymentCategory === 'mpesa') {
            params.append('payment_method', paymentCategory)
        }

        if (
            paymentCategory === 'transport' ||
            paymentCategory === 'supplies' ||
            paymentCategory === 'other'
        ) {
            params.append('expenditure_type', paymentCategory)
        }
        
        return fetch(`${apiUrl}/api/transactions?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
           .then(async response => {
                const data = await response.json()
                if (!response.ok) {
                    setError(data.message || 'Unable to load transactions.')
                    return
                }
                setError('')
                setTransactions(data.data)
                setPagination(data.pagination)
           })
           .catch(() => {
                setError('Unable to contact the server or read its response. Please try again.')
           })
    }  
    function clearFilters() {
        setSearch('')
        setType('')
        setPaymentCategory('')
        setStartDate('')
        setEndDate('')

        const token = localStorage.getItem('token')

        fetch(`${apiUrl}/api/transactions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
          .then(async response => {
                const data = await response.json()
                if (!response.ok) {
                    setError(data.message || 'Unable to load transactions.')
                    return
                }
                setError('')
                setTransactions(data.data)
                setPagination(data.pagination)
          })
          .catch(() => {
                setError('Unable to contact the server or read its response. Please try again.')
          })
    }    
    useEffect(() => {
        const token = localStorage.getItem('token')

        fetch(`${apiUrl}/api/transactions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(async response => {
                const data = await response.json()
                if (!response.ok) {
                    setError(data.message || 'Unable to load transactions.')
                    return
                }
                setError('')
                setTransactions(data.data)
                setPagination(data.pagination)
            })
            .catch(() => {
                setError('Unable to contact the server or read its response. Please try again.')
            })
    },[])
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
            <Sidebar />
            
            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                      <h1 className="text-3xl font-bold text-slate-900">
                        Transactions
                      </h1>
                      <p className="mt-1 text-sm text-slate-500" >
                        View and search all petty cash Transactions
                      </p>
                </div>
                {error && (
                    <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                 <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

    
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <input
                    type="text"
                    placeholder="Search transactions"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

    <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
        <option value="">All Types</option>
        <option value="received">Received</option>
        <option value="expense">Expense</option>
    </select>

    <select
        value={paymentCategory}
        onChange={(e) => setPaymentCategory(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
        <option value="">All Payment / Categories</option>
        <option value="cash">Cash</option>
        <option value="mpesa">M-Pesa</option>
        <option value="transport">Transport</option>
        <option value="supplies">Supplies</option>
        <option value="other">Other</option>
    </select>

    <input
        type="date"
        aria-label="Start date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="min-w-0 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />

    <input
        type="date"
        aria-label="End date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="min-w-0 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
                  </div>
    {/* Stack actions on phones, then align them to the right on wider screens. */}
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button 
        type="button"
         onClick={ () => fetchTransactions(1)}
         className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
         >
        Filter
    </button>

    <button
    type="button" 
    onClick={clearFilters}
    className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
        Clear
    </button>
    </div>

</div>
                <TransactionEditModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    onSaved={() => fetchTransactions(pagination.currentPage)}
                />
                 {/* Mobile cards show the same fields and edit permission as the table. */}
                 <ul className="space-y-3 md:hidden">
                     {transactions.map(transaction => (
                         <li key={`${transaction.type}-${transaction.transaction_id}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                             <div className="flex flex-wrap items-center justify-between gap-2">
                                 <time className="text-slate-600">{new Date(transaction.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                                 <span className={transaction.type === 'received'
                                     ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                                     : 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700'}>{transaction.type}</span>
                             </div>
                             <div className="mt-3 break-words">
                                 {transaction.type === 'received' ? (
                                     transaction.received_type === 'owner_funding' ? (
                                         <><p className="font-medium text-slate-800">Owner Funding</p><p className="text-xs text-slate-500">Capital added by owner</p></>
                                     ) : (
                                         <><p className="font-medium text-slate-800">{transaction.patient_name}</p><p className="text-xs text-slate-500">Lab No: {transaction.lab_number}</p></>
                                     )
                                 ) : (
                                     <><p className="font-medium text-slate-800">{transaction.description}</p>{transaction.destination && <p className="text-xs text-slate-500">{transaction.destination}</p>}</>
                                 )}
                             </div>
                             <dl className="mt-3 space-y-1 break-words text-slate-600">
                                 <div><dt className="inline font-medium">Reference: </dt><dd className="inline">{transaction.receipt_number || transaction.mpesa_transaction_number || transaction.receipt_id || '-'}</dd></div>
                                 <div><dt className="inline font-medium">Payment / Category: </dt><dd className="inline">{transaction.type === 'received' ? transaction.payment_method : transaction.expenditure_type}</dd></div>
                             </dl>
                             <p className="mt-3 break-words text-base font-semibold text-slate-900">Ksh {transaction.amount}</p>
                             {canEditTransaction(transaction) && (
                                 <button type="button" onClick={() => setSelectedTransaction(transaction)} className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                                     Edit
                                 </button>
                             )}
                         </li>
                     ))}
                 </ul>
                 <div className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                    <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                            <th
                            className="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Date
                            </th>
                            <th
                            className="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Type
                            </th>
                            <th
                            className="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Details
                            </th>
                            <th
                            className="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Reference
                            </th>
                            <th
                            className="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Payment/Category
                            </th>
                            <th
                            className="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Amount
                            </th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">
                                Actions
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
                                    {new Date(transaction.transaction_date).toLocaleDateString(
                                        'en-GB',
                                        {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        }
                                    )}
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
                               <td className="px-4 py-4 text-slate-600">
                                  {transaction.receipt_number ||
                                   transaction.mpesa_transaction_number ||
                                   transaction.receipt_id ||
                                    '-'}
                               </td>

                            <td className="px-4 py-4 text-slate-600">
                                {transaction.type === 'received'
                                 ? transaction.payment_method
                                 : transaction.expenditure_type}
                            </td>

                            <td className="px-4 py-4 text-right text-base font-semibold text-slate-900">
                                Ksh {transaction.amount}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right">
                                {canEditTransaction(transaction) && (
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                            onClick={() => setSelectedTransaction(transaction)}
                                        >
                                            Edit
                                        </button>
                                    )}
                            </td>
                                
                            </tr>
                        ))}
                    </tbody>
                 </table>
                    </div>
                 </div>


                 <nav aria-label="Transaction pages" className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 p-4">

    {/* Previous button goes to the page before the current page */}
    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage - 1)}
        disabled={pagination.currentPage <= 1}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
        Previous
    </button>

    {/* A page selector stays compact while still allowing a direct jump. */}
    <label className="flex items-center gap-2 text-sm text-slate-700">
        Page
        <select aria-label="Go to page" value={pagination.currentPage} onChange={event => fetchTransactions(Number(event.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-2">
            {Array.from({ length: Math.max(1, pagination.totalPages) }, (_, index) => (
                <option key={index + 1} value={index + 1}>{index + 1}</option>
            ))}
        </select>
        of {Math.max(1, pagination.totalPages)}
    </label>

    {/* Next button goes to the page after the current page */}
    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage + 1)}
        // disable Next if we are already on the last page
        disabled={pagination.currentPage >= pagination.totalPages}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"

    >
        Next
    </button>

</nav>
            </main>
        </div>
    )
}

export default Transactions
