import { useState, useCallback, useRef, useMemo } from 'react';
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
  LinearProgress,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import PanToolIcon from '@mui/icons-material/PanTool';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import CameraFeed from '../components/CameraFeed';
import PoseDetector from '../components/PoseDetector';
import { useSessionStore } from '../store/session';
import type { TaskMetric } from '../store/session';
import { createTaskHandlers, TASK_SEQUENCE } from '../logic/tasks';
import type { TaskUpdate } from '../logic/tasks';
import { cancelSpeech } from '../utils/voice';
import { speak, stopSpeaking, VOICES } from '../utils/elevenlabs-tts';
import { createSession, addTask, addMetric } from '../services/api';
import { useSearchParams } from 'react-router-dom';

// Task icons and descriptions for better UX
const TASK_INFO: Record<string, { icon: React.ReactNode; title: string; instruction: string }> = {
  raise_hand: {
    icon: <PanToolIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Raise Your Hand',
    instruction: 'Lift your right arm straight up above your head. Hold it steady.',
  },
  one_leg: {
    icon: <AccessibilityNewIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Stand on One Leg',
    instruction: 'Lift one foot off the ground and balance on the other leg for as long as you can.',
  },
  walk: {
    icon: <DirectionsWalkIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Walk Forward',
    instruction: 'Walk naturally towards the camera in a straight line.',
  },
  touch_shoulder: {
    icon: <TouchAppIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Touch Your Shoulder',
    instruction: 'Touch your left shoulder with your right hand.',
  },
};

