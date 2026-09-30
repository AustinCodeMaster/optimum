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
                 patient_name: selectedTransaction.patient_name,
                 doctor_name: selectedTransaction.doctor_name,
                 lab_number: selectedTransaction.lab_number,
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
<div>
            <h2>Transactions</h2>

            <div className="transaction-filters">

    <input
        type="text"
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
    />

    <select
        value={type}
        onChange={(e) => setType(e.target.value)}
    >
        <option value="">All Transactions</option>
        <option value="received">Received</option>
        <option value="expense">Expense</option>
    </select>

    <select
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
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
    />

    <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
    />

    <button
        type="button"
        onClick={() => fetchTransactions(1)}
    >
        Filter
    </button>

    <button
        type="button"
        onClick={clearFilters}
    >
        Clear
    </button>
    <button
       type="button"
        onClick={generateStatement}
    >
        Generate Statement
    </button>

</div>
   {selectedTransaction && selectedTransaction.type === 'received' && (
    <form
        className="edit-transaction-form"
        onSubmit={handleSaveEdit}
    >
        <h3>Edit Received Payment</h3>

        <label>Patient Name</label>
        <input
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

        <label>Doctor Name</label>
        <input
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

        <label>Lab Number</label>
        <input
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

        <label>Amount</label>
        <input
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

        <label>Payment Method</label>
        <select
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

        {selectedTransaction.payment_method === 'cash' && (
            <>
                <label>Receipt Number</label>
                <input
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
            </>
        )}

        {selectedTransaction.payment_method === 'mpesa' && (
            <>
                <label>M-Pesa Transaction Number</label>
                <input
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
            </>
        )}

        <label>Date</label>
        <input
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

        <button type="submit">
            Save Changes
        </button>

        <button
            type="button"
            onClick={() => setSelectedTransaction(null)}
        >
            Cancel
        </button>
    </form>
)}
{selectedTransaction && selectedTransaction.type === 'expense' && (
    <form
        className="edit-transaction-form"
        onSubmit={handleSaveEdit}
    >
        <h3>Edit Expense</h3>

        <label>Amount</label>
        <input
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

        <label>Description</label>
        <input
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

        <label>Expense Type</label>
        <select
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

        {selectedTransaction.expenditure_type === 'transport' && (
            <>
                <label>Destination</label>
                <input
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
            </>
        )}

        {(selectedTransaction.expenditure_type === 'supplies' ||
          selectedTransaction.expenditure_type === 'other') && (
            <>
                <label>Receipt ID</label>
                <input
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
            </>
        )}

        <label>Date</label>
        <input
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

        <button type="submit">
            Save Changes
        </button>

        <button
            type="button"
            onClick={() => setSelectedTransaction(null)}
        >
            Cancel
        </button>
    </form>
)}
            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Details</th>
                        <th>Reference</th>
                        <th>Payment / Category</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {transactions.map(transaction => (
                        <tr key={`${transaction.type}-${transaction.transaction_id}`}>
                          <td>
                            {new Date(transaction.transaction_date).toLocaleDateString(
                                'en-GB',
                                {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                }
                            )}
                          </td>
                          <td>{transaction.type}</td>
                          <td>
                               {transaction.type === 'received' ? (
                                <>
                                   {transaction.patient_name}
                                   <br/>
                                   <small>Lab No: {transaction.lab_number}</small>
                                </>
                               ) : (
                                 <>
                                    {transaction.description}
                                    {transaction.destination && (
                                        <>
                                            <br />
                                            <small>{transaction.destination}</small>
                                        </>
                                    )}
                                 </>
                               )}
                          </td>
                           <td>
                            {transaction.receipt_number ||
                             transaction.mpesa_transaction_number ||
                             transaction.receipt_id ||
                             '-'}
                        </td>

                        <td>
                            {transaction.type === 'received'
                                ? transaction.payment_method
                                : transaction.expenditure_type}
                        </td>

                        <td>Ksh {transaction.amount}</td>

                        <td>
                            <button 
                               type="button"
                               onClick={() => setSelectedTransaction(transaction)}
                            >
                                Edit
                            </button>
                        </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination">

    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
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
            >
                {pageNumber}
            </button>
        )
    })}

    <button
        type="button"
        onClick={() => fetchTransactions(pagination.currentPage + 1)}
        disabled={pagination.currentPage === pagination.totalPages}
    >
        Next
    </button>

</div>
        </div>
    )
}

export default AdminTransactions