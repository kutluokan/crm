import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

interface Customer {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  status: 'active' | 'inactive' | 'lead';
  assigned_to: {
    full_name: string;
  };
}

const statusColors = {
  active: 'success',
  inactive: 'error',
  lead: 'warning',
} as const;

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
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
          assigned_to:users!assigned_to (
            full_name
          )
        `);

      if (error) throw error;

      // Transform the data to match our Customer type
      const typedData = data.map(item => ({
        ...item,
        assigned_to: Array.isArray(item.assigned_to) ? item.assigned_to[0] : item.assigned_to
      })) as Customer[];

      setCustomers(typedData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const displayedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* TODO: Implement create customer */}}
        >
          New Customer
        </Button>
      </Stack>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <TextField
            label="Search"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 300 }}
            placeholder="Search by name, email, company, or phone"
          />
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Account Manager</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.company_name || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{customer.email}</Typography>
                    {customer.phone && (
                      <Typography variant="caption" color="text.secondary">
                        {customer.phone}
                      </Typography>
                    )}
                  </TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
} 