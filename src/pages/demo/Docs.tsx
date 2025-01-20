import {
  Box,
  Typography,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  Article,
  Book,
  Code,
  Assignment,
  PlayArrow,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function Docs() {
  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Typography variant="h5" gutterBottom>
          Documentation (Demo)
        </Typography>

        <Breadcrumbs>
          <MuiLink component={Link} to="/demo/docs" color="inherit">
            Documentation
          </MuiLink>
          <Typography color="text.primary">Getting Started</Typography>
        </Breadcrumbs>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Typography>
              Welcome to our documentation! Here you'll find everything you need to know
              about using our platform effectively.
            </Typography>

            <Box>
              <Typography variant="h6" gutterBottom>
                Quick Start Guide
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PlayArrow />
                  </ListItemIcon>
                  <ListItemText
                    primary="Getting Started"
                    secondary="A quick introduction to our platform"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Book />
                  </ListItemIcon>
                  <ListItemText
                    primary="Basic Concepts"
                    secondary="Learn about the core features"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Assignment />
                  </ListItemIcon>
                  <ListItemText
                    primary="Tutorials"
                    secondary="Step-by-step guides for common tasks"
                  />
                </ListItem>
              </List>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                API Documentation
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Code />
                  </ListItemIcon>
                  <ListItemText
                    primary="REST API"
                    secondary="Complete API reference"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Article />
                  </ListItemIcon>
                  <ListItemText
                    primary="SDK Documentation"
                    secondary="Client libraries and tools"
                  />
                </ListItem>
              </List>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                This is a demo of how customers would see the documentation section. 
                The actual documentation would be more comprehensive and include 
                detailed guides, API references, and examples.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
} 