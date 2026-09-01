import { create } from 'zustand';

export type AccountMode = 'GIG' | 'HIRING' | 'BOTH';

export interface OnboardingState {
  // Step 1: registration fields
  email: string;
  password: string;
  fullName: string;
  barNumber: string;
  governorateId: string | null;
  // Step 2: language
  language: 'en' | 'ar' | null;
  // Step 3: account mode selection
  accountMode: AccountMode | null;
  // Step 4: verification decision
  skipVerification: boolean;
  // Helper flags
  verificationSubmitted: boolean;
  // Partial updater (survives navigation within the onboarding stack)
  setPartial: (partial: Partial<Omit<OnboardingState, 'setPartial' | 'reset'>>) => void;
  // Reset all fields (call after successful registration)
  reset: () => void;
}

/**
 * useOnboardingState
 *
 * In-memory Zustand store that holds the user's registration data across all
 * onboarding steps (Register → Language → AccountMode → Verification).
 *
 * Intentionally NOT persisted to disk — onboarding data is sensitive (email,
 * password) and only needs to survive for the duration of the onboarding flow.
 * Once registration is complete, call reset() to wipe the store.
 */
export const useOnboardingState = create<OnboardingState>((set) => ({
  email: '',
  password: '',
  fullName: '',
  barNumber: '',
  governorateId: null,
  language: null,
  accountMode: null,
  skipVerification: false,
  verificationSubmitted: false,

  setPartial: (partial) =>
    set((state) => ({ ...state, ...partial })),

  reset: () =>
    set({
      email: '',
      password: '',
      fullName: '',
      barNumber: '',
      governorateId: null,
      language: null,
      accountMode: null,
      skipVerification: false,
      verificationSubmitted: false,
    }),
}));
