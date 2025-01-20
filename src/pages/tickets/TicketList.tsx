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
  IconButton,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import useAuth from '../../hooks/useAuth';
import { format } from 'date-fns';
import NewTicketDialog from './NewTicketDialog';

type Ticket = {
  id: string;
  created_at: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer: {
    name: string;
    email: string;
  };
  assigned_to: {
    full_name: string;
  } | null;
};

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

export default function TicketList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [page, rowsPerPage, statusFilter, priorityFilter, searchQuery]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // First, get the total count
      let countQuery = supabase
        .from('tickets')
        .select('id', { count: 'exact' });

      // Apply filters to count query
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        countQuery = countQuery.eq('priority', priorityFilter);
      }
      if (searchQuery) {
        countQuery = countQuery.ilike('title', `%${searchQuery}%`);
      }

      const { count: totalRecords, error: countError } = await countQuery;

      if (countError) {
        console.error('Error getting count:', countError);
        return;
      }

      setTotalCount(totalRecords || 0);

      // Then fetch the paginated data
      let query = supabase
        .from('tickets')
        .select(`
          id,
          created_at,
          title,
          status,
          priority,
          customer:customers!customer_id (
            name,
            email
          ),
          assigned_to:users!assigned_to (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .range(page * rowsPerPage, (page * rowsPerPage) + rowsPerPage - 1);

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }

      setTickets(data as Ticket[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNewTicketClick = () => {
    setIsNewTicketDialogOpen(true);
  };

  const handleNewTicketClose = () => {
    setIsNewTicketDialogOpen(false);
  };

  const handleTicketCreated = () => {
    fetchTickets();
  };

  const handleRowClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Tickets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewTicketClick}
        >
          New Ticket
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
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            label="Status"
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>
          <TextField
            select
            label="Priority"
            size="small"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Priority</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    onClick={() => handleRowClick(ticket.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{ticket.customer.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ticket.customer.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        size="small"
                        color={statusColors[ticket.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority}
                        size="small"
                        color={priorityColors[ticket.priority]}
                      />
                    </TableCell>
                    <TableCell>
                      {ticket.assigned_to?.full_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      <NewTicketDialog
        open={isNewTicketDialogOpen}
        onClose={handleNewTicketClose}
        onTicketCreated={handleTicketCreated}
      />
    </Box>
  );
} 