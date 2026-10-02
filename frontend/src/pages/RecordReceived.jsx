import Sidebar from '../components/Sidebar.jsx'
import {useState } from 'react'
import './RecordReceived.css'
function RecordReceived() {
    const [patientName, setPatientName] = useState('')
    const [doctorName, setDoctorName] = useState('')
    const [labNumber, setLabNumber] = useState('')
    const [amount, setAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [receiptNumber, setReceiptNumber] = useState('')
    const [mpesaTransactionNumber, setMpesaTransactionNumber] = useState('')
    const [dateReceived, setDateReceived] = useState('')
    const [receivedType, setReceivedType] = useState('patient_payment')
    /*
    Click Save Payment
      handleSubmit runs
      JWT is retrieved
      POST /api/received
      form data + JWT sent to backend
      backend validates it
      backend saves it to MariaDB
      success/error message appears
     */
    async function handleSubmit(e) {
        e.preventDefault()

        const token = localStorage.getItem('token')

        const response = await fetch('http://localhost:3000/api/received', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
               patient_name: receivedType === 'patient_payment' ? patientName : null,
               doctor_name: receivedType === 'patient_payment' ? doctorName : null,
               lab_number: receivedType === 'patient_payment' ? labNumber : null,

               amount: Number(amount),
               payment_method: paymentMethod,

               receipt_number:
               paymentMethod === 'cash' ? receiptNumber : null,

               mpesa_transaction_number:
               paymentMethod === 'mpesa' ? mpesaTransactionNumber : null,

               date_received: dateReceived,
               received_type: receivedType
                   })
                 })

        const data = await response.json()

        if (response.ok) {
            alert('Payment recorded successfully')
        }else {
            alert(data.message)
        }
    }
    return (
        <div className="dashboard-layout">
           <Sidebar />
            
            <div className="dashboard-content">
                <h1>Record Received Payment</h1>
                <p>Record a patient payment or owner funding</p>

                <form className="received-form" onSubmit={handleSubmit}>
                         <label>Received Type</label>
                         <select
                         value={receivedType}
                         onChange={(e) => setReceivedType(e.target.value)}
                         required
                         >
                          <option value="patient_payment">Patient Payment</option>
                           <option value="owner_funding">Owner Funding</option>
                          </select>
                       {receivedType === 'patient_payment' && (
                         <>
                            <label>Patient Name</label>
                    <input
                     type="text"
                     value={patientName}
                     onChange={(e) => setPatientName(e.target.value)}
                     required
                      />

                      <label>Doctor Name</label>
                      <input 
                     type="text" 
                     value={doctorName}
                     onChange={(e) => setDoctorName(e.target.value)}
                     required
                      />

                      <label>Lab Number</label>
                      <input 
                       type="text" 
                       value={labNumber}
                       onChange={(e) => setLabNumber(e.target.value)} 
                       required
                      />

                         </>
                       )}
                      <label>Amount</label>
                      <input 
                       type="number" 
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       min="1"
                       required
                      />

                      <label>Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        required
                      >
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="mpesa">Mpesa</option>
                      </select>
                      {paymentMethod === 'cash' && (
                        <>
                           <label>Receipt Number</label>
                           <input 
                            type="text"
                            value={receiptNumber} 
                            onChange={(e) => setReceiptNumber(e.target.value)}
                            required
                           />
                        </>
                      )}
                      {paymentMethod === 'mpesa' && (
                        <>
                           <label>Mpesa Transaction Number</label>
                           <input 
                            type="text" 
                            value={mpesaTransactionNumber}
                            onChange={(e) => setMpesaTransactionNumber(e.target.value)}
                            required
                           />
                        </>
                      )}

                      <label>Date Received</label>
                      <input 
                       type="date"
                       value={dateReceived} 
                       onChange={(e) => setDateReceived(e.target.value)}
                       required
                      />

                      <button type="submit">Save Payment</button>
                </form>
            </div>
        </div>
    )
}

export default  RecordReceived