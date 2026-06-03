import { AlertCircle, Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title = '暂无数据', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-white/20" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-white/40">{title}</p>
      {description && <p className="text-xs text-white/20 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = '加载失败，请稍后重试', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-danger/50" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-white/50">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 px-4 py-2 rounded-xl bg-white/[0.04] text-xs text-white/50 hover:bg-white/[0.08] transition-colors">
          重新加载
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ count = 5, height = 'h-20' }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`glass-card ${height} shimmer rounded-2xl`} style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}
