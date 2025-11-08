import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from 'react';
import { api } from '../services/api';

export type VerificationStepKey = 'voice' | 'face' | 'document';

export type StepStatus = {
  completed: boolean;
  updatedAt?: string;
};

export type VerificationSnapshot = {
  steps: Record<VerificationStepKey, StepStatus>;
  adminApproved: boolean;
  profileCompleted: boolean;
};

const initialSnapshot: VerificationSnapshot = {
  steps: {
    voice: { completed: false },
    face: { completed: false },
    document: { completed: false },
  },
  adminApproved: false,
  profileCompleted: false,
};

type VerificationContextValue = {
  status: VerificationSnapshot;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markStepComplete: (step: VerificationStepKey, completed?: boolean) => void;
  markAdminApproved: (approved: boolean) => void;
  reset: () => void;
};

const VerificationContext = createContext<VerificationContextValue | undefined>(undefined);

const normalizeFromApi = (payload: any): VerificationSnapshot => {
  if (!payload || typeof payload !== 'object') {
    return initialSnapshot;
  }

  const voice = Boolean(payload.voice_verified ?? payload.voiceVerified);
  const face = Boolean(payload.face_verified ?? payload.faceVerified);
  const document = Boolean(payload.document_verified ?? payload.documentVerified);
  const profileCompleted = Boolean(
    payload.profile_completed ?? payload.profileCompleted ?? (voice && face && document)
  );
  const adminApproved = Boolean(
    payload.admin_approved ?? payload.adminApproved ?? (voice && face && document)
  );

  return {
    steps: {
      voice: {
        completed: voice,
        updatedAt: payload.voice_verified_at ?? payload.voiceVerifiedAt ?? payload.updatedAt,
      },
      face: {
        completed: face,
        updatedAt: payload.face_verified_at ?? payload.faceVerifiedAt ?? payload.updatedAt,
      },
      document: {
        completed: document,
        updatedAt:
          payload.document_verified_at ?? payload.documentVerifiedAt ?? payload.updatedAt,
      },
    },
    profileCompleted,
    adminApproved,
  };
};

export const VerificationProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [status, setStatus] = useState<VerificationSnapshot>(initialSnapshot);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/profile');
      const payload = response.data?.user ?? response.data;
      if (payload) {
        const normalized = normalizeFromApi(payload);
        if (isMounted.current) {
          setStatus(normalized);
          setError(null);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        const message = err instanceof Error ? err.message : 'Failed to fetch verification status';
        setError(message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 12000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markStepComplete = useCallback(
    (step: VerificationStepKey, completed: boolean = true) => {
      setStatus((prev) => {
        const nowIso = new Date().toISOString();
        const nextSteps: VerificationSnapshot['steps'] = {
          ...prev.steps,
          [step]: {
            completed,
            updatedAt: nowIso,
          },
        };
        const allCompleted =
          nextSteps.voice.completed && nextSteps.face.completed && nextSteps.document.completed;
        const nextAdminApproved = step === 'document'
          ? completed
          : prev.adminApproved || allCompleted;
        return {
          steps: nextSteps,
          profileCompleted: allCompleted,
          adminApproved: nextAdminApproved,
        };
      });
    },
    []
  );

  const markAdminApproved = useCallback((approved: boolean) => {
    setStatus((prev) => ({
      ...prev,
      adminApproved: approved,
      profileCompleted: prev.profileCompleted || approved,
    }));
  }, []);

  const reset = useCallback(() => {
    setStatus({
      steps: {
        voice: { ...initialSnapshot.steps.voice },
        face: { ...initialSnapshot.steps.face },
        document: { ...initialSnapshot.steps.document },
      },
      profileCompleted: initialSnapshot.profileCompleted,
      adminApproved: initialSnapshot.adminApproved,
    });
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ status, loading, error, refresh, markStepComplete, markAdminApproved, reset }),
    [status, loading, error, refresh, markStepComplete, markAdminApproved, reset]
  );

  return <VerificationContext.Provider value={value}>{children}</VerificationContext.Provider>;
};

export const useVerificationStatus = () => {
  const ctx = useContext(VerificationContext);
  if (!ctx) {
    throw new Error('useVerificationStatus must be used within VerificationProvider');
  }
  return ctx;
};
