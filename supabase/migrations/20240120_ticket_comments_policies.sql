-- Add policies for ticket comments
CREATE POLICY "Enable delete for comment owners" ON ticket_comments
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable update for comment owners" ON ticket_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT DELETE ON ticket_comments TO authenticated;
GRANT UPDATE ON ticket_comments TO authenticated; 