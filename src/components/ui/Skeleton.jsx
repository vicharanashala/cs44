function Skeleton({ variant = 'text', count = 1, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  const variantStyles = {
    text: 'h-4 rounded-md',
    card: 'h-48 rounded-2xl',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-xl',
  };

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`
            animate-pulse bg-slate-200 dark:bg-slate-700/60
            ${variantStyles[variant] || variantStyles.text}
            ${variant === 'text' ? (i === items.length - 1 && count > 1 ? 'w-3/4' : 'w-full') : 'w-full'}
            ${className}
          `}
        />
      ))}
    </>
  );
}

function QuestionCardSkeleton() {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg p-6 space-y-4">
      {/* Header: avatar + user info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-28 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
          <div className="h-3 w-20 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        </div>
      </div>

      {/* Title */}
      <div className="h-5 w-4/5 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />

      {/* Description lines */}
      <div className="space-y-2.5">
        <div className="h-3.5 w-full rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="h-3.5 w-full rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="h-3.5 w-2/3 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
      </div>

      {/* Footer: badges + stats */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-12 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
          <div className="h-4 w-12 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function AnswerSkeleton() {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg p-6 space-y-4">
      {/* Header: avatar + user info + badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3.5 w-24 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
            <div className="h-3 w-16 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
      </div>

      {/* Answer body lines */}
      <div className="space-y-2.5">
        <div className="h-3.5 w-full rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="h-3.5 w-full rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="h-3.5 w-5/6 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="h-3.5 w-3/4 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-4 pt-2">
        <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Profile section */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
          <div className="h-3 w-36 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        </div>
      </div>

      {/* Nav items */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5">
            <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
            <div
              className="h-4 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse"
              style={{ width: `${60 + (i * 7) % 35}%` }}
            />
          </div>
        ))}
      </div>

      {/* Stats card */}
      <div className="bg-slate-100/60 dark:bg-slate-700/30 rounded-xl p-4 space-y-3">
        <div className="h-4 w-20 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-6 w-10 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
              <div className="h-3 w-16 rounded-md bg-slate-200 dark:bg-slate-700/60 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
export { Skeleton, QuestionCardSkeleton, AnswerSkeleton, SidebarSkeleton };
