import { useNavigate } from 'react-router-dom';
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
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  Share as ShareIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  TipsAndUpdates as TipsIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useSessionStore } from '../store/session';
import GradientLinearProgress from '../components/GradientLinearProgress';

const ParentResultsPage = () => {
  const navigate = useNavigate();
  const summary = useSessionStore((state) => state.current);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);

  const handleShareClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareMenuAnchor(null);
  };

  const handleDownloadImage = () => {
    // TODO: Implement screenshot/image generation
    alert('Image download will be implemented soon!');
    handleShareClose();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    alert('PDF download will be implemented soon!');
    handleShareClose();
  };

  if (!summary) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          No session found. Please complete a session first or load demo results.
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

  const getRiskMessage = () => {
    switch (summary.overallRisk) {
      case 'normal':
        return {
          message: 'Looks good! Your child shows typical motor development.',
          color: 'success' as const,
          icon: <CheckCircleIcon />,
        };
      case 'monitor':
        return {
          message: 'Some values are borderline — consider rechecking in a few weeks.',
          color: 'warning' as const,
          icon: <WarningIcon />,
        };
      case 'high':
        return {
          message: 'Consider seeing a pediatric physiotherapist for evaluation.',
          color: 'error' as const,
          icon: <ErrorIcon />,
        };
      default:
        return {
          message: 'Assessment complete.',
          color: 'info' as const,
          icon: <CheckCircleIcon />,
        };
    }
  };

  const riskInfo = getRiskMessage();

  const getTaskMessage = (taskName: string) => {
    switch (taskName) {
      case 'raise_hand':
        return 'Arm movements look coordinated and symmetrical.';
      case 'one_leg':
        return 'Balance is developing appropriately for their age.';
      case 'walk':
        return 'Walking pattern appears smooth and coordinated.';
      case 'jump':
        return 'Jumping and landing show good coordination.';
      default:
        return 'Task completed successfully.';
    }
  };

  const getTaskPerformance = (taskName: string, metrics: Record<string, number | string>) => {
    let score = 100;
    let color: 'success' | 'warning' | 'error' = 'success';

    switch (taskName) {
      case 'raise_hand':
        const shoulderFlexion = metrics.shoulderFlexionMax as number;
        if (shoulderFlexion >= 120) {
          score = 100;
          color = 'success';
        } else if (shoulderFlexion >= 90) {
          score = 70;
          color = 'warning';
        } else {
          score = 40;
          color = 'error';
        }
        break;
      case 'one_leg':
        const holdTime = metrics.holdTime as number;
        if (holdTime >= 5) {
          score = 100;
          color = 'success';
        } else if (holdTime >= 3) {
          score = 60;
          color = 'warning';
        } else {
          score = 30;
          color = 'error';
        }
        break;
      case 'walk':
        const symmetry = metrics.symmetryPercent as number;
        if (symmetry >= 80) {
          score = 100;
          color = 'success';
        } else if (symmetry >= 60) {
          score = 70;
          color = 'warning';
        } else {
          score = 40;
          color = 'error';
        }
        break;
      case 'jump':
        const jumpHeight = metrics.jumpHeightPixels as number;
        if (jumpHeight >= 80) {
          score = 100;
          color = 'success';
        } else if (jumpHeight >= 40) {
          score = 70;
          color = 'warning';
        } else {
          score = 50;
          color = 'error';
        }
        break;
    }

    return { score, color };
  };

  const getTaskSuggestions = (taskName: string, metrics: Record<string, number | string>) => {
    const suggestions: string[] = [];

    switch (taskName) {
      case 'raise_hand':
        const shoulderFlexion = metrics.shoulderFlexionMax as number;
        if (shoulderFlexion < 120) {
          suggestions.push('Practice reaching overhead with both arms during play.');
          suggestions.push('Try wall angels or shoulder stretches daily.');
        } else {
          suggestions.push('Keep up the great shoulder mobility!');
        }
        break;
      case 'one_leg':
        const holdTime = metrics.holdTime as number;
        if (holdTime < 5) {
          suggestions.push('Practice standing on one leg for 5 seconds daily.');
          suggestions.push('Try balance games like flamingo pose during teeth brushing.');
        } else {
          suggestions.push('Excellent balance! Try more challenging activities.');
        }
        break;
      case 'walk':
        const symmetry = metrics.symmetryPercent as number;
        if (symmetry < 80) {
          suggestions.push('Encourage regular walking and outdoor play.');
          suggestions.push('Practice walking heel-to-toe in a straight line.');
        } else {
          suggestions.push('Walking pattern looks great!');
        }
        break;
      case 'jump':
        const jumpHeight = metrics.jumpHeightPixels as number;
        if (jumpHeight < 80) {
          suggestions.push('Practice jumping on soft surfaces like grass or mats.');
          suggestions.push('Play hopscotch or jumping games to build leg strength.');
        } else {
          suggestions.push('Great jumping ability!');
        }
        break;
    }

    return suggestions;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
        Assessment Results
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Session completed on {new Date(summary.startedAt).toLocaleDateString()}
        {summary.childAgeYears && ` • Child age: ${summary.childAgeYears} years`}
      </Typography>

      {/* Overall Risk Banner */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: riskInfo.color === 'success' ? 'success.light' : 
                   riskInfo.color === 'warning' ? 'warning.light' : 'error.light',
          borderRadius: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ fontSize: '2rem' }}>{riskInfo.icon}</Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Overall Assessment
            </Typography>
            <Typography variant="body1">{riskInfo.message}</Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Task Cards */}
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Activity Details
      </Typography>
      <Stack spacing={3} sx={{ mb: 3 }}>
        {summary.tasks.map((task, index) => {
          const performance = getTaskPerformance(task.task, task.metrics);
          const suggestions = getTaskSuggestions(task.task, task.metrics);

          return (
            <Card key={index} variant="outlined" sx={{ overflow: 'visible' }}>
              <CardContent>
                {/* Task Header */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <CheckCircleIcon 
                    color={performance.color} 
                    sx={{ fontSize: '2.5rem' }} 
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {task.task.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getTaskMessage(task.task)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${performance.score}%`}
                    color={performance.color}
                    sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}
                  />
                </Stack>

                {/* Performance Bar */}
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600}>
                      Performance
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {performance.score >= 90 ? 'Excellent' : 
                       performance.score >= 70 ? 'Good' : 
                       performance.score >= 50 ? 'Fair' : 'Needs Attention'}
                    </Typography>
                  </Stack>
                  <GradientLinearProgress 
                    value={performance.score}
                  />
                </Box>

                {/* Flags */}
                {task.flags && task.flags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {task.flags.map((flag, i) => (
                      <Chip
                        key={i}
                        label={flag}
                        size="small"
                        color="warning"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}

                {/* Divider */}
                <Divider sx={{ my: 2 }} />

                {/* Suggestions */}
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <TipsIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                      Tips for Improvement
                    </Typography>
                  </Stack>
                  <Stack spacing={0.5}>
                    {suggestions.map((suggestion, i) => (
                      <Typography 
                        key={i} 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          pl: 2,
                          '&::before': {
                            content: '"• "',
                            fontWeight: 600,
                          }
                        }}
                      >
                        {suggestion}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Actions */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={<ShareIcon />}
          onClick={handleShareClick}
          sx={{ flex: 1, minWidth: '200px' }}
        >
          Share Results
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

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleDownloadImage}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download as Image</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadPDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download as PDF</ListItemText>
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default ParentResultsPage;
