-- Enable RLS on all application tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS org_isolation ON organizations;
DROP POLICY IF EXISTS org_isolation ON users;
DROP POLICY IF EXISTS org_isolation ON assets;
DROP POLICY IF EXISTS org_isolation ON vulnerabilities;
DROP POLICY IF EXISTS org_isolation ON findings;
DROP POLICY IF EXISTS org_isolation ON audit_logs;

-- Organizations: users can see their own org
CREATE POLICY org_isolation ON organizations
  FOR ALL
  USING (id = current_setting('app.current_org_id', true)::text);

-- Users: users in the same org
CREATE POLICY org_isolation ON users
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id', true)::text);

-- Assets: scoped to org
CREATE POLICY org_isolation ON assets
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id', true)::text);

-- Vulnerabilities: scoped to org
CREATE POLICY org_isolation ON vulnerabilities
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id', true)::text);

-- Findings: scoped to org
CREATE POLICY org_isolation ON findings
  FOR ALL
  USING (organization_id = current_setting('app.current_org_id', true)::text);

-- Audit logs: scoped to org via finding relation or direct org field when added
-- For now, we link audit_logs to users; restrict by user's org via a subquery
CREATE POLICY org_isolation ON audit_logs
  FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE organization_id = current_setting('app.current_org_id', true)::text
    )
  );
