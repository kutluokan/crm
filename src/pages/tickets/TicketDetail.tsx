import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import useAuth from '../../hooks/useAuth';

interface DetailedTicket {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer: {
    id: string;
    name: string;
    email: string;
    company_name: string;
  };
  assigned_to: {
    id: string;
    full_name: string;
  } | null;
  created_by: {
    full_name: string;
  };
}

const statusColors = {
  open: 'error',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
} as const;

const priorityColors = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
} as const;

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<DetailedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string }>>([]);

  useEffect(() => {
    fetchTicket();
    fetchUsers();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          created_at,
          title,
          description,
          status,
          priority,
          customer:customers!customer_id (
            id,
            name,
            email,
            company_name
          ),
          assigned_to:users!assigned_to (
            id,
            full_name
          ),
          created_by:users!created_by (
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTicket();
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: userId || null })
        .eq('id', id);

      if (error) throw error;
      fetchTicket();
    } catch (error) {
      console.error('Error updating ticket assignee:', error);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!ticket) return <Alert severity="error">Ticket not found</Alert>;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/tickets')}
        sx={{ mb: 3 }}
      >
        Back to Tickets
      </Button>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                {ticket.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created on {format(new Date(ticket.created_at), 'PPP')} by{' '}
                {ticket.created_by.full_name}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label={ticket.status}
                color={statusColors[ticket.status]}
              />
              <Chip
                label={ticket.priority}
                color={priorityColors[ticket.priority]}
              />
            </Stack>
          </Stack>

          <Divider />

          {/* Customer Information */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Customer Details
            </Typography>
            <Typography variant="body1">{ticket.customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {ticket.customer.email}
            </Typography>
            {ticket.customer.company_name && (
              <Typography variant="body2" color="text.secondary">
                {ticket.customer.company_name}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Ticket Controls */}
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={ticket.status}
                label="Status"
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Assigned To</InputLabel>
              <Select
                value={ticket.assigned_to?.id || ''}
                label="Assigned To"
                onChange={(e) => handleAssigneeChange(e.target.value)}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          {/* Description */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {ticket.description}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
} 