import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderClientContactsCard } from './order-client-contacts-card';

describe('OrderClientContactsCard', () => {
  it('renders client contact details', () => {
    render(
      <OrderClientContactsCard
        client={{
          full_name: 'Ali Valiyev',
          phone: '+998901234567',
          email: 'ali@example.com',
          telegram: '@alivaliyev',
          preferred_language: 'ru',
        }}
      />,
    );

    expect(screen.getByText('Контакты клиента')).toBeInTheDocument();
    expect(screen.getByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.getByText('+998901234567')).toBeInTheDocument();
    expect(screen.getByText('ali@example.com')).toBeInTheDocument();
    expect(screen.getByText('@alivaliyev')).toBeInTheDocument();
    expect(screen.getByText('Русский')).toBeInTheDocument();
  });
});
