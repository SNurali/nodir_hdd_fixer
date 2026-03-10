import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useAppSettings } from '@/app/app-settings-provider';
import type { KeyboardEvent, RefObject } from 'react';
import type { OrderMessage } from '../types';

interface OrderChatCardProps {
  messages: OrderMessage[];
  currentUserId?: string;
  messageText: string;
  sendingMessage: boolean;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  onMessageTextChange: (value: string) => void;
  onSendMessage: () => void;
}

export function OrderChatCard({
  messages,
  currentUserId,
  messageText,
  sendingMessage,
  chatContainerRef,
  onMessageTextChange,
  onSendMessage,
}: OrderChatCardProps) {
  const { formatTime } = useAppSettings();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare size={24} className="text-blue-500" />
        Чат по заказу
      </h2>

      <div
        ref={chatContainerRef}
        className="flex flex-col gap-4 mb-4 p-4 h-96 overflow-y-auto bg-gray-50 dark:bg-gray-950/50 rounded-xl border border-gray-200 dark:border-gray-800"
      >
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center my-auto">Нет сообщений. Напишите первым!</p>
        ) : (
          messages.map((message) => {
            const isSystem = message.sender_id === 'system';
            const isMine = message.sender_id === currentUserId;

            if (isSystem) {
              return (
                <div
                  key={message.id}
                  className="mx-auto my-2 text-center bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-full text-xs font-medium max-w-sm"
                >
                  {message.text}
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-xs text-gray-500 mb-1 px-1">
                  {isMine ? 'Вы' : message.sender?.full_name || 'Пользователь'}
                </span>
                <div className={`px-4 py-2.5 rounded-2xl ${isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm'}`}>
                  <p className="m-0 break-words">{message.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {message.created_at
                    ? formatTime(message.created_at)
                    : '-'}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(event) => onMessageTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ваше сообщение..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sendingMessage}
        />
        <button
          onClick={onSendMessage}
          disabled={sendingMessage || !messageText.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
        >
          {sendingMessage ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          Отправить
        </button>
      </div>
    </div>
  );
}
