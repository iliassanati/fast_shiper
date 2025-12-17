import type { ReactNode } from 'react';

export interface RouteConfig {
  path: string;
  element: ReactNode;
  index?: boolean;
  children?: RouteConfig[];
  protected?: boolean;
  title?: string;
  breadcrumb?: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  badge?: number | null;
  protected: boolean;
}
