import React from 'react';
import { useStore } from '@/store/useStore';
import { DataTable } from '@/components/ui/DataTable';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';

export function AuditPage() {
  const { auditLogs } = useStore();

  const columns = [
    {
      key: 'createdAt', label: 'Date/Time', sortable: true,
      render: (l: Record<string, unknown>) => <span className="text-xs text-gray-500">{format(new Date(String(l.createdAt)), 'dd MMM yyyy HH:mm:ss')}</span>
    },
    { key: 'userName', label: 'User', render: (l: Record<string, unknown>) => <span className="text-sm font-medium">{String(l.userName)}</span> },
    {
      key: 'action', label: 'Action',
      render: (l: Record<string, unknown>) => {
        const colors: Record<string, string> = { Login: 'bg-emerald-100 text-emerald-700', Logout: 'bg-gray-100 text-gray-700', Create: 'bg-blue-100 text-blue-700', Update: 'bg-amber-100 text-amber-700', Delete: 'bg-rose-100 text-rose-700' };
        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[String(l.action)] || 'bg-gray-100 text-gray-700'}`}>{String(l.action)}</span>;
      }
    },
    {
      key: 'module', label: 'Module',
      render: (l: Record<string, unknown>) => <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">{String(l.module)}</span>
    },
    { key: 'details', label: 'Details', render: (l: Record<string, unknown>) => <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs block">{String(l.details)}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield size={20} /> Audit Logs</h2>
        <p className="text-sm text-gray-500">{auditLogs.length} activity records</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <DataTable
          columns={columns}
          data={auditLogs as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search audit logs..."
          searchKeys={['userName', 'action', 'module', 'details']}
          pageSize={15}
        />
      </div>
    </div>
  );
}
