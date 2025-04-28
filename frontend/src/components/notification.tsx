import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import { CheckCircle, Error, Info, Warning, Close as CloseIcon } from '@mui/icons-material';

const NotificationContainer = styled(motion.div)(({ theme }) => ({
  position: 'fixed',
  bottom: 24,
  left: 24,
  zIndex: 2000,
}));

const NotificationCard = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[4],
  minWidth: 300,
  maxWidth: 400,
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(10px)',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
}));

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(0.5),
}));

const Message = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  padding: theme.spacing(0.5),
}));

interface NotificationProps {
  open: boolean;
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  autoHideDuration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  open,
  message,
  title,
  type = 'info',
  onClose,
  autoHideDuration = 5000,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <Info color="info" />;
    }
  };

  const getColor = (theme: any) => {
    switch (type) {
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  React.useEffect(() => {
    if (open && autoHideDuration) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <NotificationContainer
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        >
          <NotificationCard>
            <IconWrapper sx={{ backgroundColor: (theme) => alpha(getColor(theme), 0.1) }}>
              {getIcon()}
            </IconWrapper>
            <ContentWrapper>
              {title && <Title variant="subtitle1">{title}</Title>}
              <Message variant="body2">{message}</Message>
            </ContentWrapper>
            <CloseButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </CloseButton>
          </NotificationCard>
        </NotificationContainer>
      )}
    </AnimatePresence>
  );
};

export default Notification; 