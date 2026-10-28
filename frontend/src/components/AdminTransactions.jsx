import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import TransactionEditModal from './TransactionEditModal.jsx'
import TransactionDeleteModal from './TransactionDeleteModal.jsx'

const apiUrl = import.meta.env.VITE_API_URL

function AdminTransactions({ onTransactionUpdated }) {
    const [transactions, setTransactions] = useState([])
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
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [transactionToDelete, setTransactionToDelete] = useState(null)
    const [error, setError] = useState('')

    function fetchTransactions(page = 1) {
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
                      return false
                 }
                  // Deleting the last row on a page can reduce the page count.
                  const lastPage = Math.max(1, Number(data.pagination.totalPages))
                  if (page > lastPage) return fetchTransactions(lastPage)
                 setError('')
                 setTransactions(data.data)
                 setPagination(data.pagination)
                  return true
             })
             .catch(() => {
                 setError('Unable to contact the server or read its response. Please try again.')
                  return false
             })
    }
    async function handleTransactionChanged() {
        onTransactionUpdated?.()
        const refreshed = await fetchTransactions(pagination.currentPage)
        if (!refreshed) throw new Error('Unable to refresh transactions')
    }
    useEffect(() => {
        fetchTransactions(1)
    }, [])
    
    function clearFilters() {
        setError('')
        setSearch('')
        setType('')
        setPaymentCategory('')
        setStartDate('')
        setEndDate('')

        const token = localStorage.getItem('token')

        fetch(`${apiUrl}/api/transactions?page=1`, {
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
    //This formatDate function is to convert the transaction date into the YYY-MM-DD format that the database expects
    function formatDate(dateValue) {
    const date = new Date(dateValue)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}
    async function generateStatement() {
        const token = localStorage.getItem('token')

        const params = new URLSearchParams()

        if (search) params.append('search', search)
        if (type) params.append("type", type)
        if(startDate) params.append('start_date', startDate)
        if(endDate) params.append("end_date", endDate)

        if (paymentCategory === 'cash' || paymentCategory === 'mpesa') {
            params.append('payment_method', paymentCategory)
        }

        if (
            paymentCategory === 'transport' ||
            paymentCategory === 'supplies' ||
            paymentCategory === 'other'
        ) {
            params.append('expenditure_type', paymentCategory)
        }

        let data
        try {
            const response = await fetch(
                `${apiUrl}/api/statement?${params.toString()}`,
                 {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                 }
            )
            data = await response.json()

            if (!response.ok) {
                alert(data.message || 'Unable to load statement.')
                return
            }
        } catch {
            alert('Unable to contact the server or read its response. Please try again.')
            return
        }
        const doc = new jsPDF()

        doc.setFontSize(16)
        doc.text('OPTIMUM DIAGNOSTICS', 14, 15)

        doc.setFontSize(12)
        doc.text('PETTY CASH STATEMENT', 14, 23)

        doc.setFontSize(10)

        const periodText =
             startDate && endDate
             ? `Period: ${startDate} to ${endDate}`
             : 'Period: All Transactions'
        
        doc.text(periodText, 14, 31)

        //prepare the table rows
        const tableRows = data.transactions.map(transaction => [
            formatDate(transaction.transaction_date),
            transaction.type,
            transaction.type === 'received'
             ? `${transaction.patient_name} - ${transaction.lab_number}`
             : transaction.description,
            transaction.receipt_number ||
            transaction.mpesa_transaction_number ||
            transaction.receipt_id ||
            '-',
             transaction.type === 'received'
              ? transaction.payment_method
              : transaction.expenditure_type,
            `Ksh ${transaction.amount}`
          ])

          //generate the table
          autoTable(doc, {
            startY: 38,
            head: [[
              'Date',
              'Type', 
              'Details',
              'Reference',
              'Payment / Category',
              'Amount'
         ]],
           body: tableRows
})
      const finalY = doc.lastAutoTable.finalY + 10

      doc.text(
        `Total Received: ksh ${data.total_received}`,
        14,
        finalY
      )
      
      doc.text(
        `Total Expenses: Ksh ${data.total_expenses}`,
        14,
        finalY + 7
      )

      doc.text(
        `Net Amount: Ksh ${data.net_amount}`,
        14,
        finalY+ 14
      )

      doc.save('Optimum_Diagnostics_Statement.pdf')
    }

    
    return (
<div className="mt-8 min-w-0">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">Transactions</h2>

            {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

    <input
        type="text"
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
    />

    <select
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        value={type}
        onChange={(e) => setType(e.target.value)}
    >
        <option value="">All Transactions</option>
        <option value="received">Received</option>
        <option value="expense">Expense</option>
    </select>

    <select
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        value={paymentCategory}
        onChange={(e) => setPaymentCategory(e.target.value)}
    >
        <option value="">All Categories</option>
        <option value="cash">Cash</option>
        <option value="mpesa">M-Pesa</option>
        <option value="transport">Transport</option>
        <option value="supplies">Supplies</option>
        <option value="other">Other</option>
    </select>

    <input
        type="date"
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
    />

    <input
        type="date"
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
    />

                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-3">
    <button
        type="button"
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        onClick={() => fetchTransactions(1)}
    >
        Filter
    </button>

    <button
        type="button"
        className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        onClick={clearFilters}
    >
        Clear
    </button>
    <button
       type="button"
        className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        onClick={generateStatement}
    >
        Generate Statement
    </button>
                </div>

</div>
            <TransactionEditModal
                transaction={selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                onSaved={handleTransactionChanged}
            />
            <TransactionDeleteModal
                transaction={transactionToDelete}
                onClose={() => setTransactionToDelete(null)}
                onDeleted={handleTransactionChanged}
            />
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Details</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Reference</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Payment / Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Amount</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {transactions.map(transaction => (
                        <tr key={`${transaction.type}-${transaction.transaction_id}`} className="border-b border-slate-100 transition hover:bg-slate-50">
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
                            <span className={transaction.type === 'received'
                                ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                                : 'inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700'}>
                                {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
    {transaction.type === 'received' ? ( 
        transaction.received_type === 'owner_funding' ? (
            <div>
                <p className="font-medium text-slate-800">Owner Funding</p>
                <p className="text-xs text-slate-500">Capital added by owner</p>
            </div>
        ) : (
            <div>
                <p className="font-medium text-slate-800">{transaction.patient_name}</p>
                <p className="text-xs text-slate-500">Lab No: {transaction.lab_number}</p>
            </div>
        )
    ) : ( 
        <div>
            <p className="font-medium text-slate-800">{transaction.description}</p>
            {transaction.destination && ( 
                <p className="text-xs text-slate-500">{transaction.destination}</p>
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

                        <td className="px-4 py-4 text-right text-base font-semibold text-slate-900">Ksh {transaction.amount}</td>

                        <td className="whitespace-nowrap px-4 py-4 text-right">
                            <button 
                               type="button"
                               className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                               onClick={() => setSelectedTransaction(transaction)}
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                className="ml-2 inline-flex items-center rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                onClick={() => setTransactionToDelete(transaction)}
                            >
                                Delete
                            </button>
                        </td>
                        </tr>
                    ))}
                </tbody>
            </table>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 p-4">

    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
        Previous
    </button>

    {Array.from({ length: pagination.totalPages }, (_, index) => {
        const pageNumber = index + 1

        return (
            <button
                type="button"
                key={pageNumber}
                onClick={() => fetchTransactions(pageNumber)}
                className={pagination.currentPage === pageNumber
                    ? 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white'
                    : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'}
            >
                {pageNumber}
            </button>
        )
    })}

    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage + 1)}
        disabled={pagination.currentPage >= pagination.totalPages}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
        Next
    </button>

</div>
        </div>
    )
}

export default AdminTransactions
