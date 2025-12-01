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
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', mr: 1.5 }}>
            <PersonIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h6" component="h1" fontWeight={600} sx={{ color: 'text.primary' }}>
              Child Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter details before starting assessment
            </Typography>
          </Box>
        </Box>

        {/* Form */}
        <Stack spacing={2}>
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
          <Box sx={{ display: 'flex', gap: 1.5, pt: 2, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => navigate('/')}
              sx={{ 
                flex: 1, 
                textTransform: 'none', 
                fontWeight: 500, 
                py: 1,
                fontSize: '0.9rem',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="medium"
              endIcon={<ArrowForwardIcon />}
              onClick={handleSubmit}
              sx={{ 
                flex: 1, 
                textTransform: 'none', 
                fontWeight: 500, 
                py: 1,
                fontSize: '0.9rem',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                }
              }}
            >
              Continue
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ChildInfoPage;
