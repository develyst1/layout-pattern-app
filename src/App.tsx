import { AppShell } from './components/AppShell';
import { DesignerCanvas } from './components/DesignerCanvas';
import { SlotListPanel } from './components/SlotListPanel';
import { SlotPropertiesPanel } from './components/SlotPropertiesPanel';
import { Toolbar } from './components/Toolbar';
import { UseTemplateView } from './components/UseTemplateView';
import { useUiStore } from '@/store/uiStore';

/**
 * SPEC-002 §6 "The mode shell": the shell renders the designer tree when
 * `mode === 'designer'` and `<UseTemplateView />` when `mode === 'useTemplate'`.
 *
 * Switching modes destroys nothing (SA call B-5) — `designerStore` and
 * `useTemplateStore` are plain in-memory stores that live for the app session,
 * so leaving a mode and coming back finds it exactly as it was. Only the tree
 * below the shell is swapped.
 */
export default function App(): JSX.Element {
  const mode = useUiStore((state) => state.mode);

  return (
    <AppShell>
      {mode === 'designer' ? (
        <>
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
        </>
      ) : (
        <UseTemplateView />
      )}
    </AppShell>
  );
}
