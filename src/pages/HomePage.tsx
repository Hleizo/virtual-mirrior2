import { Box, Button, Container, Typography, Paper, IconButton, Stack, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ScienceIcon from '@mui/icons-material/Science';
import LanguageIcon from '@mui/icons-material/Language';
import { useSessionStore } from '../store/session';
import { makeMockSession } from '../utils/mockSession';

const HomePage = () => {
  console.log('HomePage rendering...');
  const navigate = useNavigate();
  const setCurrent = useSessionStore((state) => state.setCurrent);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const handleLoadDemo = () => {
    const mockSession = makeMockSession();
    setCurrent(mockSession);
    navigate('/results/parent');
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            textAlign: 'center',
            maxWidth: '1000px',
            width: '100%',
          }}
        >
          {/* Language Switch */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <IconButton
              onClick={toggleLanguage}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <LanguageIcon />
              <Typography
                variant="caption"
                sx={{ ml: 1, fontWeight: 600 }}
              >
                {language === 'en' ? 'AR' : 'EN'}
              </Typography>
            </IconButton>
          </Box>

          {/* Icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <MonitorHeartIcon
              sx={{
                fontSize: { xs: 60, md: 80 },
                color: 'primary.main',
              }}
            />
          </Box>

          {/* Project Name */}
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              color: 'primary.main',
              mb: 2,
            }}
          >
            Virtual Mirror
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: 'text.secondary',
              mb: 4,
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            Early Detection of Motor Weakness in Children
          </Typography>

          {/* Main Action Buttons */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3,
              mb: 3,
            }}
          >
            <Stack spacing={0.5}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={() => navigate('/session')}
                sx={{
                  py: 3,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {language === 'en' ? 'Start Test' : 'ابدأ الاختبار'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                {language === 'en' ? 'Begin motor assessment for your child' : 'ابدأ تقييم الحركة لطفلك'}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                color="secondary"
                startIcon={<FamilyRestroomIcon />}
                onClick={() => navigate('/results/parent')}
                sx={{
                  py: 3,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {language === 'en' ? 'Parent Results' : 'نتائج الأهل'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                {language === 'en' ? 'For parents and caregivers' : 'للآباء ومقدمي الرعاية'}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<MedicalServicesIcon />}
                onClick={() => navigate('/results/clinician')}
                sx={{
                  py: 3,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {language === 'en' ? 'Clinician Results' : 'نتائج الأطباء'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                {language === 'en' ? 'For doctors and healthcare professionals' : 'للأطباء والمتخصصين في الرعاية الصحية'}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate('/admin')}
                sx={{
                  py: 3,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {language === 'en' ? 'Admin Dashboard' : 'لوحة الإدارة'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                {language === 'en' ? 'System administration and analytics' : 'إدارة النظام والتحليلات'}
              </Typography>
            </Stack>
          </Box>

          {/* Demo Button */}
          <Button
            variant="text"
            size="small"
            startIcon={<ScienceIcon />}
            onClick={handleLoadDemo}
            sx={{
              mt: 2,
              textTransform: 'none',
            }}
          >
            Load Demo Results
          </Button>

          {/* Additional Info */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 3,
              color: 'text.secondary',
            }}
          >
            {language === 'en' 
              ? 'Camera-based analysis • No sensors required • Real-time feedback'
              : 'تحليل عبر الكاميرا • لا حاجة لأجهزة استشعار • ملاحظات فورية'}
          </Typography>
        </Paper>

        {/* Footer */}
        <Box
          sx={{
            width: '100%',
            mt: 6,
            py: 3,
            textAlign: 'center',
          }}
        >
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            © 2025 Virtual Mirror | {language === 'en' ? 'Powered by AI Motion Analysis' : 'مدعوم بتحليل الحركة بالذكاء الاصطناعي'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {language === 'en' 
              ? 'Early detection technology for pediatric motor development'
              : 'تقنية الكشف المبكر لتطور الحركة لدى الأطفال'}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
