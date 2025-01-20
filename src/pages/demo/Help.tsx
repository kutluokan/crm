import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ExpandMore, ContactSupport, Send } from '@mui/icons-material';
import { supabase } from '../../lib/supabase';

export default function Help() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ticket, setTicket] = useState({
    title: '',
    description: '',
    priority: 'low' as 'low' | 'medium' | 'high',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Current user:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      });

      // Get or create customer record
      const { data: existingCustomers, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('email', user.email);

      if (customerError) throw customerError;

      let customerId;
      let customerName;

      if (!existingCustomers || existingCustomers.length === 0) {
        console.log('Creating new customer for:', user.email);
        // Create a new customer record
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email,
            email: user.email,
            status: 'active'
          })
          .select('id, name')
          .single();

        if (createError) {
          console.error('Error creating customer:', createError);
          throw createError;
        }
        if (!newCustomer) throw new Error('Failed to create customer record');
        
        console.log('New customer created:', newCustomer);
        customerId = newCustomer.id;
        customerName = newCustomer.name;
      } else {
        console.log('Found existing customer:', existingCustomers[0]);
        customerId = existingCustomers[0].id;
        customerName = existingCustomers[0].name;
      }

      console.log('Creating ticket with customer_id:', customerId);
      
      // Create the ticket
      const ticketData = {
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: 'open',
        customer_id: customerId,
        created_by: customerName
      };

      console.log('Ticket data:', ticketData);

      const { error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketData);

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        throw ticketError;
      }

      // Reset form and show success message
      setTicket({
        title: '',
        description: '',
        priority: 'low',
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Help Center (Demo)
      </Typography>

      <Stack spacing={3}>
        {/* FAQs Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Frequently Asked Questions
          </Typography>

          <Stack spacing={2}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>How do I get started?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Getting started is easy! Just follow these steps:
                  <ol>
                    <li>Complete your profile</li>
                    <li>Browse our documentation</li>
                    <li>Contact support if you need help</li>
                  </ol>
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>What support options are available?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  We offer multiple support channels:
                  <ul>
                    <li>24/7 Email Support</li>
                    <li>Live Chat (Business Hours)</li>
                    <li>Phone Support for Premium Customers</li>
                    <li>Community Forums</li>
                  </ul>
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>How do I contact support?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  You can create a support ticket using the form below. Our team will
                  respond as quickly as possible based on the ticket priority.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Paper>

        {/* Create Ticket Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactSupport /> Create Support Ticket
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Ticket created successfully! Our support team will respond shortly.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Title"
                fullWidth
                required
                value={ticket.title}
                onChange={(e) => setTicket(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of your issue"
              />

              <TextField
                label="Description"
                fullWidth
                required
                multiline
                rows={4}
                value={ticket.description}
                onChange={(e) => setTicket(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide detailed information about your issue"
              />

              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={ticket.priority}
                  label="Priority"
                  onChange={(e) => setTicket(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                >
                  <MenuItem value="low">Low - General questions or minor issues</MenuItem>
                  <MenuItem value="medium">Medium - Issues affecting work with workarounds</MenuItem>
                  <MenuItem value="high">High - Critical issues preventing work</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Box>
  );
} 