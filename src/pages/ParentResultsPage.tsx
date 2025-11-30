import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Download as DownloadIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useMemo, useRef, useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import { gradeMetric, getLevelColor } from '../clinical/standards';
import type { TaskName } from '../store/session';
import { getSession, getSessionTasks, getTaskMetrics } from '../services/api';

interface SessionData {
  session: any;
  tasks: Array<{
    task: TaskName;
    metrics: Record<string, number>;
    status?: string;
    notes?: string;
  }>;
}

const ParentResultsPage = () => {
  const navigate = useNavigate();
  const { sessionId: sessionIdFromUrl } = useParams<{ sessionId: string }>();
  
  const contentRef = useRef<HTMLDivElement>(null);
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
              status: task.status || 'success', // Track if task failed
              notes: task.notes || '',
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
          setError('Session not found. It may have been deleted or is from a previous database version.');
        } else {
          setError('Failed to load session data. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionIdFromUrl]);

  // Helper: get primary metric for a task
  const getPrimaryMetric = (taskName: TaskName, metrics: Record<string, number | string>) => {
    switch (taskName) {
      case 'raise_hand':
        return { name: 'Shoulder Flexion', value: metrics.shoulderFlexionMax ?? 0 };
      case 'one_leg':
        return { name: 'Hold Time', value: metrics.holdTime ?? 0 };
      case 'walk':
        return { name: 'Gait Symmetry', value: metrics.symmetryPercent ?? 0 };
      case 'jump':
        return { name: 'Jump Height', value: metrics.jumpHeightPercent ?? 0 };
      default:
        return { name: 'Unknown', value: 0 };
    }
  };

  // Clinical grades for each task
  const clinicalGrades = useMemo(() => {
    if (!sessionData) return [];
    return sessionData.tasks.map((t) => {
      const primary = getPrimaryMetric(t.task, t.metrics);
      const age = sessionData.session.child_age;
      const grade = gradeMetric(t.task, primary.name, primary.value as number, age);
      return { taskName: t.task, ...grade };
    });
  }, [sessionData]);

  // Overall score (0-100) from clinical grades
  const overallScore = useMemo(() => {
    if (clinicalGrades.length === 0) return 0;
    const scoreMap: Record<string, number> = { normal: 100, borderline: 70, abnormal: 30 };
    const total = clinicalGrades.reduce((sum: number, g: any) => sum + (scoreMap[g.level] || 0), 0);
    return Math.round(total / clinicalGrades.length);
  }, [clinicalGrades]);

  // Get tip based on grade level
  const getTip = (level: 'normal' | 'borderline' | 'abnormal', taskName: TaskName): string => {
    if (level === 'normal') {
      return 'Keep practicing healthy movement! Your child is doing well.';
    } else if (level === 'borderline') {
      const taskTips: Record<TaskName, string> = {
        raise_hand: 'Practice reaching overhead with both arms during play for 5–10 minutes daily.',
        one_leg: 'Practice standing on one leg for 5 seconds daily—try balance games like flamingo pose.',
        walk: 'Encourage walking on different surfaces (grass, sand) to improve gait symmetry.',
        jump: 'Practice jumping activities like hopscotch or jump rope for 10 minutes daily.',
      };
      return taskTips[taskName] || 'Continue practicing this movement pattern regularly.';
    } else {
      return 'Consider consulting a pediatric physiotherapist for personalized guidance.';
    }
  };

  // Download results as PNG
  const handleDownloadPNG = async () => {
    if (!contentRef.current || !sessionData) return;
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${sessionData.session.child_name || 'Child'}-Results.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to generate PNG:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
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
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <div ref={contentRef}>
        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Assessment Results
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Session completed on {new Date(sessionData.session.created_at).toLocaleDateString()}
          {sessionData.session.child_name && ` • ${sessionData.session.child_name}`}
          {sessionData.session.child_age && ` • Age: ${sessionData.session.child_age} years`}
        </Typography>

        {/* Overall Score Donut Chart */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Overall Score
          </Typography>
          <Box sx={{ width: '100%', height: 250, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                data={[{ score: overallScore }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="score"
                  cornerRadius={10}
                  fill={overallScore >= 85 ? '#4caf50' : overallScore >= 65 ? '#ff9800' : '#f44336'}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h2" fontWeight={700}>
                {overallScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                out of 100
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
            {overallScore >= 85 
              ? '🎉 Excellent! Your child shows healthy motor development.'
              : overallScore >= 65 
              ? '⚠️ Some areas may benefit from practice and monitoring.'
              : '⚠️ Consider consulting a pediatric physiotherapist for guidance.'}
          </Typography>
        </Paper>

      {/* Failed Tasks Warning */}
      {sessionData.tasks.some(t => t.status === 'failed') && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="body1" fontWeight={600} gutterBottom>
            Some tasks were not completed
          </Typography>
          <Typography variant="body2">
            {sessionData.tasks.filter(t => t.status === 'failed').length} task(s) were not completed during the assessment. 
            This may affect the overall evaluation. Consider retrying these tasks for a more complete assessment.
          </Typography>
        </Alert>
      )}

      {/* Task Cards */}
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Activity Details
      </Typography>
      <Stack spacing={3} sx={{ mb: 3 }}>
        {sessionData.tasks.map((task, index: number) => {
          const isFailed = task.status === 'failed';
          const grade = clinicalGrades.find((g: any) => g.taskName === task.task);
          
          if (isFailed) {
            // Show failed task card
            return (
              <Card key={index} variant="outlined" sx={{ borderColor: 'error.main', borderWidth: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <CancelIcon 
                      color="error" 
                      sx={{ fontSize: '2.5rem' }} 
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {task.task.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="error.main" fontWeight={600}>
                        Task Not Completed
                      </Typography>
                    </Box>
                    <Chip 
                      label="Failed"
                      color="error"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>

                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> This task was not completed during the assessment. 
                      {task.notes && ` Reason: ${task.notes.replace('Failed: ', '')}`}
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            );
          }
          
          if (!grade) return null;
          
          const tip = getTip(grade.level, task.task);
          const color = getLevelColor(grade.level);

          return (
            <Card key={index} variant="outlined">
              <CardContent>
                {/* Task Header */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <CheckCircleIcon 
                    color={color} 
                    sx={{ fontSize: '2.5rem' }} 
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {task.task.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {grade.note}
                    </Typography>
                  </Box>
                  <Chip 
                    label={grade.level}
                    color={color}
                    sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                  />
                </Stack>

                {/* Tip Alert */}
                <Alert severity={color} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> {tip}
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
      </div>

      {/* Actions */}
      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadPNG}
          sx={{ flex: 1, minWidth: '200px' }}
        >
          Download Results
        </Button>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ flex: 1, minWidth: '200px' }}
        >
          Back to Home
        </Button>
      </Stack>
    </Container>
  );
};

export default ParentResultsPage;
