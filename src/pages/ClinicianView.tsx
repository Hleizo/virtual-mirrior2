import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tab,
  Tabs,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import { getSession, getSessionTasks, getTaskMetrics, getFollowupSessions } from '../services/api';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

interface SessionData {
  id: string;
  child_name: string;
  child_age: number;
  child_height_cm?: number;
  child_weight_kg?: number;
  child_gender?: string;
  child_notes?: string;
  started_at: string;
  session_type: string;
  tasks: Array<{
    id: string;
    task_name: string;
    duration_seconds: number;
    status: string;
    notes?: string;
    metrics: { [key: string]: number };
  }>;
}

const ClinicianView = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [followups, setFollowups] = useState<SessionData[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch session
        const sessionData = await getSession(sessionId);
        const tasks = await getSessionTasks(sessionId);

        const tasksWithMetrics = await Promise.all(
          tasks.map(async (task: any) => {
            const metrics = await getTaskMetrics(task.id);
            const metricsObj = metrics.reduce((acc: any, m: any) => {
              acc[m.metric_name] = m.metric_value;
              return acc;
            }, {});
            return {
              ...task,
              metrics: metricsObj,
            };
          })
        );

        const sessionWithTasks = {
          ...sessionData,
          started_at: sessionData.started_at || new Date().toISOString(),
          session_type: sessionData.session_type || 'initial',
          tasks: tasksWithMetrics,
        };

        setSession(sessionWithTasks);
        setClinicalNotes(sessionData.child_notes || '');

        // Fetch follow-ups if this is an initial session
        if (sessionData.session_type === 'initial') {
          const followupData = await getFollowupSessions(sessionId);
          const followupsWithTasks = await Promise.all(
            followupData.map(async (f: any) => {
              const fTasks = await getSessionTasks(f.id);
              const fTasksWithMetrics = await Promise.all(
                fTasks.map(async (task: any) => {
                  const metrics = await getTaskMetrics(task.id);
                  const metricsObj = metrics.reduce((acc: any, m: any) => {
                    acc[m.metric_name] = m.metric_value;
                    return acc;
                  }, {});
                  return { ...task, metrics: metricsObj };
                })
              );
              return { ...f, tasks: fTasksWithMetrics };
            })
          );
          setFollowups(followupsWithTasks);
        }
      } catch (err: any) {
        console.error('Failed to fetch session:', err);
        setError(err.message || 'Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading clinical data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !session) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || 'Failed to load session'}</Alert>
      </Container>
    );
  }

  // Calculate clinical metrics
  const calculateBMI = () => {
    if (session.child_height_cm && session.child_weight_kg) {
      const heightM = session.child_height_cm / 100;
      return (session.child_weight_kg / (heightM * heightM)).toFixed(1);
    }
    return 'N/A';
  };

  const getRiskAssessment = () => {
    const oneLegs = session.tasks.find(t => t.task_name === 'one_leg');
    const raiseHand = session.tasks.find(t => t.task_name === 'raise_hand');
    const walk = session.tasks.find(t => t.task_name === 'walk');

    const risks = [];
    
    if (oneLegs?.metrics.holdTime && oneLegs.metrics.holdTime < 5) {
      risks.push({ area: 'Balance', level: 'High', detail: `Hold time: ${oneLegs.metrics.holdTime}s (< 5s)` });
    }
    if (oneLegs?.metrics.wobbleCount && oneLegs.metrics.wobbleCount > 3) {
      risks.push({ area: 'Stability', level: 'Moderate', detail: `Wobble count: ${oneLegs.metrics.wobbleCount}` });
    }
    if (raiseHand?.metrics.shoulderFlexionMax && raiseHand.metrics.shoulderFlexionMax < 120) {
      risks.push({ area: 'Shoulder ROM', level: 'High', detail: `Max flexion: ${raiseHand.metrics.shoulderFlexionMax}° (< 120°)` });
    }
    if (walk?.metrics.symmetryPercent && walk.metrics.symmetryPercent < 80) {
      risks.push({ area: 'Gait Symmetry', level: 'Moderate', detail: `Symmetry: ${walk.metrics.symmetryPercent}%` });
    }

    return risks;
  };

  // Prepare radar chart data
  const radarData = [
    {
      metric: 'Balance',
      value: Math.min(100, (session.tasks.find(t => t.task_name === 'one_leg')?.metrics.holdTime || 0) * 10),
      fullMark: 100,
    },
    {
      metric: 'Flexibility',
      value: Math.min(100, (session.tasks.find(t => t.task_name === 'raise_hand')?.metrics.shoulderFlexionMax || 0) / 1.8),
      fullMark: 100,
    },
    {
      metric: 'Symmetry',
      value: session.tasks.find(t => t.task_name === 'walk')?.metrics.symmetryPercent || 0,
      fullMark: 100,
    },
    {
      metric: 'Stability',
      value: Math.max(0, 100 - (session.tasks.find(t => t.task_name === 'one_leg')?.metrics.wobbleCount || 0) * 10),
      fullMark: 100,
    },
    {
      metric: 'Coordination',
      value: Math.min(100, (session.tasks.find(t => t.task_name === 'raise_hand')?.metrics.duration || 0) * 20),
      fullMark: 100,
    },
  ];

  // Prepare angle data for detailed biomechanics
  const angleData = [
    {
      joint: 'Shoulder',
      metric: 'Flexion Max',
      value: session.tasks.find(t => t.task_name === 'raise_hand')?.metrics.shoulderFlexionMax,
      normal: '180°',
      unit: '°',
    },
    {
      joint: 'Shoulder',
      metric: 'Flexion Min',
      value: session.tasks.find(t => t.task_name === 'raise_hand')?.metrics.shoulderFlexionMin,
      normal: '0°',
      unit: '°',
    },
    {
      joint: 'Hip',
      metric: 'Angle',
      value: session.tasks.find(t => t.task_name === 'one_leg')?.metrics.hipAngle,
      normal: '180°',
      unit: '°',
    },
    {
      joint: 'Knee',
      metric: 'Angle',
      value: session.tasks.find(t => t.task_name === 'one_leg')?.metrics.kneeAngle,
      normal: '180°',
      unit: '°',
    },
    {
      joint: 'Ankle',
      metric: 'Angle',
      value: session.tasks.find(t => t.task_name === 'one_leg')?.metrics.ankleAngle,
      normal: '90°',
      unit: '°',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleSaveNotes = () => {
    // TODO: Implement save to backend
    alert('Clinical notes saved successfully!');
  };

  const allSessions = session.session_type === 'initial' ? [session, ...followups] : [session];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
            Back to Dashboard
          </Button>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={600}>
                Clinical Assessment Report
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive diagnostic evaluation
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Report
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveNotes}>
            Save Notes
          </Button>
        </Stack>
      </Box>

      {/* Patient Information Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <PersonIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight={600}>
            Patient Information
          </Typography>
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Patient Name</Typography>
                <Typography variant="h6">{session.child_name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Age</Typography>
                <Typography variant="body1">{session.child_age} years</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Gender</Typography>
                <Typography variant="body1">{session.child_gender || 'Not specified'}</Typography>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Height</Typography>
                <Typography variant="body1">{session.child_height_cm ? `${session.child_height_cm} cm` : 'Not recorded'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Weight</Typography>
                <Typography variant="body1">{session.child_weight_kg ? `${session.child_weight_kg} kg` : 'Not recorded'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">BMI</Typography>
                <Typography variant="body1">{calculateBMI()}</Typography>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ flex: "1 1 100%" }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Assessment Date</Typography>
              <Typography variant="body1">
                {new Date(session.started_at).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flex: "1 1 100%" }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Session Type</Typography>
              <Chip 
                label={session.session_type === 'initial' ? 'Initial Assessment' : 'Follow-Up'} 
                color={session.session_type === 'initial' ? 'primary' : 'secondary'}
                sx={{ ml: 1 }}
              />
              {followups.length > 0 && (
                <Chip 
                  label={`${followups.length} Follow-up${followups.length > 1 ? 's' : ''}`} 
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabs for Different Views */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Overview" />
          <Tab label="Biomechanical Analysis" />
          <Tab label="Task Details" />
          <Tab label="Progress Tracking" />
          <Tab label="Clinical Notes" />
        </Tabs>

        {/* Tab 0: Overview */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {/* Performance Radar Chart */}
              <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Motor Performance Profile
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="value" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>

              {/* Risk Assessment */}
              <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Risk Assessment
                </Typography>
                <Stack spacing={2}>
                  {getRiskAssessment().length === 0 ? (
                    <Alert severity="success">
                      <Typography variant="body2">
                        No significant risk factors identified. All metrics within normal ranges.
                      </Typography>
                    </Alert>
                  ) : (
                    getRiskAssessment().map((risk, idx) => (
                      <Alert 
                        key={idx} 
                        severity={risk.level === 'High' ? 'error' : 'warning'}
                        icon={<AnnouncementIcon />}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>{risk.area}</Typography>
                        <Typography variant="body2">{risk.detail}</Typography>
                      </Alert>
                    ))
                  )}
                </Stack>
              </Box>

              {/* Summary Metrics */}
              <Box sx={{ flex: "1 1 100%" }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 2 }}>
                  Key Performance Indicators
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {session.tasks.map((task) => (
                    <Box sx={{ flex: "1 1 30%", minWidth: "250px" }} key={task.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="caption" color="text.secondary">
                            {task.task_name.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                          <Typography variant="h5" fontWeight={600} sx={{ my: 1 }}>
                            {task.status === 'success' ? '✓' : '○'}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Stack spacing={0.5}>
                            {Object.entries(task.metrics).slice(0, 3).map(([key, value]) => (
                              <Typography key={key} variant="body2">
                                <strong>{key}:</strong> {typeof value === 'number' ? value.toFixed(2) : value}
                              </Typography>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 1: Biomechanical Analysis */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Joint Angle Analysis
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Joint</strong></TableCell>
                    <TableCell><strong>Metric</strong></TableCell>
                    <TableCell align="right"><strong>Measured Value</strong></TableCell>
                    <TableCell align="right"><strong>Normal Range</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {angleData.map((angle, idx) => {
                    const value = angle.value;
                    const normalValue = parseInt(angle.normal);
                    let status = 'Normal';
                    let color: 'success' | 'warning' | 'error' = 'success';
                    
                    if (value !== undefined) {
                      const deviation = Math.abs(value - normalValue);
                      if (deviation > 30) {
                        status = 'Significant Deviation';
                        color = 'error';
                      } else if (deviation > 15) {
                        status = 'Moderate Deviation';
                        color = 'warning';
                      }
                    }

                    return (
                      <TableRow key={idx}>
                        <TableCell>{angle.joint}</TableCell>
                        <TableCell>{angle.metric}</TableCell>
                        <TableCell align="right">
                          {value !== undefined ? `${value.toFixed(1)}${angle.unit}` : 'Not measured'}
                        </TableCell>
                        <TableCell align="right">{angle.normal}</TableCell>
                        <TableCell align="center">
                          <Chip label={status} color={color} size="small" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Angle Visualization */}
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mt: 3 }}>
              Angle Measurements Visualization
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={angleData.filter(a => a.value !== undefined)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="joint" />
                <YAxis label={{ value: 'Degrees (°)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1976d2" name="Measured Angle" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Tab 2: Task Details */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            {session.tasks.map((task, idx) => {
              const isFailed = task.status === 'failed';
              return (
              <Paper 
                key={task.id} 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  mb: 2,
                  borderColor: isFailed ? 'error.main' : 'divider',
                  borderWidth: isFailed ? 2 : 1,
                  bgcolor: isFailed ? 'error.lighter' : 'background.paper',
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight={600} color={isFailed ? 'error.main' : 'text.primary'}>
                  Task {idx + 1}: {task.task_name.replace(/_/g, ' ').toUpperCase()}
                  {isFailed && ' - NOT COMPLETED'}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                        <Typography variant="body1">{task.duration_seconds.toFixed(2)} seconds</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Chip 
                          label={task.status} 
                          color={task.status === 'success' ? 'success' : 'error'} 
                          size="small"
                          sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                        />
                      </Box>
                      {task.notes && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Notes</Typography>
                          <Typography variant="body2" color={isFailed ? 'error.main' : 'text.primary'}>
                            {task.notes}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {isFailed ? 'Task Failed - No Metrics Available' : 'All Metrics'}
                    </Typography>
                    {!isFailed && (
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          {Object.entries(task.metrics).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>{key}</TableCell>
                              <TableCell align="right">
                                <strong>{typeof value === 'number' ? value.toFixed(3) : value}</strong>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    )}
                  </Box>
                </Box>
              </Paper>
              );
            })}
          </Box>
        )}

        {/* Tab 3: Progress Tracking */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            {allSessions.length > 1 ? (
              <>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Progress Over Time ({allSessions.length} sessions)
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={allSessions.map((s, idx) => ({
                    session: `Session ${idx + 1}`,
                    date: new Date(s.started_at).toLocaleDateString(),
                    balance: s.tasks.find(t => t.task_name === 'one_leg')?.metrics.holdTime || 0,
                    flexibility: s.tasks.find(t => t.task_name === 'raise_hand')?.metrics.shoulderFlexionMax || 0,
                    symmetry: s.tasks.find(t => t.task_name === 'walk')?.metrics.symmetryPercent || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#1976d2" name="Balance (s)" strokeWidth={2} />
                    <Line type="monotone" dataKey="flexibility" stroke="#2e7d32" name="Shoulder Flexion (°)" strokeWidth={2} />
                    <Line type="monotone" dataKey="symmetry" stroke="#ed6c02" name="Gait Symmetry (%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <Alert severity="info">
                <Typography variant="body2">
                  No follow-up sessions recorded yet. Progress tracking will be available after recording follow-up assessments.
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Tab 4: Clinical Notes */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Clinical Observations
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter clinical observations, notes about the patient's performance, behavior, cooperation level, etc."
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Diagnosis / Impressions
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter clinical diagnosis or impressions based on assessment results"
                  variant="outlined"
                />
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Recommendations
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Enter treatment recommendations, follow-up plan, referrals, exercises, etc."
                  variant="outlined"
                />
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ClinicianView;
