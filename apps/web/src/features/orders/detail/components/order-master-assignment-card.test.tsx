import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderMasterAssignmentCard } from './order-master-assignment-card';

describe('OrderMasterAssignmentCard', () => {
  it('renders details and calls assignment handlers', async () => {
    const user = userEvent.setup();
    const onSelectedMasterChange = vi.fn();
    const onAssignMaster = vi.fn();

    render(
      <OrderMasterAssignmentCard
        details={[
          {
            id: 'detail-1',
            status: 'assigned',
            equipment: { name_rus: 'HDD' },
            issue: { name_rus: 'Bad sectors' },
          },
        ]}
        masters={[
          { id: 'master-1', full_name: 'Мастер 1' },
          { id: 'master-2', full_name: 'Мастер 2' },
        ]}
        selectedMastersByDetail={{ 'detail-1': 'master-1' }}
        assigningDetailId=""
        onSelectedMasterChange={onSelectedMasterChange}
        onAssignMaster={onAssignMaster}
      />,
    );

    expect(screen.getByText('Назначение мастера по каждой позиции')).toBeInTheDocument();
    expect(screen.getByText(/1\. HDD - Bad sectors/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox'), 'master-2');
    expect(onSelectedMasterChange).toHaveBeenCalledWith('detail-1', 'master-2');

    await user.click(screen.getByRole('button', { name: /Назначить|Переназначить/ }));
    expect(onAssignMaster).toHaveBeenCalledWith('detail-1');
  });
});
