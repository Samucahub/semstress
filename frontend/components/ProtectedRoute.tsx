'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    async function checkAuth() {
      const token = getToken();

      if (!token) {
        router.push('/login');
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    }

    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [router]);

  if (isChecking || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
