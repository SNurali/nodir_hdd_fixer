import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderChatCard } from './order-chat-card';

describe('OrderChatCard', () => {
  it('renders messages and sends input text', async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    const onMessageTextChange = vi.fn();

    render(
      <OrderChatCard
        messages={[
          { id: 'system-1', sender_id: 'system', text: 'Статус обновлён' },
          { id: 'msg-1', sender_id: 'user-1', text: 'Здравствуйте', sender: { full_name: 'Ali' }, created_at: '2026-03-06T10:00:00.000Z' },
        ]}
        currentUserId="user-2"
        messageText="Тест"
        sendingMessage={false}
        chatContainerRef={createRef<HTMLDivElement>()}
        onMessageTextChange={onMessageTextChange}
        onSendMessage={onSendMessage}
      />,
    );

    expect(screen.getByText('Чат по заказу')).toBeInTheDocument();
    expect(screen.getByText('Статус обновлён')).toBeInTheDocument();
    expect(screen.getByText('Ali')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(onSendMessage).toHaveBeenCalled();
  });
});
