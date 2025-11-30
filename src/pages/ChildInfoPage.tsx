import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useSessionStore } from '../store/session';
import type { ChildProfile } from '../store/session';

const ChildInfoPage = () => {
  const navigate = useNavigate();
  const setChildProfile = useSessionStore((state) => state.setChildProfile);

  const [formData, setFormData] = useState<ChildProfile>({
    childName: '',
    ageYears: 0,
    gender: '',
    heightCm: undefined,
    weightKg: undefined,
    notes: '',
  });

  const [errors, setErrors] = useState({
    childName: false,
    ageYears: false,
  });

  const handleChange = (field: keyof ChildProfile, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field === 'childName' || field === 'ageYears') {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    const newErrors = {
      childName: !formData.childName.trim(),
      ageYears: !formData.ageYears || formData.ageYears <= 0,
    };

    setErrors(newErrors);

    if (newErrors.childName || newErrors.ageYears) {
      return;
    }

    // Save to store and navigate
    setChildProfile(formData);
    navigate('/parent/session');
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', mr: 2 }}>
            <PersonIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
              Child Information
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>
              Please provide basic information before starting the assessment
            </Typography>
          </Box>
        </Box>

        {/* Form */}
        <Stack spacing={3.5}>
          {/* Child Name - Required */}
          <TextField
            fullWidth
            required
            label="Child Name"
            placeholder="Enter child's full name"
            value={formData.childName}
            onChange={(e) => handleChange('childName', e.target.value)}
            error={errors.childName}
            helperText={errors.childName ? 'Child name is required' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {/* Age - Required */}
          <TextField
            fullWidth
            required
            label="Age"
            type="number"
            placeholder="Enter age in years"
            value={formData.ageYears || ''}
            onChange={(e) => handleChange('ageYears', parseInt(e.target.value) || 0)}
            error={errors.ageYears}
            helperText={errors.ageYears ? 'Valid age is required (1-18 years)' : 'Typical age range: 1-18 years'}
            inputProps={{ min: 1, max: 18 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">years</InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {/* Gender - Optional */}
          <FormControl fullWidth>
            <InputLabel>Gender (Optional)</InputLabel>
            <Select
              value={formData.gender || ''}
              label="Gender (Optional)"
              onChange={(e) => handleChange('gender', e.target.value)}
              sx={{
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <MenuItem value="">
                <em>Prefer not to say</em>
              </MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </Select>
          </FormControl>

          {/* Height - Optional */}
          <TextField
            fullWidth
            label="Height (Optional)"
            type="number"
            placeholder="Enter height"
            value={formData.heightCm || ''}
            onChange={(e) => handleChange('heightCm', parseFloat(e.target.value) || undefined)}
            inputProps={{ min: 50, max: 200, step: 0.1 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {/* Weight - Optional */}
          <TextField
            fullWidth
            label="Weight (Optional)"
            type="number"
            placeholder="Enter weight"
            value={formData.weightKg || ''}
            onChange={(e) => handleChange('weightKg', parseFloat(e.target.value) || undefined)}
            inputProps={{ min: 10, max: 150, step: 0.1 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {/* Notes - Optional */}
          <TextField
            fullWidth
            label="Notes (Optional)"
            placeholder="Any additional information, medical history, or concerns..."
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={4}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, pt: 3, mt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              sx={{ 
                flex: 1, 
                textTransform: 'none', 
                fontWeight: 600, 
                py: 1.5,
                borderWidth: '1.5px',
                '&:hover': {
                  borderWidth: '1.5px',
                  bgcolor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleSubmit}
              sx={{ 
                flex: 1, 
                textTransform: 'none', 
                fontWeight: 600, 
                py: 1.5,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              Continue to Session
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ChildInfoPage;
