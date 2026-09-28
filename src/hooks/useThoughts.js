import { useCallback } from "react";
import { nextId } from "../utils/id";

export function useThoughts({ setThoughts, setPendingPlacement, popNav }) {
  const addOrUpdate = useCallback((text, id) => {
    if (id) {
      setThoughts((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
    } else {
      setThoughts((prev) => [
        ...prev,
        { id: `n_${nextId()}`, text, createdAt: Date.now() },
      ]);
    }
  }, [setThoughts]);

  const remove = useCallback((id) => {
    setThoughts((prev) => prev.filter((t) => t.id !== id));
  }, [setThoughts]);

  const convertToTask = useCallback((thought) => {
    setPendingPlacement({
      title: thought.text,
      due: null,
      notes: [],
      source: undefined,
      repeat: null,
    });
    setThoughts((prev) => prev.filter((t) => t.id !== thought.id));
    popNav();
  }, [setThoughts, setPendingPlacement, popNav]);

  return { addOrUpdate, remove, convertToTask };
}
