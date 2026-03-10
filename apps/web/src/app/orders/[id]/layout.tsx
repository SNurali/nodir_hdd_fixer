import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default async function OrderDetailLayout({ children, params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    redirect(`/login?next=/orders/${id}`);
  }

  return <>{children}</>;
}
