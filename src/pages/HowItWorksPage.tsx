import { Box, Container, Typography, Paper, Stack, Card, CardContent, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { Button } from '@mui/material';

const HowItWorksPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      label: 'Camera Setup',
      icon: <CameraAltIcon sx={{ fontSize: 40 }} />,
      title: 'Position Your Camera',
      description: 'Simply use your device\'s camera or webcam. No special equipment needed—just ensure good lighting and a clear view of the child.',
      color: '#1976d2',
    },
    {
      label: 'Interactive Tasks',
      icon: <SportsGymnasticsIcon sx={{ fontSize: 40 }} />,
      title: 'Child Performs Fun Activities',
      description: 'The child follows on-screen prompts to perform simple, game-like movements. Our friendly virtual coach guides them through exercises designed to assess motor skills.',
      color: '#2e7d32',
    },
    {
      label: 'AI Analysis',
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Real-Time Processing',
      description: 'Advanced AI analyzes body movements, joint angles, balance, and coordination in real-time using computer vision technology.',
      color: '#ed6c02',
    },
    {
      label: 'Results',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      title: 'Comprehensive Report',
      description: 'Receive detailed insights comparing your child\'s performance to clinical standards. Results are presented in both parent-friendly and clinical formats.',
      color: '#9c27b0',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #e3f2fd 0%, #ffffff 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Home
        </Button>

        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 4,
            textAlign: 'center',
            mb: 5,
            background: 'linear-gradient(135deg, #1976d2 0%, #667eea 100%)',
            color: 'white',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              mb: 2,
            }}
          >
            <PlayCircleOutlineIcon sx={{ fontSize: 56 }} />
          </Box>
          <Typography variant="h2" fontWeight={800} gutterBottom>
            How Virtual Mirror Works
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}>
            A Simple, Non-Invasive Process Powered by Advanced AI Technology
          </Typography>
        </Paper>

        {/* Process Overview */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary" sx={{ mb: 3 }}>
            The Assessment Process
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 4 }}>
            Virtual Mirror transforms your device's camera into a powerful assessment tool. Here's how the magic happens:
          </Typography>

          <Stack spacing={4}>
            {steps.map((step, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: step.color,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${step.color}25`,
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={3} alignItems="flex-start">
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: `${step.color}15`,
                        color: step.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 80,
                        height: 80,
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: step.color,
                            width: 32,
                            height: 32,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </Avatar>
                        <Typography variant="h5" fontWeight={700} color={step.color}>
                          {step.title}
                        </Typography>
                      </Stack>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {step.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        {/* Technology Behind It */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, mb: 4, background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(102, 126, 234, 0.05) 100%)', border: '1px solid', borderColor: 'primary.light' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary" sx={{ mb: 3 }}>
            The Technology Behind Virtual Mirror
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom color="primary.dark">
                Computer Vision & Pose Estimation
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Our system uses state-of-the-art pose estimation models to track 33 body landmarks in real-time, measuring joint angles, body positioning, and movement patterns with clinical-grade precision.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom color="primary.dark">
                Clinical Standards Comparison
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Every movement is compared against established clinical benchmarks for motor development, using evidence-based criteria from pediatric assessment protocols.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom color="primary.dark">
                Privacy-First Design
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                All processing happens in real-time. Video is never stored or transmitted—only anonymized movement data is analyzed and saved for your reports.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* CTA */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
            Begin your child's assessment today and gain valuable insights into their motor development.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={2}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/parent/child-info')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              Start Assessment
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default HowItWorksPage;
