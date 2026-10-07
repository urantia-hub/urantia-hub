// Node modules.
import Link from "next/link";
import { useEffect, useState } from "react";
// Relative modules.
import {
  PARALLELS_ROOT,
  loadTrail,
  nextTrail,
  saveTrail,
  type TrailStep,
} from "@/utils/parallels";

type TrailProps = { href: string; label: string };

// The reader's path through the links, as a breadcrumb. It lives in this tab only and
// renders after mount, so the server HTML and the first client render match.
const Trail = ({ href, label }: TrailProps) => {
  const [trail, setTrail] = useState<TrailStep[]>([]);

  useEffect(() => {
    const next = nextTrail(loadTrail(), { href, label });
    saveTrail(next);
    setTrail(next);
  }, [href, label]);

  return (
    <nav
      aria-label="Your path"
      className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs py-2.5 -mx-4 px-4 border-b border-gray-200 dark:border-zinc-700"
    >
      <Link href={PARALLELS_ROOT} className="text-sky-600 dark:text-sky-400">
        Parallels
      </Link>
      {trail.map((step, i) => (
        <span key={step.href} className="flex items-center gap-1.5">
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
            ›
          </span>
          {i === trail.length - 1 ? (
            <span aria-current="page" className="font-semibold text-gray-700 dark:text-white">
              {step.label}
            </span>
          ) : (
            <Link href={step.href} className="text-sky-600 dark:text-sky-400">
              {step.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Trail;
