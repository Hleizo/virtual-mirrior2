import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HeightIcon from '@mui/icons-material/Height';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import { getSession, getSessionTasks, getTaskMetrics } from '../services/api';
import { gradeMetric, getLevelColor } from '../clinical/standards';
import type { TaskName } from '../store/session';

interface SessionDetailsModalProps {
  sessionId: string | null;
  open: boolean;
  onClose: () => void;
}

const SessionDetailsModal = ({ sessionId, open, onClose }: SessionDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId || !open) return;

    const fetchSessionDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch session
        const session = await getSession(sessionId);
        setSessionData(session);

        // Fetch tasks
        const tasksData = await getSessionTasks(sessionId);
        
        // Fetch metrics for each task
        const tasksWithMetrics = await Promise.all(
          tasksData.map(async (task: any) => {
            const metricsData = await getTaskMetrics(task.id);
            
            const metricsObj: Record<string, number> = {};
            metricsData.forEach((metric: any) => {
              metricsObj[metric.metric_name] = metric.metric_value;
            });
            
            return {
              ...task,
              metrics: metricsObj,
            };
          })
        );
        
        setTasks(tasksWithMetrics);
      } catch (err: any) {
        console.error('Failed to fetch session details:', err);
        setError(err.message || 'Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, open]);

  const getTaskLabel = (taskName: string) => {
    const labels: Record<string, string> = {
      raise_hand: 'Raise Hand',
      one_leg: 'One Leg Balance',
      walk: 'Walking',
      jump: 'Jumping',
    };
    return labels[taskName] || taskName;
  };

  const getPrimaryMetric = (taskName: TaskName, metrics: Record<string, number>) => {
    switch (taskName) {
      case 'raise_hand':
        return { name: 'Shoulder Flexion', value: metrics.shoulderFlexionMax ?? 0, unit: '°' };
      case 'one_leg':
        return { name: 'Hold Time', value: metrics.holdTime ?? 0, unit: 's' };
      case 'walk':
        return { name: 'Gait Symmetry', value: metrics.symmetryPercent ?? 0, unit: '%' };
      case 'jump':
        return { name: 'Jump Height', value: metrics.jumpHeightPercent ?? 0, unit: '%' };
      default:
        return { name: 'Unknown', value: 0, unit: '' };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={600}>
            Session Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && sessionData && (
          <Stack spacing={3}>
            {/* Child Information */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Child Information
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ flex: "1 1 45%" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {sessionData.child_name}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ flex: "1 1 45%" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarTodayIcon color="action" fontSize="small" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Age
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {sessionData.child_age} years
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  {sessionData.child_height_cm && (
                    <Box sx={{ flex: "1 1 45%" }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HeightIcon color="action" fontSize="small" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Height
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {sessionData.child_height_cm} cm
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  {sessionData.child_weight_kg && (
                    <Box sx={{ flex: "1 1 45%" }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MonitorWeightIcon color="action" fontSize="small" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Weight
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {sessionData.child_weight_kg} kg
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  {sessionData.child_gender && (
                    <Box sx={{ flex: "1 1 45%" }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Gender
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {sessionData.child_gender}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Tasks and Results */}
            <Box>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Assessment Results
              </Typography>
              <Stack spacing={2}>
                {tasks.map((task) => {
                  const primary = getPrimaryMetric(task.task_name as TaskName, task.metrics);
                  const grade = gradeMetric(
                    task.task_name as TaskName,
                    primary.name,
                    primary.value,
                    sessionData.child_age
                  );

                  return (
                    <Card key={task.id} variant="outlined">
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {getTaskLabel(task.task_name)}
                          </Typography>
                          <Chip
                            label={grade.level}
                            size="small"
                            sx={{
                              bgcolor: getLevelColor(grade.level),
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {primary.name}
                          </Typography>
                          <Typography variant="h5" fontWeight={600}>
                            {primary.value.toFixed(1)}{primary.unit}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {grade.note}
                          </Typography>
                        </Box>

                        {/* Additional Metrics */}
                        {Object.keys(task.metrics).length > 1 && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              Additional Metrics
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {Object.entries(task.metrics).map(([key, value]) => {
                                if (typeof value === 'number' && key !== primary.name.toLowerCase().replace(/ /g, '')) {
                                  return (
                                    <Box sx={{ flex: "1 1 45%" }} key={key}>
                                      <Typography variant="caption" color="text.secondary">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </Typography>
                                      <Typography variant="body2" fontWeight={500}>
                                        {value.toFixed(1)}
                                      </Typography>
                                    </Box>
                                  );
                                }
                                return null;
                              })}
                            </Box>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailsModal;
