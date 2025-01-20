-- Create a view to safely expose auth users
CREATE OR REPLACE VIEW public.auth_users AS
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at,
  last_sign_in_at,
  COALESCE(raw_user_meta_data->>'full_name', email) as display_name
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.auth_users TO authenticated;

-- Update the employees RLS policies
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can be viewed by authenticated users"
  ON public.employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Employees can be updated by admins"
  ON public.employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can be deleted by admins"
  ON public.employees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Employees can be inserted by admins"
  ON public.employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ); 