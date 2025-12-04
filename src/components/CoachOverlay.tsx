import { useEffect, useRef, useState } from 'react';
import { Chip, Box, Typography, Paper, Fade, Zoom } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { speak } from '../utils/voice';
import type { TaskUpdate } from '../logic/tasks';
import GradientLinearProgress from './GradientLinearProgress';
import AssistantFace, { type AssistantMood } from './AssistantFace';

interface CoachOverlayProps {
  taskUpdate: TaskUpdate | null;
  currentTaskName?: string;
  muted?: boolean;
}

// Humanized Arabic voice feedback - multiple variations per context
// Each phrase is designed to sound natural, encouraging, and child-friendly
const VOICE_PHRASES = {
  // === RAISE HAND TASK ===
  raise_hand: {
    start: [
      'يلا نرفع إيدينا للسما!',
      'هيا نرفع الإيدين عالي!',
      'يلا شوف كم تقدر ترفع إيدك!',
    ],
    low: [
      'شوي كمان، ارفع أعلى!',
      'عالي شوي!',
      'يلا ارفع أكثر!',
    ],
    almost: [
      'كده! قربت كتير!',
      'ممتاز، شوي كمان!',
      'أحسنت، تقريباً!',
    ],
    elbow: [
      'افرد إيدك كويس!',
      'خلي إيدك مستقيمة!',
    ],
    hold: [
      'كده تمام! خليها ثابتة!',
      'ممتاز! اثبت كده!',
    ],
    success: [
      'برافو عليك! إيدك وصلت!',
      'شاطر! عملتها!',
      'يا سلام! رائع!',
    ],
  },

  // === ONE LEG BALANCE ===
  one_leg: {
    start: [
      'يلا نشوف توازنك! ارفع رِجل وحدة!',
      'هيا نتوازن! ارفع قدم واحدة!',
    ],
    detecting: [
      'تمام! خليك ثابت!',
      'كده صح! استمر!',
    ],
    sway: [
      'اثبت مكانك!',
      'خليك مركز!',
      'لا تتحرك كتير!',
    ],
    good: [
      'برافو! توازنك حلو!',
      'ممتاز! مركز تماماً!',
    ],
    success: [
      'يا بطل! توازن رائع!',
      'شاطر! ثبات ممتاز!',
      'برافو عليك!',
    ],
  },

  // === WALK TASK ===
  walk: {
    start: [
      'يلا نمشي! خطوة خطوة!',
      'امشي بشكل طبيعي!',
    ],
    step: [
      'أحسنت!',
      'كده!',
      'تمام!',
    ],
    keepgoing: [
      'استمر! كده صح!',
      'يلا كمل!',
      'خطوة كمان!',
    ],
    steady: [
      'براحتك، ما في عجلة!',
      'امشي على مهلك!',
    ],
    success: [
      'برافو! مشيت ممتاز!',
      'شاطر! خطواتك حلوة!',
      'يا سلام على المشي!',
    ],
  },

  // === JUMP TASK ===
  jump: {
    start: [
      'يلا نقفز! جهز حالك!',
      'هيا نطير! اثني ركبتيك!',
    ],
    crouch: [
      'كده! جاهز! يلا اقفز!',
      'تمام! والآن اقفز!',
    ],
    airborne: [
      'طاير! رائع!',
      'يا سلام! عالي!',
    ],
    land: [
      'برافو! نزلت كويس!',
    ],
    bothfeet: [
      'اقفز برجليك سوا!',
      'الرجلين مع بعض!',
    ],
    tryagain: [
      'حاول مرة تانية!',
      'يلا نحاول كمان!',
    ],
    success: [
      'يا بطل! قفزة عالية!',
      'برافو! قفزت ممتاز!',
      'شاطر! زي الكنغر!',
    ],
  },

  // === TIPTOE TASK ===
  tiptoe: {
    start: [
      'يلا نقف على أطراف أصابعنا!',
      'زي الباليرينا! ارفع كعبيك!',
    ],
    raise: [
      'ارفع كعبيك أكثر!',
      'عالي شوي!',
    ],
    hold: [
      'كده تمام! اثبت!',
      'ممتاز! خليك كده!',
    ],
    arms: [
      'ارفع إيديك كمان!',
    ],
    sway: [
      'اثبت مكانك!',
      'خليك متوازن!',
    ],
    success: [
      'برافو! زي راقصة باليه!',
      'رائع! أطراف أصابعك قوية!',
    ],
  },

  // === SQUAT TASK ===
  squat: {
    start: [
      'يلا نعمل قرفصاء!',
      'اقعد زي الكرسي!',
    ],
    deeper: [
      'اثني ركبتيك أكثر!',
      'انزل أكثر!',
    ],
    knees: [
      'خلي ركبتيك متباعدين!',
    ],
    heels: [
      'خلي كعبيك على الأرض!',
    ],
    hold: [
      'ممتاز! اثبت لحظة!',
      'كده تمام!',
    ],
    success: [
      'برافو! قرفصاء ممتازة!',
      'شاطر! عضلاتك قوية!',
    ],
  },

  // === GENERAL ===
  general: {
    visibility: [
      'تعال قرب شوي عشان أشوفك!',
      'ادخل في الصورة!',
    ],
    timeout_warning: [
      'يلا نحاول بسرعة!',
    ],
  },
};

