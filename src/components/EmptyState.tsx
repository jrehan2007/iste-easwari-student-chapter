import { isSupabaseConfigured } from '../lib/supabase'
import { IsteMark } from './Logo'

export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-8 border border-dashed border-turkish/40 px-6 py-14 text-center">
      <IsteMark className="mx-auto h-12 w-12 opacity-40" />
      <p className="font-display mt-4 text-lg font-semibold">{title}</p>
      {hint && <p className="muted mt-1">{hint}</p>}
      {!isSupabaseConfigured && (
        <p className="mt-4 text-sm text-turkish-dark dark:text-turkish-light">
          Supabase isn't connected — add your keys to .env.
        </p>
      )}
    </div>
  )
}
