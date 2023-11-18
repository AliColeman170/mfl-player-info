import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Portal(props) {
  let { children } = props;
  let [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
