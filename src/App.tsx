import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import ChildInfoPage from './pages/ChildInfoPage';
import SessionPageOrchestrator from './pages/SessionPageOrchestrator';
import ParentResultsPage from './pages/ParentResultsPage';
import ParentSessionsPage from './pages/ParentSessionsPage';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import SessionComparison from './pages/SessionComparison';
import ProgressTracking from './pages/ProgressTracking';
import ClinicianView from './pages/ClinicianView';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';

// Create Material UI theme with custom design touches
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Blue
    },
    secondary: {
      main: '#21CBF3',
    },
    success: {
      main: '#2e7d32', // Green
    },
    warning: {
      main: '#ed6c02', // Orange
    },
    error: {
      main: '#d32f2f', // Red
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12, // Rounded cards globally
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.08)',
    '0px 3px 6px rgba(0,0,0,0.1)',
    '0px 4px 8px rgba(0,0,0,0.12)',
    '0px 6px 12px rgba(0,0,0,0.15)',
    '0px 8px 16px rgba(0,0,0,0.18)',
    '0px 10px 20px rgba(0,0,0,0.2)',
    '0px 12px 24px rgba(0,0,0,0.22)',
    '0px 14px 28px rgba(0,0,0,0.25)',
    '0px 16px 32px rgba(0,0,0,0.27)',
    '0px 18px 36px rgba(0,0,0,0.3)',
    '0px 20px 40px rgba(0,0,0,0.32)',
    '0px 22px 44px rgba(0,0,0,0.35)',
    '0px 24px 48px rgba(0,0,0,0.37)',
    '0px 26px 52px rgba(0,0,0,0.4)',
    '0px 28px 56px rgba(0,0,0,0.42)',
    '0px 30px 60px rgba(0,0,0,0.45)',
    '0px 32px 64px rgba(0,0,0,0.47)',
    '0px 34px 68px rgba(0,0,0,0.5)',
    '0px 36px 72px rgba(0,0,0,0.52)',
    '0px 38px 76px rgba(0,0,0,0.55)',
    '0px 40px 80px rgba(0,0,0,0.57)',
    '0px 42px 84px rgba(0,0,0,0.6)',
    '0px 44px 88px rgba(0,0,0,0.62)',
    '0px 46px 92px rgba(0,0,0,0.65)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 3px 6px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0px 3px 6px rgba(0,0,0,0.1)',
        },
        elevation3: {
          boxShadow: '0px 4px 8px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  console.log('App rendering...');
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopNav />
          <Box sx={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              
              {/* Parent Flow */}
              <Route path="/parent/child-info" element={<ChildInfoPage />} />
              <Route path="/parent/session" element={<SessionPageOrchestrator />} />
              <Route path="/parent/sessions" element={<ParentSessionsPage />} />
              <Route path="/parent/results/:sessionId" element={<ParentResultsPage />} />
              
              {/* Admin Flow */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/compare" element={<SessionComparison />} />
              <Route path="/admin/progress/:sessionId" element={<ProgressTracking />} />
              <Route path="/admin/clinician/:sessionId" element={<ClinicianView />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
  