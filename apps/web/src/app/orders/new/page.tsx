"use client";

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/provider';
import { useAuth } from '@/app/auth-provider';
import { useTheme } from '@/components/theme-provider';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { E164_PHONE_REGEX } from '@/lib/phone';
import { DEFAULT_EQUIPMENTS, DEFAULT_ISSUES } from '@/features/orders/new/constants';
import {
  buildOrderPayload,
  getEquipmentIconForItem,
  getContactDiffState,
  normalizePhone,
  normalizeTelegram,
  resolveEntityNameById,
  selectPrimaryServiceId,
  validateOrderDraftIds,
} from '@/features/orders/new/utils';
import type {
  ClientProfileSnapshot,
  ContactUpdateDecision,
  NewOrderFormData,
  OrderItemDraft,
} from '@/features/orders/new/types';
import { NewOrderStepEquipment } from '@/features/orders/new/components/new-order-step-equipment';
import { NewOrderStepIssue } from '@/features/orders/new/components/new-order-step-issue';
import { NewOrderStepContact } from '@/features/orders/new/components/new-order-step-contact';
import { NewOrderStepReview } from '@/features/orders/new/components/new-order-step-review';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function NewOrderPage() {
  const { t } = useI18n() as any;
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

   const [mounted, setMounted] = useState(false);
   const [step, setStep] = useState(1);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitSuccess, setSubmitSuccess] = useState(false);
   const [createdOrderId, setCreatedOrderId] = useState('');
   const [createdTrackingToken, setCreatedTrackingToken] = useState('');
   const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([]);
   const [didPrefillContacts, setDidPrefillContacts] = useState(false);
   const [profileSnapshot, setProfileSnapshot] = useState<ClientProfileSnapshot | null>(null);
   const [contactUpdateDecision, setContactUpdateDecision] = useState<ContactUpdateDecision>('pending');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login?next=/orders/new');
      return;
    }

    setFormData(prev => ({
      ...prev,
      full_name: user.full_name || '',
    }));
  }, [authLoading, router, user]);

   const [formData, setFormData] = useState<NewOrderFormData>({
     equipment_id: '',
     issue_id: '',
     description: '',
     phone: '',
     full_name: '',
     telegram: '',
     preferred_language: 'ru'
   });
   const [phoneError, setPhoneError] = useState('');

  const { data: equipments } = useSWR('/equipments', fetcher, {
    errorRetryCount: 0,
    dedupingInterval: 5000
  });
  const { data: issues } = useSWR('/issues', fetcher, {
    errorRetryCount: 0,
    dedupingInterval: 5000
  });
  const { data: services } = useSWR('/services', fetcher, {
    errorRetryCount: 0,
    dedupingInterval: 5000
  });
  const { data: profileData } = useSWR(user ? '/users/me' : null, fetcher, {
    dedupingInterval: 5000,
  });
  const { data: settingsData } = useSWR(user ? '/users/me/settings' : null, fetcher, {
    dedupingInterval: 5000,
  });
  const profile = profileData?.data || profileData;
  const autoOpenTrackingAfterCreate = settingsData?.settings?.role_preferences?.auto_open_tracking_after_create !== false;

  const equipmentList = (equipments?.data || equipments) ?? DEFAULT_EQUIPMENTS;
  const issuesList = (issues?.data || issues) ?? DEFAULT_ISSUES;
  const isClientRole = user?.role === 'client';

  const handleEquipmentSelect = (equipmentId: string) => {
    setFormData({ ...formData, equipment_id: equipmentId });
  };
  
  const handleIssueSelect = (issueId: string) => {
    setFormData({ ...formData, issue_id: issueId });
  };

  const getEquipmentName = (equipmentId: string): string => {
    return resolveEntityNameById(equipmentList as any[], equipmentId);
  };

  const getIssueName = (issueId: string): string => {
    return resolveEntityNameById(issuesList as any[], issueId);
  };

  const currentItemReady = Boolean(formData.equipment_id && formData.issue_id);

  const addCurrentItemToOrder = (options?: { moveToStep1?: boolean }): boolean => {
    if (!formData.equipment_id) {
      toast.error('Сначала выберите оборудование');
      return false;
    }
    if (!formData.issue_id) {
      toast.error('Сначала выберите проблему');
      return false;
    }

    setOrderItems((prev) => [
      ...prev,
      {
        equipment_id: formData.equipment_id,
        issue_id: formData.issue_id,
        description: formData.description || 'Без описания',
      },
    ]);

    setFormData((prev) => ({
      ...prev,
      equipment_id: '',
      issue_id: '',
      description: '',
    }));

    if (options?.moveToStep1) {
      setStep(1);
    }

    toast.success('Позиция добавлена в заказ');
    return true;
  };

  const removeOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const goToCollectedOrderCheckout = () => {
    if (orderItems.length === 0) {
      toast.error('Сначала добавьте хотя бы одно устройство');
      return;
    }
    setStep(3);
  };

  const hasContactDiff = getContactDiffState(formData, profileSnapshot);
  const reviewItems = [
    ...orderItems,
    ...(currentItemReady
      ? [{
        equipment_id: formData.equipment_id,
        issue_id: formData.issue_id,
        description: formData.description || 'Без описания',
      }]
      : []),
  ];

  useEffect(() => {
    if (!isClientRole || !profile || didPrefillContacts) return;
    const snapshot: ClientProfileSnapshot = {
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      telegram: profile.telegram || '',
      preferred_language: profile.preferred_language || 'ru',
    };
    setProfileSnapshot(snapshot);
    setFormData((prev) => ({
      ...prev,
      full_name: snapshot.full_name,
      phone: snapshot.phone,
      telegram: snapshot.telegram,
      preferred_language: snapshot.preferred_language || prev.preferred_language,
    }));
    setDidPrefillContacts(true);
    setContactUpdateDecision('pending');
  }, [isClientRole, profile, didPrefillContacts]);

  useEffect(() => {
    if (!submitSuccess || !createdTrackingToken || !isClientRole || !autoOpenTrackingAfterCreate) {
      return;
    }

    const redirectId = window.setTimeout(() => {
      router.replace(`/track?token=${encodeURIComponent(createdTrackingToken)}`);
    }, 1200);

    return () => {
      window.clearTimeout(redirectId);
    };
  }, [autoOpenTrackingAfterCreate, createdTrackingToken, isClientRole, router, submitSuccess]);

  const keepProfileContacts = () => {
    if (!profileSnapshot) return;
    setFormData((prev) => ({
      ...prev,
      full_name: profileSnapshot.full_name,
      phone: profileSnapshot.phone,
      telegram: profileSnapshot.telegram,
      preferred_language: profileSnapshot.preferred_language || prev.preferred_language,
    }));
    setPhoneError('');
    setContactUpdateDecision('keep');
    toast.message('Оставлены контактные данные из профиля');
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setPhoneError('Номер телефона обязателен');
      return false;
    }
    if (!E164_PHONE_REGEX.test(phone)) {
      setPhoneError('Неверный формат. Используйте международный номер с кодом страны');
      return false;
    }
    setPhoneError('');
    return true;
  };

   const handleSubmit = async () => {
    setIsSubmitting(true);

    // Clear any previous errors
    if (phoneError) setPhoneError('');

    const detailsForOrder: OrderItemDraft[] = [...orderItems];
    if (currentItemReady) {
      detailsForOrder.push({
        equipment_id: formData.equipment_id,
        issue_id: formData.issue_id,
        description: formData.description || 'Без описания',
      });
    }

    if (detailsForOrder.length === 0) {
      toast.error('Добавьте хотя бы одно оборудование в заказ');
      setIsSubmitting(false);
      return;
    }
    if (!validatePhone(formData.phone)) {
      setIsSubmitting(false);
      return;
    }

    // Validate that selected IDs are real UUIDs (not from fallback list)
    if (!validateOrderDraftIds(detailsForOrder)) {
      toast.error('Выбранные справочники устарели. Обновите страницу и попробуйте снова.');
      setIsSubmitting(false);
      return;
    }

    // Phone validation and normalization (only required for non-client users submitting guest order)
    const phone = normalizePhone(formData.phone || '');
    // Client role: backend auto-resolves from JWT. Others (admin/operator/guest) need phone for guest client creation
    if (!isClientRole && !E164_PHONE_REGEX.test(phone)) {
      toast.error('Введите телефон в международном формате с кодом страны');
      setIsSubmitting(false);
      return;
    }

    if (isClientRole && hasContactDiff && contactUpdateDecision === 'pending') {
      toast.error('Вы изменили контакты. Выберите: обновить профиль или оставить данные профиля.');
      setStep(3);
      setIsSubmitting(false);
      return;
    }

    if (isClientRole && hasContactDiff && contactUpdateDecision === 'update') {
      try {
        const updatePayload: Record<string, string | undefined> = {};
        
        // Only include full_name if valid (min 2 chars)
        const trimmedName = formData.full_name.trim();
        if (trimmedName.length >= 2) {
          updatePayload.full_name = trimmedName;
        }
        
        // Only include phone if it's a valid E.164 format
        if (phone && E164_PHONE_REGEX.test(phone)) {
          updatePayload.phone = phone;
        }
        
        // Only include telegram if it's not empty
        const normalizedTelegram = normalizeTelegram(formData.telegram || '');
        if (normalizedTelegram) {
          updatePayload.telegram = normalizedTelegram;
        }
        
        // Only make API call if there's something to update
        if (Object.keys(updatePayload).length > 0) {
        await api.patch('/users/me', updatePayload);
        setProfileSnapshot({
          full_name: trimmedName || formData.full_name,
          phone,
          telegram: normalizedTelegram,
          preferred_language: formData.preferred_language || 'ru',
        });
        }
      } catch (err: any) {
        console.error('Profile sync failed before order creation', err?.response?.data || err);
        toast.warning('Не удалось обновить профиль. Заказ будет создан с текущими данными аккаунта.');
      }
    }

    try {
      // Get service_id from API or use first available real service UUID
      const serviceList = services?.data || services || [];
      const serviceId = selectPrimaryServiceId(serviceList);

      if (!serviceId) {
        toast.error('Список услуг ещё загружается. Подождите несколько секунд и попробуйте снова.');
        setIsSubmitting(false);
        return;
      }

      const orderPayload = buildOrderPayload({
        preferredLanguage: formData.preferred_language,
        detailsForOrder,
        serviceId,
        isClientRole,
        fullName: formData.full_name,
        telegram: formData.telegram,
        phone,
      });
      // For client role, backend auto-resolves client_id from JWT

      const response = await api.post('/orders', orderPayload);
      const createdOrder = response.data?.data || response.data;
      setCreatedOrderId(createdOrder?.id || '');
      setCreatedTrackingToken(createdOrder?.public_tracking_token || '');
      setSubmitSuccess(true);
      toast.success('Заявка успешно отправлена!', {
        description: `Номер заказа: ${createdOrder?.id}`
      });
    } catch (err: any) {
      // Errors are already handled by interceptor (toast.error)
      // Only show generic error if interceptor didn't catch it
      if (!err.response) {
        toast.error('Ошибка сети. Проверьте подключение к интернету');
      }
      // No need to setError, interceptor will show toasts for 400/429/500
    } finally {
      setIsSubmitting(false);
    }
   }

  if (submitSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-10 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Заявка принята!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Мы свяжемся с вами в ближайшее время
          </p>

          <div className="flex gap-3">
            {createdTrackingToken && (
              <button
                onClick={() => router.push(`/track?token=${encodeURIComponent(createdTrackingToken)}`)}
                className="flex-1 btn-primary"
              >
                Отследить заказ
              </button>
            )}
            {createdOrderId && (
              <button
                onClick={() => router.push(`/orders/${createdOrderId}`)}
                className="flex-1 btn-secondary"
              >
                Мой заказ
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="flex-1 btn-outline"
            >
              На главную
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!mounted || authLoading || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gradient-to-b from-gray-50 to-white text-gray-900'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t('common.back')}</span>
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Wrench className="text-blue-500" size={20} />
              <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">{t('login.service_title')}</h1>
            </div>
            <p className="text-xs text-blue-500">{t('login.tagline')}</p>
          </div>

          <div className="w-16" />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '25%' }}
          animate={{ width: `${step * 25}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>



      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NewOrderStepEquipment
                  equipmentList={equipmentList}
                  selectedEquipmentId={formData.equipment_id}
                  orderItems={orderItems}
                  onSelectEquipment={handleEquipmentSelect}
                  onCheckout={goToCollectedOrderCheckout}
                  onReload={() => window.location.reload()}
                  getEquipmentIconForItem={getEquipmentIconForItem}
                  title={t('order.step1_title') || 'Что нужно восстановить?'}
                  subtitle={t('order.step1_subtitle') || 'Выберите тип носителя данных'}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NewOrderStepIssue
                  currentEquipmentName={getEquipmentName(formData.equipment_id)}
                  issuesList={issuesList}
                  selectedIssueId={formData.issue_id}
                  description={formData.description}
                  orderItems={orderItems}
                  canAddCurrentItem={currentItemReady}
                  title={t('order.step2_title') || 'Что случилось?'}
                  subtitle={t('order.step2_subtitle') || 'Опишите проблему'}
                  descriptionLabel={t('order.description')}
                  descriptionPlaceholder={t('order.description_placeholder') || 'Опишите подробнее: когда началось, после чего, важные детали...'}
                  itemsCountLabel="Добавлено позиций"
                  onBackToEquipment={() => setStep(1)}
                  onSelectIssue={handleIssueSelect}
                  onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
                  onAddCurrentItem={() => addCurrentItemToOrder({ moveToStep1: true })}
                  onCheckout={goToCollectedOrderCheckout}
                  onRemoveOrderItem={removeOrderItem}
                  getEquipmentName={getEquipmentName}
                  getIssueName={getIssueName}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NewOrderStepContact
                  formData={formData}
                  phoneError={phoneError}
                  isClientRole={isClientRole}
                  hasContactDiff={hasContactDiff}
                  profileSnapshot={profileSnapshot}
                  contactUpdateDecision={contactUpdateDecision}
                  title={t('order.step3_title') || 'Как с вами связаться?'}
                  subtitle={t('order.step3_subtitle') || 'Оставьте контактные данные'}
                  fullNameLabel={t('client.full_name')}
                  fullNamePlaceholder={t('client.full_name_placeholder') || 'Ваше имя'}
                  phoneLabel={t('client.phone')}
                  languageLabel={t('order.language')}
                  onFullNameChange={(value) => {
                    setFormData({ ...formData, full_name: value });
                    if (isClientRole && profileSnapshot) {
                      setContactUpdateDecision('pending');
                    }
                  }}
                  onPhoneChange={(value) => {
                    setFormData({ ...formData, phone: value });
                    validatePhone(value);
                    if (isClientRole && profileSnapshot) {
                      setContactUpdateDecision('pending');
                    }
                  }}
                  onTelegramChange={(value) => {
                    setFormData({ ...formData, telegram: value });
                    if (isClientRole && profileSnapshot) {
                      setContactUpdateDecision('pending');
                    }
                  }}
                  onLanguageChange={(value) => setFormData({ ...formData, preferred_language: value })}
                  onUpdateDecisionChange={setContactUpdateDecision}
                  onKeepProfileContacts={keepProfileContacts}
                />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NewOrderStepReview
                  reviewItems={reviewItems}
                  formData={formData}
                  title={t('order.step4_title') || 'Подтвердите заявку'}
                  subtitle={t('order.step4_subtitle') || 'Проверьте данные перед отправкой'}
                  fullNameLabel={t('client.full_name')}
                  phoneLabel={t('client.phone')}
                  getEquipmentName={getEquipmentName}
                  getIssueName={getIssueName}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="btn-secondary flex-1"
            >
              <ArrowLeft size={20} className="inline mr-2" />
              {t('common.back')}
            </button>
          )}

           {step < 4 ? (
             <button
               onClick={() => {
                 if (step === 1) {
                   if (!formData.equipment_id) {
                     if (orderItems.length > 0) {
                       setStep(3);
                       return;
                     }
                     toast.error('Сначала выберите оборудование');
                     return;
                   }
                 }
                 if (step === 2) {
                   let totalItems = orderItems.length;
                   if (currentItemReady) {
                     const wasAdded = addCurrentItemToOrder();
                     if (!wasAdded) return;
                     totalItems += 1;
                   }
                   if (totalItems === 0) {
                     toast.error('Добавьте хотя бы одно оборудование в заказ');
                     return;
                   }
                 }
                 if (step === 3) {
                   if (!validatePhone(formData.phone)) {
                     return;
                   }
                 }
                 setStep(step + 1);
               }}
               disabled={
                 (step === 1 && !formData.equipment_id && orderItems.length === 0) ||
                 (step === 2 && orderItems.length === 0 && !currentItemReady) ||
                 (step === 3 && (!formData.full_name || !formData.phone || !!phoneError))
               }
               className="btn-primary flex-1"
             >
               {t('common.next')}
               <ArrowRight size={20} className="inline ml-2" />
             </button>
           ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (orderItems.length === 0 && !currentItemReady)}
              className="btn-primary flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin inline mr-2" size={20} />
              ) : (
                <CheckCircle2 className="inline mr-2" size={20} />
              )}
              {t('order.submit_order') || 'Отправить заявку'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
