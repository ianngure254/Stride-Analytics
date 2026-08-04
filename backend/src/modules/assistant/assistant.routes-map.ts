export const routeIds = ['home', 'dashboard', 'sales', 'inventory', 'customers', 'auth'] as const;

export type RouteId = (typeof routeIds)[number];

export const isRouteId = (value: string): value is RouteId =>
  routeIds.includes(value as RouteId);

export const routeKeywords: Record<RouteId, string[]> = {
  home: ['home', 'overview', 'start'],
  dashboard: ['dashboard', 'summary', 'analytics', 'revenue', 'report'],
  sales: ['sales', 'sale', 'transaction', 'record sale', 'payment'],
  inventory: ['inventory', 'stock', 'products', 'low stock', 'reorder'],
  customers: ['customers', 'customer', 'deni', 'credit', 'debt'],
  auth: ['admin', 'auth', 'account', 'login', 'profile'],
};
