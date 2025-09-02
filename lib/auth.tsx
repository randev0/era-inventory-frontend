'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, JWTClaims } from './types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  claims: JWTClaims | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT decode function
function parseJwt(token: string | null | undefined): JWTClaims | null {
  if (!token || typeof token !== 'string') {
    console.error('Invalid token provided to parseJwt:', token);
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('JWT token does not have 3 parts:', token);
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error, 'Token:', token);
    return null;
  }
}

// Check if token is expired
function isTokenExpired(claims: JWTClaims): boolean {
  const now = Math.floor(Date.now() / 1000);
  return claims.exp < now;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<JWTClaims | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem('era_token');
    const storedUser = localStorage.getItem('era_user');

    if (storedToken && storedUser) {
      const parsedClaims = parseJwt(storedToken);
      
      if (parsedClaims && !isTokenExpired(parsedClaims)) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setClaims(parsedClaims);
      } else {
        // Token expired, clear session
        localStorage.removeItem('era_token');
        localStorage.removeItem('era_user');
        localStorage.removeItem('era_org_override');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('Login called with token:', newToken ? `${newToken.substring(0, 20)}...` : 'null');
    console.log('Login called with user:', newUser);

    if (!newToken) {
      throw new Error('No token provided');
    }

    const parsedClaims = parseJwt(newToken);
    
    if (!parsedClaims) {
      throw new Error('Invalid token format - could not parse JWT claims');
    }

    localStorage.setItem('era_token', newToken);
    localStorage.setItem('era_user', JSON.stringify(newUser));
    
    setToken(newToken);
    setUser(newUser);
    setClaims(parsedClaims);
  };

  const logout = () => {
    localStorage.removeItem('era_token');
    localStorage.removeItem('era_user');
    localStorage.removeItem('era_org_override');
    
    setToken(null);
    setUser(null);
    setClaims(null);
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        claims,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route component
interface ProtectedProps {
  children: React.ReactNode;
}

export function Protected({ children }: ProtectedProps) {
  const { token, claims, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!token || !claims || isTokenExpired(claims)) {
        router.push('/login');
      }
    }
  }, [token, claims, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token || !claims || isTokenExpired(claims)) {
    return null;
  }

  return <>{children}</>;
}
