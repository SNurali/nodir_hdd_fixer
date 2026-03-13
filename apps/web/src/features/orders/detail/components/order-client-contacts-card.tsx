import { Globe, Mail, MessageSquare, User } from 'lucide-react';
import { PhoneDisplay } from '@/components/phone-display';
import type { Order } from '../types';

interface OrderClientContactsCardProps {
  client: NonNullable<Order['client']>;
}

const LANGUAGE_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  'uz-lat': "O'zbekcha",
  'uz-cyr': 'Ўзбекча',
};

export function OrderClientContactsCard({ client }: OrderClientContactsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <User size={20} className="text-blue-500" />
        Контакты клиента
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {client.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">ФИО</p>
            <p className="font-bold">{client.full_name}</p>
          </div>
        </div>

        <PhoneDisplay phone={client.phone} />

        {client.email && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Mail size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
              <a href={`mailto:${client.email}`} className="font-bold text-blue-600 hover:underline">
                {client.email}
              </a>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <MessageSquare size={18} className="text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Telegram</p>
            {client.telegram ? (
              <a
                href={`https://t.me/${client.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:underline"
              >
                {client.telegram}
              </a>
            ) : (
              <p className="text-gray-400 italic text-sm">Не указан</p>
            )}
          </div>
        </div>

        {client.preferred_language && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Globe size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Язык</p>
              <p className="font-bold">{LANGUAGE_LABELS[client.preferred_language] || client.preferred_language}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
