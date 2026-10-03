import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../theme/tokens';

type JobLifecycleStatus = 'OPEN' | 'NEGOTIATING' | 'AGREED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

interface JobLifecycleStepperProps {
  status: JobLifecycleStatus;
  hasApplied?: boolean;
}

const steps = [
  { label: 'تقديم', status: 'OPEN' },
  { label: 'تفاوض', status: 'NEGOTIATING' },
  { label: 'اتفاق', status: 'AGREED' },
  { label: 'تنفيذ', status: 'IN_PROGRESS' },
  { label: 'مكتمل', status: 'COMPLETED' },
] as const;

const JobLifecycleStepper = ({ status, hasApplied = false }: JobLifecycleStepperProps) => {
  if (status === 'CANCELLED' || status === 'EXPIRED') {
    return (
      <View style={styles.terminalContainer}>
        <Text style={styles.terminalText}>
          {status === 'CANCELLED' ? 'تم إلغاء المهمة' : 'انتهت صلاحية المهمة'}
        </Text>
      </View>
    );
  }

  const activeIndex = status === 'OPEN'
    ? (hasApplied ? 0 : -1)
    : steps.findIndex((step) => step.status === status);
  if (activeIndex < 0) return null;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`تقدم المهمة: ${steps[activeIndex].label}`}
      style={styles.container}
    >
      {steps.map((step, index) => {
        const isComplete = index < activeIndex;
        const isCurrent = index === activeIndex;
        const color = isComplete
          ? tokens.colors.signal
          : isCurrent
            ? tokens.colors.docket
            : tokens.colors.muted;

        return (
          <React.Fragment key={step.status}>
            <View style={styles.step}>
              <View style={[styles.marker, { borderColor: color, backgroundColor: isComplete ? color : tokens.colors.paper }]}>
                {isComplete ? <View style={styles.completeDot} /> : null}
              </View>
              <Text style={[styles.label, { color, fontFamily: isCurrent ? tokens.typography.fonts.bodyMedium : tokens.typography.fonts.body }]}>
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 ? (
              <View style={[styles.connector, { backgroundColor: index < activeIndex ? tokens.colors.signal : tokens.colors.line }]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xs,
  },
  step: {
    alignItems: 'center',
    flex: 1,
    gap: tokens.spacing.xs / 2,
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: tokens.radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeDot: {
    width: 6,
    height: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.paper,
  },
  connector: {
    height: 2,
    flex: 0.55,
    marginTop: 7,
  },
  label: {
    fontSize: tokens.typography.sizes.xs,
    textAlign: 'center',
  },
  terminalContainer: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs / 2,
    marginBottom: tokens.spacing.md,
  },
  terminalText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodyMedium,
    fontSize: tokens.typography.sizes.xs,
  },
});

export default JobLifecycleStepper;
