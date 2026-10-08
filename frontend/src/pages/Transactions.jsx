import Sidebar from '../components/Sidebar.jsx'
import { useState, useEffect} from 'react'
function Transactions() {
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
        
        fetch(`http://localhost:3000/api/transactions?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
           .then(response => response.json())
           .then(data => {
                setTransactions(data.data)
                setPagination(data.pagination)
           })
    }  
    function clearFilters() {
        setSearch('')
        setType('')
        setPaymentCategory('')
        setStartDate('')
        setEndDate('')

        const token = localStorage.getItem('token')

        fetch('http://localhost:3000/api/transactions', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
          .then(response => response.json())
          .then(data => {
            setTransactions(data.data)
            setPagination(data.pagination)
          })
    }    
    useEffect(() => {
        const token = localStorage.getItem('token')

        fetch('http://localhost:3000/api/transactions', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response=> response.json())
            .then(data => {
                setTransactions(data.data)
                setPagination(data.pagination)
            })
    },[])
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            
            <main className="min-w-0 flex-1 p-6 lg:p-8">
                <div className="mb-6">
                      <h1 className="text-3xl font-bold text-slate-900">
                        Transactions
                      </h1>
                      <p className="mt-1 text-sm text-slate-500" >
                        View and search all petty cash Transactions
                      </p>
                </div>
                 <div className="mb-6 rounded-2xl border-slate-200 bg-white p-6 shadow-sm">

    
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
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
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />

    <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
                  </div>
    <div className="mt-4 flex justify-end gap-3">
        <button 
        type="button"
         onClick={ () => fetchTransactions(1)}
         className="rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
                 <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                                
                            </tr>
                        ))}
                    </tbody>
                 </table>
                    </div>
                 </div>


                 <div className="flex items-center justify-center gap-2 border-t border-slate-200 p-4">

    {/* Previous button goes to the page before the current page */}
    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
        Previous
    </button>

    {/* Creates one button for every available page */}
    {Array.from({ length: pagination.totalPages }, (_, index) => {

        // index starts at 0, so add 1 to get page numbers 1, 2, 3...
        const pageNumber = index + 1

        return (
            <button
                type="button"
                key={pageNumber}
                // when this page number is clicked, fetch that page
                onClick={() => fetchTransactions(pageNumber)}
                className={
                   pagination.currentPage === pageNumber
                      ? 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white'
                      : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
    }
            >
                {pageNumber}
            </button>
        )
    })}

    {/* Next button goes to the page after the current page */}
    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage + 1)}
        // disable Next if we are already on the last page
        disabled={pagination.currentPage === pagination.totalPages}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"

    >
        Next
    </button>

</div>
            </main>
        </div>
    )
}

export default Transactions