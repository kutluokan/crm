import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  role: 'support' | 'admin' | 'manager';
}

interface NewEmployee {
  email: string;
  full_name: string;
  department: string;
  role: 'support' | 'admin' | 'manager';
}

export default function EmployeeList() {
  const [open, setOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    email: '',
    full_name: '',
    department: '',
    role: 'support',
  });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: employees, isLoading, error: queryError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      console.log('Fetching employees...');
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');
      
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      console.log('Fetched employees:', data);
      return data as Employee[];
    },
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
    setNewEmployee({
      email: '',
      full_name: '',
      department: '',
      role: 'support',
    });
  };

  const handleSubmit = async () => {
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmployee.email,
        password: Math.random().toString(36).slice(-12), // Generate a random password
        options: {
          data: {
            full_name: newEmployee.full_name,
          },
        },
      });

      if (authError) throw authError;

      // The employee record will be created automatically via the handle_new_user trigger
      // We just need to update the additional fields
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          department: newEmployee.department,
          role: newEmployee.role,
        })
        .eq('id', authData.user!.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['employees'] });
      handleClose();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      setError(error.message || 'Failed to create employee');
    }
  };

  const roleColors = {
    admin: 'error',
    manager: 'warning',
    support: 'info',
  } as const;

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Employees</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          New Employee
        </Button>
      </Stack>

      {queryError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading employees: {queryError.message}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !employees || employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={employee.avatar_url || undefined}>
                        {employee.full_name.charAt(0)}
                      </Avatar>
                      {employee.full_name}
                    </Stack>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.role}
                      size="small"
                      color={roleColors[employee.role]}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            <TextField
              label="Full Name"
              fullWidth
              value={newEmployee.full_name}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={newEmployee.email}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Department"
              fullWidth
              value={newEmployee.department}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newEmployee.role}
                label="Role"
                onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value as Employee['role'] }))}
              >
                <MenuItem value="support">Support</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 