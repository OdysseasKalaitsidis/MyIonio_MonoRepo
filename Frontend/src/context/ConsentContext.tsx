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
    const consent = localStorage.getItem('storage_notice_acknowledged') ?? localStorage.getItem('cookie_consent');
    if (consent === 'yes' || consent === 'accepted' || consent === 'declined') {
      setAgreedToCookies(true);
      setHasMadeChoice(true);
    } else if (consent === 'declined') {
      setAgreedToCookies(false);
      setHasMadeChoice(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('storage_notice_acknowledged', 'yes');
    localStorage.removeItem('cookie_consent');
    setAgreedToCookies(true);
    setHasMadeChoice(true);
  };

  const declineCookies = () => {
    localStorage.setItem('storage_notice_acknowledged', 'yes');
    localStorage.removeItem('cookie_consent');
    setAgreedToCookies(false);
    setHasMadeChoice(true);
  };

  const resetConsent = () => {
    localStorage.removeItem('storage_notice_acknowledged');
    localStorage.removeItem('cookie_consent');
    setHasMadeChoice(false);
    setAgreedToCookies(false);
  };

  const canLoadAnalytics = false; // No analytics are loaded in the launch baseline.

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
