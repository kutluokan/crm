import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

// Use service role key for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const statuses = ['open', 'in_progress', 'resolved', 'closed'];
const priorities = ['low', 'medium', 'high', 'urgent'];

async function ensureTestCustomerExists() {
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('email', 'test.customer@example.com')
    .limit(1);

  if (!customers?.length) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer',
        email: 'test.customer@example.com',
        phone: '+1234567890',
        company_name: 'Test Company',
        status: 'active'
      })
      .select()
      .limit(1);

    if (error) {
      console.error('Error creating test customer:', error);
      throw error;
    }
    console.log('Created test customer');
    return data[0].id;
  }

  return customers[0].id;
}

async function ensureTestUserExists() {
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'test.user@example.com')
    .limit(1);

  if (!users?.length) {
    // Create the user in Supabase Auth with metadata
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test.user@example.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    console.log('Created auth user');

    // The trigger will automatically create the user in our users table
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the role since it's not handled by the trigger
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'support' })
      .eq('id', authUser.user.id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      throw updateError;
    }

    return authUser.user.id;
  }

  return users[0].id;
}

async function generateTestData() {
  try {
    // Ensure we have a test customer and user
    const customerId = await ensureTestCustomerExists();
    const userId = await ensureTestUserExists();

    // Generate 100 test tickets
    const testTickets = Array.from({ length: 100 }, (_, i) => ({
      title: `Test Ticket ${i + 1}`,
      description: `This is a test ticket ${i + 1} for performance testing`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      customer_id: customerId,
      created_by: userId, // Required field from schema
      assigned_to: Math.random() > 0.3 ? userId : null, // 70% of tickets assigned
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 90 days
    }));

    // Insert tickets in batches of 20
    for (let i = 0; i < testTickets.length; i += 20) {
      const batch = testTickets.slice(i, i + 20);
      const { error } = await supabase
        .from('tickets')
        .insert(batch);

      if (error) {
        console.error('Error inserting batch:', error);
        return;
      }
      console.log(`Inserted tickets ${i + 1} to ${i + batch.length}`);
    }

    console.log('Successfully generated test data');
  } catch (error) {
    console.error('Error generating test data:', error);
  }
}

generateTestData(); 