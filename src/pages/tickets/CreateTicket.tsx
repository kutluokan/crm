import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

interface Customer {
  id: string;
  name: string;
  company_name: string | null;
}

interface NewTicket {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id: string;
}

export default function CreateTicket() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<NewTicket>({
    title: '',
    description: '',
    priority: 'medium',
    customer_id: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company_name')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get the employee record for the current user
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', userData.user.id)
        .limit(1)
        .maybeSingle();

      if (employeeError) throw employeeError;
      if (!employeeData) throw new Error('Employee record not found');

      const { error: insertError } = await supabase
        .from('tickets')
        .insert([
          {
            ...ticket,
            created_by: employeeData.id,
            status: 'open',
          },
        ]);

      if (insertError) throw insertError;

      navigate('/tickets');
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      setError(error?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof NewTicket, value: string) => {
    setTicket(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box p={3}>
      <Paper elevation={3}>
        <Box p={3}>
          <Stack spacing={3}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              mb={2}
            >
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/tickets')}
              >
                Back
              </Button>
              <Typography variant="h6">Create New Ticket</Typography>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Title"
                  required
                  fullWidth
                  value={ticket.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />

                <TextField
                  label="Description"
                  required
                  fullWidth
                  multiline
                  rows={4}
                  value={ticket.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />

                <FormControl fullWidth required>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={ticket.customer_id}
                    label="Customer"
                    onChange={(e) => handleChange('customer_id', e.target.value)}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.company_name ? `(${customer.company_name})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={ticket.priority}
                    label="Priority"
                    onChange={(e) => handleChange('priority', e.target.value as NewTicket['priority'])}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Ticket'}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
} 