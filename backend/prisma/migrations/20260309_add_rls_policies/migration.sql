-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see their own record
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = current_user_id());

CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

-- Admins can see all users
CREATE POLICY users_select_admin ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_user_id()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Sessions table policies
-- Users can only see their own sessions
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY sessions_delete_own ON sessions
  FOR DELETE
  USING (user_id = current_user_id());

-- Patients table policies
-- Patients can see their own record
CREATE POLICY patients_select_own ON patients
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY patients_update_own ON patients
  FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Providers can see patients they have invoices for
CREATE POLICY patients_select_provider ON patients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.patient_id = patients.id
      AND i.provider_id IN (
        SELECT id FROM providers WHERE user_id = current_user_id()
      )
    )
  );

-- Providers table policies
-- Providers can see their own record
CREATE POLICY providers_select_own ON providers
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY providers_update_own ON providers
  FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Accounts table policies
-- Users can see their own accounts
CREATE POLICY accounts_select_own ON accounts
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY accounts_update_own ON accounts
  FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Invoices table policies
-- Patients can see their own invoices
CREATE POLICY invoices_select_patient ON invoices
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_user_id()
    )
  );

-- Providers can see invoices they created
CREATE POLICY invoices_select_provider ON invoices
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = current_user_id()
    )
  );

-- Providers can update their own invoices
CREATE POLICY invoices_update_provider ON invoices
  FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = current_user_id()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = current_user_id()
    )
  );

-- Invoice items policies
-- Users can see items for invoices they can access
CREATE POLICY invoice_items_select ON invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE patient_id IN (
        SELECT id FROM patients WHERE user_id = current_user_id()
      )
      OR provider_id IN (
        SELECT id FROM providers WHERE user_id = current_user_id()
      )
    )
  );

-- Payments table policies
-- Patients can see their own payments
CREATE POLICY payments_select_patient ON payments
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_user_id()
    )
  );

-- Providers can see payments for their invoices
CREATE POLICY payments_select_provider ON payments
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = current_user_id()
      )
    )
  );

-- Claims table policies
-- Patients can see their own claims
CREATE POLICY claims_select_patient ON claims
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = current_user_id()
    )
  );

-- Providers can see claims they submitted
CREATE POLICY claims_select_provider ON claims
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = current_user_id()
    )
  );

-- Audit logs policies
-- Users can see audit logs related to their account
CREATE POLICY audit_logs_select_own ON audit_logs
  FOR SELECT
  USING (user_id = current_user_id());

-- Admins can see all audit logs
CREATE POLICY audit_logs_select_admin ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_user_id()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Services table policies (read-only for patients/providers)
CREATE POLICY services_select ON services
  FOR SELECT
  USING (true);

-- Create helper function for current_user_id
CREATE OR REPLACE FUNCTION current_user_id() RETURNS text AS $$
  SELECT current_setting('app.current_user_id', true)::text;
$$ LANGUAGE SQL STABLE;

-- Create indexes for performance
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_claims_patient_id ON claims(patient_id);
CREATE INDEX idx_claims_provider_id ON claims(provider_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
