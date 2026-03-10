export function extractOrders(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export function getStatusColor(theme: 'light' | 'dark', status: string) {
  switch (status) {
    case 'new':
      return theme === 'dark' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-purple-600 bg-purple-100 border-purple-200';
    case 'assigned':
      return theme === 'dark' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-100 border-blue-200';
    case 'diagnosing':
      return theme === 'dark' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-cyan-700 bg-cyan-100 border-cyan-200';
    case 'awaiting_approval':
      return theme === 'dark' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-orange-700 bg-orange-100 border-orange-200';
    case 'approved':
      return theme === 'dark' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-green-600 bg-green-100 border-green-200';
    case 'in_repair':
      return theme === 'dark' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-yellow-700 bg-yellow-100 border-yellow-200';
    case 'ready_for_pickup':
      return theme === 'dark' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-100 border-emerald-200';
    case 'unrepairable':
      return theme === 'dark' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-600 bg-red-100 border-red-200';
    case 'issued':
      return theme === 'dark' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-green-600 bg-green-100 border-green-200';
    case 'cancelled':
      return theme === 'dark' ? 'text-gray-400 bg-gray-500/10 border-gray-500/20' : 'text-gray-600 bg-gray-100 border-gray-200';
    default:
      return theme === 'dark' ? 'text-gray-400 bg-gray-500/10 border-gray-500/20' : 'text-gray-600 bg-gray-100 border-gray-200';
  }
}
