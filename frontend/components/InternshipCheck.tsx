'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import ProfileIncompleteModal from './ProfileIncompleteModal';

export default function InternshipCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasInternship, setHasInternship] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const checkRef = useRef(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (checkRef.current) return;
    checkRef.current = true;
    
    checkInternship();
  }, []);

  // Poll for internship changes when modal is shown
  useEffect(() => {
    if (!showModal) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    // Poll every 2 seconds to check if internship was filled
    pollRef.current = setInterval(() => {
      checkInternship();
    }, 2000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [showModal]);

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
        setShowModal(false);
      } else {
        setHasInternship(false);
        // Only show modal if not on profile page
        if (pathname !== '/profile') {
          setShowModal(true);
        }
      }
    } catch (err) {
      setHasInternship(false);
      // Only show modal if not on profile page
      if (pathname !== '/profile') {
        setShowModal(true);
      }
    } finally {
      setIsChecking(false);
    }
  }

  if (isChecking) {
    return null;
  }

  // If on profile page, always render children (the profile form)
  if (pathname === '/profile') {
    return <>{children}</>;
  }

  // If not on profile and has internship, render children
  if (hasInternship) {
    return <>{children}</>;
  }

  // If not on profile and no internship, show modal blocking the page
  return (
    <>
      {children}
      <ProfileIncompleteModal
        isOpen={showModal}
        onNavigateToProfile={() => {
          setShowModal(false);
          router.push('/profile');
        }}
        onClose={() => {
          setShowModal(false);
        }}
      />
    </>
  );
}

