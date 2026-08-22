import { DesignerCanvas } from './components/DesignerCanvas';
import { SlotListPanel } from './components/SlotListPanel';
import { SlotPropertiesPanel } from './components/SlotPropertiesPanel';
import { Toolbar } from './components/Toolbar';

/**
 * TASK-003 scope: the Layout Designer only. The mode shell (Designer / Use
 * Template), the template-name field, save / load and the dark-mode toggle are
 * TASK-004 — the `dark:` classes below are already in place for it.
 */
export default function App(): JSX.Element {
  return (
    <div className="flex h-full flex-col bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
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
    </div>
  );
}
