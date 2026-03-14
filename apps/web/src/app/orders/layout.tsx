import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// For server-side fetch, use internal Docker network URL if available
function getServerApiBaseUrl(): string {
  // API_INTERNAL_URL is for server-to-server communication (Docker internal)
  // Falls back to NEXT_PUBLIC_API_URL or localhost
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/v1';
}

export default async function OrdersLayout({ children }: Props) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    redirect('/login');
  }

  const apiBaseUrl = getServerApiBaseUrl();
  const cookieHeader = [
    accessToken ? `access_token=${accessToken}` : '',
    refreshToken ? `refresh_token=${refreshToken}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  try {
    const response = await fetch(`${apiBaseUrl}/users/me`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      redirect('/login');
    }
  } catch {
    // On network error, allow the page to render - client-side auth will handle redirect
    console.warn('SSR auth check failed, falling back to client-side auth');
  }

  return <>{children}</>;
}
