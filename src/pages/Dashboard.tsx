import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  CircularProgress,
  Stack,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';

interface Stats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  resolutionRate: number;
}

interface TicketsByPriority {
  priority: string;
  count: number;
}

interface TicketsByStatus {
  status: string;
  count: number;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<number>(7); // days

  // Fetch overall statistics
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['dashboardStats', timeRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), timeRange), 'yyyy-MM-dd');
      
      // Get total tickets
      const { count: totalTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      // Get open tickets
      const { count: openTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])
        .gte('created_at', startDate);

      // Get resolved tickets
      const { count: resolvedTickets } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('created_at', startDate);

      // Calculate resolution rate
      const resolutionRate = totalTickets ? ((resolvedTickets || 0) / totalTickets) * 100 : 0;

      // Calculate average response time (in hours)
      const { data: tickets } = await supabase
        .from('tickets')
        .select('created_at, resolved_at')
        .not('resolved_at', 'is', null)
        .gte('created_at', startDate);

      let avgResponseTime = 0;
      if (tickets && tickets.length > 0) {
        const totalResponseTime = tickets.reduce((acc, ticket) => {
          const created = new Date(ticket.created_at);
          const resolved = new Date(ticket.resolved_at);
          return acc + (resolved.getTime() - created.getTime());
        }, 0);
        avgResponseTime = (totalResponseTime / tickets.length) / (1000 * 60 * 60); // Convert to hours
      }

      return {
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        resolvedTickets: resolvedTickets || 0,
        avgResponseTime,
        resolutionRate
      };
    }
  });

  // Fetch tickets by priority
  const { data: ticketsByPriority, isLoading: priorityLoading } = useQuery<TicketsByPriority[]>({
    queryKey: ['ticketsByPriority', timeRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), timeRange), 'yyyy-MM-dd');
      const { data } = await supabase
        .rpc('get_tickets_by_priority', { start_date: startDate });
      return data || [];
    }
  });

  // Fetch tickets by status
  const { data: ticketsByStatus, isLoading: statusLoading } = useQuery<TicketsByStatus[]>({
    queryKey: ['ticketsByStatus', timeRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), timeRange), 'yyyy-MM-dd');
      const { data } = await supabase
        .rpc('get_tickets_by_status', { start_date: startDate });
      return data || [];
    }
  });

  const isLoading = statsLoading || priorityLoading || statusLoading;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Dashboard
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Total Tickets</Typography>
            <Typography variant="h4">{stats?.totalTickets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Open Tickets</Typography>
            <Typography variant="h4">{stats?.openTickets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Resolution Rate</Typography>
            <Typography variant="h4">{stats?.resolutionRate.toFixed(1)}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Avg Response Time</Typography>
            <Typography variant="h4">{stats?.avgResponseTime.toFixed(1)}h</Typography>
          </Paper>
        </Grid>

        {/* Tickets by Priority */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Tickets by Priority</Typography>
            <Stack spacing={1}>
              {ticketsByPriority?.map((item) => (
                <Stack key={item.priority} direction="row" justifyContent="space-between" alignItems="center">
                  <Chip 
                    label={item.priority} 
                    size="small"
                    color={
                      item.priority === 'urgent' ? 'error' :
                      item.priority === 'high' ? 'warning' :
                      item.priority === 'medium' ? 'info' : 'success'
                    }
                  />
                  <Typography>{item.count}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Tickets by Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Tickets by Status</Typography>
            <Stack spacing={1}>
              {ticketsByStatus?.map((item) => (
                <Stack key={item.status} direction="row" justifyContent="space-between" alignItems="center">
                  <Chip 
                    label={item.status} 
                    size="small"
                    color={
                      item.status === 'open' ? 'error' :
                      item.status === 'in_progress' ? 'warning' :
                      item.status === 'resolved' ? 'success' : 'default'
                    }
                  />
                  <Typography>{item.count}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 