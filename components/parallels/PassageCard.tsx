// Node modules.
import Link from "next/link";
// Relative modules.
import { percent, type PassageItem } from "@/utils/parallels";

type PassageCardProps = { passage: PassageItem };

const PassageCard = ({ passage: p }: PassageCardProps) => (
  <li>
    <Link
      href={p.href}
      className="block rounded-lg bg-white dark:bg-neutral-700 p-4 hover:no-underline hover:shadow-lg hover:dark:shadow-none transition-shadow duration-300"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-gray-700 dark:text-white">{p.reference}</span>
        <span className="rounded bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-300 px-2 py-0.5 text-xs">
          {percent(p.similarity)}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-0.5">
        {p.title} · {p.religion}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-2 mb-0 line-clamp-4">
        {p.text}
      </p>
      <div className="flex justify-between text-xs mt-2">
        <span className="text-gray-400">
          Tr. {p.translator}, {p.year}
        </span>
        <span className="text-sky-600 dark:text-sky-400">Open ›</span>
      </div>
    </Link>
  </li>
);

export default PassageCard;
