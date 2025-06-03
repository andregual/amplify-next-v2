'use client';

import { Alert, Text } from '@aws-amplify/ui-react';

interface AlertBannerProps {
  type: 'success' | 'error';
  title: string;
  message?: string;
  reservationId?: string | null;
  onDismiss?: () => void;
}

export default function AlertBanner({
  type,
  title,
  message,
  reservationId,
  onDismiss,
}: AlertBannerProps) {
  return (
    <Alert
      variation={type}
      isDismissible
      heading={title}
      marginBottom='medium'
      onDismiss={onDismiss}
    >
      {type === 'success' && reservationId ? (
        <Text>
          Your reservation (ID: {reservationId}) has been created successfully.
        </Text>
      ) : (
        message
      )}
    </Alert>
  );
}
