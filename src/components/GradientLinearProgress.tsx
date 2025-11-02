import { LinearProgress, Box } from '@mui/material';
import type { LinearProgressProps } from '@mui/material';

interface GradientLinearProgressProps extends LinearProgressProps {
  value: number;
}

/**
 * A LinearProgress component with gradient colors (green → yellow → red)
 * based on the value percentage.
 */
const GradientLinearProgress = ({ value, ...props }: GradientLinearProgressProps) => {
  // Determine gradient based on value
  const getGradient = (val: number) => {
    if (val >= 80) {
      return 'linear-gradient(90deg, #2e7d32 0%, #4caf50 100%)'; // Green
    } else if (val >= 60) {
      return 'linear-gradient(90deg, #66bb6a 0%, #fdd835 100%)'; // Green to Yellow
    } else if (val >= 40) {
      return 'linear-gradient(90deg, #fdd835 0%, #ff9800 100%)'; // Yellow to Orange
    } else if (val >= 20) {
      return 'linear-gradient(90deg, #ff9800 0%, #f4511e 100%)'; // Orange to Red-Orange
    } else {
      return 'linear-gradient(90deg, #f4511e 0%, #d32f2f 100%)'; // Red-Orange to Red
    }
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <LinearProgress
        variant="determinate"
        value={value}
        {...props}
        sx={{
          height: 12,
          borderRadius: 6,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 6,
            background: getGradient(value),
          },
          ...props.sx,
        }}
      />
    </Box>
  );
};

export default GradientLinearProgress;
