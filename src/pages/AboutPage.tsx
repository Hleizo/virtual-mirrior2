import { Box, Container, Typography, Paper, Stack, Card, CardContent, Avatar, Collapse } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Button } from '@mui/material';
import { useState } from 'react';

const AboutPage = () => {
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const whyItMatters = [
    {
      icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
      title: 'Brain Plasticity',
      description: 'Young children\'s brains are incredibly adaptable. When motor challenges are identified early, therapeutic interventions can be significantly more effective, helping children develop essential skills during critical developmental windows.',
      color: '#1976d2',
    },
    {
      icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
      title: 'Confidence Building',
      description: 'Children who struggle with motor skills may avoid physical activities, impacting their confidence and social development. Early support helps them build skills and self-esteem before these patterns become ingrained.',
      color: '#ed6c02',
    },
    {
      icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
      title: 'Academic Success',
      description: 'Fine and gross motor skills impact everything from handwriting to sports participation. Addressing challenges early can prevent academic and social difficulties down the road.',
      color: '#2e7d32',
    },
    {
      icon: <FavoriteIcon sx={{ fontSize: 40 }} />,
      title: 'Peace of Mind',
      description: 'For parents who have concerns, having an accessible screening tool provides clarity. Whether results show typical development or suggest further evaluation, knowing is the first step toward support.',
      color: '#9c27b0',
    },
  ];

  const features = [
    {
      icon: <CameraAltIcon sx={{ fontSize: 40 }} />,
      title: 'Real-Time Pose Detection',
      description: 'Advanced AI technology tracks body movements through your camera, analyzing 33 key points on the body to detect subtle movement patterns that might indicate motor weakness.',
      color: '#1976d2',
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Comprehensive Analysis',
      description: 'Our system evaluates balance, coordination, range of motion, and movement quality across multiple standardized tasks designed by pediatric specialists.',
      color: '#2e7d32',
    },
    {
      icon: <HealthAndSafetyIcon sx={{ fontSize: 40 }} />,
      title: 'Clinical-Grade Reports',
      description: 'Generate detailed assessment reports that clinicians can review, including visual data, metrics, and clinical recommendations for further evaluation when needed.',
      color: '#ed6c02',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Parent Setup',
      description: 'Parents enter basic information about their child (name, age, any relevant notes) and prepare a safe, well-lit space with the camera positioned properly.',
    },
    {
      step: '2',
      title: 'Guided Tasks',
      description: 'The child performs simple, age-appropriate movements while our virtual assistant guides them through each task. Tasks include reaching, balancing, stepping, and other natural movements.',
    },
    {
      step: '3',
      title: 'AI Analysis',
      description: 'As the child moves, our AI analyzes their posture, joint angles, balance, and coordination in real-time, comparing their performance to developmental norms.',
    },
    {
      step: '4',
      title: 'Results & Follow-up',
      description: 'Parents receive an easy-to-understand summary, while clinicians access detailed metrics. If concerns are detected, the system recommends professional consultation.',
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
            p: 6,
            borderRadius: 4,
            textAlign: 'center',
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            <MonitorHeartIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h2" fontWeight={800} gutterBottom>
            About Virtual Mirror
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: 800, mx: 'auto', lineHeight: 1.6 }}>
            Empowering Early Detection of Motor Development Challenges in Children
          </Typography>
        </Paper>

        {/* Our Mission */}
        <Paper id="mission" elevation={0} sx={{ p: 5, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
            Our Mission
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
            Every child deserves the opportunity to reach their full potential. But sometimes, motor development challenges can go unnoticed until they impact a child's daily life, social interactions, or academic performance. 
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
            Virtual Mirror was created to bridge this gap. We believe that early detection isn't just about identifying problems—it's about opening doors to timely support, intervention, and hope. Our mission is to make screening for motor weakness accessible, non-invasive, and stress-free for both children and their families.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            Using cutting-edge artificial intelligence and computer vision technology, we've developed a tool that transforms a simple camera into a powerful assessment device. Parents can screen their children from the comfort of home, while healthcare professionals gain valuable insights to guide their clinical decisions.
          </Typography>
        </Paper>

        {/* Why Early Detection Matters - Expandable Cards */}
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary" sx={{ mb: 4, textAlign: 'center' }}>
            Why Early Detection Matters
          </Typography>
          <Stack spacing={2}>
            {whyItMatters.map((item, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  border: '2px solid',
                  borderColor: expandedCard === index ? `${item.color}` : 'divider',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: expandedCard === index 
                    ? `linear-gradient(135deg, ${item.color}08 0%, ${item.color}03 100%)`
                    : 'white',
                  '&:hover': {
                    borderColor: item.color,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${item.color}25`,
                  },
                }}
                onClick={() => handleCardClick(index)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${item.color}15`,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        transform: expandedCard === index ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      fontWeight={700} 
                      sx={{ 
                        color: expandedCard === index ? item.color : 'text.primary',
                        flex: 1,
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {item.title}
                    </Typography>
                    <ExpandMoreIcon 
                      sx={{ 
                        color: item.color,
                        transition: 'transform 0.3s ease',
                        transform: expandedCard === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      }} 
                    />
                  </Stack>
                  <Collapse in={expandedCard === index} timeout={400}>
                    <Box sx={{ pt: 2.5, pl: 7 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        {/* How It Works */}
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary" sx={{ mb: 4 }}>
            How Virtual Mirror Works
          </Typography>
          <Stack spacing={3}>
            {howItWorks.map((item, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={3} alignItems="flex-start">
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {item.step}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        {/* Key Features */}
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary" sx={{ mb: 4, textAlign: 'center' }}>
            What Makes Us Different
          </Typography>
          <Stack spacing={3}>
            {features.map((feature, index) => (
              <Card
                key={index}
                elevation={0}
                sx={{
                  background: `linear-gradient(135deg, ${feature.color}08 0%, ${feature.color}03 100%)`,
                  border: '1px solid',
                  borderColor: `${feature.color}30`,
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: `${feature.color}15`,
                        color: feature.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: feature.color }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        {/* Our Commitment */}
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(102, 187, 106, 0.05) 100%)',
            border: '1px solid',
            borderColor: 'success.light',
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom color="success.dark">
            Our Commitment to You
          </Typography>
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              <strong>Privacy First:</strong> All assessment data is handled with the utmost care. We prioritize your child's privacy and comply with healthcare data protection standards.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              <strong>Evidence-Based:</strong> Our assessment tasks and analysis algorithms are grounded in pediatric developmental research and clinical best practices.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              <strong>Accessible:</strong> We believe every family deserves access to quality screening tools, regardless of location or resources. Virtual Mirror makes professional-grade assessment available from home.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              <strong>Supportive, Not Diagnostic:</strong> Virtual Mirror is a screening tool designed to identify children who may benefit from further evaluation. It does not replace professional medical assessment, but rather serves as a valuable first step in the care journey.
            </Typography>
          </Stack>
        </Paper>

        {/* CTA Footer */}
        <Box sx={{ textAlign: 'center', mt: 6, mb: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Join families and healthcare providers who are using Virtual Mirror to support children's healthy development.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/parent/child-info')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 3,
              }}
            >
              Start an Assessment
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/admin')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 3,
              }}
            >
              View Dashboard
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default AboutPage;
