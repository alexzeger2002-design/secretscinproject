import React, { createContext, useContext, ReactNode } from 'react';

interface LandingContextType {
  redirectUrl: string | null;
  visitId: number | null;
  linkCode: string | null;
  onTelegramClick?: () => void;
}

const LandingContext = createContext<LandingContextType | undefined>(undefined);

export function LandingProvider({ 
  children, 
  redirectUrl, 
  visitId, 
  linkCode,
  onTelegramClick 
}: { 
  children: ReactNode;
  redirectUrl: string | null;
  visitId: number | null;
  linkCode: string | null;
  onTelegramClick?: () => void;
}) {
  // Создаем новый объект значения при каждом рендере, чтобы гарантировать обновление контекста
  // Это важно для того, чтобы все компоненты, использующие контекст, перерендерились при изменении redirectUrl
  const value = React.useMemo(
    () => ({ redirectUrl, visitId, linkCode, onTelegramClick }),
    [redirectUrl, visitId, linkCode, onTelegramClick]
  );
  
  return (
    <LandingContext.Provider value={value}>
      {children}
    </LandingContext.Provider>
  );
}

export function useLanding() {
  const context = useContext(LandingContext);
  if (context === undefined) {
    throw new Error('useLanding must be used within LandingProvider');
  }
  return context;
}
