import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface DetailedCustomer {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  company_name: string | null;
  status: 'active' | 'inactive' | 'lead';
  notes: string | null;
  website: string | null;
  industry: string | null;
  address: string | null;
  assigned_to: {
    id: string;
    full_name: string;
  } | null;
  custom_fields: Record<string, any> | null;
}

interface User {
  id: string;
  full_name: string;
}

const statusColors = {
  active: 'success',
  inactive: 'error',
  lead: 'warning',
} as const;

export default function CustomerDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<DetailedCustomer | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Partial<DetailedCustomer>>({});

  useEffect(() => {
    fetchCustomer();
    fetchUsers();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      if (!id) return;

      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          created_at,
          name,
          email,
          phone,
          company_name,
          status,
          notes,
          website,
          industry,
          address,
          custom_fields,
          assigned_to:users!assigned_to (
            id,
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform the data to match our DetailedCustomer type
      const transformedData = {
        ...data,
        assigned_to: Array.isArray(data.assigned_to) ? data.assigned_to[0] : data.assigned_to
      } as DetailedCustomer;

      setCustomer(transformedData);
      setEditedFields({});
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Error loading customer details');
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

  const handleFieldChange = (field: keyof DetailedCustomer, value: any) => {
    setEditedFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!customer || Object.keys(editedFields).length === 0) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update(editedFields)
        .eq('id', customer.id);

      if (error) throw error;

      // Update local state
      setCustomer(prev => prev ? { ...prev, ...editedFields } : null);
      setEditedFields({});
    } catch (error) {
      console.error('Error updating customer:', error);
      setError('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box p={2}>
        <Alert severity="error">{error || 'Customer not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
        <Typography variant="h5" component="h1">
          Customer Details
        </Typography>
        {Object.keys(editedFields).length > 0 && (
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                {customer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created on {format(new Date(customer.created_at), 'PPP')}
              </Typography>
            </Box>
            <Chip
              label={customer.status}
              color={statusColors[customer.status]}
            />
          </Stack>

          <Divider />

          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={editedFields.name ?? customer.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <TextField
                label="Email"
                fullWidth
                value={editedFields.email ?? customer.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
              <TextField
                label="Phone"
                fullWidth
                value={editedFields.phone ?? customer.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editedFields.status ?? customer.status}
                  label="Status"
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="lead">Lead</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Divider />

          {/* Company Information */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Company Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Company Name"
                fullWidth
                value={editedFields.company_name ?? customer.company_name ?? ''}
                onChange={(e) => handleFieldChange('company_name', e.target.value)}
              />
              <TextField
                label="Industry"
                fullWidth
                value={editedFields.industry ?? customer.industry ?? ''}
                onChange={(e) => handleFieldChange('industry', e.target.value)}
              />
              <TextField
                label="Website"
                fullWidth
                value={editedFields.website ?? customer.website ?? ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
              />
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={editedFields.address ?? customer.address ?? ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Account Management */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Account Management
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Account Manager</InputLabel>
                <Select
                  value={editedFields.assigned_to?.id ?? customer.assigned_to?.id ?? ''}
                  label="Account Manager"
                  onChange={(e) => {
                    const userId = e.target.value;
                    const assignedUser = users.find(user => user.id === userId);
                    handleFieldChange('assigned_to', userId ? {
                      id: userId,
                      full_name: assignedUser?.full_name || ''
                    } : null);
                  }}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={4}
                value={editedFields.notes ?? customer.notes ?? ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
} 