import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import AuthProvider from './contexts/AuthContext'
import useAuth from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import TicketList from './pages/tickets/TicketList'
import TicketDetail from './pages/tickets/TicketDetail'
import CustomerList from './pages/customers/CustomerList'
import CustomerDetail from './pages/customers/CustomerDetail'
import CreateCustomer from './pages/customers/CreateCustomer'
import CreateTicket from './pages/tickets/CreateTicket'
import EmployeeList from './pages/employees/EmployeeList'
import { Box, CircularProgress, Typography } from '@mui/material'

// Create a new query client instance
const queryClient = new QueryClient()

function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

// Placeholder components - we'll create proper ones later
const Dashboard = () => (
  <Box>
    <Typography variant="h4">Dashboard</Typography>
    <Typography>Welcome to your CRM Dashboard</Typography>
  </Box>
)

function LoadingScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RequireAuth />}>
                <Route index element={<Dashboard />} />
                <Route path="tickets" element={<TicketList />} />
                <Route path="tickets/new" element={<CreateTicket />} />
                <Route path="tickets/:id" element={<TicketDetail />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/new" element={<CreateCustomer />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="employees" element={<EmployeeList />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
