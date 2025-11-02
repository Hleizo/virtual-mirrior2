import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Typography,
  IconButton,
  Fade,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CameraFeed } from '../components/CameraFeed';
import { PoseDetector } from '../components/PoseDetector';
import CoachOverlay from '../components/CoachOverlay';
import SessionControls from '../components/SessionControls';
import { useSessionStore } from '../store/session';
import type { TaskMetric } from '../store/session';
import { tasks, TASK_SEQUENCE } from '../logic/tasks';
import GradientLinearProgress from '../components/GradientLinearProgress';
import type { TaskUpdate } from '../logic/tasks';
import { cancelSpeech } from '../utils/voice';

const SessionPageOrchestrator = () => {
  const navigate = useNavigate();
  const setCurrent = useSessionStore((state) => state.setCurrent);
  
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<TaskMetric[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [taskUpdate, setTaskUpdate] = useState<TaskUpdate | null>(null);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false);
  const [floatingMessage, setFloatingMessage] = useState<string>('');
  const [showFloatingMessage, setShowFloatingMessage] = useState<boolean>(false);
  
  const currentTaskName = TASK_SEQUENCE[currentTaskIndex];
  const currentTask = tasks[currentTaskName];
  const progressPercentage = ((currentTaskIndex + 1) / TASK_SEQUENCE.length) * 100;

  // Start session
  const handleStart = async () => {
    setIsRunning(true);
    setSessionStartTime(new Date().toISOString());
    setCurrentTaskIndex(0);
    setCompletedTasks([]);
    
    // Start first task
    tasks[TASK_SEQUENCE[0]].start();
  };

  // Stop session
  const handleStop = () => {
    setIsRunning(false);
    setRecording(false);
    
    // Stop current task
    currentTask.stop();
  };

  const handleToggleRecording = (value: boolean) => {
    setRecording(value);
  };

  const handleToggleVoice = () => {
    setVoiceMuted((prev) => {
      const newValue = !prev;
      if (newValue) {
        cancelSpeech(); // Mute immediately
      }
      return newValue;
    });
  };

  const handleRestartTask = () => {
    if (!isRunning) return;
    currentTask.stop();
    currentTask.start();
    setTaskUpdate(null);
    showFloatingText('Task restarted!');
  };

  const handleNextTask = () => {
    if (!isRunning || currentTaskIndex >= TASK_SEQUENCE.length - 1) return;
    
    currentTask.stop();
    const nextIndex = currentTaskIndex + 1;
    setCurrentTaskIndex(nextIndex);
    tasks[TASK_SEQUENCE[nextIndex]].start();
    setTaskUpdate(null);
    showFloatingText('Moving to next task!');
  };

  const showFloatingText = (message: string) => {
    setFloatingMessage(message);
    setShowFloatingMessage(true);
    setTimeout(() => setShowFloatingMessage(false), 2000);
  };

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    console.log('SESSION: Video ready');
  }, []);

  // Handle pose detection results
  const handlePoseResult = useCallback((detectedLandmarks: any) => {
    if (!isRunning || !detectedLandmarks || detectedLandmarks.length === 0) {
      return;
    }

    // Update current task with landmarks
    const update = currentTask.update(detectedLandmarks);
    setTaskUpdate(update);

    // Show encouraging floating messages based on progress
    if (update.progress > 0.3 && update.progress < 0.5 && !showFloatingMessage) {
      showFloatingText('Keep going!');
    } else if (update.progress > 0.7 && update.progress < 0.9 && !showFloatingMessage) {
      showFloatingText('Almost there!');
    }

    // Check if task is complete
    if (update.done && update.metrics) {
      const taskMetric: TaskMetric = {
        task: currentTaskName as any,
        metrics: update.metrics,
      };
      
      setCompletedTasks((prev) => [...prev, taskMetric]);
      
      // Show success animation
      setShowSuccessAnimation(true);
      showFloatingText('Great job! 🎉');
      
      // Move to next task or complete session
      if (currentTaskIndex < TASK_SEQUENCE.length - 1) {
        // Celebration delay before next task
        setTimeout(() => {
          setShowSuccessAnimation(false);
          const nextIndex = currentTaskIndex + 1;
          setCurrentTaskIndex(nextIndex);
          
          // Start next task
          tasks[TASK_SEQUENCE[nextIndex]].start();
          setTaskUpdate(null);
        }, 2000); // Extended to 2s for celebration
      } else {
        // All tasks complete
        setTimeout(() => {
          setShowSuccessAnimation(false);
          completeSession([...completedTasks, taskMetric]);
        }, 2000);
      }
    }
  }, [isRunning, currentTask, currentTaskName, currentTaskIndex, completedTasks, showFloatingMessage]);

  const completeSession = (allTasks: TaskMetric[]) => {
    // Extract metrics from each task
    const oneLegMetrics = allTasks.find(t => t.task === 'one_leg')?.metrics;
    const raiseHandMetrics = allTasks.find(t => t.task === 'raise_hand')?.metrics;
    const walkMetrics = allTasks.find(t => t.task === 'walk')?.metrics;
    
    // Calculate overall risk using specified criteria
    let overallRisk: 'normal' | 'monitor' | 'high' = 'normal';
    
    const oneLegHoldTime = oneLegMetrics?.holdTime as number | undefined;
    const shoulderFlexionMax = raiseHandMetrics?.shoulderFlexionMax as number | undefined;
    const walkSymmetry = walkMetrics?.symmetryPercent as number | undefined;
    
    // Check for "monitor" conditions
    const lowBalance = oneLegHoldTime !== undefined && oneLegHoldTime < 5;
    const lowFlexion = shoulderFlexionMax !== undefined && shoulderFlexionMax < 120;
    
    // Check for "high" conditions
    const poorSymmetry = walkSymmetry !== undefined && (100 - walkSymmetry) > 20; // asymmetry > 20%
    const bothBelowThreshold = lowBalance && lowFlexion;
    
    if (bothBelowThreshold || poorSymmetry) {
      overallRisk = 'high';
    } else if (lowBalance || lowFlexion) {
      overallRisk = 'monitor';
    } else {
      overallRisk = 'normal';
    }
    
    const summary = {
      sessionId: `SESSION-${Date.now()}`,
      childAgeYears: 8,
      startedAt: sessionStartTime,
      endedAt: new Date().toISOString(),
      overallRisk,
      tasks: allTasks,
    };
    
    console.log('Session completed:', summary);
    console.log('Risk factors:', {
      oneLegHoldTime,
      shoulderFlexionMax,
      walkSymmetry,
      lowBalance,
      lowFlexion,
      poorSymmetry,
      overallRisk,
    });
    
    setCurrent(summary);
    setIsRunning(false);
    setShowResultsDialog(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Session Controls */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <SessionControls
            onStart={handleStart}
            onStop={handleStop}
            recording={recording}
            onToggleRecording={handleToggleRecording}
            isRunning={isRunning}
          />
          <Chip 
            label={isRunning ? "Running" : "Idle"} 
            color={isRunning ? "success" : "default"}
            sx={{ fontWeight: 600 }}
          />
          
          {/* Voice Toggle */}
          <IconButton
            onClick={handleToggleVoice}
            color={voiceMuted ? 'default' : 'primary'}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            {voiceMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>

          {/* Task Controls */}
          {isRunning && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={handleRestartTask}
                sx={{ textTransform: 'none' }}
              >
                Restart Task
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SkipNextIcon />}
                onClick={handleNextTask}
                disabled={currentTaskIndex >= TASK_SEQUENCE.length - 1}
                sx={{ textTransform: 'none' }}
              >
                Next Task
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {/* Task Progress Bar */}
      <Box sx={{ mb: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" fontWeight={600}>
              Task Progress: {currentTaskIndex + 1}/{TASK_SEQUENCE.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(progressPercentage)}% Complete
            </Typography>
          </Stack>
          <GradientLinearProgress 
            value={progressPercentage}
            sx={{ 
              height: 8,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              }
            }}
          />
        </Stack>
      </Box>

      {/* Task Pills */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
          {TASK_SEQUENCE.map((task, idx) => (
            <Chip
              key={task}
              label={task.replace('_', ' ')}
              color={idx < currentTaskIndex ? 'success' : idx === currentTaskIndex ? 'primary' : 'default'}
              variant={idx === currentTaskIndex ? 'filled' : 'outlined'}
              size="medium"
              sx={{ 
                fontWeight: idx === currentTaskIndex ? 700 : 500,
                fontSize: '0.875rem',
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Camera and Pose Detection */}
      <Box sx={{ position: 'relative', height: '70vh', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
        <CameraFeed onVideoReady={handleVideoReady} autoStart={true} />
        <PoseDetector 
          running={isRunning}
          videoRef={videoRef}
          onResult={handlePoseResult}
          showVisualization={true}
        />

        {/* Success Animation Overlay */}
        <Fade in={showSuccessAnimation} timeout={500}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 4,
                bgcolor: 'success.main',
                color: 'white',
                borderRadius: 4,
                animation: 'pulse 0.5s ease-in-out',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(0.8)', opacity: 0 },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 80 }} />
            </Paper>
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 700,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Task Complete!
            </Typography>
          </Box>
        </Fade>

        {/* Floating Encouragement Messages */}
        <Fade in={showFloatingMessage} timeout={300}>
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1500,
            }}
          >
            <Paper
              elevation={4}
              sx={{
                px: 4,
                py: 2,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '1.5rem',
                animation: 'bounce 0.5s ease-in-out',
                '@keyframes bounce': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                },
              }}
            >
              {floatingMessage}
            </Paper>
          </Box>
        </Fade>
      </Box>

      {/* Coach Overlay with Progress Bar */}
      {isRunning && taskUpdate && (
        <CoachOverlay taskUpdate={taskUpdate} currentTaskName={currentTaskName} muted={voiceMuted} />
      )}

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assessment Complete!</DialogTitle>
        <DialogContent>
          All tasks have been completed. Would you like to view the results as a parent or clinician?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/results/parent')} variant="contained">
            Parent View
          </Button>
          <Button onClick={() => navigate('/results/clinician')} variant="outlined">
            Clinician View
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SessionPageOrchestrator;
