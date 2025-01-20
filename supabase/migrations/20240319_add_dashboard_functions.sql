-- Function to get tickets grouped by priority
CREATE OR REPLACE FUNCTION get_tickets_by_priority(start_date timestamp with time zone)
RETURNS TABLE (priority text, count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.priority, COUNT(*)::bigint
  FROM tickets t
  WHERE t.created_at >= start_date
  GROUP BY t.priority
  ORDER BY t.priority;
END;
$$;

-- Function to get tickets grouped by status
CREATE OR REPLACE FUNCTION get_tickets_by_status(start_date timestamp with time zone)
RETURNS TABLE (status text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.status, COUNT(*)::bigint
  FROM tickets t
  WHERE t.created_at >= start_date
  GROUP BY t.status
  ORDER BY t.status;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_tickets_by_priority(timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tickets_by_status(timestamp with time zone) TO authenticated; 