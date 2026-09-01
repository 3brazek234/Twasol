import React from 'react';
import { View, Text } from 'react-native';
import { Job } from '../schemas/job.schema';

interface StatusPillProps {
  status: Job['status'];
}

const statusConfig: Record<string, { label: string; className: string; textClassName: string }> = {
  OPEN: { label: 'OPEN', className: 'bg-signal/10', textClassName: 'text-signal' },
  NEGOTIATING: { label: 'NEGOTIATING', className: 'bg-docket/10', textClassName: 'text-docket' },
  ACTIVE: { label: 'ACTIVE', className: 'bg-info/10', textClassName: 'text-info' },
  COMPLETED: { label: 'COMPLETED', className: 'bg-success/10', textClassName: 'text-success' },
  CANCELLED: { label: 'CANCELLED', className: 'bg-muted/10', textClassName: 'text-muted' },
};

export const StatusPill = ({ status }: StatusPillProps) => {
  const config = statusConfig[status] || statusConfig.OPEN;

  return (
    <View className={`px-2 py-0.5 rounded-sm ${config.className}`}>
      <Text className={`text-[10px] font-bodySemibold tracking-[0.5px] ${config.textClassName}`}>
        {config.label}
      </Text>
    </View>
  );
};
