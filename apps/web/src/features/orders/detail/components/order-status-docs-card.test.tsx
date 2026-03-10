import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderStatusDocsCard } from './order-status-docs-card';

describe('OrderStatusDocsCard', () => {
  it('renders status documentation content', () => {
    render(<OrderStatusDocsCard />);

    expect(screen.getByText('Инструкция и правила статусов')).toBeInTheDocument();
    expect(screen.getByText('В ожидании')).toBeInTheDocument();
    expect(screen.getByText('Готов к выдаче')).toBeInTheDocument();
  });
});