// Get a random phrase from array (to avoid repetition)
const getRandomPhrase = (phrases: string[]): string => {
  return phrases[Math.floor(Math.random() * phrases.length)];
};

// Task instruction display (English for visual display)
const TASK_INSTRUCTIONS: Record<string, { title: string; subtitle: string }> = {
  raise_hand: { title: '🙋 Raise Your Hand', subtitle: 'Lift your arm straight up above your head' },
  one_leg: { title: '🦩 Stand on One Leg', subtitle: 'Lift one foot and balance as long as you can' },
  walk: { title: '🚶 Walk Forward', subtitle: 'Walk naturally toward the camera' },
  jump: { title: '🦘 Jump Up', subtitle: 'Bend your knees and jump with both feet' },
  tiptoe: { title: '🩰 Stand on Tiptoes', subtitle: 'Rise up on your toes like a ballerina' },
  squat: { title: '🪑 Do a Squat', subtitle: 'Bend your knees like sitting in a chair' },
};

const CoachOverlay = ({ taskUpdate, currentTaskName, muted = false }: CoachOverlayProps) => {
  const lastSpeechTime = useRef<number>(0);
  const lastSpokenContext = useRef<string>(''); // Track what context we last spoke about
  const lastProgress = useRef<number>(0); // Track progress to detect actual changes
  const taskStarted = useRef<boolean>(false); // Track if we've said the start phrase
  const successSpoken = useRef<boolean>(false); // Prevent repeating success
  const [assistantMood, setAssistantMood] = useState<AssistantMood>('idle');

  // Reset tracking when task changes
  useEffect(() => {
    taskStarted.current = false;
    successSpoken.current = false;
    lastSpokenContext.current = '';
    lastProgress.current = 0;
  }, [currentTaskName]);

  // Helper to get mood from task level
  const getMoodFromLevel = (level: string): AssistantMood => {
    if (level === 'success') return 'great';
    if (level === 'warning') return 'warn';
    if (level === 'info' && taskUpdate?.message.includes('Almost')) return 'encourage';
    return 'idle';
  };

  // Smart voice feedback - context-aware, no repetition, movement-based
  const speakContextual = (context: string, taskName: string) => {
    if (muted) {
      setAssistantMood(getMoodFromLevel(taskUpdate?.level || 'info'));
      return;
    }

    const now = Date.now();
    const timeSinceLastSpeech = now - lastSpeechTime.current;
    
    // Minimum 2 seconds between voice feedback (more natural pacing)
    const MIN_SPEECH_GAP = 2000;
    
    // Don't repeat the same context unless enough time passed (5s)
    const sameContext = context === lastSpokenContext.current;
    if (sameContext && timeSinceLastSpeech < 5000) {
      return;
    }
    
    // Must wait minimum gap
    if (timeSinceLastSpeech < MIN_SPEECH_GAP) {
      return;
    }

    // Get the appropriate phrase pool for this task and context
    const taskPhrases = VOICE_PHRASES[taskName as keyof typeof VOICE_PHRASES];
    if (!taskPhrases) return;

    const phrases = taskPhrases[context as keyof typeof taskPhrases] as string[] | undefined;
    if (!phrases || phrases.length === 0) return;

    const phrase = getRandomPhrase(phrases);
    
    lastSpokenContext.current = context;
    lastSpeechTime.current = now;
    setAssistantMood(getMoodFromLevel(taskUpdate?.level || 'info'));
    
    speak(phrase).catch(err => console.error('Speech error:', err));
  };

  // Render success celebration overlay
  const renderSuccessCelebration = () => {
    if (!taskUpdate?.done) return null;
    
    return (
      <Zoom in timeout={400}>
        <Paper
          elevation={6}
          id="coachSuccessCard"
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            padding: 3,
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            zIndex: 1002,
            borderRadius: 3,
            minWidth: 160,
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.4)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            <StarIcon sx={{ fontSize: '1.5rem', color: '#FFD700' }} />
            <CelebrationIcon sx={{ fontSize: '1.5rem' }} />
            <StarIcon sx={{ fontSize: '1.5rem', color: '#FFD700' }} />
          </Box>
          <CheckCircleIcon sx={{ fontSize: '3rem' }} />
          <Typography variant="h5" fontWeight={700}>
            Excellent!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Task Complete
          </Typography>
        </Paper>
      </Zoom>
    );
  };

  // Helper to render task-specific HUD with real-time metrics
  const renderHUD = () => {
    if (!taskUpdate || !currentTaskName) return null;

    const { metrics } = taskUpdate;
    const taskInfo = TASK_INSTRUCTIONS[currentTaskName];

    // Base HUD container styling
    const hudStyle = {
      position: 'fixed' as const,
      bottom: 100,
      right: 20,
      padding: 2,
      bgcolor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      color: 'white',
      zIndex: 1001,
      minWidth: 140,
      borderRadius: 2,
    };

    // Task instruction header (shown for all tasks)
    const renderTaskHeader = () => (
      <Fade in timeout={300}>
        <Paper
          elevation={3}
          id="coachTaskHeader"
          sx={{
            position: 'fixed',
            top: 80,
            right: 20,
            padding: 2,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            zIndex: 1001,
            minWidth: 200,
            borderRadius: 2,
            borderLeft: '4px solid',
            borderColor: taskUpdate.level === 'success' ? 'success.main' : 
                         taskUpdate.level === 'warning' ? 'warning.main' : 'primary.main',
          }}
        >
          {taskInfo && (
            <>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                {taskInfo.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {taskInfo.subtitle}
              </Typography>
            </>
          )}
        </Paper>
      </Fade>
    );

    // Task-specific metric displays
    // ONE LEG BALANCE - Show timer and detection status
    if (currentTaskName === 'one_leg') {
      const holdTime = typeof metrics?.holdTime === 'number' ? metrics.holdTime : 0;
      const isDetecting = holdTime > 0;
      const minutes = Math.floor(holdTime / 60);
      const seconds = Math.floor(holdTime % 60);
      const tenths = Math.floor((holdTime % 1) * 10);
      
      return (
        <>
          {renderTaskHeader()}
          <Paper elevation={3} sx={hudStyle}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.5 }}>
              {isDetecting ? '✅ Balancing!' : '👀 Lift one foot...'}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}.{tenths}
            </Typography>
            {typeof metrics?.trunkLean === 'number' && (
              <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>
                Sway: {metrics.trunkLean.toFixed(1)}°
              </Typography>
            )}
          </Paper>
        </>
      );
    }

    // WALK - Show step counter
    if (currentTaskName === 'walk' && typeof metrics?.stepCount === 'number') {
      const targetSteps = 10;
      const stepsRemaining = Math.max(0, targetSteps - metrics.stepCount);
      
      return (
        <>
          {renderTaskHeader()}
          <Paper elevation={3} sx={hudStyle}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.5 }}>
              👣 Steps Taken
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
              {metrics.stepCount}
              <Typography component="span" variant="h6" sx={{ opacity: 0.6 }}>
                /{targetSteps}
              </Typography>
            </Typography>
            {stepsRemaining > 0 && (
              <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>
                {stepsRemaining} more to go!
              </Typography>
            )}
          </Paper>
        </>
      );
    }

    // JUMP - Show jump height and phase
    if (currentTaskName === 'jump') {
      const heightCm = typeof metrics?.jumpHeightPixels === 'number' 
        ? Math.round((metrics.jumpHeightPixels / 1080) * 180) 
        : 0;
      // Phase can be string or undefined - safely convert
      const phase = metrics?.phase !== undefined ? String(metrics.phase) : 'ready';
      
      const phaseEmoji: Record<string, string> = {
        'ready': '🧍',
        'crouching': '🏋️',
        'airborne': '🚀',
        'landed': '✅',
      };
      
      return (
        <>
          {renderTaskHeader()}
          <Paper elevation={3} sx={hudStyle}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.5 }}>
              {phaseEmoji[phase] || '🦘'} Jump Status
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, textTransform: 'capitalize', mb: 1 }}>
              {phase}
            </Typography>
            {heightCm > 0 && (
              <>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                  Height
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {heightCm}<Typography component="span" variant="body2">cm</Typography>
                </Typography>
              </>
            )}
          </Paper>
        </>
      );
    }

    // SQUAT - Show depth and form
    if (currentTaskName === 'squat') {
      const depth = typeof metrics?.squatDepth === 'number' ? metrics.squatDepth : 0;
      const depthPercent = Math.min(100, Math.round(depth * 100));
      
      return (
        <>
          {renderTaskHeader()}
          <Paper elevation={3} sx={hudStyle}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.5 }}>
              🪑 Squat Depth
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
              {depthPercent}%
            </Typography>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: 'rgba(255,255,255,0.2)', 
              borderRadius: 1,
              mt: 1,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                width: `${depthPercent}%`, 
                height: '100%', 
                bgcolor: depthPercent >= 70 ? 'success.main' : 'warning.main',
                transition: 'width 0.2s ease'
              }} />
            </Box>
            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>
              {depthPercent < 70 ? 'Go lower!' : 'Good depth!'}
            </Typography>
          </Paper>
        </>
      );
    }

    // TIPTOE - Show heel height and balance
    if (currentTaskName === 'tiptoe') {
      const holdTime = typeof metrics?.holdTime === 'number' ? metrics.holdTime : 0;
      const seconds = Math.floor(holdTime);
      const tenths = Math.floor((holdTime % 1) * 10);
      
      return (
        <>
          {renderTaskHeader()}
          <Paper elevation={3} sx={hudStyle}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.5 }}>
              🩰 Tiptoe Time
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
              {seconds}.{tenths}s
            </Typography>
            {typeof metrics?.heelElevation === 'number' && (
              <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>
                Elevation: {(metrics.heelElevation * 100).toFixed(0)}%
              </Typography>
            )}
          </Paper>
        </>
      );
    }

    // RAISE HAND - Show arm elevation
    if (currentTaskName === 'raise_hand') {
      // Use the best of left/right shoulder angles as elevation display
      const leftAngle = typeof metrics?.leftShoulderAngle === 'number' ? metrics.leftShoulderAngle : 0;
      const rightAngle = typeof metrics?.rightShoulderAngle === 'number' ? metrics.rightShoulderAngle : 0;
      const elevation = Math.max(leftAngle, rightAngle);
      const elevationPercent = Math.min(100, Math.round((elevation / 150) * 100)); // Target is 150°
      
      return (
        <>
          {renderTaskHeader()}
          <Paper elevation={3} sx={hudStyle}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.5 }}>
              🙋 Arm Elevation
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
              {Math.round(elevation)}°
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.6, mt: 0.5 }}>
              Target: 150° {elevation >= 150 ? '✓' : ''}
            </Typography>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: 'rgba(255,255,255,0.2)', 
              borderRadius: 1,
              mt: 1,
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                width: `${elevationPercent}%`, 
                height: '100%', 
                bgcolor: elevation >= 150 ? 'success.main' : 'primary.main',
                transition: 'width 0.2s ease'
              }} />
            </Box>
          </Paper>
        </>
      );
    }

    // Default: show task header only
    return renderTaskHeader();
  };

  // Smart context-aware voice feedback based on actual movement detection
  useEffect(() => {
    if (!taskUpdate || !currentTaskName) return;
    
    const { level, message, progress, done, metrics } = taskUpdate;
    const msg = message.toLowerCase();
    
    // === TASK SUCCESS - say once only ===
    if ((level === 'success' || done) && !successSpoken.current) {
      successSpoken.current = true;
      speakContextual('success', currentTaskName);
      return;
    }
    
    // Don't speak after success
    if (successSpoken.current) return;
    
    // === TASK START - speak introduction once ===
    if (!taskStarted.current && progress > 0) {
      taskStarted.current = true;
      speakContextual('start', currentTaskName);
      return;
    }
    
    // === MOVEMENT-BASED FEEDBACK ===
    // Only speak when there's meaningful progress change or specific detection
    const progressChanged = Math.abs(progress - lastProgress.current) > 0.1; // 10% change
    lastProgress.current = progress;
    
    // Task-specific context detection based on actual metrics
    switch (currentTaskName) {
      case 'raise_hand': {
        const elevation = Math.max(
          (metrics?.leftShoulderAngle as number) || 0,
          (metrics?.rightShoulderAngle as number) || 0
        );
        
        if (level === 'warning') {
          if (msg.includes('elbow')) {
            speakContextual('elbow', currentTaskName);
          } else if (elevation < 60) {
            speakContextual('low', currentTaskName);
          }
        } else if (level === 'info') {
          if (elevation >= 120 && elevation < 150) {
            speakContextual('almost', currentTaskName);
          } else if (msg.includes('hold') || progress > 0.8) {
            speakContextual('hold', currentTaskName);
          }
        }
        break;
      }
      
      case 'one_leg': {
        const holdTime = (metrics?.holdTime as number) || 0;
        const isDetecting = holdTime > 0;
        
        if (level === 'warning') {
          speakContextual('sway', currentTaskName);
        } else if (isDetecting && holdTime > 1 && holdTime < 3) {
          speakContextual('detecting', currentTaskName);
        } else if (holdTime >= 3) {
          speakContextual('good', currentTaskName);
        }
        break;
      }
      
      case 'walk': {
        const stepCount = (metrics?.stepCount as number) || 0;
        
        if (level === 'warning') {
          if (msg.includes('visibility') || msg.includes('view')) {
            speakContextual('visibility', 'general');
          } else {
            speakContextual('steady', currentTaskName);
          }
        } else if (progressChanged && stepCount > 0 && stepCount % 3 === 0) {
          // Encourage every 3 steps
          speakContextual('keepgoing', currentTaskName);
        }
        break;
      }
      
      case 'jump': {
        const phase = metrics?.phase !== undefined ? String(metrics.phase) : '';
        
        if (phase === 'crouching') {
          speakContextual('crouch', currentTaskName);
        } else if (phase === 'airborne') {
          speakContextual('airborne', currentTaskName);
        } else if (level === 'warning') {
          if (msg.includes('both') || msg.includes('feet')) {
            speakContextual('bothfeet', currentTaskName);
          } else {
            speakContextual('tryagain', currentTaskName);
          }
        }
        break;
      }
      
      case 'tiptoe': {
        if (level === 'warning') {
          if (msg.includes('arm')) {
            speakContextual('arms', currentTaskName);
          } else if (msg.includes('sway') || msg.includes('balance')) {
            speakContextual('sway', currentTaskName);
          } else {
            speakContextual('raise', currentTaskName);
          }
        } else if (level === 'info' && progress > 0.5) {
          speakContextual('hold', currentTaskName);
        }
        break;
      }
      
      case 'squat': {
        if (level === 'warning') {
          if (msg.includes('knee')) {
            speakContextual('knees', currentTaskName);
          } else if (msg.includes('heel')) {
            speakContextual('heels', currentTaskName);
          } else {
            speakContextual('deeper', currentTaskName);
          }
        } else if (level === 'info' && progress > 0.7) {
          speakContextual('hold', currentTaskName);
        }
        break;
      }
    }
  }, [taskUpdate?.level, taskUpdate?.message, taskUpdate?.progress, taskUpdate?.done, taskUpdate?.metrics, currentTaskName, muted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!taskUpdate) {
    return null;
  }

  const progressPercent = Math.round(taskUpdate.progress * 100);

  return (
    <>
      {/* Success Celebration (shows on task completion) */}
      {renderSuccessCelebration()}

      {/* Task-Specific HUD with real-time metrics */}
      {!taskUpdate.done && renderHUD()}

      {/* Assistant Face (top-left) */}
      <Box
        sx={{
          position: 'fixed',
          top: 80,
          left: 20,
          zIndex: 1001,
        }}
      >
        <AssistantFace mood={assistantMood} size={100} />
      </Box>

      {/* Bottom Progress Bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <GradientLinearProgress
          value={progressPercent}
          sx={{
            height: 8,
          }}
        />
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label={taskUpdate.message}
            color={taskUpdate.level === 'success' ? 'success' : 
                   taskUpdate.level === 'warning' ? 'warning' : 
                   'info'}
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              py: 2,
              px: 2,
            }}
          />
          <Chip
            label={`${progressPercent}%`}
            variant="outlined"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          />
        </Box>
      </Box>
    </>
  );
};

export default CoachOverlay;
