export const STATUS_FILTERS = [
  { key: 'all', translationKey: 'dashboard.filter_all' },
  { key: 'new', translationKey: 'statuses.new', color: 'purple' },
  { key: 'assigned', translationKey: 'statuses.assigned', color: 'blue' },
  { key: 'diagnosing', translationKey: 'statuses.diagnosing', color: 'cyan' },
  { key: 'awaiting_approval', translationKey: 'statuses.awaiting_approval', color: 'orange' },
  { key: 'approved', translationKey: 'statuses.approved', color: 'green' },
  { key: 'in_repair', translationKey: 'statuses.in_repair', color: 'yellow' },
  { key: 'ready_for_pickup', translationKey: 'statuses.ready_for_pickup', color: 'emerald' },
  { key: 'unrepairable', translationKey: 'statuses.unrepairable', color: 'red' },
  { key: 'issued', translationKey: 'statuses.issued', color: 'teal' },
  { key: 'cancelled', translationKey: 'statuses.cancelled', color: 'gray' },
] as const;

export const ORDERS_PER_PAGE = 10;
