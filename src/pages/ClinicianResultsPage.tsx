import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Stack,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Home as HomeIcon,
  Psychology as PsychologyIcon,
  Compare as CompareIcon,
  TableChart as CsvIcon,
  Code as JsonIcon,
  Description as TextIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { gradeMetric, getLevelColor } from '../clinical/standards';
import { computeOverallRisk, getRiskColor, getRiskLabel } from '../clinical/scoring';
import type { TaskName } from '../store/session';
import { getSession, getSessionTasks, getTaskMetrics } from '../services/api';
import { 
  buildSessionResult, 
  exportSessionAsJSON, 
  exportSessionAsCSV,
  generateClinicalReport,
  type TaskResult 
} from '../services/sessionReport';

interface SessionData {
  session: any;
  tasks: Array<{
    task: TaskName;
    metrics: Record<string, number>;
  }>;
}

const ClinicianResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // Fetch data from backend using URL parameter
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionIdFromUrl) {
        setError('No session ID provided in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('📡 Fetching session data from backend:', sessionIdFromUrl);
        
        // Fetch session details
        const session = await getSession(sessionIdFromUrl);
        
        if (!session) {
          setError('This session was not saved. Please try again.');
          setLoading(false);
          return;
        }
        
        console.log('✅ Session loaded:', session);
        
        // Fetch tasks for this session
        const tasksData = await getSessionTasks(sessionIdFromUrl);
        console.log('✅ Tasks loaded:', tasksData);
        
        // Fetch metrics for each task
        const tasksWithMetrics = await Promise.all(
          tasksData.map(async (task: any) => {
            const metricsData = await getTaskMetrics(task.id);
            console.log(`✅ Metrics loaded for task ${task.task_name}:`, metricsData);
            
            // Convert metrics array to object format
            const metricsObj: Record<string, number> = {};
            metricsData.forEach((metric: any) => {
              metricsObj[metric.metric_name] = metric.metric_value;
            });
            
            return {
              task: task.task_name as TaskName,
              metrics: metricsObj,
            };
          })
        );
        
        setSessionData({
          session,
          tasks: tasksWithMetrics,
        });
        
        console.log('✅ All data loaded successfully');
      } catch (err: any) {
        console.error('❌ Failed to fetch session data:', err);
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setError('This session was not saved. Please try again.');
        } else {
          setError('Failed to load session data. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionIdFromUrl]);

  // Helper to get primary metric for each task
  const getPrimaryMetric = (taskName: TaskName, metrics: Record<string, number | string>) => {
    switch (taskName) {
      case 'raise_hand':
        return { name: 'shoulderFlexion', value: (metrics.shoulderFlexionMax || metrics.symmetry || 0) as number };
      case 'one_leg':
        return { name: 'balanceTime', value: (metrics.balanceTime || metrics.holdTime || 0) as number };
      case 'walk':
        return { name: 'gaitSymmetry', value: (metrics.gaitSymmetry || metrics.symmetryPercent || 0) as number };
      case 'jump':
        return { name: 'jumpHeight', value: (metrics.jumpHeight || metrics.jumpHeightPixels || 0) as number };
      default:
        return { name: 'unknown', value: 0 };
    }
  };

  // Compute clinical grades for all tasks
  const clinicalGrades = useMemo(() => {
    if (!sessionData) return [];
    
    return sessionData.tasks.map((task) => {
      const taskName = task.task as TaskName;
      const primaryMetric = getPrimaryMetric(taskName, task.metrics);
      const age = sessionData.session.child_age;
      const grade = gradeMetric(
        taskName,
        primaryMetric.name,
        primaryMetric.value,
        age
      );
      return { task: taskName, grade };
    });
  }, [sessionData]);

  // Compute overall risk from clinical grades
  const overallRisk = useMemo(() => {
    if (!sessionData) return 'normal';
    // Use backend risk level if available, otherwise compute
    if (sessionData.session.risk_level) {
      return sessionData.session.risk_level;
    }
    return computeOverallRisk(clinicalGrades);
  }, [sessionData, clinicalGrades]);



  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading session data from database...
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (error || !sessionData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom color="error">
            Failed to Load Session
          </Typography>
          <Alert severity="error" sx={{ mb: 3, mt: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              {error || 'No session data found'}
            </Typography>
            <Typography variant="body2">
              {!sessionIdFromUrl ? 'No session ID provided in URL.' : 'Failed to load session from backend.'}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  // Prepare chart data
  const tasks = sessionData.tasks;
  const chartData = tasks.map((task) => {
    const metrics = task.metrics;
    return {
      name: task.task.replace('_', ' '),
      ...metrics,
    };
  });

  // Build structured session result for enhanced exports
  const sessionResult = useMemo(() => {
    const taskResults: TaskResult[] = sessionData.tasks.map(t => ({
      task: t.task,
      metrics: t.metrics,
      status: 'success' as const,
    }));
    
    return buildSessionResult(
      taskResults,
      sessionIdFromUrl || 'unknown',
      sessionData.session.child_age,
      sessionData.session.child_name,
      sessionData.session.child_height_cm,
      sessionData.session.child_gender
    );
  }, [sessionData, sessionIdFromUrl]);

  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportMenuAnchor);

  const handleExportJSON = () => {
    // Use enhanced JSON export with full session structure
    const jsonStr = exportSessionAsJSON(sessionResult);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionData.session.id}-clinical.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // Use enhanced CSV export with complete metrics
    const csvStr = exportSessionAsCSV(sessionResult);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionData.session.id}-clinical.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTextReport = () => {
    // Generate clinical text report
    const report = generateClinicalReport(sessionResult);
    const blob = new Blob([report.textReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionData.session.id}-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCompareSession = () => {
    alert('Session comparison feature coming soon! This will allow you to compare current results with previous sessions.');
  };

  // Generate AI Interpretation Summary
  const generateAIInterpretation = () => {
    const interpretations: string[] = [];

    // Analyze each task
    tasks.forEach((task: any) => {
      const metrics = task.metrics;

      switch (task.task) {
        case 'raise_hand':
          const shoulderFlexion = metrics.shoulderFlexionMax as number;
          if (shoulderFlexion >= 120) {
            interpretations.push('Shoulder mobility is excellent with full range of motion.');
          } else if (shoulderFlexion >= 90) {
            interpretations.push('Shoulder mobility is within acceptable range but shows slight limitation.');
          } else {
            interpretations.push('⚠️ Shoulder mobility shows significant limitation. Consider referral to physical therapy.');
          }
          break;

        case 'one_leg':
          const holdTime = metrics.holdTime as number;
          const swayIndex = metrics.swayIndex as number;
          
          if (holdTime >= 5 && swayIndex < 0.02) {
            interpretations.push('Balance and postural control are age-appropriate.');
          } else if (holdTime >= 3) {
            interpretations.push('Balance shows moderate weakness. Monitor and encourage balance activities.');
          } else {
            interpretations.push('⚠️ Significant balance deficits observed. Recommend vestibular assessment.');
          }
          break;

        case 'walk':
          const symmetry = metrics.symmetryPercent as number;
          
          if (symmetry >= 80) {
            interpretations.push('Motor symmetry is within normal range.');
          } else if (symmetry >= 60) {
            interpretations.push('Mild asymmetry detected in gait pattern. Continue monitoring.');
          } else {
            interpretations.push('⚠️ Significant gait asymmetry noted. Consider neuromuscular evaluation.');
          }
          break;

        case 'jump':
          const jumpHeight = metrics.jumpHeightPixels as number;
          
          if (jumpHeight >= 80) {
            interpretations.push('Lower extremity power and coordination are adequate.');
          } else if (jumpHeight >= 40) {
            interpretations.push('Lower extremity power is below expected range for age.');
          } else {
            interpretations.push('⚠️ Significant weakness in lower extremity. Assess muscle tone and strength.');
          }
          break;
      }
    });

    // Overall assessment
    if (overallRisk === 'normal') {
      interpretations.unshift('Overall assessment: Motor development appears age-appropriate across all domains.');
    } else if (overallRisk === 'monitor') {
      interpretations.unshift('Overall assessment: Some areas show borderline performance. Recommend follow-up in 6-8 weeks.');
    } else {
      interpretations.unshift('Overall assessment: Multiple areas of concern identified. Comprehensive evaluation recommended.');
    }

    return interpretations;
  };

  const aiInterpretations = generateAIInterpretation();

  // Prepare radar chart data
  const radarData = tasks.map((task: any) => {
    let score = 100;

    switch (task.task) {
      case 'raise_hand':
        const shoulderFlexion = task.metrics.shoulderFlexionMax as number;
        score = Math.min((shoulderFlexion / 120) * 100, 100);
        break;
      case 'one_leg':
        const holdTime = task.metrics.holdTime as number;
        score = Math.min((holdTime / 5) * 100, 100);
        break;
      case 'walk':
        const symmetry = task.metrics.symmetryPercent as number;
        score = symmetry || 0;
        break;
      case 'jump':
        const jumpHeight = task.metrics.jumpHeightPixels as number;
        score = Math.min((jumpHeight / 100) * 100, 100);
        break;
    }

    return {
      task: task.task.replace('_', ' ').toUpperCase(),
      score: Math.round(score),
      fullMark: 100,
    };
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
        Clinician Assessment Report
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Session ID: {sessionData.session.id} • Started: {new Date(sessionData.session.created_at).toLocaleString()}
        {sessionData.session.child_age && ` • Age: ${sessionData.session.child_age} years`}
        {sessionData.session.child_name && ` • Child: ${sessionData.session.child_name}`}
      </Typography>

      {/* Risk Level */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={`Risk Level: ${overallRisk.toUpperCase()}`}
            color={getRiskColor(overallRisk)}
            sx={{ fontSize: '1rem', py: 2, px: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {getRiskLabel(overallRisk)}
          </Typography>
        </Stack>
      </Box>

      {/* AI Interpretation Summary */}
      <Paper elevation={2} sx={{ mb: 3, p: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <PsychologyIcon color="primary" sx={{ fontSize: '2rem', mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} color="primary.main">
              AI Interpretation Summary
            </Typography>
            <Stack spacing={1.5}>
              {aiInterpretations.map((interpretation, index) => (
                <Box key={index}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      lineHeight: 1.7,
                      color: interpretation.includes('⚠️') ? 'error.main' : 'text.primary',
                      fontWeight: index === 0 ? 600 : 400,
                    }}
                  >
                    {interpretation}
                  </Typography>
                  {index === 0 && <Divider sx={{ my: 1.5 }} />}
                </Box>
              ))}
            </Stack>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}
            >
              Note: This is an automated analysis. Clinical judgment should always supersede algorithmic interpretation.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Metrics Table */}
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Detailed Metrics by Task
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Task</strong></TableCell>
                <TableCell><strong>Metric</strong></TableCell>
                <TableCell><strong>Value</strong></TableCell>
                <TableCell><strong>Clinical Grade</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task, taskIndex: number) => {
                const clinicalGrade = clinicalGrades[taskIndex]?.grade;
                return Object.entries(task.metrics).map(([key, value], metricIndex) => (
                  <TableRow key={`${taskIndex}-${metricIndex}`}>
                    {metricIndex === 0 && (
                      <TableCell rowSpan={Object.keys(task.metrics).length}>
                        <strong>{task.task.replace('_', ' ').toUpperCase()}</strong>
                      </TableCell>
                    )}
                    <TableCell>{key}</TableCell>
                    <TableCell>
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                    </TableCell>
                    {metricIndex === 0 && (
                      <TableCell rowSpan={Object.keys(task.metrics).length}>
                        {clinicalGrade && (
                          <Stack spacing={0.5}>
                            <Chip 
                              label={clinicalGrade.level.toUpperCase()}
                              color={getLevelColor(clinicalGrade.level)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {clinicalGrade.note}
                            </Typography>
                          </Stack>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Charts */}
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Metrics Visualization
        </Typography>
        
        {/* Bar Chart */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Detailed Metrics Comparison
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="symmetry" fill="#1976d2" name="Symmetry %" />
              <Bar dataKey="balanceTime" fill="#2e7d32" name="Balance Time (s)" />
              <Bar dataKey="holdTime" fill="#ed6c02" name="Hold Time (s)" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Radar Chart */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Overall Performance Comparison (0-100 scale)
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="task" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar 
                name="Performance Score" 
                dataKey="score" 
                stroke="#1976d2" 
                fill="#1976d2" 
                fillOpacity={0.6} 
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Box>

        {/* Compare Button */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={handleCompareSession}
            size="small"
          >
            Compare with Last Session
          </Button>
        </Box>
      </Paper>

      {/* Notes */}
      <Paper elevation={2} sx={{ mb: 3, p: 2, '@media print': { breakInside: 'avoid' } }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Clinical Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Enter clinical observations, recommendations, or follow-up notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          variant="outlined"
        />
      </Paper>

      {/* Actions */}
      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ '@media print': { display: 'none' } }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
        >
          Export Data
        </Button>
        
        {/* Export Format Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={exportMenuOpen}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={() => { handleExportJSON(); setExportMenuAnchor(null); }}>
            <ListItemIcon><JsonIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export as JSON (Full Data)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleExportCSV(); setExportMenuAnchor(null); }}>
            <ListItemIcon><CsvIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export as CSV (Spreadsheet)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handleExportTextReport(); setExportMenuAnchor(null); }}>
            <ListItemIcon><TextIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export Clinical Report (Text)</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { handlePrint(); setExportMenuAnchor(null); }}>
            <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Print / Save as PDF</ListItemText>
          </MenuItem>
        </Menu>
        
        <Button
          variant="outlined"
          startIcon={<CompareIcon />}
          onClick={handleCompareSession}
        >
          Compare Sessions
        </Button>
        
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Stack>
      
      {/* Session tracking info */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        Session ID: {sessionIdFromUrl} • Storing session data helps track progress over time
      </Typography>
    </Container>
  );
};

export default ClinicianResultsPage;
