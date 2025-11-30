import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PersonIcon from '@mui/icons-material/Person';
import { getSession, getSessionTasks, getTaskMetrics } from '../services/api';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface SessionData {
  id: string;
  child_name: string;
  child_age: number;
  child_height_cm?: number;
  child_weight_kg?: number;
  child_gender?: string;
  started_at: string;
  tasks: Array<{
    id: string;
    task_name: string;
    duration_seconds: number;
    status: string;
    metrics: { [key: string]: number };
  }>;
}

const SessionComparison = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId1 = searchParams.get('session1');
  const sessionId2 = searchParams.get('session2');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session1, setSession1] = useState<SessionData | null>(null);
  const [session2, setSession2] = useState<SessionData | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!sessionId1 || !sessionId2) {
        setError('Two session IDs are required for comparison');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch both sessions
        const [s1, s2] = await Promise.all([
          getSession(sessionId1),
          getSession(sessionId2),
        ]);

        // Fetch tasks for both sessions
        const [tasks1, tasks2] = await Promise.all([
          getSessionTasks(sessionId1),
          getSessionTasks(sessionId2),
        ]);

        // Fetch metrics for all tasks
        const session1WithMetrics = {
          ...s1,
          started_at: s1.started_at || new Date().toISOString(),
          tasks: await Promise.all(
            tasks1.map(async (task: any) => {
              const metrics = await getTaskMetrics(task.id);
              const metricsObj = metrics.reduce((acc: any, m: any) => {
                acc[m.metric_name] = m.metric_value;
                return acc;
              }, {});
              return { ...task, metrics: metricsObj };
            })
          ),
        };

        const session2WithMetrics = {
          ...s2,
          started_at: s2.started_at || new Date().toISOString(),
          tasks: await Promise.all(
            tasks2.map(async (task: any) => {
              const metrics = await getTaskMetrics(task.id);
              const metricsObj = metrics.reduce((acc: any, m: any) => {
                acc[m.metric_name] = m.metric_value;
                return acc;
              }, {});
              return { ...task, metrics: metricsObj };
            })
          ),
        };

        setSession1(session1WithMetrics);
        setSession2(session2WithMetrics);
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err);
        setError(err.message || 'Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [sessionId1, sessionId2]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading sessions for comparison...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !session1 || !session2) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || 'Failed to load sessions'}</Alert>
      </Container>
    );
  }

  // Prepare comparison data
  const getTaskMetric = (session: SessionData, taskName: string, metricName: string): number => {
    const task = session.tasks.find(t => t.task_name === taskName);
    return task?.metrics[metricName] || 0;
  };

  // Radar chart data for overall comparison
  const radarData = [
    {
      metric: 'Balance',
      [session1.child_name]: getTaskMetric(session1, 'one_leg', 'holdTime') * 10,
      [session2.child_name]: getTaskMetric(session2, 'one_leg', 'holdTime') * 10,
    },
    {
      metric: 'Flexibility',
      [session1.child_name]: getTaskMetric(session1, 'raise_hand', 'shoulderFlexionMax'),
      [session2.child_name]: getTaskMetric(session2, 'raise_hand', 'shoulderFlexionMax'),
    },
    {
      metric: 'Symmetry',
      [session1.child_name]: getTaskMetric(session1, 'walk', 'symmetryPercent'),
      [session2.child_name]: getTaskMetric(session2, 'walk', 'symmetryPercent'),
    },
    {
      metric: 'Stability',
      [session1.child_name]: getTaskMetric(session1, 'one_leg', 'wobbleCount') > 0 
        ? 100 - (getTaskMetric(session1, 'one_leg', 'wobbleCount') * 10) 
        : 100,
      [session2.child_name]: getTaskMetric(session2, 'one_leg', 'wobbleCount') > 0 
        ? 100 - (getTaskMetric(session2, 'one_leg', 'wobbleCount') * 10) 
        : 100,
    },
  ];

  // Task duration comparison
  const durationData = Array.from(
    new Set([...session1.tasks.map(t => t.task_name), ...session2.tasks.map(t => t.task_name)])
  ).map(taskName => ({
    task: taskName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    [session1.child_name]: session1.tasks.find(t => t.task_name === taskName)?.duration_seconds || 0,
    [session2.child_name]: session2.tasks.find(t => t.task_name === taskName)?.duration_seconds || 0,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Stack direction="row" alignItems="center" spacing={2}>
          <CompareArrowsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Session Comparison
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Side-by-side analysis of two assessment sessions
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Child Info Comparison */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Session 1: {session1.child_name}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Age:</strong> {session1.child_age} years
                </Typography>
                {session1.child_height_cm && (
                  <Typography variant="body2">
                    <strong>Height:</strong> {session1.child_height_cm} cm
                  </Typography>
                )}
                {session1.child_weight_kg && (
                  <Typography variant="body2">
                    <strong>Weight:</strong> {session1.child_weight_kg} kg
                  </Typography>
                )}
                {session1.child_gender && (
                  <Typography variant="body2">
                    <strong>Gender:</strong> {session1.child_gender}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(session1.started_at).toLocaleDateString()}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <PersonIcon color="secondary" />
                <Typography variant="h6" fontWeight={600}>
                  Session 2: {session2.child_name}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Age:</strong> {session2.child_age} years
                </Typography>
                {session2.child_height_cm && (
                  <Typography variant="body2">
                    <strong>Height:</strong> {session2.child_height_cm} cm
                  </Typography>
                )}
                {session2.child_weight_kg && (
                  <Typography variant="body2">
                    <strong>Weight:</strong> {session2.child_weight_kg} kg
                  </Typography>
                )}
                {session2.child_gender && (
                  <Typography variant="body2">
                    <strong>Gender:</strong> {session2.child_gender}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(session2.started_at).toLocaleDateString()}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* Radar Chart - Overall Performance */}
        <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Overall Performance Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name={session1.child_name}
                  dataKey={session1.child_name}
                  stroke="#1976d2"
                  fill="#1976d2"
                  fillOpacity={0.6}
                />
                <Radar
                  name={session2.child_name}
                  dataKey={session2.child_name}
                  stroke="#d32f2f"
                  fill="#d32f2f"
                  fillOpacity={0.6}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Bar Chart - Task Duration */}
        <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Task Duration Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="task" />
                <YAxis label={{ value: 'Duration (seconds)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={session1.child_name} fill="#1976d2" />
                <Bar dataKey={session2.child_name} fill="#d32f2f" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Detailed Metrics Table */}
        <Box sx={{ flex: "1 1 100%" }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Detailed Metrics Comparison
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Task</strong></TableCell>
                    <TableCell><strong>Metric</strong></TableCell>
                    <TableCell align="center"><strong>{session1.child_name}</strong></TableCell>
                    <TableCell align="center"><strong>{session2.child_name}</strong></TableCell>
                    <TableCell align="center"><strong>Difference</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {session1.tasks.map((task1) => {
                    const task2 = session2.tasks.find(t => t.task_name === task1.task_name);
                    return Object.keys(task1.metrics).map((metricName, idx) => {
                      const value1 = task1.metrics[metricName];
                      const value2 = task2?.metrics[metricName] || 0;
                      const diff = value1 - value2;
                      const diffPercent = value2 !== 0 ? ((diff / value2) * 100).toFixed(1) : 'N/A';
                      
                      return (
                        <TableRow key={`${task1.task_name}-${metricName}`}>
                          {idx === 0 && (
                            <TableCell rowSpan={Object.keys(task1.metrics).length}>
                              {task1.task_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </TableCell>
                          )}
                          <TableCell>{metricName}</TableCell>
                          <TableCell align="center">{value1.toFixed(2)}</TableCell>
                          <TableCell align="center">{value2.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${diff > 0 ? '+' : ''}${diff.toFixed(2)} (${diffPercent}%)`}
                              color={diff > 0 ? 'success' : diff < 0 ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default SessionComparison;
