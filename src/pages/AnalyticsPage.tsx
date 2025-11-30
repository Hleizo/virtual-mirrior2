import { useState, useEffect } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import { getAllSessions, getSessionTasks, getTaskMetrics } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsData {
  totalSessions: number;
  totalChildren: number;
  avgAge: number;
  riskDistribution: { name: string; value: number; color: string }[];
  ageDistribution: { ageGroup: string; count: number }[];
  taskPerformance: { taskName: string; avgScore: number; avgDuration: number }[];
  genderDistribution: { name: string; value: number }[];
}

const COLORS = {
  normal: '#2e7d32',
  monitor: '#ed6c02',
  high: '#d32f2f',
  male: '#1976d2',
  female: '#e91e63',
  other: '#9c27b0',
};

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const sessions = await getAllSessions();
        
        if (sessions.length === 0) {
          setAnalytics({
            totalSessions: 0,
            totalChildren: 0,
            avgAge: 0,
            riskDistribution: [],
            ageDistribution: [],
            taskPerformance: [],
            genderDistribution: [],
          });
          setLoading(false);
          return;
        }

        // Calculate basic stats
        const totalSessions = sessions.length;
        const uniqueChildren = new Set(sessions.map((s: any) => s.child_name)).size;
        const avgAge = sessions.reduce((sum: number, s: any) => sum + (s.child_age || 0), 0) / sessions.length;

        // Risk distribution
        const riskCounts = { normal: 0, monitor: 0, high: 0 };
        sessions.forEach((s: any) => {
          const risk = s.risk_level || 'normal';
          riskCounts[risk as keyof typeof riskCounts] = (riskCounts[risk as keyof typeof riskCounts] || 0) + 1;
        });

        const riskDistribution = [
          { name: 'Normal', value: riskCounts.normal, color: COLORS.normal },
          { name: 'Monitor', value: riskCounts.monitor, color: COLORS.monitor },
          { name: 'High Risk', value: riskCounts.high, color: COLORS.high },
        ].filter(item => item.value > 0);

        // Age distribution
        const ageGroups = { '0-5': 0, '6-10': 0, '11-15': 0, '16+': 0 };
        sessions.forEach((s: any) => {
          const age = s.child_age || 0;
          if (age <= 5) ageGroups['0-5']++;
          else if (age <= 10) ageGroups['6-10']++;
          else if (age <= 15) ageGroups['11-15']++;
          else ageGroups['16+']++;
        });

        const ageDistribution = Object.entries(ageGroups).map(([ageGroup, count]) => ({
          ageGroup,
          count,
        }));

        // Gender distribution
        const genderCounts: any = {};
        sessions.forEach((s: any) => {
          const gender = s.child_gender || 'Other';
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        });

        const genderDistribution = Object.entries(genderCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: value as number,
        }));

        // Task performance - fetch tasks for a sample of sessions
        const taskMetricsMap: any = {};
        const sampleSize = Math.min(10, sessions.length); // Analyze up to 10 sessions
        
        for (let i = 0; i < sampleSize; i++) {
          const session = sessions[i];
          try {
            const tasks = await getSessionTasks(session.id);
            
            for (const task of tasks) {
              if (!taskMetricsMap[task.task_name]) {
                taskMetricsMap[task.task_name] = {
                  durations: [],
                  scores: [],
                };
              }
              
              taskMetricsMap[task.task_name].durations.push(task.duration_seconds || 0);
              
              // Fetch metrics to calculate score
              const metrics = await getTaskMetrics(task.id);
              const metricsObj = metrics.reduce((acc: any, m: any) => {
                acc[m.metric_name] = m.metric_value;
                return acc;
              }, {});
              
              // Simple scoring based on available metrics
              let score = 50; // Default
              if (metricsObj.holdTime) score = Math.min(100, (metricsObj.holdTime / 10) * 100);
              else if (metricsObj.shoulderFlexionMax) score = Math.min(100, metricsObj.shoulderFlexionMax);
              else if (metricsObj.symmetryPercent) score = metricsObj.symmetryPercent;
              
              taskMetricsMap[task.task_name].scores.push(score);
            }
          } catch (err) {
            console.warn('Failed to fetch tasks for session:', session.id);
          }
        }

        const taskPerformance = Object.entries(taskMetricsMap).map(([taskName, data]: [string, any]) => ({
          taskName: taskName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          avgScore: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length || 0,
          avgDuration: data.durations.reduce((a: number, b: number) => a + b, 0) / data.durations.length || 0,
        }));

        setAnalytics({
          totalSessions,
          totalChildren: uniqueChildren,
          avgAge: Math.round(avgAge * 10) / 10,
          riskDistribution,
          ageDistribution,
          taskPerformance,
          genderDistribution,
        });
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading analytics...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!analytics) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of assessment data and performance metrics
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
        <Box sx={{ flex: "1 1 22%", minWidth: "200px" }}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 1.5 }}>
                  <AssessmentIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {analytics.totalSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sessions
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 22%", minWidth: "200px" }}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: 'success.main', borderRadius: 2, p: 1.5 }}>
                  <PeopleIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {analytics.totalChildren}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Children
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 22%", minWidth: "200px" }}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: 'info.main', borderRadius: 2, p: 1.5 }}>
                  <TrendingUpIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {analytics.avgAge}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Age
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: "1 1 22%", minWidth: "200px" }}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ bgcolor: 'warning.main', borderRadius: 2, p: 1.5 }}>
                  <WarningIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {analytics.riskDistribution.find(r => r.name === 'High Risk')?.value || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Risk Cases
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts Grid */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* Risk Distribution Pie Chart */}
        <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Risk Level Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Age Distribution Bar Chart */}
        <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Age Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageGroup" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1976d2" name="Number of Children" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Gender Distribution Pie Chart */}
        <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Gender Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.genderDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#9c27b0'} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Task Performance */}
        {analytics.taskPerformance.length > 0 && (
          <Box sx={{ flex: "1 1 45%", minWidth: "300px" }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Average Task Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.taskPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="taskName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#2e7d32" name="Avg Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
        )}

        {/* Task Duration */}
        {analytics.taskPerformance.length > 0 && (
          <Box sx={{ flex: "1 1 100%" }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Average Task Duration (seconds)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.taskPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="taskName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgDuration" stroke="#1976d2" strokeWidth={2} name="Duration (s)" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default AnalyticsPage;

