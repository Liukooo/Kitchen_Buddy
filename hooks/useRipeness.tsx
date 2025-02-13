import { useState, useEffect, useMemo } from "react";

export const useRipeness = (initialConfection: string, initialRipeness: string = "") => {
  const [confection, setConfection] = useState(initialConfection);
  const [ripeness, setRipeness] = useState(initialRipeness);

  const isFresh = useMemo(() => confection === "fresh", [confection]);

  // Reset ripeness when the confection type changes to non-fresh
  useEffect(() => {
    if (!isFresh) {
      setRipeness("");
    }
  }, [ripeness, isFresh]);

  return { confection, setConfection, ripeness, setRipeness, isFresh };
};