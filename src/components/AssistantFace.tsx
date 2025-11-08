import { Box } from '@mui/material';
import { useMemo } from 'react';

export type AssistantMood = 'idle' | 'encourage' | 'great' | 'warn';

interface AssistantFaceProps {
  mood: AssistantMood;
  size?: number;
}

/**
 * Cartoon assistant that reacts to child's performance
 * Uses emoji animations as placeholder for future Lottie integration
 */
const AssistantFace = ({ mood, size = 80 }: AssistantFaceProps) => {
  const { emoji, animation } = useMemo(() => {
    switch (mood) {
      case 'idle':
        return {
          emoji: '😊',
          animation: 'pulse 2s ease-in-out infinite',
        };
      case 'encourage':
        return {
          emoji: '💪',
          animation: 'bounce 0.8s ease-in-out infinite',
        };
      case 'great':
        return {
          emoji: '🎉',
          animation: 'spin 1s ease-in-out infinite',
        };
      case 'warn':
        return {
          emoji: '🤔',
          animation: 'shake 0.5s ease-in-out infinite',
        };
      default:
        return {
          emoji: '😊',
          animation: 'none',
        };
    }
  }, [mood]);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
        animation,
        '@keyframes pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
        },
        '@keyframes bounce': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        '@keyframes spin': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        '@keyframes shake': {
          '0%, 100%': {
            transform: 'translateX(0)',
          },
          '25%': {
            transform: 'translateX(-5px)',
          },
          '75%': {
            transform: 'translateX(5px)',
          },
        },
      }}
    >
      {emoji}
    </Box>
  );
};

export default AssistantFace;
