import { useEffect, useState } from "react";
import { COMPACT_MQ } from "./layout";

function matchesCompact(): boolean {
  return window.matchMedia(COMPACT_MQ).matches;
}

export default function useCompactLayout(): boolean {
  const [compact, setCompact] = useState(matchesCompact);

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_MQ);
    const onChange = () => setCompact(mq.matches);
    mq.addEventListener("change", onChange);
    onChange();
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return compact;
}
