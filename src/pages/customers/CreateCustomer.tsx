import { useState } from 'react';
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
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

interface NewCustomer {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  status: 'active' | 'inactive' | 'lead';
  notes?: string;
  website?: string;
  industry?: string;
  address?: string;
}

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<NewCustomer>({
    name: '',
    email: '',
    status: 'lead',
  });

  const handleFieldChange = (field: keyof NewCustomer, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;

      // Navigate to the customer detail page
      navigate(`/customers/${data.id}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Error creating customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
        <Typography variant="h5" component="h1">
          Create New Customer
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Name"
                required
                fullWidth
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <TextField
                label="Email"
                required
                fullWidth
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
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

          {/* Company Information */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Company Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Company Name"
                fullWidth
                value={formData.company_name || ''}
                onChange={(e) => handleFieldChange('company_name', e.target.value)}
              />
              <TextField
                label="Industry"
                fullWidth
                value={formData.industry || ''}
                onChange={(e) => handleFieldChange('industry', e.target.value)}
              />
              <TextField
                label="Website"
                fullWidth
                value={formData.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
              />
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={formData.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
              />
            </Stack>
          </Box>

          {/* Notes */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Additional Information
            </Typography>
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
            />
          </Box>

          <Box>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving || !formData.name || !formData.email}
            >
              {saving ? 'Creating...' : 'Create Customer'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
} 