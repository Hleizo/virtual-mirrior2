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
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { getSession, getFollowupSessions, getSessionTasks, getTaskMetrics } from '../services/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface SessionWithTasks {
  id: string;
  child_name: string;
  started_at: string;
  session_type: string;
  tasks: Array<{
    task_name: string;
    metrics: { [key: string]: number };
  }>;
}

const ProgressTracking = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialSession, setInitialSession] = useState<SessionWithTasks | null>(null);
  const [followupSessions, setFollowupSessions] = useState<SessionWithTasks[]>([]);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch initial session
        const session = await getSession(sessionId);
        const tasks = await getSessionTasks(sessionId);

        const tasksWithMetrics = await Promise.all(
          tasks.map(async (task: any) => {
            const metrics = await getTaskMetrics(task.id);
            const metricsObj = metrics.reduce((acc: any, m: any) => {
              acc[m.metric_name] = m.metric_value;
              return acc;
            }, {});
            return {
              task_name: task.task_name,
              metrics: metricsObj,
            };
          })
        );

        setInitialSession({
          ...session,
          started_at: session.started_at || new Date().toISOString(),
          session_type: session.session_type || 'initial',
          tasks: tasksWithMetrics,
        });

        // Fetch follow-up sessions
        const followups = await getFollowupSessions(sessionId);
        
        const followupsWithTasks = await Promise.all(
          followups.map(async (followup: any) => {
            const followupTasks = await getSessionTasks(followup.id);
            const followupTasksWithMetrics = await Promise.all(
              followupTasks.map(async (task: any) => {
                const metrics = await getTaskMetrics(task.id);
                const metricsObj = metrics.reduce((acc: any, m: any) => {
                  acc[m.metric_name] = m.metric_value;
                  return acc;
                }, {});
                return {
                  task_name: task.task_name,
                  metrics: metricsObj,
                };
              })
            );
            return {
              ...followup,
              tasks: followupTasksWithMetrics,
            };
          })
        );

        setFollowupSessions(followupsWithTasks);
      } catch (err: any) {
        console.error('Failed to fetch progress data:', err);
        setError(err.message || 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [sessionId]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading progress data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !initialSession) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || 'Failed to load session'}</Alert>
      </Container>
    );
  }

  // Prepare progress data for charts
  const allSessions = [initialSession, ...followupSessions];
  
  const taskNames = Array.from(new Set(allSessions.flatMap(s => s.tasks.map(t => t.task_name))));

  const progressData = taskNames.map(taskName => {
    const dataPoint: any = { task: taskName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
    
    allSessions.forEach((session, idx) => {
      const task = session.tasks.find(t => t.task_name === taskName);
      const sessionLabel = idx === 0 ? 'Initial' : `Follow-up ${idx}`;
      const date = new Date(session.started_at).toLocaleDateString();
      
      // Get primary metric for this task
      if (task) {
        if (task.metrics.holdTime) {
          dataPoint[`${sessionLabel} (${date})`] = task.metrics.holdTime;
        } else if (task.metrics.shoulderFlexionMax) {
          dataPoint[`${sessionLabel} (${date})`] = task.metrics.shoulderFlexionMax;
        } else if (task.metrics.symmetryPercent) {
          dataPoint[`${sessionLabel} (${date})`] = task.metrics.symmetryPercent;
        } else if (task.metrics.duration) {
          dataPoint[`${sessionLabel} (${date})`] = task.metrics.duration;
        }
      }
    });
    
    return dataPoint;
  });

  // Calculate improvements
  const calculateImprovement = (taskName: string, metricName: string): number | null => {
    const initialTask = initialSession.tasks.find(t => t.task_name === taskName);
    const latestFollowup = followupSessions[followupSessions.length - 1];
    
    if (!latestFollowup) return null;
    
    const followupTask = latestFollowup.tasks.find(t => t.task_name === taskName);
    
    if (!initialTask || !followupTask) return null;
    
    const initialValue = initialTask.metrics[metricName];
    const followupValue = followupTask.metrics[metricName];
    
    if (initialValue === undefined || followupValue === undefined) return null;
    
    return ((followupValue - initialValue) / initialValue) * 100;
  };

  const colors = ['#1976d2', '#d32f2f', '#2e7d32', '#ed6c02', '#9c27b0'];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Stack direction="row" alignItems="center" spacing={2}>
          <TimelineIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Progress Tracking: {initialSession.child_name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track improvements across {allSessions.length} session{allSessions.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h3" fontWeight={600} color="primary">
                {allSessions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {followupSessions.length} follow-up session{followupSessions.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                First Session
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {new Date(initialSession.started_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 30%", minWidth: "250px" }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Latest Session
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {followupSessions.length > 0
                  ? new Date(followupSessions[followupSessions.length - 1].started_at).toLocaleDateString()
                  : 'No follow-ups yet'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Progress Chart */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Performance Progress Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="task" />
            <YAxis />
            <Tooltip />
            <Legend />
            {allSessions.map((session, idx) => {
              const sessionLabel = idx === 0 ? 'Initial' : `Follow-up ${idx}`;
              const date = new Date(session.started_at).toLocaleDateString();
              return (
                <Bar
                  key={session.id}
                  dataKey={`${sessionLabel} (${date})`}
                  fill={colors[idx % colors.length]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Improvement Summary */}
      {followupSessions.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Improvement Summary (vs. Initial Session)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {taskNames.map(taskName => {
              const improvements = [
                { name: 'holdTime', label: 'Balance Hold Time' },
                { name: 'shoulderFlexionMax', label: 'Shoulder Flexion' },
                { name: 'symmetryPercent', label: 'Gait Symmetry' },
              ];

              return improvements.map(({ name, label }) => {
                const improvement = calculateImprovement(taskName, name);
                if (improvement === null) return null;

                return (
                  <Box sx={{ flex: "1 1 30%", minWidth: "250px" }} key={`${taskName}-${name}`}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          {taskName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {label}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                          {improvement > 0 ? (
                            <TrendingUpIcon color="success" />
                          ) : (
                            <TrendingDownIcon color="error" />
                          )}
                          <Typography
                            variant="h5"
                            fontWeight={600}
                            color={improvement > 0 ? 'success.main' : 'error.main'}
                          >
                            {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                );
              }).filter(Boolean);
            })}
          </Box>
        </Paper>
      )}

      {/* No Follow-ups Message */}
      {followupSessions.length === 0 && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Follow-up Sessions Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Record a follow-up session to track progress over time
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(`/parent/session?followup=${sessionId}`)}
          >
            Record Follow-Up Session
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default ProgressTracking;

