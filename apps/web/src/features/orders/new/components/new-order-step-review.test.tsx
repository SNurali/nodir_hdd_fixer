import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NewOrderStepReview } from './new-order-step-review';

describe('NewOrderStepReview', () => {
  it('renders draft items and contact summary', () => {
    render(
      <NewOrderStepReview
        reviewItems={[
          { equipment_id: 'eq-1', issue_id: 'issue-1', description: 'Не определяется' },
          { equipment_id: 'eq-2', issue_id: 'issue-2', description: 'Шумит' },
        ]}
        formData={{
          equipment_id: '',
          issue_id: '',
          description: '',
          phone: '+998901234567',
          full_name: 'Ali',
          telegram: '@ali',
          preferred_language: 'ru',
        }}
        title="Подтвердите заявку"
        subtitle="Проверьте данные перед отправкой"
        fullNameLabel="Имя"
        phoneLabel="Телефон"
        getEquipmentName={(id) => (id === 'eq-1' ? 'HDD' : 'SSD')}
        getIssueName={(id) => (id === 'issue-1' ? 'Не определяется' : 'Шум')}
      />,
    );

    expect(screen.getByText('Подтвердите заявку')).toBeInTheDocument();
    expect(screen.getByText('1. HDD')).toBeInTheDocument();
    expect(screen.getByText('2. SSD')).toBeInTheDocument();
    expect(screen.getByText('Ali')).toBeInTheDocument();
    expect(screen.getByText('+998901234567')).toBeInTheDocument();
  });
});
