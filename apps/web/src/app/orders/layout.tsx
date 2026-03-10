import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default async function OrdersLayout({ children }: Props) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    redirect('/login');
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/v1';
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
    redirect('/login');
  }

  return <>{children}</>;
}
