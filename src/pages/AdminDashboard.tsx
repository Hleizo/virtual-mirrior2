import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  keyframes,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRowsProp } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import { getAllSessions } from '../services/api';

// Animated bouncing dots keyframe
const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<GridRowsProp>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, session: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedSession(session);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSession(null);
  };

  // Delete session handler
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      // Refresh sessions list
      setSessions(sessions.filter((s: any) => s.sessionId !== sessionId));
      alert('Session deleted successfully');
    } catch (error: any) {
      alert('Error deleting session: ' + error.message);
    }
  };

  // Fetch sessions from backend
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📡 Fetching all sessions from backend...');
        
        const data = await getAllSessions();
        console.log('✅ Sessions loaded:', data);
        
        // Transform backend data to DataGrid format
        const transformedSessions = data.map((session: any, index: number) => {
          // Handle date - use started_at if available, otherwise use current date
          let dateStr = 'N/A';
          try {
            if (session.started_at) {
              dateStr = new Date(session.started_at).toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn('Invalid date for session:', session.id);
          }
          
          return {
            id: index + 1,
            sessionId: session.id,
            displayId: session.display_id || 0,
            date: dateStr,
            patientName: session.child_name || 'Unknown',
            age: session.child_age || 0,
            riskLevel: session.risk_level || 'normal',
            riskScore: session.overall_score || 0,
            sessionType: session.session_type || 'initial',
          };
        });
        
        setSessions(transformedSessions);
      } catch (err: any) {
        console.error('❌ Failed to fetch sessions:', err);
        setError(err.message || 'Failed to load sessions from backend');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Filter sessions based on risk level and search query
  const filteredSessions = sessions.filter((session: any) => {
    // Risk filter
    if (riskFilter !== 'all' && session.riskLevel !== riskFilter) {
      return false;
    }
    // Search filter (patient name or session ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        session.patientName.toLowerCase().includes(query) ||
        session.sessionId.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'displayId',
      headerName: 'ID',
      width: 80,
      sortable: true,
      valueFormatter: (value: any) => String(value),
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'patientName',
      headerName: 'Child Name',
      width: 200,
      sortable: true,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 150,
      sortable: true,
      type: 'date',
      valueGetter: (value: any) => new Date(value),
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'age',
      headerName: 'Age',
      width: 100,
      sortable: true,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'riskLevel',
      headerName: 'Risk Level',
      width: 150,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: any) => (
        <Chip
          label={params.value.toUpperCase()}
          color={
            params.value === 'normal' ? 'success' :
            params.value === 'monitor' ? 'warning' :
            'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 450,
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: any) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%', py: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<MedicalServicesIcon />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/clinician/${params.row.sessionId}`);
            }}
            sx={{ 
              minWidth: 100, 
              textTransform: 'none', 
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)' }
            }}
          >
            Clinical
          </Button>
          {params.row.sessionType === 'initial' && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<AddCircleIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/parent/session?followup=${params.row.sessionId}`);
                }}
                sx={{ 
                  minWidth: 110, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  borderWidth: '1.5px',
                  '&:hover': { borderWidth: '1.5px', bgcolor: 'rgba(2, 136, 209, 0.04)' }
                }}
              >
                Follow-Up
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<TimelineIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/progress/${params.row.sessionId}`);
                }}
                sx={{ 
                  minWidth: 100, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  borderWidth: '1.5px',
                  '&:hover': { borderWidth: '1.5px', bgcolor: 'rgba(46, 125, 50, 0.04)' }
                }}
              >
                Progress
              </Button>
            </>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, params.row);
            }}
            sx={{ 
              border: '1.5px solid',
              borderColor: 'divider',
              transition: 'all 0.2s ease',
              '&:hover': { 
                bgcolor: 'action.hover',
                borderColor: 'primary.main',
                transform: 'scale(1.05)'
              }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (selectedSession) {
              navigate(`/parent/child-info?edit=${selectedSession.sessionId}`);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Edit Session</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedSession) {
              handleDeleteSession(selectedSession.sessionId);
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Session</ListItemText>
        </MenuItem>
      </Menu>

      {/* Header */}
      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', boxShadow: '0 8px 32px rgba(102, 126, 234, 0.25)' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2, color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, textTransform: 'none', fontWeight: 500 }}
        >
          Back to Home
        </Button>
        
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h1" gutterBottom fontWeight={700} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Admin Dashboard
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.95, fontWeight: 400 }}>
              Manage and analyze all patient assessment sessions
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/parent/child-info')}
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
            >
              New Session
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<BarChartIcon />}
              onClick={() => navigate('/admin/analytics')}
              sx={{ 
                borderColor: 'white',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Analytics
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<CompareArrowsIcon />}
              onClick={() => {
                if (selectedSessions.length !== 2) {
                  alert('Please select exactly 2 sessions to compare');
                  return;
                }
                navigate(`/admin/compare?session1=${selectedSessions[0]}&session2=${selectedSessions[1]}`);
              }}
              disabled={selectedSessions.length !== 2}
              sx={{ 
                borderColor: 'white',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.3)' }
              }}
            >
              Compare ({selectedSessions.length}/2)
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5, color: 'text.primary', fontSize: '1.1rem' }}>
          Filter & Search
        </Typography>
        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Risk Level</InputLabel>
            <Select
              value={riskFilter}
              label="Risk Level"
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="monitor">Monitor</MenuItem>
              <MenuItem value="high">High Risk</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <TextField
            size="small"
            placeholder="Search by patient name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
        </Stack>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          py: 10,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  animation: `${bounce} 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight={600}>
            Failed to load sessions
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      )}

      {/* Data Grid */}
      {!loading && !error && (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <DataGrid
            rows={filteredSessions}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
              sorting: {
                sortModel: [{ field: 'date', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            checkboxSelection
            onRowSelectionModelChange={(newSelection) => {
              const selectionIds = Array.isArray(newSelection) ? newSelection : Array.from(newSelection.ids);
              const selected = selectionIds.map((id: any) => {
                const row = filteredSessions.find((s: any) => s.id === id);
                return row?.sessionId;
              }).filter(Boolean) as string[];
              setSelectedSessions(selected.slice(0, 2)); // Limit to 2 selections
            }}
            rowSelectionModel={{
              type: 'include',
              ids: new Set(filteredSessions
                .filter((s: any) => selectedSessions.includes(s.sessionId))
                .map((s: any) => s.id))
            }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              minHeight: 400,
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
                py: 2.5,
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.9rem',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'grey.100',
                borderBottom: '2px solid',
                borderColor: 'divider',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'text.primary',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
              '& .MuiDataGrid-columnHeader': {
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  cursor: 'pointer',
                  bgcolor: 'rgba(102, 126, 234, 0.04)',
                  transition: 'background-color 0.2s ease',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(102, 126, 234, 0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.12)',
                  },
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid',
                borderColor: 'divider',
                bgcolor: 'grey.50',
              },
            }}
            autoHeight
          />
        </Paper>
      )}

      {/* Empty State */}
      {!loading && !error && sessions.length === 0 && (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="h5" color="text.primary" gutterBottom fontWeight={600}>
            No Sessions Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Start a new assessment session to see data here. You can track patient progress and view detailed analytics.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            sx={{ mt: 2, textTransform: 'none', fontWeight: 600, px: 4, py: 1.5 }}
            onClick={() => navigate('/parent/child-info')}
          >
            Create New Session
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default AdminDashboard;
