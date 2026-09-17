"use client";

import { useSession, signIn, signUp, signOut } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';

export interface UniventUser {
  id: string;
  name: string;
  email: string;
  role?: 'student' | 'organizer' | 'admin';
  studentId?: string;
  department?: string;
  phoneNumber?: string;
  isApproved?: boolean;
  image?: string | null;
}

export function useAuth() {
  const router = useRouter();
  const { data: sessionData, isPending, error } = useSession();

  const user = sessionData?.user as UniventUser | undefined;
  const session = sessionData?.session;

  const role = user?.role ?? 'student';
  const isStudent = role === 'student';
  const isOrganizer = role === 'organizer';
  const isAdmin = role === 'admin';
  const isApproved = user?.isApproved ?? true;
  const isAuthenticated = !!user;

  const logout = async (redirectTo = '/login') => {
    await signOut();
    router.push(redirectTo);
    router.refresh();
  };

  return {
    user,
    session,
    role,
    isLoading: isPending,
    isAuthenticated,
    isStudent,
    isOrganizer,
    isAdmin,
    isApproved,
    error,
    login: signIn.email,
    register: signUp.email,
    logout,
  };
}
