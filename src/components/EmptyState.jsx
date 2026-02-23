import React from 'react';
import { Inbox, Calendar, BookOpen, Search, FileText } from 'lucide-react';
import { Button } from './Button';

const icons = {
  inbox: Inbox,
  calendar: Calendar,
  book: BookOpen,
  search: Search,
  file: FileText,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  const Icon = icons[icon] || Inbox;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-20 h-20 bg-light-200 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-dark-300" />
      </div>
      <h3 className="text-lg font-semibold text-dark mb-2">
        {title}
      </h3>
      <p className="text-dark-400 max-w-xs mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
