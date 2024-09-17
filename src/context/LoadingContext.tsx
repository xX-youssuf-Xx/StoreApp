// src/context/LoadingContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoadin: React.Dispatch<React.SetStateAction<boolean>>;
  forceLoading: boolean;
  setForceLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const [isLoading, setIsLoadin] = useState(false);
  const [forceLoading, setForceLoading] = useState(true);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoadin, forceLoading, setForceLoading }}>
      {children}
      {/* JOE: SHOW LOADING OVERLAY */}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === null) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
