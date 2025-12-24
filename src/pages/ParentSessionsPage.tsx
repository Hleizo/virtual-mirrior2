import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  keyframes,
} from '@mui/material';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { useNavigate } from 'react-router-dom';
import { getAllSessions } from '../services/api';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface Session {
  id: string;
  child_name: string;
  child_age: number;
  started_at?: string;
  session_type?: string;
}

const ParentSessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllSessions();
        setSessions(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 4,
            animation: `${fadeIn} 0.6s ease-out`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ color: '#667eea' }}
            >
              Back to Home
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FamilyRestroomIcon sx={{ fontSize: 48, color: '#667eea' }} />
            <Box>
              <Typography variant="h4" fontWeight={700} color="#333">
                Parent View - Session Results
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select a session to view your child's assessment results
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: 'white' }} />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* No Sessions */}
        {!loading && !error && sessions.length === 0 && (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 4,
            }}
          >
            <ChildCareIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No Sessions Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              There are no assessment sessions available yet.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/parent/child-info')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 4,
                py: 1.5,
              }}
            >
              Start New Assessment
            </Button>
          </Paper>
        )}

        {/* Sessions Grid */}
        {!loading && !error && sessions.length > 0 && (
          <Grid container spacing={3}>
            {sessions.map((session, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={session.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    animation: `${fadeIn} 0.6s ease-out`,
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ChildCareIcon sx={{ color: '#667eea' }} />
                      <Typography variant="h6" fontWeight={600}>
                        {session.child_name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Age: {session.child_age} years
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: '#999' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(session.started_at)}
                      </Typography>
                    </Box>
                    
                    {session.session_type && (
                      <Chip
                        label={session.session_type === 'initial' ? 'Initial Assessment' : 'Follow-up'}
                        size="small"
                        sx={{
                          background: session.session_type === 'initial' 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          color: 'white',
                        }}
                      />
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/parent/results/${session.id}`)}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                        },
                      }}
                    >
                      View Results
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ParentSessionsPage;
