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
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Add } from '@mui/icons-material';

interface AuthUser {
  id: string;
  email: string;
  raw_user_meta_data: {
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface Employee {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  role: 'support' | 'admin' | 'manager';
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'lead';
  notes: string | null;
  assigned_to: string | null;
}

export default function UserList() {
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    status: 'lead' as const,
  });
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Query to get all auth users
  const { data: authUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['auth-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      return data as AuthUser[];
    },
  });

  // Query to get all employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Query to get all customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          assigned_to:employees!assigned_to (
            id,
            full_name
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data as (Customer & { assigned_to: Pick<Employee, 'id' | 'full_name'> | null })[];
    },
  });

  // Convert auth user to employee
  const handleConvertToEmployee = async (user: AuthUser, role: Employee['role'] = 'support') => {
    try {
      const { error } = await supabase
        .from('employees')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.raw_user_meta_data.full_name || user.email,
            avatar_url: user.raw_user_meta_data.avatar_url,
            role: role,
          },
        ]);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error: any) {
      console.error('Error converting user to employee:', error);
      setError(error.message);
    }
  };

  // Remove employee status
  const handleRemoveEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error: any) {
      console.error('Error removing employee:', error);
      setError(error.message);
    }
  };

  // Create new customer
  const handleCreateCustomer = async () => {
    try {
      const { error } = await supabase
        .from('customers')
        .insert([newCustomer]);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setNewCustomer({
        name: '',
        email: '',
        company_name: '',
        phone: '',
        status: 'lead',
      });
      setCustomerDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      setError(error.message);
    }
  };

  const isEmployee = (userId: string) => {
    return employees.some(emp => emp.id === userId);
  };

  const getEmployeeData = (userId: string) => {
    return employees.find(emp => emp.id === userId);
  };

  const roleColors = {
    admin: 'error',
    manager: 'warning',
    support: 'info',
  } as const;

  const statusColors = {
    active: 'success',
    inactive: 'error',
    lead: 'warning',
  } as const;

  // Add isCustomer helper
  const isCustomer = (userId: string) => {
    return customers.some(customer => customer.email === authUsers.find(u => u.id === userId)?.email);
  };

  // Add getCustomerData helper
  const getCustomerData = (userId: string) => {
    const user = authUsers.find(u => u.id === userId);
    return user ? customers.find(customer => customer.email === user.email) : null;
  };

  // Convert auth user to customer
  const handleConvertToCustomer = async (user: AuthUser, status: Customer['status'] = 'lead') => {
    try {
      const { error } = await supabase
        .from('customers')
        .insert([{
          name: user.raw_user_meta_data.full_name || user.email,
          email: user.email,
          status: status,
        }]);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error: any) {
      console.error('Error converting user to customer:', error);
      setError(error.message);
    }
  };

  // Remove customer status
  const handleRemoveCustomer = async (email: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('email', email);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error: any) {
      console.error('Error removing customer:', error);
      setError(error.message);
    }
  };

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Typography variant="h5">Users</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="Employees" />
          <Tab label="Customers" />
        </Tabs>

        {tab === 0 ? (
          // Employees/Users Table
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Employee Status</TableCell>
                  <TableCell>Employee Role</TableCell>
                  <TableCell>Customer Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingUsers || isLoadingEmployees || isLoadingCustomers ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  authUsers.map((user) => {
                    const isEmployeeUser = isEmployee(user.id);
                    const employeeData = getEmployeeData(user.id);
                    const isCustomerUser = isCustomer(user.id);
                    const customerData = getCustomerData(user.id);

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={user.raw_user_meta_data.avatar_url || undefined}>
                              {(user.raw_user_meta_data.full_name || user.email).charAt(0)}
                            </Avatar>
                            {user.raw_user_meta_data.full_name || user.email}
                          </Stack>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={isEmployeeUser ? "Employee" : "Not Employee"}
                            color={isEmployeeUser ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {isEmployeeUser && employeeData && (
                            <Chip
                              label={employeeData.role}
                              size="small"
                              color={roleColors[employeeData.role]}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {isCustomerUser && customerData && (
                            <Chip
                              label={customerData.status}
                              size="small"
                              color={statusColors[customerData.status]}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {isEmployeeUser ? (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleRemoveEmployee(user.id)}
                              >
                                Remove Employee
                              </Button>
                            ) : (
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value=""
                                  displayEmpty
                                  onChange={(e) => handleConvertToEmployee(user, e.target.value as Employee['role'])}
                                >
                                  <MenuItem value="" disabled>
                                    Make Employee
                                  </MenuItem>
                                  <MenuItem value="support">Support</MenuItem>
                                  <MenuItem value="manager">Manager</MenuItem>
                                  <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                            {isCustomerUser ? (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleRemoveCustomer(user.email)}
                              >
                                Remove Customer
                              </Button>
                            ) : (
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value=""
                                  displayEmpty
                                  onChange={(e) => handleConvertToCustomer(user, e.target.value as Customer['status'])}
                                >
                                  <MenuItem value="" disabled>
                                    Make Customer
                                  </MenuItem>
                                  <MenuItem value="lead">Lead</MenuItem>
                                  <MenuItem value="active">Active</MenuItem>
                                  <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          // Customers Table
          <Box>
            <Stack direction="row" justifyContent="flex-end" mb={2}>
              <Button
                variant="contained"
                onClick={() => setCustomerDialogOpen(true)}
                startIcon={<Add />}
              >
                Add Customer
              </Button>
            </Stack>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingCustomers ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.company_name || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={customer.status}
                            size="small"
                            color={statusColors[customer.status]}
                          />
                        </TableCell>
                        <TableCell>
                          {customer.assigned_to?.full_name || 'Unassigned'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Stack>

      {/* Add Customer Dialog */}
      <Dialog 
        open={customerDialogOpen} 
        onClose={() => setCustomerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={newCustomer.name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              label="Company Name"
              fullWidth
              value={newCustomer.company_name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, company_name: e.target.value }))}
            />
            <TextField
              label="Phone"
              fullWidth
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newCustomer.status}
                label="Status"
                onChange={(e) => setNewCustomer(prev => ({ ...prev, status: e.target.value as Customer['status'] }))}
              >
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCustomer} variant="contained">
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 