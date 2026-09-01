import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountModeScreen } from '../../screens/verification/AccountModeScreen';
import { VerificationIntroScreen } from '../../screens/verification/VerificationIntroScreen';
import { DocumentUploadScreen } from '../../screens/verification/DocumentUploadScreen';
import { PendingReviewScreen } from '../../screens/verification/PendingReviewScreen';
import { ResubmitScreen } from '../../screens/verification/ResubmitScreen';

const VerificationStack = createNativeStackNavigator();

export const VerificationNavigator = () => (
  <VerificationStack.Navigator screenOptions={{ headerShown: false }}>
    <VerificationStack.Screen name="AccountMode" component={AccountModeScreen} />
    <VerificationStack.Screen name="VerificationIntro" component={VerificationIntroScreen} />
    <VerificationStack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
    <VerificationStack.Screen name="PendingReview" component={PendingReviewScreen} />
    <VerificationStack.Screen name="Resubmit" component={ResubmitScreen} />
  </VerificationStack.Navigator>
);
