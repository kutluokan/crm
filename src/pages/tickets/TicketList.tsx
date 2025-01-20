import { useState } from 'react';
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
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useTickets } from '../../hooks/useTickets';
import NewTicketDialog from './NewTicketDialog';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

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
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const { data, isLoading, isError } = useTickets({
    page,
    rowsPerPage,
    searchTerm,
    status,
    priority,
  });

  const queryClient = useQueryClient();

  // Calculate current page based on data
  const currentPage = React.useMemo(() => {
    if (!data?.totalCount) return 0;
    const maxPage = Math.max(0, Math.ceil(data.totalCount / rowsPerPage) - 1);
    return Math.min(Math.max(0, page), maxPage);
  }, [data?.totalCount, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNewTicketClick = () => {
    setIsNewTicketOpen(true);
  };

  const handleNewTicketClose = () => {
    setIsNewTicketOpen(false);
  };

  const handleRowClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const getStatusColor = (status: keyof typeof statusColors) => {
    return statusColors[status] || 'default';
  };

  const getPriorityColor = (priority: keyof typeof priorityColors) => {
    return priorityColors[priority] || 'default';
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            label="Status"
            size="small"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'error.main' }}>
                    Error loading tickets. Please try again.
                  </TableCell>
                </TableRow>
              ) : data?.tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                data?.tickets.map((ticket) => (
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
                        color={getStatusColor(ticket.status as keyof typeof statusColors)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority}
                        size="small"
                        color={getPriorityColor(ticket.priority as keyof typeof priorityColors)}
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
          count={data?.totalCount || 0}
          page={currentPage}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      <NewTicketDialog
        open={isNewTicketOpen}
        onClose={handleNewTicketClose}
        onTicketCreated={() => {
          queryClient.invalidateQueries(['tickets']);
        }}
      />
    </Box>
  );
} 