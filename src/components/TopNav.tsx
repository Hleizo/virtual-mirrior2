import { AppBar, Toolbar, Typography, Button, Box, keyframes } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const TopNav = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Don't show TopNav on homepage
  if (isHomePage) {
    return null;
  }

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        mb: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        animation: `${slideDown} 0.5s ease-out`,
        borderRadius: 0,
        left: 0,
        right: 0,
        width: '100%',
      }}
    >
      <Toolbar sx={{ py: 0.5, px: { xs: 2, sm: 3 } }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexGrow: 1,
          }}
        >
          <MonitorHeartIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Virtual Mirror
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/"
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              px: 2,
              borderRadius: 0,
              transition: 'all 0.3s ease',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 6,
                left: '50%',
                transform: 'translateX(-50%) scaleX(0)',
                width: '60%',
                height: 2,
                bgcolor: 'white',
                transition: 'transform 0.3s ease',
              },
              '&:hover': {
                background: 'transparent',
                '&::after': {
                  transform: 'translateX(-50%) scaleX(1)',
                },
              },
            }}
          >
            Home
          </Button>
          
          <Button 
            color="inherit" 
            component={Link} 
            to="/about#mission"
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              px: 2,
              borderRadius: 0,
              transition: 'all 0.3s ease',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 6,
                left: '50%',
                transform: 'translateX(-50%) scaleX(0)',
                width: '60%',
                height: 2,
                bgcolor: 'white',
                transition: 'transform 0.3s ease',
              },
              '&:hover': {
                background: 'transparent',
                '&::after': {
                  transform: 'translateX(-50%) scaleX(1)',
                },
              },
            }}
          >
            Our Mission
          </Button>

          <Button 
            color="inherit" 
            component={Link} 
            to="/how-it-works"
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              px: 2,
              borderRadius: 0,
              transition: 'all 0.3s ease',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 6,
                left: '50%',
                transform: 'translateX(-50%) scaleX(0)',
                width: '60%',
                height: 2,
                bgcolor: 'white',
                transition: 'transform 0.3s ease',
              },
              '&:hover': {
                background: 'transparent',
                '&::after': {
                  transform: 'translateX(-50%) scaleX(1)',
                },
              },
            }}
          >
            How It Works
          </Button>
          
          <Button 
            color="inherit" 
            component={Link} 
            to="/admin"
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              px: 2,
              borderRadius: 0,
              transition: 'all 0.3s ease',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 6,
                left: '50%',
                transform: 'translateX(-50%) scaleX(0)',
                width: '60%',
                height: 2,
                bgcolor: 'white',
                transition: 'transform 0.3s ease',
              },
              '&:hover': {
                background: 'transparent',
                '&::after': {
                  transform: 'translateX(-50%) scaleX(1)',
                },
              },
            }}
          >
            Admin
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopNav;
