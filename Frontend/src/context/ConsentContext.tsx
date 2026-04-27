import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ConsentContextType {
  agreedToCookies: boolean;
  canLoadAnalytics: boolean;
  acceptCookies: () => void;
  declineCookies: () => void;
  resetConsent: () => void;
  hasMadeChoice: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [agreedToCookies, setAgreedToCookies] = useState(false);
  const [hasMadeChoice, setHasMadeChoice] = useState(false);

  useEffect(() => {
    // Check local storage on mount
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'accepted') {
      setAgreedToCookies(true);
      setHasMadeChoice(true);
    } else if (consent === 'declined') {
      setAgreedToCookies(false);
      setHasMadeChoice(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setAgreedToCookies(true);
    setHasMadeChoice(true);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setAgreedToCookies(false);
    setHasMadeChoice(true);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie_consent');
    setHasMadeChoice(false);
    setAgreedToCookies(false);
  };

  const canLoadAnalytics = agreedToCookies;

  return (
    <ConsentContext.Provider value={{ agreedToCookies, canLoadAnalytics, acceptCookies, declineCookies, resetConsent, hasMadeChoice }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}
