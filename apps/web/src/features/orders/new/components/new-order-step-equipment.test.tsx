import { HardDrive } from 'lucide-react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NewOrderStepEquipment } from './new-order-step-equipment';

describe('NewOrderStepEquipment', () => {
  it('renders equipment options and checkout CTA', async () => {
    const user = userEvent.setup();
    const onSelectEquipment = vi.fn();
    const onCheckout = vi.fn();

    render(
      <NewOrderStepEquipment
        equipmentList={[
          { id: 'eq-1', name_rus: 'HDD' },
          { id: 'eq-2', name_rus: 'SSD' },
        ]}
        selectedEquipmentId="eq-2"
        orderItems={[{ equipment_id: 'eq-1', issue_id: 'issue-1', description: 'desc' }]}
        onSelectEquipment={onSelectEquipment}
        onCheckout={onCheckout}
        onReload={() => {}}
        getEquipmentIconForItem={() => HardDrive}
        title="Что нужно восстановить?"
        subtitle="Выберите тип носителя данных"
      />,
    );

    expect(screen.getByText('HDD')).toBeInTheDocument();
    expect(screen.getByText('SSD')).toBeInTheDocument();
    expect(screen.getByText('Уже добавлено устройств: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'HDD' }));
    expect(onSelectEquipment).toHaveBeenCalledWith('eq-1');

    await user.click(screen.getByRole('button', { name: 'Перейти к оформлению' }));
    expect(onCheckout).toHaveBeenCalled();
  });
});
