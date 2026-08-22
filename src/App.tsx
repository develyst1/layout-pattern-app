import { AppShell } from './components/AppShell';
import { DesignerCanvas } from './components/DesignerCanvas';
import { SlotListPanel } from './components/SlotListPanel';
import { SlotPropertiesPanel } from './components/SlotPropertiesPanel';
import { Toolbar } from './components/Toolbar';

/**
 * REQ-001 ships the Layout Designer only: the shell's second mode (Use Template)
 * is a visibly disabled entry that cannot be activated (A6), so the designer is
 * the single thing rendered inside the shell.
 */
export default function App(): JSX.Element {
  return (
    <AppShell>
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          <DesignerCanvas />
        </main>
        <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <SlotPropertiesPanel />
          <SlotListPanel />
        </aside>
      </div>
    </AppShell>
  );
}
