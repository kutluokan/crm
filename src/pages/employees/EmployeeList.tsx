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

export default function EmployeeList() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Users & Employees</Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoadingUsers || isLoadingEmployees ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              authUsers.map((user) => {
                const isEmployeeUser = isEmployee(user.id);
                const employeeData = getEmployeeData(user.id);

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
                        label={isEmployeeUser ? "Employee" : "User"}
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
                      {isEmployeeUser ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveEmployee(user.id)}
                        >
                          Remove Employee Status
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 