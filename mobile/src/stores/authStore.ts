import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../schemas/auth.schema';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  submitVerification: (status: 'UNVERIFIED' | 'PENDING_UPLOAD' | 'PENDING' | 'APPROVED' | 'REJECTED') => Promise<void>;
  selectedMode: 'GIG' | 'HIRING' | null;
  setSelectedMode: (mode: 'GIG' | 'HIRING') => void;
  updateAccountMode: (mode: 'GIG' | 'HIRING' | 'BOTH') => Promise<void>;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until hydrated
  selectedMode: null,
  hasSeenOnboarding: false,

  setHasSeenOnboarding: (val) => set({ hasSeenOnboarding: val }),

  setUser: (user) => {
    // Determine the initial selected mode based on accountMode
    let initialSelectedMode: 'GIG' | 'HIRING' | null = null;
    if (user) {
      if (user.accountMode === 'GIG') initialSelectedMode = 'GIG';
      else if (user.accountMode === 'HIRING') initialSelectedMode = 'HIRING';
      // If BOTH, we will try to load from SecureStore in hydrate, otherwise default to GIG later
    }
    set({ user, isAuthenticated: !!user, selectedMode: initialSelectedMode || get().selectedMode });
  },

  login: async (accessToken, refreshToken, user) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('userProfile', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userProfile');
    set({ user: null, isAuthenticated: false });
  },

  submitVerification: async (status) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, verificationStatus: status };
      SecureStore.setItemAsync('userProfile', JSON.stringify(updatedUser)).catch(console.error);
      return { user: updatedUser };
    });
  },

  setSelectedMode: (mode) => {
    set({ selectedMode: mode });
    SecureStore.setItemAsync('selectedMode', mode).catch(console.error);
  },

  updateAccountMode: async (mode) => {
    const { usersApi } = require('../api/users.api');
    await usersApi.updateAccountMode(mode);
    
    set((state) => {
      if (!state.user) return state;
      const initialSelected = mode === 'BOTH' ? (state.selectedMode || 'GIG') : mode;
      const updatedUser = { ...state.user, accountMode: mode };
      SecureStore.setItemAsync('userProfile', JSON.stringify(updatedUser)).catch(console.error);
      return {
        user: updatedUser,
        selectedMode: initialSelected,
      };
    });
  },

  // Fetches live user profile from /auth/me and updates store + SecureStore cache.
  // Called on: app foreground, subscription screen mount, apply flow.
  refreshUserProfile: async () => {
    try {
      const { apiClient } = require('../api/client');
      const res = await apiClient.get('/auth/me');
      const freshUser = res.data?.user ?? res.data;
      if (freshUser) {
        await SecureStore.setItemAsync('userProfile', JSON.stringify(freshUser));
        set({ user: freshUser });
      }
    } catch (err) {
      console.warn('[authStore] refreshUserProfile failed, using cached state', err);
    }
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const userJson = await SecureStore.getItemAsync('userProfile');
        let currentUser = userJson ? JSON.parse(userJson) : null;
        
        // Optimistically set authenticated state from cache
        set({ isAuthenticated: true, user: currentUser });

        // Fetch full fresh profile from server (covers verificationStatus AND subscriptionStatus)
        try {
          const { apiClient } = require('../api/client');
          const res = await apiClient.get('/auth/me');
          const freshUser = res.data?.user ?? res.data;
          if (freshUser) {
            await SecureStore.setItemAsync('userProfile', JSON.stringify(freshUser));
            set({ user: freshUser });
            currentUser = freshUser;
          }
        } catch (apiErr) {
          console.warn('[authStore] Failed to fetch fresh user profile, using cached state', apiErr);
        }

        const savedMode = await SecureStore.getItemAsync('selectedMode');
        if (savedMode === 'GIG' || savedMode === 'HIRING') {
          set({ selectedMode: savedMode });
        } else if (currentUser?.accountMode === 'GIG') {
          set({ selectedMode: 'GIG' });
        } else if (currentUser?.accountMode === 'HIRING') {
          set({ selectedMode: 'HIRING' });
        } else {
          set({ selectedMode: 'GIG' });
        }
      }

      // Read Onboarding status
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const seen = await AsyncStorage.getItem('@has_seen_onboarding');
        if (seen === 'true') {
          set({ hasSeenOnboarding: true });
        }
      } catch (e) {
        console.warn('Failed to read onboarding status', e);
      }
    } catch (e) {
      console.error('Failed to hydrate auth state', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
