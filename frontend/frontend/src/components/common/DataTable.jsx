import { useMemo, useState } from 'react';
import { SkeletonRows } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Pagination } from './Pagination';
import './common.css';

/**
 * @param {{
 *  columns: {key:string, header:string, render?:(row:any)=>any, sortable?:boolean,
 *            sortValue?:(row:any)=>any, align?:'left'|'right'|'center', mono?:boolean}[],
 *  rows: any[], keyField?: string, loading?: boolean, error?: any, onRetry?: ()=>void,
 *  emptyTitle?: string, emptyMessage?: string, emptyIcon?: string,
 *  pageSize?: number, onRowClick?: (row:any)=>void, renderCard?: (row:any)=>any,
 *  rowActions?: (row:any)=>any
 * }} props
 */
export function DataTable({
  columns,
  rows,
  keyField = 'id',
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  emptyIcon = 'ti-inbox',
  pageSize = 10,
  onRowClick,
