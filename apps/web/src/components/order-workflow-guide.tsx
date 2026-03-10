"use client";

import React, { useState } from 'react';
import { useI18n } from '@/i18n/provider';
import { CheckCircle, ArrowRight, ChevronDown } from 'lucide-react';

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface OrderWorkflowGuideProps {
  status: string;
  priceApproved?: boolean;
  hasMaster?: boolean;
  hasPrice?: boolean;
}

export function OrderWorkflowGuide({ 
  status, 
  priceApproved, 
  hasMaster, 
  hasPrice 
}: OrderWorkflowGuideProps) {
  const { t, language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const getSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      {
        number: 1,
        title: language === 'en' ? 'Order Created' : language?.startsWith('uz') ? 'Buyurtma yaratildi' : 'Заказ создан',
        description: language === 'en' ? 'Waiting for assignment' : language?.startsWith('uz') ? 'Tayinlash kutilmoqda' : 'Ожидает назначения мастера',
        completed: ['assigned', 'diagnosing', 'awaiting_approval', 'approved', 'in_repair', 'ready_for_pickup', 'issued'].includes(status),
        current: status === 'new'
      },
      {
        number: 2,
        title: language === 'en' ? 'Assigned' : language?.startsWith('uz') ? 'Tayinlandi' : 'Назначен',
        description: language === 'en' ? 'Ready for diagnosis' : language?.startsWith('uz') ? 'Diagnostika uchun tayyor' : 'Готов к диагностике',
        completed: ['diagnosing', 'awaiting_approval', 'approved', 'in_repair', 'ready_for_pickup', 'issued'].includes(status),
        current: status === 'assigned'
      },
      {
        number: 3,
        title: language === 'en' ? 'Diagnosis' : language?.startsWith('uz') ? 'Diagnostika' : 'Диагностика',
        description: language === 'en' ? 'Master is diagnosing' : language?.startsWith('uz') ? 'Usta diagnostika qilmoqda' : 'Мастер проводит диагностику',
        completed: ['awaiting_approval', 'approved', 'in_repair', 'ready_for_pickup', 'issued'].includes(status),
        current: status === 'diagnosing'
      },
      {
        number: 4,
        title: language === 'en' ? 'Price Set' : language?.startsWith('uz') ? 'Narx belgilandi' : 'Цена выставлена',
        description: language === 'en' ? 'Waiting for client approval' : language?.startsWith('uz') ? 'Mijoz tasdiqlashi kutilmoqda' : 'Ждём одобрения клиента',
        completed: ['approved', 'in_repair', 'ready_for_pickup', 'issued'].includes(status),
        current: status === 'awaiting_approval'
      },
      {
        number: 5,
        title: language === 'en' ? 'Price Approved' : language?.startsWith('uz') ? 'Narx tasdiqlandi' : 'Цена одобрена',
        description: language === 'en' ? 'Ready for repair' : language?.startsWith('uz') ? 'Tayyorlashga tayyor' : 'Готов к ремонту',
        completed: ['in_repair', 'ready_for_pickup', 'issued'].includes(status),
        current: status === 'approved'
      },
      {
        number: 6,
        title: language === 'en' ? 'In Repair' : language?.startsWith('uz') ? 'Tamirlash jarayoni' : 'В работе',
        description: language === 'en' ? 'Master is repairing' : language?.startsWith('uz') ? 'Usta tamirlamoqda' : 'Мастер выполняет ремонт',
        completed: ['ready_for_pickup', 'issued'].includes(status),
        current: status === 'in_repair'
      },
      {
        number: 7,
        title: language === 'en' ? 'Ready for Pickup' : language?.startsWith('uz') ? 'Topshirishga tayyor' : 'Готов к выдаче',
        description: language === 'en' ? 'Ready for pickup' : language?.startsWith('uz') ? 'Olishga tayyor' : 'Готов к выдаче',
        completed: ['issued'].includes(status),
        current: status === 'ready_for_pickup'
      },
      {
        number: 8,
        title: language === 'en' ? 'Issued' : language?.startsWith('uz') ? 'Topshirildi' : 'Выдан',
        description: language === 'en' ? 'Order closed' : language?.startsWith('uz') ? 'Buyurtma yopildi' : 'Заказ закрыт',
        completed: ['issued'].includes(status),
        current: status === 'issued'
      }
    ];

    return steps;
  };

  const steps = getSteps();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {language === 'en' ? 'Order Workflow' : language?.startsWith('uz') ? 'Buyurtma jarayoni' : 'Порядок выполнения заказа'}
        </h3>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-expanded={isExpanded}
        >
          <span>
            {isExpanded
              ? (language === 'en' ? 'Collapse' : language?.startsWith('uz') ? 'Yopish' : 'Свернуть')
              : (language === 'en' ? 'Expand' : language?.startsWith('uz') ? 'Ochish' : 'Развернуть')}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  {/* Number/Icon */}
                  <div className={`
                    relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${step.current 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {step.completed ? (
                      <CheckCircle size={20} />
                    ) : (
                      <span className="text-sm font-bold">{step.number}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <h4 className={`text-sm font-semibold mb-1 ${
                      step.current 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : step.completed
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {step.description}
                    </p>

                    {/* Action hint for current step */}
                    {step.current && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                        <ArrowRight size={12} />
                        <span>
                          {status === 'awaiting_approval' && (language === 'en' 
                            ? 'Client action required!' 
                            : language?.startsWith('uz')
                              ? 'Mijoz harakati talab qilinadi!'
                              : 'Требуется действие клиента!')}
                          {status === 'approved' && (language === 'en'
                            ? 'Master can start repair'
                            : language?.startsWith('uz')
                              ? 'Usta tamirlashni boshlashi mumkin'
                              : 'Мастер может начинать ремонт')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className={`
                    absolute left-5 top-10 w-0.5 h-8 -ml-px
                    ${steps[index + 1].completed 
                      ? 'bg-green-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Important notice */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  {language === 'en' ? 'Important!' : language?.startsWith('uz') ? 'Muhim!' : 'Важно!'}
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {language === 'en'
                    ? 'Repair can only start after client approves the price'
                    : language?.startsWith('uz')
                      ? 'Ta\'mirlash faqat mijoz narxni tasdiqlagandan keyin boshlanadi'
                      : 'Ремонт можно начинать только после одобрения цены клиентом'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OrderWorkflowGuide;
