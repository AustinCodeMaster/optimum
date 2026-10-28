-- 1. expense: new columns
ALTER TABLE expense
  ADD COLUMN request_id CHAR(36) NULL,
  ADD COLUMN updated_at DATETIME NULL,
  ADD COLUMN updated_by INT NULL,
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN deleted_by INT NULL,
  ADD COLUMN delete_reason VARCHAR(255) NULL,
  ADD UNIQUE KEY uq_expense_request (request_id);

-- 2. received: the same columns
ALTER TABLE received
  ADD COLUMN request_id CHAR(36) NULL,
  ADD COLUMN updated_at DATETIME NULL,
  ADD COLUMN updated_by INT NULL,
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN deleted_by INT NULL,
  ADD COLUMN delete_reason VARCHAR(255) NULL,
  ADD UNIQUE KEY uq_received_request (request_id);

-- 3. audit_log: history of edits and deletes
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity ENUM('received', 'expense') NOT NULL,
  entity_id INT NOT NULL,
  action ENUM('edit', 'delete') NOT NULL,
  changed_by INT NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  reason VARCHAR(255) NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. history view: same columns as before, but hide deleted rows
CREATE OR REPLACE VIEW transaction_history AS
SELECT received_id AS transaction_id, 'received' AS type,
       amount, date_received AS transaction_date, created_at,
       patient_name, doctor_name, lab_number, payment_method,
       receipt_number, mpesa_transaction_number, received_type,
       NULL AS expenditure_type, NULL AS description,
       NULL AS destination, NULL AS receipt_id, user_id
FROM received
WHERE deleted_at IS NULL
UNION ALL
SELECT expense_id, 'expense',
       amount, date_of_expense, created_at,
       NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       expenditure_type, description, destination, receipt_id, user_id
FROM expense
WHERE deleted_at IS NULL;