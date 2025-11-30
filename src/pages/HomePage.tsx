import { Box, Button, Container, Typography, Paper, Stack, Card, CardContent, keyframes } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import FavoriteIcon from '@mui/icons-material/Favorite';

// Breathing animation for the icon
const breathe = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Pulse glow animation
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(25, 118, 210, 0.3), 0 0 40px rgba(25, 118, 210, 0.1); }
  50% { box-shadow: 0 0 30px rgba(25, 118, 210, 0.5), 0 0 60px rgba(25, 118, 210, 0.2); }
`;

// Wave background SVG component
const WaveBackground = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0,
      opacity: 0.08,
      pointerEvents: 'none',
    }}
  >
    <svg
      viewBox="0 0 1440 320"
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 'auto',
      }}
    >
      <path
        fill="#1976d2"
        fillOpacity="1"
        d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
  </Box>
);

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #e3f2fd 0%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <WaveBackground />
      
      <Container 
        maxWidth={false}
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          maxWidth: '1100px',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: { xs: 3, sm: 4, md: 5 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 3.5, lg: 4.5 },
              borderRadius: { xs: 4, md: 6 },
              textAlign: 'center',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 0 1px rgba(25, 118, 210, 0.1)',
              position: 'relative',
            }}
          >
            {/* Animated Icon */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: { xs: 2, md: 3 },
              }}
            >
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: `${breathe} 3s ease-in-out infinite, ${pulseGlow} 3s ease-in-out infinite`,
                  border: '2px solid rgba(25, 118, 210, 0.2)',
                }}
              >
                <MonitorHeartIcon
                  sx={{
                    fontSize: { xs: 36, sm: 42, md: 48, lg: 52 },
                    color: 'primary.main',
                  }}
                />
              </Box>
            </Box>

            {/* Title with Underline */}
            <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1976d2 0%, #667eea 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                  mb: 0.5,
                  position: 'relative',
                  display: 'inline-block',
                  px: { xs: 2, sm: 0 },
                }}
              >
                Virtual Mirror
              </Typography>
              <Box
                sx={{
                  height: { xs: 2, md: 2.5 },
                  width: { xs: 60, md: 75 },
                  background: 'linear-gradient(90deg, #1976d2 0%, #667eea 100%)',
                  borderRadius: 2,
                  mx: 'auto',
                  mt: 0.5,
                }}
              />
            </Box>

            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ 
                mb: { xs: 2.5, sm: 3, md: 3.5 }, 
                fontWeight: 500, 
                maxWidth: { xs: '100%', sm: 550 }, 
                mx: 'auto', 
                lineHeight: 1.5,
                fontSize: 'clamp(0.85rem, 2.2vw, 1.1rem)',
                px: { xs: 1, sm: 2 },
              }}
            >
              Early Detection of Motor Weakness in Children
            </Typography>

            {/* User Type Selection */}
            <Stack 
              spacing={{ xs: 2, md: 2.5 }} 
              sx={{ 
                maxWidth: { xs: '100%', md: 650 }, 
                mx: 'auto',
              }}
            >
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  borderRadius: { xs: 3, md: 4 },
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    transform: { xs: 'translateY(-4px)', md: 'translateY(-8px) scale(1.01)' },
                    boxShadow: '0 20px 40px rgba(25, 118, 210, 0.25)',
                    borderColor: 'primary.main',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(227, 242, 253, 0.5) 100%)',
                  },
                }}
                onClick={() => navigate('/parent/child-info')}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 } }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 2, sm: 2.5 }} 
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        p: { xs: 1.75, md: 2.25 },
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                      }}
                    >
                      <FamilyRestroomIcon sx={{ fontSize: { xs: 32, md: 38 }, color: 'white' }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
                      <Typography 
                        variant="h5" 
                        fontWeight={700} 
                        gutterBottom 
                        sx={{ 
                          color: 'text.primary',
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.35rem)',
                          mb: 0.5,
                        }}
                      >
                        Parent Portal
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          fontWeight: 400,
                          fontSize: { xs: '0.85rem', md: '0.95rem' },
                        }}
                      >
                        Start a new assessment session for your child
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/parent/child-info');
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: { xs: 2.5, md: 3.5 },
                        py: { xs: 1, md: 1.25 },
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                        transition: 'all 0.3s ease',
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { sm: '130px' },
                        fontSize: { xs: '0.9rem', md: '0.95rem' },
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                          boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      Start Session
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  borderRadius: { xs: 3, md: 4 },
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(156, 39, 176, 0.08)',
                  '&:hover': {
                    transform: { xs: 'translateY(-4px)', md: 'translateY(-8px) scale(1.01)' },
                    boxShadow: '0 20px 40px rgba(156, 39, 176, 0.25)',
                    borderColor: 'secondary.main',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(243, 229, 245, 0.5) 100%)',
                  },
                }}
                onClick={() => navigate('/admin')}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 } }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 2, sm: 2.5 }} 
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        p: { xs: 1.75, md: 2.25 },
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(156, 39, 176, 0.3)',
                      }}
                    >
                      <AdminPanelSettingsIcon sx={{ fontSize: { xs: 32, md: 38 }, color: 'white' }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
                      <Typography 
                        variant="h5" 
                        fontWeight={700} 
                        gutterBottom 
                        sx={{ 
                          color: 'text.primary',
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.35rem)',
                          mb: 0.5,
                        }}
                      >
                        Admin Dashboard
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          fontWeight: 400,
                          fontSize: { xs: '0.85rem', md: '0.95rem' },
                        }}
                      >
                        View all sessions and analyze patient data
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained"
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/admin');
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: { xs: 2.5, md: 3.5 },
                        py: { xs: 1, md: 1.25 },
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                        boxShadow: '0 4px 16px rgba(156, 39, 176, 0.3)',
                        transition: 'all 0.3s ease',
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { sm: '130px' },
                        fontSize: { xs: '0.9rem', md: '0.95rem' },
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
                          boxShadow: '0 6px 20px rgba(156, 39, 176, 0.4)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      View Dashboard
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Our Mission Card */}
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  borderRadius: { xs: 3, md: 4 },
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(46, 125, 50, 0.08)',
                  '&:hover': {
                    transform: { xs: 'translateY(-4px)', md: 'translateY(-8px) scale(1.01)' },
                    boxShadow: '0 20px 40px rgba(46, 125, 50, 0.25)',
                    borderColor: 'success.main',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(232, 245, 233, 0.5) 100%)',
                  },
                }}
                onClick={() => navigate('/about#mission')}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 } }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 2, sm: 3 }} 
                    alignItems="center"
                  >
                    <Box 
                      sx={{ 
                        p: 2, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: { xs: 60, md: 70 },
                        height: { xs: 60, md: 70 },
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 16px rgba(46, 125, 50, 0.3)',
                      }}
                    >
                      <FavoriteIcon sx={{ fontSize: { xs: 32, md: 38 }, color: 'white' }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
                      <Typography 
                        variant="h5" 
                        fontWeight={700} 
                        gutterBottom 
                        sx={{ 
                          color: 'text.primary',
                          fontSize: 'clamp(1.1rem, 3.5vw, 1.35rem)',
                          mb: 0.5,
                        }}
                      >
                        Our Mission
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          fontWeight: 400,
                          fontSize: { xs: '0.85rem', md: '0.95rem' },
                        }}
                      >
                        Learn about our commitment to early detection
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained"
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/about#mission');
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        px: { xs: 2.5, md: 3.5 },
                        py: { xs: 1, md: 1.25 },
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                        boxShadow: '0 4px 16px rgba(46, 125, 50, 0.3)',
                        transition: 'all 0.3s ease',
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { sm: '130px' },
                        fontSize: { xs: '0.9rem', md: '0.95rem' },
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
                          boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      Learn More
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>

            {/* Enhanced Footer */}
            <Box sx={{ mt: { xs: 2.5, md: 3.5 }, pt: { xs: 2, md: 3 }, borderTop: '2px solid rgba(25, 118, 210, 0.1)' }}>
              <Stack spacing={1.5} alignItems="center">
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: { xs: '0.8rem', md: '0.9rem' },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      width: { xs: 5, md: 6 },
                      height: { xs: 5, md: 6 },
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                      animation: `${breathe} 2s ease-in-out infinite`,
                    }}
                  />
                  Powered by AI Technology
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 400, 
                    maxWidth: { xs: '100%', sm: 450 }, 
                    textAlign: 'center',
                    px: { xs: 2, sm: 0 },
                    fontSize: { xs: '0.75rem', md: '0.8rem' },
                    lineHeight: 1.5,
                  }}
                >
                  Advanced AI-powered pose detection for accurate, real-time assessment of motor function
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