const SessionPageOrchestrator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const followupSessionId = searchParams.get('followup'); // ID of the initial session if this is a follow-up
  const setCurrent = useSessionStore((state) => state.setCurrent);
  const current = useSessionStore((state) => state.current);
  const childProfile = useSessionStore((state) => state.childProfile);
  
  // Create task handlers with child height for normalization
  const tasks = useMemo(() => {
    return createTaskHandlers(childProfile?.heightCm);
  }, [childProfile?.heightCm]);
  
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<TaskMetric[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [taskUpdate, setTaskUpdate] = useState<TaskUpdate | null>(null);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [taskStatus, setTaskStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [taskStartTime, setTaskStartTime] = useState<number>(0);
  const MAX_RETRIES = 1;
  const TASK_TIMEOUT = 30000; // 30 seconds
  
  // Backend integration state
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [savedTaskIds, setSavedTaskIds] = useState<Set<string>>(new Set());
  const sessionCreatedRef = useRef(false);
  
  const currentTaskName = TASK_SEQUENCE[currentTaskIndex];
  const currentTask = tasks[currentTaskName];

  // Start session
  const handleStart = async () => {
    // Check if childProfile exists
    if (!childProfile) {
      console.error('❌ No child profile found! Redirecting to child info page...');
      alert('Please enter child information first.');
      navigate('/parent/child-info');
      return;
    }

    setIsRunning(true);
    setTaskStatus('running');
    setTaskStartTime(Date.now());
    const startTime = new Date().toISOString();
    setSessionStartTime(startTime);
    setCurrentTaskIndex(0);
    setCompletedTasks([]);
    setRetryCount(0);
    setBackendSessionId(null);
    setSavedTaskIds(new Set());
    sessionCreatedRef.current = false;
    
    // Create session in backend
    if (!sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      try {
        const sessionData: any = {
          child_name: childProfile.childName,
          child_age: childProfile.ageYears,
          child_height_cm: childProfile.heightCm,
          child_weight_kg: childProfile.weightKg,
          child_gender: childProfile.gender,
          child_notes: childProfile.notes,
        };

        // If this is a follow-up session, add the parent session ID
        if (followupSessionId) {
          sessionData.session_type = 'followup';
          sessionData.parent_session_id = followupSessionId;
        }
        
        console.log('📤 Creating backend session with data:', sessionData);
        const session = await createSession(sessionData);
        setBackendSessionId(session.id);
        console.log('✅ Backend session created:', session.id, followupSessionId ? '(Follow-up)' : '(Initial)');
      } catch (error) {
        console.error('❌ Failed to create backend session:', error);
        sessionCreatedRef.current = false;
        alert('Failed to create session. Please try again.');
        setIsRunning(false);
        return;
      }
    }
    
    // Start first task
    tasks[TASK_SEQUENCE[0]].start();
    
    // Speak the first task instruction
    if (!voiceMuted) {
      const taskInfo = TASK_INFO[TASK_SEQUENCE[0]];
      if (taskInfo) {
        speak(taskInfo.instruction, VOICES.RACHEL);
      }
    }
  };

  // Stop session
  const handleStop = () => {
    setIsRunning(false);
    stopSpeaking();
    
    // Stop current task
    currentTask.stop();
  };

  const handleToggleVoice = () => {
    setVoiceMuted((prev) => {
      const newValue = !prev;
      if (newValue) {
        cancelSpeech(); // Mute browser TTS
        stopSpeaking(); // Mute ElevenLabs TTS
      }
      return newValue;
    });
  };

  const handleRestartTask = () => {
    if (!isRunning) return;
    currentTask.stop();
    setTaskStatus('running');
    setTaskUpdate(null);
    setTaskStartTime(Date.now());
    currentTask.start();
  };

  const handleRetryTask = () => {
    if (retryCount >= MAX_RETRIES) return;
    setRetryCount(prev => prev + 1);
    setTaskStatus('running');
    setTaskUpdate(null);
    setTaskStartTime(Date.now());
    currentTask.start();
  };

  const handleContinue = () => {
    if (currentTaskIndex < TASK_SEQUENCE.length - 1) {
      // Move to next task
      const nextIndex = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      setTaskStatus('running');
      setRetryCount(0);
      setTaskUpdate(null);
      setTaskStartTime(Date.now());
      tasks[TASK_SEQUENCE[nextIndex]].start();
      
      // Speak instruction for next task
      if (!voiceMuted) {
        const taskInfo = TASK_INFO[TASK_SEQUENCE[nextIndex]];
        if (taskInfo) {
          speak(taskInfo.instruction, VOICES.RACHEL);
        }
      }
    } else {
      // Complete session
      if (!voiceMuted) {
        speak("Wonderful! You've completed all the exercises. Great work today!", VOICES.RACHEL);
      }
      completeSession(completedTasks);
    }
  };

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
    console.log('SESSION: Video ready');
  }, []);

  // Save failed task to backend
  const saveFailedTask = async (reason: string) => {
    if (!backendSessionId || savedTaskIds.has(currentTaskName)) return;
    
    setSavedTaskIds(prev => new Set(prev).add(currentTaskName));
    
    try {
      const taskData = {
        task_name: currentTaskName,
        duration_seconds: Math.floor((Date.now() - taskStartTime) / 1000),
        status: 'failed',
        notes: `Failed: ${reason}`,
        metrics: {},
      };
      
      const taskResult = await addTask(backendSessionId, taskData);
      console.log(`✅ Failed task saved to backend: ${currentTaskName}`, taskResult.id);
    } catch (error) {
      console.error('❌ Failed to save failed task:', error);
    }
  };

  // Handle pose detection results with failure detection
  const handlePoseResult = useCallback((detectedLandmarks: any) => {
    if (!isRunning || !detectedLandmarks || detectedLandmarks.length === 0 || taskStatus !== 'running') {
      return;
    }

    // Check for timeout
    const elapsed = Date.now() - taskStartTime;
    if (elapsed > TASK_TIMEOUT) {
      setTaskStatus('failed');
      saveFailedTask('timeout');
      currentTask.stop();
      if (!voiceMuted) {
        speak("Time's up. Let's try the next exercise.", VOICES.RACHEL);
      }
      return;
    }

    // Update current task with landmarks
    const update = currentTask.update(detectedLandmarks);
    setTaskUpdate(update);

    // Failure detection: if progress < 70% after 15 seconds
    if (elapsed > 15000 && update.progress < 0.7) {
      setTaskStatus('failed');
      saveFailedTask('low_progress');
      currentTask.stop();
      if (!voiceMuted) {
        speak("That's okay, let's move on to the next one.", VOICES.RACHEL);
      }
      return;
    }

    // Check if task is complete
    if (update.done && update.metrics) {
      setTaskStatus('success');
      
      // Celebrate with voice
      if (!voiceMuted) {
        speak("Great job! That was excellent.", VOICES.RACHEL);
      };
      const taskMetric: TaskMetric = {
        task: currentTaskName as any,
        metrics: update.metrics,
      };
      
      setCompletedTasks((prev) => [...prev, taskMetric]);
      
      // Save task to backend - mark as saved IMMEDIATELY to prevent duplicates
      if (backendSessionId && !savedTaskIds.has(currentTaskName)) {
        // Mark as saved immediately to prevent race condition
        setSavedTaskIds(prev => new Set(prev).add(currentTaskName));
        
        const saveTaskToBackend = async () => {
          try {
            if (!update.metrics) return;
            
            const taskData = {
              task_name: currentTaskName,
              duration_seconds: (update.metrics.duration as number) || 0,
              status: 'success',
              notes: `Completed ${currentTaskName}`,
              metrics: update.metrics,
            };
            
            let currentSessionId = backendSessionId;
            let taskResult;

            try {
              taskResult = await addTask(currentSessionId, taskData);
            } catch (error: any) {
              console.log('⚠️ Error saving task:', error);
              const errorMessage = error.message || error.toString();
              
              // If session not found (404), try to create a new session and retry
              if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('Session not found')) {
                console.log('⚠️ Session not found (likely due to DB reset), creating new session...');
                
                const sessionData = {
                  child_name: childProfile?.childName || 'Unknown',
                  child_age: childProfile?.ageYears || 8,
                  child_height_cm: childProfile?.heightCm,
                  child_weight_kg: childProfile?.weightKg,
                  child_gender: childProfile?.gender,
                  child_notes: childProfile?.notes,
                };
                
                try {
                  const newSession = await createSession(sessionData);
                  console.log('✅ New session created for recovery:', newSession.id);
                  setBackendSessionId(newSession.id);
                  currentSessionId = newSession.id;
                  
                  // Retry adding task with new session ID
                  taskResult = await addTask(currentSessionId, taskData);
                } catch (recoveryError) {
                  console.error('❌ Recovery failed - could not create new session:', recoveryError);
                  throw recoveryError;
                }
              } else {
                throw error;
              }
            }

            console.log(`✅ Task saved to backend: ${currentTaskName}`, taskResult.id);
            
            // Save individual metrics to backend
            for (const [metricName, metricValue] of Object.entries(update.metrics)) {
              if (typeof metricValue === 'number') {
                try {
                  await addMetric(taskResult.id, {
                    metric_name: metricName,
                    metric_value: metricValue,
                  });
                  console.log(`✅ Metric saved: ${metricName} = ${metricValue}`);
                } catch (metricError) {
                  console.error(`❌ Failed to save metric ${metricName}:`, metricError);
                }
              }
            }
          } catch (error) {
            console.error('❌ Failed to save task to backend:', error);
          }
        };
        
        saveTaskToBackend();
      }
      
      // Don't auto-advance - wait for user to click Continue
    }
  }, [isRunning, currentTask, currentTaskName, currentTaskIndex, completedTasks, backendSessionId, childProfile, tasks, taskStartTime, taskStatus]);

  const completeSession = async (allTasks: TaskMetric[]) => {
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
    
    // Use existing backend session ID (tasks already saved during execution)
    const finalSessionId = backendSessionId;
    
    if (!finalSessionId) {
      console.error('❌ No valid session ID available');
      alert('Failed to create session. Please try again.');
      setIsRunning(false);
      return;
    }
    
    const summary = {
      sessionId: finalSessionId,
      childAgeYears: childProfile?.ageYears || 8,
      startedAt: sessionStartTime,
      endedAt: new Date().toISOString(),
      overallRisk,
      tasks: allTasks,
    };
    
    console.log('✅ Session completed:', summary);
    console.log('📊 Risk factors:', {
      oneLegHoldTime,
      shoulderFlexionMax,
      walkSymmetry,
      lowBalance,
      lowFlexion,
      poorSymmetry,
      overallRisk,
    });
    console.log('👤 Child profile:', childProfile);
    
    setCurrent(summary);
    setIsRunning(false);
    
    // Add small delay to ensure all backend saves complete
    setTimeout(() => {
      setShowResultsDialog(true);
    }, 500);
  };

  // Get current task info
  const taskInfo = TASK_INFO[currentTaskName] || {
    icon: <AccessibilityNewIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: currentTaskName.replace('_', ' '),
    instruction: 'Follow the instructions on screen.',
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 2 }}>
      <Container maxWidth="xl">
        {/* Top Control Bar */}
        <Paper elevation={1} sx={{ p: 1.5, mb: 2, borderRadius: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={isRunning ? "outlined" : "contained"}
              color={isRunning ? "error" : "primary"}
              startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
              onClick={isRunning ? handleStop : handleStart}
              size="medium"
              sx={{ 
                fontSize: '0.9rem', 
                px: 3,
                borderRadius: 2,
              }}
            >
              {isRunning ? "Stop" : "Start Session"}
            </Button>
            
            <IconButton
              onClick={handleToggleVoice}
              color={voiceMuted ? 'default' : 'primary'}
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                bgcolor: voiceMuted ? 'grey.100' : 'primary.50',
              }}
            >
              {voiceMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Chip 
              label={`Task ${currentTaskIndex + 1} of ${TASK_SEQUENCE.length}`}
              color="primary"
              variant="filled"
              sx={{ fontWeight: 600, px: 1 }}
            />
          </Stack>
        </Paper>

        {/* Main Content: Split Layout */}
        <Grid container spacing={2}>
          {/* Left Side: Camera Feed */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                borderRadius: 3, 
                overflow: 'hidden',
                position: 'relative',
                bgcolor: '#000',
              }}
            >
              <CameraFeed onVideoReady={handleVideoReady} autoStart={true} />
              <PoseDetector 
                running={isRunning && taskStatus === 'running'}
                videoRef={videoRef}
                onResult={handlePoseResult}
                showVisualization={true}
              />
            </Paper>
          </Grid>

          {/* Right Side: Task Instructions & Feedback */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2} sx={{ height: '100%' }}>
              {/* Task Info Card */}
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  '& svg': { fontSize: 40, color: 'white' }
                }}>
                  {taskInfo.icon}
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {taskInfo.title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                  {taskInfo.instruction}
                </Typography>
              </Paper>

              {/* Progress Card (when running) */}
              {isRunning && taskStatus === 'running' && taskUpdate && (
                <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={taskUpdate.progress * 100} 
                    sx={{ 
                      height: 12, 
                      borderRadius: 2,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      }
                    }}
                  />
                  <Typography variant="h4" fontWeight={700} color="primary" sx={{ mt: 1 }}>
                    {Math.round(taskUpdate.progress * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {taskUpdate.message}
                  </Typography>
                  
                  {/* Restart button */}
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={handleRestartTask}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Restart Task
                  </Button>
                </Paper>
              )}

              {/* Success Feedback */}
              {taskStatus === 'success' && (
                <Fade in timeout={300}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 56, mb: 1 }} />
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      Excellent! 🎉
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                      Task completed successfully!
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleContinue}
                      fullWidth
                      sx={{ 
                        bgcolor: 'white', 
                        color: 'success.main',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
                    >
                      {currentTaskIndex < TASK_SEQUENCE.length - 1 ? 'Next Task →' : 'View Results'}
                    </Button>
                  </Paper>
                </Fade>
              )}

              {/* Failure Feedback */}
              {taskStatus === 'failed' && (
                <Fade in timeout={300}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    <ErrorOutlineIcon sx={{ fontSize: 56, mb: 1 }} />
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      Let's Try Again
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                      {retryCount < MAX_RETRIES 
                        ? "Don't worry, you can try again!" 
                        : "That's okay, let's move on."}
                    </Typography>
                    <Stack spacing={1.5}>
                      {retryCount < MAX_RETRIES && (
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleRetryTask}
                          fullWidth
                          sx={{ 
                            bgcolor: 'white', 
                            color: 'error.main',
                            fontWeight: 600,
                            py: 1.5,
                            '&:hover': { bgcolor: 'grey.100' }
                          }}
                        >
                          Try Again ({MAX_RETRIES - retryCount} left)
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleContinue}
                        fullWidth
                        sx={{ 
                          borderColor: 'rgba(255,255,255,0.5)',
                          color: 'white',
                          fontWeight: 600,
                          py: 1.5,
                          '&:hover': { 
                            borderColor: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)' 
                          }
                        }}
                      >
                        {currentTaskIndex < TASK_SEQUENCE.length - 1 ? 'Skip to Next Task' : 'View Results'}
                      </Button>
                    </Stack>
                  </Paper>
                </Fade>
              )}

              {/* Idle State - Instructions before starting */}
              {!isRunning && taskStatus === 'idle' && (
                <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Ready to Begin?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click "Start Session" when you're ready. Make sure you're visible in the camera.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStart}
                    fullWidth
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    Start Session
                  </Button>
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Results Dialog */}
        <Dialog open={showResultsDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              Assessment Complete!
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center' }}>
            <Typography color="text.secondary">
              Great job! All tasks have been completed. Click below to view your detailed results.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={() => navigate(`/parent/results/${current?.sessionId}`)} 
              variant="contained"
              fullWidth
              size="large"
              sx={{ 
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              View Results
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SessionPageOrchestrator;
