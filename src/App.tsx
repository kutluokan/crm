import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { Box, Typography } from '@mui/material'

// Placeholder components - we'll create proper ones later
const Dashboard = () => (
  <Box>
    <Typography variant="h4">Dashboard</Typography>
    <Typography>Welcome to your CRM Dashboard</Typography>
  </Box>
)

const Tickets = () => (
  <Box>
    <Typography variant="h4">Tickets</Typography>
    <Typography>Your tickets will appear here</Typography>
  </Box>
)

const Customers = () => (
  <Box>
    <Typography variant="h4">Customers</Typography>
    <Typography>Your customer list will appear here</Typography>
  </Box>
)

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/customers" element={<Customers />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
