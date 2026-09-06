import React from 'react';
import { View, Text } from 'react-native';
import { Job } from '../schemas/job.schema';

interface StatusPillProps {
  status: Job['status'];
}

const statusConfig: Record<string, { label: string; className: string; textClassName: string }> = {
  OPEN: { label: 'متاح', className: 'bg-signal/10', textClassName: 'text-signal' },
  NEGOTIATING: { label: 'قيد التفاوض', className: 'bg-docket/10', textClassName: 'text-docket' },
  AGREED: { label: 'تم الاتفاق', className: 'bg-info/10', textClassName: 'text-info' },
  IN_PROGRESS: { label: 'جاري التنفيذ', className: 'bg-success/10', textClassName: 'text-success' },
  COMPLETED: { label: 'مكتمل', className: 'bg-docket/20', textClassName: 'text-navy' },
  CANCELLED: { label: 'ملغي', className: 'bg-muted/10', textClassName: 'text-muted' },
  EXPIRED: { label: 'منتهي', className: 'bg-destructive/10', textClassName: 'text-destructive' },
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
