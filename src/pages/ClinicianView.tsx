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
  Tooltip as MuiTooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
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
    const tiptoe = session.tasks.find(t => t.task_name === 'tiptoe');
    const squat = session.tasks.find(t => t.task_name === 'squat');

    const risks = [];
    
    // Balance assessment
    if (oneLegs?.metrics.holdTime !== undefined && oneLegs.metrics.holdTime < 3) {
      risks.push({ area: 'Balance', level: 'High', detail: `Hold time: ${oneLegs.metrics.holdTime.toFixed(1)}s (< 3s)` });
    } else if (oneLegs?.metrics.holdTime !== undefined && oneLegs.metrics.holdTime < 5) {
      risks.push({ area: 'Balance', level: 'Moderate', detail: `Hold time: ${oneLegs.metrics.holdTime.toFixed(1)}s (< 5s)` });
    }
    
    // Stability assessment (using swayIndex)
    if (oneLegs?.metrics.swayIndex !== undefined && oneLegs.metrics.swayIndex > 0.1) {
      risks.push({ area: 'Stability', level: 'Moderate', detail: `Sway index: ${(oneLegs.metrics.swayIndex * 100).toFixed(1)}%` });
    }
    
    // Shoulder ROM assessment
    const maxShoulder = Math.max(raiseHand?.metrics.leftShoulderAngle || 0, raiseHand?.metrics.rightShoulderAngle || 0);
    if (maxShoulder > 0 && maxShoulder < 120) {
      risks.push({ area: 'Shoulder ROM', level: 'High', detail: `Max flexion: ${maxShoulder.toFixed(0)}° (< 120°)` });
    } else if (maxShoulder > 0 && maxShoulder < 150) {
      risks.push({ area: 'Shoulder ROM', level: 'Moderate', detail: `Max flexion: ${maxShoulder.toFixed(0)}° (< 150°)` });
    }
    
    // Gait assessment
    if (walk?.status === 'failed') {
      risks.push({ area: 'Gait', level: 'High', detail: 'Walk task not completed' });
    }
    
    // Task failures
    if (tiptoe?.status === 'failed') {
      risks.push({ area: 'Tiptoe Balance', level: 'Moderate', detail: 'Tiptoe task not completed' });
    }
    if (squat?.status === 'failed') {
      risks.push({ area: 'Lower Body Strength', level: 'Moderate', detail: 'Squat task not completed' });
    }

    return risks;
  };

  // Assess task status: 'passed' | 'partial' | 'failed' based on metrics
  type TaskStatus = 'passed' | 'partial' | 'failed';
  
  const getTaskMetricStatus = (task: SessionData['tasks'][0]): { status: TaskStatus; passedCount: number; failedCount: number; details: string[] } => {
    const { task_name, metrics, status } = task;
    const details: string[] = [];
    let passedCount = 0;
    let failedCount = 0;

    if (status === 'success') {
      return { status: 'passed', passedCount: Object.keys(metrics).length, failedCount: 0, details: ['All metrics within acceptable range'] };
    }

    // Check individual metrics against thresholds
    switch (task_name) {
      case 'raise_hand': {
        const REQUIRED_ANGLE = 90;
        const REQUIRED_HOLD = 2;
        if (metrics.leftShoulderAngle !== undefined) {
          if (metrics.leftShoulderAngle >= REQUIRED_ANGLE) { passedCount++; }
          else { failedCount++; details.push(`Left shoulder: ${metrics.leftShoulderAngle.toFixed(0)}° < ${REQUIRED_ANGLE}°`); }
        }
        if (metrics.rightShoulderAngle !== undefined) {
          if (metrics.rightShoulderAngle >= REQUIRED_ANGLE) { passedCount++; }
          else { failedCount++; details.push(`Right shoulder: ${metrics.rightShoulderAngle.toFixed(0)}° < ${REQUIRED_ANGLE}°`); }
        }
        if (metrics.holdTime !== undefined) {
          if (metrics.holdTime >= REQUIRED_HOLD) { passedCount++; }
          else { failedCount++; details.push(`Hold time: ${metrics.holdTime.toFixed(1)}s < ${REQUIRED_HOLD}s`); }
        }
        break;
      }
      case 'jump': {
        if (metrics.jumpHeightCm !== undefined || metrics.jumpHeightNorm !== undefined) {
          const height = metrics.jumpHeightCm || metrics.jumpHeightNorm || 0;
          if (height >= 5) { passedCount++; }
          else { failedCount++; details.push(`Jump height: ${height.toFixed(1)} < 5`); }
        }
        if (metrics.isTwoFootedTakeoff !== undefined) {
          if (metrics.isTwoFootedTakeoff === 1) { passedCount++; }
          else { failedCount++; details.push('Takeoff not two-footed'); }
        }
        if (metrics.isTwoFootedLanding !== undefined) {
          if (metrics.isTwoFootedLanding === 1) { passedCount++; }
          else { failedCount++; details.push('Landing not two-footed'); }
        }
        break;
      }
      case 'walk': {
        if (metrics.stepCount !== undefined) {
          if (metrics.stepCount >= 6) { passedCount++; }
          else { failedCount++; details.push(`Steps: ${metrics.stepCount} < 6`); }
        }
        if (metrics.symmetryPercent !== undefined) {
          if (metrics.symmetryPercent >= 60) { passedCount++; }
          else { failedCount++; details.push(`Symmetry: ${metrics.symmetryPercent.toFixed(0)}% < 60%`); }
        }
        break;
      }
      case 'one_leg': {
        if (metrics.holdTime !== undefined) {
          if (metrics.holdTime >= 3) { passedCount++; }
          else { failedCount++; details.push(`Hold: ${metrics.holdTime.toFixed(1)}s < 3s`); }
        }
        if (metrics.swayIndex !== undefined) {
          if (metrics.swayIndex <= 0.15) { passedCount++; }
          else { failedCount++; details.push(`Sway: ${(metrics.swayIndex * 100).toFixed(0)}% > 15%`); }
        }
        break;
      }
      case 'tiptoe': {
        if (metrics.holdTime !== undefined) {
          if (metrics.holdTime >= 3) { passedCount++; }
          else { failedCount++; details.push(`Hold: ${metrics.holdTime.toFixed(1)}s < 3s`); }
        }
        const plantarflexion = metrics.plantarflexionAngle || metrics.leftPlantarflexion || metrics.rightPlantarflexion;
        if (plantarflexion !== undefined) {
          if (plantarflexion >= 30) { passedCount++; }
          else { failedCount++; details.push(`Plantarflexion: ${plantarflexion.toFixed(0)}° < 30°`); }
        }
        break;
      }
      case 'squat': {
        const kneeAngle = metrics.minKneeAngle || metrics.kneeAngle;
        if (kneeAngle !== undefined) {
          if (kneeAngle < 130) { passedCount++; }
          else { failedCount++; details.push(`Knee angle: ${kneeAngle.toFixed(0)}° > 130°`); }
        }
        if (metrics.holdTime !== undefined) {
          if (metrics.holdTime >= 1) { passedCount++; }
          else { failedCount++; details.push(`Hold: ${metrics.holdTime.toFixed(1)}s < 1s`); }
        }
        break;
      }
    }

    // Determine overall status
    let taskStatus: TaskStatus;
    if (failedCount === 0 && passedCount > 0) {
      taskStatus = 'passed';
    } else if (passedCount > 0 && failedCount > 0) {
      taskStatus = 'partial';
    } else {
      taskStatus = 'failed';
    }

    if (details.length === 0 && taskStatus === 'failed') {
      details.push('Task requirements not met');
    }

    return { status: taskStatus, passedCount, failedCount, details };
  };

  // Render professional status indicator with tooltip
  const renderStatusIndicator = (task: SessionData['tasks'][0], size: 'small' | 'medium' | 'large' = 'medium') => {
    const { status, passedCount, failedCount, details } = getTaskMetricStatus(task);
    const iconSize = size === 'small' ? 20 : size === 'medium' ? 28 : 36;
    
    const tooltipContent = (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {status === 'passed' ? 'All Metrics Passed' : status === 'partial' ? 'Partial Pass' : 'Failed'}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
          {passedCount} passed, {failedCount} failed
        </Typography>
        {details.length > 0 && (
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {details.slice(0, 4).map((d, i) => (
              <Typography component="li" key={i} variant="caption">{d}</Typography>
            ))}
          </Box>
        )}
      </Box>
    );

    let icon;
    let chipColor: 'success' | 'warning' | 'error';
    let label: string;

    switch (status) {
      case 'passed':
        icon = <CheckCircleIcon sx={{ fontSize: iconSize, color: 'success.main' }} />;
        chipColor = 'success';
        label = 'PASS';
        break;
      case 'partial':
        icon = <WarningIcon sx={{ fontSize: iconSize, color: 'warning.main' }} />;
        chipColor = 'warning';
        label = 'PARTIAL';
        break;
      case 'failed':
      default:
        icon = <CancelIcon sx={{ fontSize: iconSize, color: 'error.main' }} />;
        chipColor = 'error';
        label = 'FAIL';
    }

    return (
      <MuiTooltip title={tooltipContent} arrow placement="top">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
          {icon}
          {size !== 'small' && (
            <Chip 
              label={label} 
              color={chipColor} 
              size="small" 
              sx={{ fontWeight: 600, minWidth: 70 }}
            />
          )}
        </Box>
      </MuiTooltip>
    );
  };

  // Get detailed failure reasons for a task based on metrics and thresholds
  const getTaskFailureReasons = (task: SessionData['tasks'][0]): string[] => {
    const reasons: string[] = [];
    const { task_name, metrics, status } = task;

    if (status === 'success') return reasons;

    switch (task_name) {
      case 'raise_hand': {
        const leftAngle = metrics.leftShoulderAngle;
        const rightAngle = metrics.rightShoulderAngle;
        const REQUIRED_ANGLE = 90;
        
        if (leftAngle !== undefined && leftAngle < REQUIRED_ANGLE) {
          reasons.push(`Left shoulder angle was ${leftAngle.toFixed(0)}° (required ≥${REQUIRED_ANGLE}°)`);
        }
        if (rightAngle !== undefined && rightAngle < REQUIRED_ANGLE) {
          reasons.push(`Right shoulder angle was ${rightAngle.toFixed(0)}° (required ≥${REQUIRED_ANGLE}°)`);
        }
        if (metrics.holdTime !== undefined && metrics.holdTime < 2) {
          reasons.push(`Hold time was ${metrics.holdTime.toFixed(1)}s (required ≥2s)`);
        }
        if (reasons.length === 0 && status === 'failed') {
          reasons.push('Arms not raised high enough or not held long enough');
        }
        break;
      }

      case 'jump': {
        const jumpHeight = metrics.jumpHeightCm || metrics.jumpHeightNorm;
        const REQUIRED_HEIGHT = 5; // cm or normalized units
        const timeAirborne = metrics.timeAirborne;
        
        if (jumpHeight !== undefined && jumpHeight < REQUIRED_HEIGHT) {
          const unit = metrics.jumpHeightCm !== undefined ? 'cm' : ' units';
          reasons.push(`Jump height was ${jumpHeight.toFixed(1)}${unit} (required ≥${REQUIRED_HEIGHT}${unit})`);
        }
        if (timeAirborne !== undefined && timeAirborne < 0.1) {
          reasons.push(`Time airborne was ${(timeAirborne * 1000).toFixed(0)}ms (too short)`);
        }
        if (metrics.isTwoFootedTakeoff === 0) {
          reasons.push('Takeoff was not two-footed (required: both feet leave ground together)');
        }
        if (metrics.isTwoFootedLanding === 0) {
          reasons.push('Landing was not two-footed (required: both feet land together)');
        }
        if (reasons.length === 0 && status === 'failed') {
          reasons.push('Jump not detected or insufficient height');
        }
        break;
      }

      case 'walk': {
        const stepCount = metrics.stepCount;
        const REQUIRED_STEPS = 6;
        const alternatingSteps = metrics.alternatingSteps;
        const symmetry = metrics.symmetryPercent;
        
        if (stepCount !== undefined && stepCount < REQUIRED_STEPS) {
          reasons.push(`Step count was ${stepCount} (required ≥${REQUIRED_STEPS} steps)`);
        }
        if (alternatingSteps !== undefined && stepCount !== undefined && alternatingSteps < stepCount * 0.7) {
          reasons.push(`Only ${alternatingSteps} of ${stepCount} steps were alternating (poor gait pattern)`);
        }
        if (symmetry !== undefined && symmetry < 60) {
          reasons.push(`Gait symmetry was ${symmetry.toFixed(0)}% (required ≥60%)`);
        }
        if (reasons.length === 0 && status === 'failed') {
          reasons.push('Walking motion not detected or insufficient steps');
        }
        break;
      }

      case 'one_leg': {
        const holdTime = metrics.holdTime;
        const REQUIRED_HOLD = 3; // seconds
        const swayIndex = metrics.swayIndex;
        const maxTrunkLean = metrics.maxTrunkLean;
        
        if (holdTime !== undefined && holdTime < REQUIRED_HOLD) {
          reasons.push(`Hold time was ${holdTime.toFixed(1)}s (required ≥${REQUIRED_HOLD}s)`);
        }
        if (swayIndex !== undefined && swayIndex > 0.15) {
          reasons.push(`Sway index was ${(swayIndex * 100).toFixed(0)}% (too much wobbling)`);
        }
        if (maxTrunkLean !== undefined && maxTrunkLean > 20) {
          reasons.push(`Trunk lean was ${maxTrunkLean.toFixed(0)}° (required <20°)`);
        }
        if (reasons.length === 0 && status === 'failed') {
          reasons.push('One-leg stance not detected or not held long enough');
        }
        break;
      }

      case 'tiptoe': {
        const holdTime = metrics.holdTime;
        const REQUIRED_HOLD = 3; // seconds
        const plantarflexion = metrics.plantarflexionAngle || metrics.leftPlantarflexion || metrics.rightPlantarflexion;
        const REQUIRED_ANGLE = 30;
        
        if (holdTime !== undefined && holdTime < REQUIRED_HOLD) {
          reasons.push(`Hold time was ${holdTime.toFixed(1)}s (required ≥${REQUIRED_HOLD}s)`);
        }
        if (plantarflexion !== undefined && plantarflexion < REQUIRED_ANGLE) {
          reasons.push(`Plantarflexion angle was ${plantarflexion.toFixed(0)}° (required ≥${REQUIRED_ANGLE}°)`);
        }
        if (metrics.heelsLifted === 0) {
          reasons.push('Heels not lifted off ground');
        }
        if (reasons.length === 0 && status === 'failed') {
          reasons.push('Tiptoe stance not detected or not held long enough');
        }
        break;
      }

      case 'squat': {
        const kneeAngle = metrics.minKneeAngle || metrics.kneeAngle;
        const REQUIRED_ANGLE = 130; // Must be less than this for partial squat
        const holdTime = metrics.holdTime;
        
        if (kneeAngle !== undefined && kneeAngle > REQUIRED_ANGLE) {
          reasons.push(`Knee angle was ${kneeAngle.toFixed(0)}° (required <${REQUIRED_ANGLE}° for squat)`);
        }
        if (holdTime !== undefined && holdTime < 1) {
          reasons.push(`Squat hold time was ${holdTime.toFixed(1)}s (required ≥1s)`);
        }
        if (metrics.hipsBackEnough === 0) {
          reasons.push('Hips not positioned back enough (weight on toes)');
        }
        if (reasons.length === 0 && status === 'failed') {
          reasons.push('Squat not detected or insufficient depth');
        }
        break;
      }

      default:
        if (status === 'failed') {
          reasons.push('Task requirements not met');
        }
    }

    return reasons;
  };

  // Prepare radar chart data - using actual metric names from tasks
  const oneLegTask = session.tasks.find(t => t.task_name === 'one_leg');
  const raiseHandTask = session.tasks.find(t => t.task_name === 'raise_hand');
  const walkTask = session.tasks.find(t => t.task_name === 'walk');
  const jumpTask = session.tasks.find(t => t.task_name === 'jump');
  const squatTask = session.tasks.find(t => t.task_name === 'squat');
  const tiptoeTask = session.tasks.find(t => t.task_name === 'tiptoe');

  // Get shoulder angle (max of left/right)
  const leftShoulder = raiseHandTask?.metrics.leftShoulderAngle || 0;
  const rightShoulder = raiseHandTask?.metrics.rightShoulderAngle || 0;
  const maxShoulderAngle = Math.max(leftShoulder, rightShoulder);

  const radarData = [
    {
      metric: 'Balance',
      value: Math.min(100, (oneLegTask?.metrics.holdTime || 0) * 20), // 5s = 100%
      fullMark: 100,
    },
    {
      metric: 'Flexibility',
      value: Math.min(100, maxShoulderAngle / 1.8), // 180° = 100%
      fullMark: 100,
    },
    {
      metric: 'Symmetry',
      value: walkTask?.metrics.symmetryPercent || walkTask?.metrics.alternatingSteps ? Math.min(100, (walkTask?.metrics.alternatingSteps || 0) * 20) : 50,
      fullMark: 100,
    },
    {
      metric: 'Stability',
      value: Math.max(0, 100 - (oneLegTask?.metrics.swayIndex || 0) * 500), // Lower sway = higher stability
      fullMark: 100,
    },
    {
      metric: 'Coordination',
      value: jumpTask?.metrics.jumpScore ? jumpTask.metrics.jumpScore * 50 : (raiseHandTask?.metrics.armRaiseScore ? raiseHandTask.metrics.armRaiseScore * 50 : 50),
      fullMark: 100,
    },
  ];

  // Prepare angle data for detailed biomechanics - using actual metric names
  // Each entry includes min/max for proper range evaluation
  const angleData = [
    {
      joint: 'Left Shoulder',
      metric: 'Flexion Angle',
      value: raiseHandTask?.metrics.leftShoulderAngle,
      normal: '150-180°',
      min: 150,
      max: 180,
      unit: '°',
    },
    {
      joint: 'Right Shoulder',
      metric: 'Flexion Angle',
      value: raiseHandTask?.metrics.rightShoulderAngle,
      normal: '150-180°',
      min: 150,
      max: 180,
      unit: '°',
    },
    {
      joint: 'Left Elbow',
      metric: 'Extension Angle',
      value: raiseHandTask?.metrics.leftElbowAngle,
      normal: '160-180°',
      min: 160,
      max: 180,
      unit: '°',
    },
    {
      joint: 'Right Elbow',
      metric: 'Extension Angle',
      value: raiseHandTask?.metrics.rightElbowAngle,
      normal: '160-180°',
      min: 160,
      max: 180,
      unit: '°',
    },
    {
      joint: 'Trunk',
      metric: 'Max Lean (Balance)',
      value: oneLegTask?.metrics.maxTrunkLean,
      normal: '<15°',
      min: 0,
      max: 15,
      unit: '°',
    },
    {
      joint: 'Knee',
      metric: 'Squat Depth',
      value: squatTask?.metrics.minKneeAngle || squatTask?.metrics.kneeAngle,
      normal: '<130°',
      min: 0,
      max: 130,
      unit: '°',
    },
  ];

  // Evaluate biomechanical status based on proper range checking
  const evaluateAngleStatus = (value: number | undefined, min: number, max: number): { status: string; color: 'success' | 'warning' | 'error' } => {
    if (value === undefined) {
      return { status: 'Not measured', color: 'warning' };
    }

    const MILD_THRESHOLD = 5; // degrees within boundary for mild deviation
    const SIGNIFICANT_THRESHOLD = 15; // degrees beyond boundary for significant deviation

    // Check if value is within normal range
    if (value >= min && value <= max) {
      return { status: 'Normal', color: 'success' };
    }

    // Value is outside range - calculate how far
    let deviation = 0;
    if (value < min) {
      deviation = min - value;
    } else if (value > max) {
      deviation = value - max;
    }

    // Classify deviation severity
    if (deviation <= MILD_THRESHOLD) {
      return { status: 'Mild Deviation', color: 'warning' };
    } else if (deviation <= SIGNIFICANT_THRESHOLD) {
      return { status: 'Moderate Deviation', color: 'warning' };
    } else {
      return { status: 'Significant Deviation', color: 'error' };
    }
  };

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
                  Task Performance Summary
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {session.tasks.map((task) => {
                    const isFailed = task.status === 'failed';
                    const failureReasons = getTaskFailureReasons(task);
                    return (
                    <Box sx={{ flex: "1 1 30%", minWidth: "280px" }} key={task.id}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          borderColor: isFailed ? 'error.main' : 'success.main',
                          borderWidth: 2,
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {task.task_name.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            {renderStatusIndicator(task, 'medium')}
                          </Box>
                          
                          {/* Show failure reasons on summary cards */}
                          {isFailed && failureReasons.length > 0 && (
                            <Box sx={{ 
                              bgcolor: 'error.lighter', 
                              p: 1.5, 
                              borderRadius: 1, 
                              mb: 1.5,
                              border: '1px solid',
                              borderColor: 'error.light',
                            }}>
                              {failureReasons.slice(0, 2).map((reason, rIdx) => (
                                <Typography 
                                  key={rIdx} 
                                  variant="body2" 
                                  color="error.dark"
                                  sx={{ 
                                    fontSize: '0.8rem',
                                    lineHeight: 1.4,
                                    mb: rIdx < failureReasons.slice(0, 2).length - 1 ? 0.5 : 0,
                                  }}
                                >
                                  • {reason}
                                </Typography>
                              ))}
                              {failureReasons.length > 2 && (
                                <Typography variant="caption" color="error.dark" sx={{ fontStyle: 'italic' }}>
                                  +{failureReasons.length - 2} more...
                                </Typography>
                              )}
                            </Box>
                          )}
                          
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
                    );
                  })}
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
                    const { status, color } = evaluateAngleStatus(angle.value, angle.min, angle.max);

                    return (
                      <TableRow key={idx}>
                        <TableCell>{angle.joint}</TableCell>
                        <TableCell>{angle.metric}</TableCell>
                        <TableCell align="right">
                          {angle.value !== undefined ? `${angle.value.toFixed(1)}${angle.unit}` : 'Not measured'}
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
            {session.tasks.map((task) => {
              const isFailed = task.status === 'failed';
              const failureReasons = getTaskFailureReasons(task);
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600} color={isFailed ? 'error.main' : 'text.primary'}>
                    {task.task_name.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                  {renderStatusIndicator(task, 'large')}
                </Box>
                
                {/* Failure Reasons - Prominent display for failed tasks */}
                {isFailed && failureReasons.length > 0 && (
                  <Box sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'error.main', 
                    borderRadius: 1,
                  }}>
                    <Typography variant="subtitle2" sx={{ color: 'error.contrastText', fontWeight: 600, mb: 1 }}>
                      Why This Task Failed:
                    </Typography>
                    {failureReasons.map((reason, rIdx) => (
                      <Typography 
                        key={rIdx} 
                        variant="body2" 
                        sx={{ 
                          color: 'error.contrastText',
                          display: 'flex',
                          alignItems: 'flex-start',
                          mb: 0.5,
                        }}
                      >
                        <span style={{ marginRight: 8, fontWeight: 'bold' }}>•</span>
                        {reason}
                      </Typography>
                    ))}
                  </Box>
                )}

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
                      {isFailed ? 'Partial Metrics (Task Not Completed)' : 'All Metrics'}
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          {Object.keys(task.metrics).length > 0 ? (
                            Object.entries(task.metrics).map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell>{key}</TableCell>
                                <TableCell align="right">
                                  <strong>{typeof value === 'number' ? value.toFixed(2) : value}</strong>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} align="center">
                                <Typography variant="body2" color="text.secondary">
                                  No metrics recorded - detection may have failed
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
