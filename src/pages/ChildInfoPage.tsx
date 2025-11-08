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
    navigate('/session');
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Child Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please provide basic information before starting the assessment
            </Typography>
          </Box>
        </Box>

        {/* Form */}
        <Stack spacing={3}>
          {/* Child Name - Required */}
          <TextField
            fullWidth
            required
            label="Child Name"
            placeholder="Enter child's name"
            value={formData.childName}
            onChange={(e) => handleChange('childName', e.target.value)}
            error={errors.childName}
            helperText={errors.childName ? 'Child name is required' : ''}
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
            helperText={errors.ageYears ? 'Valid age is required' : ''}
            inputProps={{ min: 1, max: 18 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">years</InputAdornment>,
            }}
          />

          {/* Gender - Optional */}
          <FormControl fullWidth>
            <InputLabel>Gender (Optional)</InputLabel>
            <Select
              value={formData.gender || ''}
              label="Gender (Optional)"
              onChange={(e) => handleChange('gender', e.target.value)}
            >
              <MenuItem value="">
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
          />

          {/* Notes - Optional */}
          <TextField
            fullWidth
            label="Notes (Optional)"
            placeholder="Any additional information or concerns..."
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            multiline
            rows={3}
          />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleSubmit}
              sx={{ flex: 1 }}
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
