'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function InternshipCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [hasInternship, setHasInternship] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkInternship();
  }, []);

  async function checkInternship() {
    const token = getToken();
    if (!token) {
      setIsChecking(false);
      return;
    }

    try {
      const data = await apiFetch('/internship');
      if (data) {
        setHasInternship(true);
      } else {
        router.push('/profile');
      }
    } catch (err) {
      router.push('/profile');
    } finally {
      setIsChecking(false);
    }
  }

  if (isChecking) {
    return null;
  }

  if (!hasInternship) {
    return null;
  }

  return <>{children}</>;
}
