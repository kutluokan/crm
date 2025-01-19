import { Box, Button, Container, Paper, Typography } from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import useAuth from '../hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

export default function Login() {
  const { signInWithGoogle, session } = useAuth()
  const location = useLocation()
  const from = location.state?.from?.pathname || "/"

  if (session) {
    return <Navigate to={from} replace />
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to CRM
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Please sign in to continue
          </Typography>
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
            size="large"
            sx={{ mt: 2 }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  )
} 