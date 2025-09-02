'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { authApi, getErrorMessage, checkServerHealth, testBackendConnection } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [testingConnection, setTestingConnection] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Test backend connection with detailed diagnostics
      const connectionTest = await testBackendConnection();
      console.log('Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        setServerStatus('offline');
        throw new Error(`Backend connection failed: ${connectionTest.message}`);
      }
      
      setServerStatus('online');

      const response = await authApi.login(data);
      console.log('Login API response:', response.data);
      
      const { token, user } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      if (!user) {
        throw new Error('No user data received from server');
      }
      
      login(token, user);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(getErrorMessage(err));
      setServerStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setError(null);

    try {
      const result = await testBackendConnection();
      console.log('Manual connection test:', result);
      
      if (result.success) {
        setServerStatus('online');
        setError(`✅ Connection successful! Server responded with status ${result.details?.status}`);
      } else {
        setServerStatus('offline');
        setError(`❌ Connection failed: ${result.message}`);
      }
    } catch (err) {
      setServerStatus('offline');
      setError(`❌ Connection test error: ${getErrorMessage(err)}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Era Inventory
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
          
          {/* Server Status Indicator */}
          {serverStatus !== 'unknown' && (
            <div className={`mt-3 text-center text-sm px-3 py-2 rounded-md ${
              serverStatus === 'online' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              Server: {serverStatus === 'online' ? 'Connected' : 'Not Available'}
            </div>
          )}
          
          {/* Debug Info - Removed to prevent hydration mismatch */}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
              {serverStatus === 'offline' && (
                <div className="mt-3 text-sm text-red-600">
                  <p className="font-medium mb-2">To fix this issue:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Ensure the backend server is running on the configured port</li>
                    <li>Check if the API URL is correct in your environment configuration</li>
                    <li>Verify your network connection</li>
                    <li>Contact your system administrator if the problem persists</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingConnection ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing connection...
                </span>
              ) : (
                '🔍 Test Backend Connection'
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              <p className="font-medium">Test Accounts:</p>
              <div className="mt-2 space-y-1">
                <p><span className="font-mono text-xs">superadmin@maintenant.com</span> / <span className="font-mono text-xs">Password123!</span></p>
                <p><span className="font-mono text-xs">admin@clienta.com</span> / <span className="font-mono text-xs">Password123!</span></p>
                <p><span className="font-mono text-xs">manager@clienta.com</span> / <span className="font-mono text-xs">Password123!</span></p>
                <p><span className="font-mono text-xs">viewer@clienta.com</span> / <span className="font-mono text-xs">Password123!</span></p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
