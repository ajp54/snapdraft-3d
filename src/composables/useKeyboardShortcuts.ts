import { useSettingsStore } from '../stores/settingsStore';
import { useHistoryStore } from '../stores/historyStore';
import { useSceneStore } from '../stores/sceneStore';

export function useKeyboardShortcuts() {
  const historyStore = useHistoryStore();
  const sceneStore = useSceneStore();
  const settingsStore = useSettingsStore();

  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+Z / Ctrl+Y for undo/redo
    if (event.ctrlKey) {
      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        historyStore.undo();
      } else if (event.key === 'y' || event.key === 'Y') {
        event.preventDefault();
        historyStore.redo();
      } else if (event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        const selected = Array.from(sceneStore.selectedIds);
        if (selected.length > 0) {
          historyStore.pushSnapshot();
          selected.forEach((id) => {
            const part = sceneStore.placedParts.find((p) => p.id === id);
            if (part) {
              sceneStore.duplicatePart(id);
            }
          });
        }
      }
    }

    // Delete key
    if (event.key === 'Delete') {
      event.preventDefault();
      const selected = Array.from(sceneStore.selectedIds);
      if (selected.length > 0) {
        historyStore.pushSnapshot();
        selected.forEach((id) => {
          sceneStore.deletePart(id);
        });
        sceneStore.clearSelection();
      }
    }

    // Escape key
    if (event.key === 'Escape') {
      event.preventDefault();
      sceneStore.clearSelection();
    }

    // G for snap toggle
    if ((event.key === 'g' || event.key === 'G') && !event.ctrlKey) {
      event.preventDefault();
      settingsStore.toggleSnap();
    }

    // Tab for cycling selection
    if (event.key === 'Tab') {
      event.preventDefault();
      const parts = sceneStore.placedParts;
      if (parts.length === 0) return;

      const selectedIds = Array.from(sceneStore.selectedIds);
      let nextIdx = 0;

      if (selectedIds.length > 0) {
        const lastId = selectedIds[selectedIds.length - 1];
        const lastIdx = parts.findIndex((p) => p.id === lastId);
        nextIdx = (lastIdx + 1) % parts.length;
      }

      sceneStore.setSelectedIds(new Set([parts[nextIdx].id]));
    }
  };

  return {
    handleKeyDown,
  };
}
