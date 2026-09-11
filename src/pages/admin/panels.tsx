import { useState, type ReactNode } from 'react'

export function Panel({ title, hint, children }:
  { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="dash">
      <h2 className="panel-title">{title}</h2>
      {hint && <p className="muted mt-1 font-serif">{hint}</p>}
      <div className="mt-5 space-y-5 font-serif">{children}</div>
    </div>
  )
}

/** Shared success / error banner so every panel reports the same way. */
export function useSaver() {
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async <T,>(fn: () => Promise<T>, okText: string | ((result: T) => string), after?: () => void) => {
    setBusy(true)
    try {
      const result = await fn()
      setMsg({ kind: 'ok', text: typeof okText === 'function' ? okText(result) : okText })
      after?.()
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const banner = msg && (
    <p className={`rounded-sm px-3 py-2 text-sm ${
      msg.kind === 'ok'
        ? 'bg-turkish-mist text-turkish-dark dark:bg-turkish/10 dark:text-turkish-light'
        : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200'}`}>
      {msg.text}
    </p>
  )

  return { run, banner, busy, setMsg }
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-turkish/25 text-left text-sm dark:border-night-line">
        <thead className="bg-turkish-mist dark:bg-night-soft">
          <tr>{head.map((h) => <th key={h} className="p-3 font-display font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export const Row = ({ children }: { children: ReactNode }) =>
  <tr className="border-t border-turkish/15 dark:border-night-line">{children}</tr>

export const Danger = ({ onClick, children }: { onClick: () => void; children: ReactNode }) =>
  <button onClick={onClick} className="text-red-700 hover:underline dark:text-red-300">{children}</button>

export const Action = ({ onClick, children }: { onClick: () => void; children: ReactNode }) =>
  <button onClick={onClick} className="text-turkish-dark hover:underline dark:text-turkish-light">{children}</button>
