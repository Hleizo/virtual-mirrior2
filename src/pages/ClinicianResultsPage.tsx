import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Download as DownloadIcon,
  SaveAlt as ExportIcon,
  Home as HomeIcon,
  Psychology as PsychologyIcon,
  Compare as CompareIcon,
  TableChart as CsvIcon,
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
import { useSessionStore } from '../store/session';

const ClinicianResultsPage = () => {
  const navigate = useNavigate();
  const summary = useSessionStore((state) => state.current);
  const [notes, setNotes] = useState('');

  if (!summary) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          No session found. Please complete a session first or load demo results.
        </Alert>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  // Prepare chart data
  const chartData = summary.tasks.map((task) => {
    const metrics = task.metrics;
    return {
      name: task.task.replace('_', ' '),
      ...metrics,
    };
  });

  // Collect all flags
  const allFlags = summary.tasks.flatMap((task) => task.flags || []);

  const handleExportJSON = () => {
    const json = JSON.stringify(summary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${summary.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csv = 'Task,Metric,Value\n';
    summary.tasks.forEach((task) => {
      Object.entries(task.metrics).forEach(([key, value]) => {
        csv += `${task.task},${key},${value}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${summary.sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCompareSession = () => {
    alert('Session comparison feature coming soon! This will allow you to compare current results with previous sessions.');
  };

  // Generate AI Interpretation Summary
  const generateAIInterpretation = () => {
    const interpretations: string[] = [];

    // Analyze each task
    summary.tasks.forEach((task) => {
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
    if (summary.overallRisk === 'normal') {
      interpretations.unshift('Overall assessment: Motor development appears age-appropriate across all domains.');
    } else if (summary.overallRisk === 'monitor') {
      interpretations.unshift('Overall assessment: Some areas show borderline performance. Recommend follow-up in 6-8 weeks.');
    } else {
      interpretations.unshift('Overall assessment: Multiple areas of concern identified. Comprehensive evaluation recommended.');
    }

    return interpretations;
  };

  const aiInterpretations = generateAIInterpretation();

  // Prepare radar chart data
  const radarData = summary.tasks.map((task) => {
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
        Session ID: {summary.sessionId} • Started: {new Date(summary.startedAt).toLocaleString()}
        {summary.childAgeYears && ` • Age: ${summary.childAgeYears} years`}
      </Typography>

      {/* Risk Level */}
      <Box sx={{ mb: 3 }}>
        <Chip
          label={`Risk Level: ${summary.overallRisk?.toUpperCase() || 'N/A'}`}
          color={
            summary.overallRisk === 'normal' ? 'success' :
            summary.overallRisk === 'monitor' ? 'warning' : 'error'
          }
          sx={{ fontSize: '1rem', py: 2, px: 1 }}
        />
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
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.tasks.map((task, taskIndex) =>
                Object.entries(task.metrics).map(([key, value], metricIndex) => (
                  <TableRow key={`${taskIndex}-${metricIndex}`}>
                    {metricIndex === 0 && (
                      <TableCell rowSpan={Object.keys(task.metrics).length}>
                        <strong>{task.task.replace('_', ' ').toUpperCase()}</strong>
                      </TableCell>
                    )}
                    <TableCell>{key}</TableCell>
                    <TableCell>
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </TableCell>
                  </TableRow>
                ))
              )}
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

      {/* Flags */}
      {allFlags.length > 0 && (
        <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Clinical Flags
          </Typography>
          <Stack spacing={1}>
            {allFlags.map((flag, index) => (
              <Alert key={index} severity="warning">
                {flag}
              </Alert>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Notes */}
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
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
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={handleExportJSON}
        >
          Export JSON
        </Button>
        <Button
          variant="contained"
          startIcon={<CsvIcon />}
          onClick={handleExportCSV}
          color="secondary"
        >
          Export CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          disabled
        >
          Download PDF
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
    </Container>
  );
};

export default ClinicianResultsPage;
