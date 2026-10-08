import { useState, useEffect } from 'react'
import '../pages/Transactions.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
    useEffect(() => {
        fetchTransactions(1)
    }, [])
    
    function clearFilters() {
        setSearch('')
        setType('')
        setPaymentCategory('')
        setStartDate('')
        setEndDate('')

        const token = localStorage.getItem('token')

        fetch('http://localhost:3000/api/transactions?page=1', {
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
    //This formatDate function is to convert the transaction date into the YYY-MM-DD format that the database expects
    function formatDate(dateValue) {
    const date = new Date(dateValue)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}
    async function handleSaveEdit(e) {
        e.preventDefault()

        const token = localStorage.getItem('token')

        let url //holds the backend endpoint we want to send the PATCH request to
        let body  //holds the transaction data we want to send

        if (selectedTransaction.type === 'received') {
            url = `http://localhost:3000/api/received/${selectedTransaction.transaction_id}`

            body = {
                 // Send received_type because the backend requires it
                 received_type: selectedTransaction.received_type,
                 // Patient details are only required for patient payments
                 // Owner funding does not have patient, doctor, or lab details
                 patient_name: selectedTransaction.received_type === 'patient_payment'
                     ? selectedTransaction.patient_name
                     : null,
                 doctor_name: selectedTransaction.received_type === 'patient_payment'
                     ? selectedTransaction.doctor_name
                     : null,
                 lab_number: selectedTransaction.received_type === 'patient_payment'
                     ? selectedTransaction.lab_number
                     : null,
                 amount: Number(selectedTransaction.amount),
                 payment_method: selectedTransaction.payment_method,

                 receipt_number:
                    selectedTransaction.payment_method === 'cash'
                    ? selectedTransaction.receipt_number
                    :null,
                
                mpesa_transaction_number:
                    selectedTransaction.payment_method === 'mpesa'
                    ? selectedTransaction.mpesa_transaction_number
                    :null,
                
                date_received: formatDate(selectedTransaction.transaction_date)
            }
        } else {
            url = `http://localhost:3000/api/expense/${selectedTransaction.transaction_id}`

            body = {
            amount: Number(selectedTransaction.amount),
            description: selectedTransaction.description,
            expenditure_type: selectedTransaction.expenditure_type,

            destination:
                selectedTransaction.expenditure_type === 'transport'
                    ? selectedTransaction.destination
                    : null,

            receipt_id:
                selectedTransaction.expenditure_type === 'supplies' ||
                selectedTransaction.expenditure_type === 'other'
                    ? selectedTransaction.receipt_id || null
                    : null,

            date_of_expense: formatDate(selectedTransaction.transaction_date)
           }
        }

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        })

        const data = await response.json()

        if (response.ok) {
            alert('Transaction updated successfully')

            setSelectedTransaction(null)

            fetchTransactions(pagination.currentPage)

            onTransactionUpdated()
        } else {
            alert(data.message)
        }
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

        const response = await fetch(
            `http://localhost:3000/api/statement?${params.toString()}`,
             {
                headers: {
                    Authorization: `Bearer ${token}`
                }
             }
        )
        const data = await response.json()

        if (!response.ok) {
            alert(data.message)
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
            {selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-transaction-title"
                        className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
                    >
                        {selectedTransaction && selectedTransaction.type === 'received' && (
                            <form
                                className="grid grid-cols-1 gap-5 md:grid-cols-2"
                                onSubmit={handleSaveEdit}
                            >
                                <h3 id="edit-transaction-title" className="border-b border-slate-200 pb-4 text-xl font-bold text-slate-900 md:col-span-2">Edit Received Transaction</h3>

                                {/* Keep the received type read-only while editing transaction details */}
                                <div className="md:col-span-2">
                                    <label htmlFor="edit-received-received-type" className="mb-2 block text-sm font-semibold text-slate-700">Received Type</label>
                                    <input
                                        id="edit-received-received-type"
                                        className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-500 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        type="text"
                                        value={selectedTransaction.received_type === 'patient_payment'
                                            ? 'Patient Payment'
                                            : 'Owner Funding'}
                                        readOnly
                                    />
                                </div>

                                {/* Show patient fields only when editing a patient payment */}
                                {selectedTransaction.received_type === 'patient_payment' && (
                                    <>
                                        <div>
                                            <label htmlFor="edit-received-patient-name" className="mb-2 block text-sm font-semibold text-slate-700">Patient Name</label>
                                            <input
                                                id="edit-received-patient-name"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                type="text"
                                                value={selectedTransaction.patient_name || ''}
                                                onChange={(e) =>
                                                    setSelectedTransaction({
                                                        ...selectedTransaction,
                                                        patient_name: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="edit-received-doctor-name" className="mb-2 block text-sm font-semibold text-slate-700">Doctor Name</label>
                                            <input
                                                id="edit-received-doctor-name"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                type="text"
                                                value={selectedTransaction.doctor_name || ''}
                                                onChange={(e) =>
                                                    setSelectedTransaction({
                                                        ...selectedTransaction,
                                                        doctor_name: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="edit-received-lab-number" className="mb-2 block text-sm font-semibold text-slate-700">Lab Number</label>
                                            <input
                                                id="edit-received-lab-number"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                type="text"
                                                value={selectedTransaction.lab_number || ''}
                                                onChange={(e) =>
                                                    setSelectedTransaction({
                                                        ...selectedTransaction,
                                                        lab_number: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Received transaction amounts must be positive */}
                                <div>
                                    <label htmlFor="edit-received-amount" className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
                                    <input
                                        id="edit-received-amount"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        type="number"
                                        min={1}
                                        value={selectedTransaction.amount}
                                        onChange={(e) =>
                                            setSelectedTransaction({
                                                ...selectedTransaction,
                                                amount: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="edit-received-payment-method" className="mb-2 block text-sm font-semibold text-slate-700">Payment Method</label>
                                    <select
                                        id="edit-received-payment-method"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        value={selectedTransaction.payment_method}
                                        onChange={(e) =>
                                            setSelectedTransaction({
                                                ...selectedTransaction,
                                                payment_method: e.target.value
                                            })
                                        }
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="mpesa">M-Pesa</option>
                                    </select>
                                </div>

                                {selectedTransaction.payment_method === 'cash' && (
                                    <>
                                        <div>
                                            <label htmlFor="edit-received-receipt-number" className="mb-2 block text-sm font-semibold text-slate-700">Receipt Number</label>
                                            <input
                                                id="edit-received-receipt-number"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                type="text"
                                                value={selectedTransaction.receipt_number || ''}
                                                onChange={(e) =>
                                                    setSelectedTransaction({
                                                        ...selectedTransaction,
                                                        receipt_number: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedTransaction.payment_method === 'mpesa' && (
                                    <>
                                        <div>
                                            <label htmlFor="edit-received-m-pesa-transaction-number" className="mb-2 block text-sm font-semibold text-slate-700">M-Pesa Transaction Number</label>
                                            <input
                                                id="edit-received-m-pesa-transaction-number"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                type="text"
                                                value={selectedTransaction.mpesa_transaction_number || ''}
                                                onChange={(e) =>
                                                    setSelectedTransaction({
                                                        ...selectedTransaction,
                                                        mpesa_transaction_number: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="edit-received-date" className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                                    <input
                                        id="edit-received-date"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        type="date"
                                        value={formatDate(selectedTransaction.transaction_date)}
                                        onChange={(e) =>
                                            setSelectedTransaction({
                                                ...selectedTransaction,
                                                transaction_date: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end md:col-span-2">
                                    <button type="submit" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                                        Save Changes
                                    </button>

                                    <button
                                        type="button"
                                        className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        onClick={() => setSelectedTransaction(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                        {selectedTransaction && selectedTransaction.type === 'expense' && (
                            <form
                                className="grid grid-cols-1 gap-5 md:grid-cols-2"
                                onSubmit={handleSaveEdit}
                            >
                                <h3 id="edit-transaction-title" className="border-b border-slate-200 pb-4 text-xl font-bold text-slate-900 md:col-span-2">Edit Expense</h3>

                                <div>
                                    <label htmlFor="edit-expense-amount" className="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
                                    <input
                                        id="edit-expense-amount"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        type="number"
                                        value={selectedTransaction.amount}
                                        onChange={(e) =>
                                            setSelectedTransaction({
                                                ...selectedTransaction,
                                                amount: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="edit-expense-description" className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                                    <input
                                        id="edit-expense-description"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        type="text"
                                        value={selectedTransaction.description || ''}
                                        onChange={(e) =>
                                            setSelectedTransaction({
                                                ...selectedTransaction,
                                                description: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit-expense-expense-type" className="mb-2 block text-sm font-semibold text-slate-700">Expense Type</label>
                                    <select
                                        id="edit-expense-expense-type"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        value={selectedTransaction.expenditure_type}
                                        onChange={(e) =>
                                            setSelectedTransaction({
                                                ...selectedTransaction,
                                                expenditure_type: e.target.value
                                            })
                                        }
                                    >
                                        <option value="transport">Transport</option>
                                        <option value="supplies">Supplies</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {selectedTransaction.expenditure_type === 'transport' && (
                                    <>
                                        <div>
                                            <label htmlFor="edit-expense-destination" className="mb-2 block text-sm font-semibold text-slate-700">Destination</label>
                                            <input
                                                id="edit-expense-destination"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                type="text"
                                                value={selectedTransaction.destination || ''}
                                                onChange={(e) =>
                                                    setSelectedTransaction({
                                                        ...selectedTransaction,
                                                        destination: e.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {(selectedTransaction.expenditure_type === 'supplies' ||
                                  selectedTransaction.expenditure_type === 'other') && (
                                    <>
                                        <div>
                                            <label htmlFor="edit-expense-receipt-id" className="mb-2 block text-sm font-semibold text-slate-700">Receipt ID</label>
                                            <input
                                                id="edit-expense-receipt-id"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                type="text"
                                                value={selectedTransaction.receipt_id || ''}
                                                onChange={(e) =>
                                                    setSelectedTransaction({
                                                        ...selectedTransaction,
                                                        receipt_id: e.target.value
                                                    })
                                                }
                                                required={selectedTransaction.expenditure_type === 'supplies'}
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="edit-expense-date" className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                                    <input
                                        id="edit-expense-date"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        type="date"
                                        value={formatDate(selectedTransaction.transaction_date)}
                                        onChange={(e) =>
                                            setSelectedTransaction({
                                                ...selectedTransaction,
                                                transaction_date: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end md:col-span-2">
                                    <button type="submit" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                                        Save Changes
                                    </button>

                                    <button
                                        type="button"
                                        className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        onClick={() => setSelectedTransaction(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
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
        disabled={pagination.currentPage === pagination.totalPages}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
        Next
    </button>

</div>
        </div>
    )
}

export default AdminTransactions