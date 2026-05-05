// Node modules.
import Link from "next/link";
import { useState } from "react";
// Relative modules.
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { paperIdToUrl } from "@/utils/paperFormatters";
import { renderLeadingText } from "@/utils/renderNode";
import type {
  ApiBibleParallel,
  ApiUrantiaParallel,
} from "@/libs/urantiaApi/types";

const TEXT_PREVIEW = 220;

type TabId = "urantia" | "bible";

type RelatedWorksProps = {
  onClose?: () => void;
  node?: UBNode;
  urantiaParallels: ApiUrantiaParallel[];
  bibleParallels: ApiBibleParallel[];
  loading: boolean;
  error: string;
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

const RelatedWorks = ({
  onClose,
  node,
  urantiaParallels,
  bibleParallels,
  loading,
  error,
}: RelatedWorksProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("urantia");
  // Per-card "Read more" toggles, keyed by parallel id (chunkId for Bible, id for UB).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "urantia", label: "Urantia", count: urantiaParallels.length },
    { id: "bible", label: "Bible", count: bibleParallels.length },
  ];

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col px-4 py-3 max-h-[85vh]">
        <h2 className="text-2xl mb-3 pr-8">Cross-references</h2>

        {node && (
          <div className="leading-relaxed border-l-4 border-gray-200 dark:border-gray-500 pl-3 pb-1 mb-3">
            <div className="mb-1 text-gray-400 dark:text-gray-500 text-xs">
              {renderLeadingText(node as UBNodeLeadingTextProps)}
            </div>
            <p className="max-h-32 overflow-y-auto text-gray-600 dark:text-white text-sm m-0">
              {node.text}
            </p>
          </div>
        )}

        {/* Tab nav */}
        <div className="flex border-b border-gray-200 dark:border-zinc-700 mb-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 text-sm font-medium border-0 bg-transparent transition-colors duration-200 -mb-px ${
                  isActive
                    ? "text-sky-500 dark:text-sky-400 border-b-2 border-sky-500 dark:border-sky-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                }`}
              >
                {tab.label}
                {!loading && (
                  <span
                    className={`ml-1.5 text-xs ${
                      isActive
                        ? "text-sky-500/70 dark:text-sky-400/70"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    · {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto -mx-1 px-1 pb-1" style={{ minHeight: "180px" }}>
          {loading && (
            <div className="py-8 flex justify-center">
              <Spinner />
            </div>
          )}

          {!loading && error && (
            <p className="text-rose-500 text-sm py-4 text-center">{error}</p>
          )}

          {!loading && !error && activeTab === "urantia" && (
            <UrantiaList
              parallels={urantiaParallels}
              expanded={expanded}
              onToggle={toggleExpanded}
            />
          )}

          {!loading && !error && activeTab === "bible" && (
            <BibleList
              parallels={bibleParallels}
              expanded={expanded}
              onToggle={toggleExpanded}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

type ListProps<T> = {
  parallels: T[];
  expanded: Set<string>;
  onToggle: (key: string) => void;
};

function UrantiaList({ parallels, expanded, onToggle }: ListProps<ApiUrantiaParallel>) {
  if (parallels.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-6 text-center">
        No Urantia parallels found.
      </p>
    );
  }
  return (
    <ul className="space-y-2 list-none p-0 m-0">
      {parallels.map((p) => {
        const isExpanded = expanded.has(p.id);
        const isLong = p.text.length > TEXT_PREVIEW;
        const href = `/papers/${paperIdToUrl(p.paperId)}#${p.id}`;
        return (
          <li
            key={p.id}
            className="rounded-md border border-gray-200 dark:border-zinc-700 p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <Link
                href={href}
                className="text-sm font-semibold text-gray-900 dark:text-white hover:underline"
              >
                {p.standardReferenceId}
                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
                  · {p.paperTitle}
                  {p.sectionTitle ? ` — ${p.sectionTitle}` : ""}
                </span>
              </Link>
              <span className="rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 text-xs">
                {Math.round(p.similarity * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {isExpanded ? p.text : truncate(p.text, TEXT_PREVIEW)}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => onToggle(p.id)}
                className="mt-1.5 text-xs font-medium text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 bg-transparent border-0 p-0"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BibleList({ parallels, expanded, onToggle }: ListProps<ApiBibleParallel>) {
  if (parallels.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-6 text-center">
        No Bible parallels found.
      </p>
    );
  }
  // TODO: when urantia-hub gets a Bible viewer, link the reference to it.
  return (
    <ul className="space-y-2 list-none p-0 m-0">
      {parallels.map((p) => {
        const isExpanded = expanded.has(p.chunkId);
        const isLong = p.text.length > TEXT_PREVIEW;
        return (
          <li
            key={p.chunkId}
            className="rounded-md border border-gray-200 dark:border-zinc-700 p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {p.reference}
              </span>
              <span className="rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 text-xs">
                {Math.round(p.similarity * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {isExpanded ? p.text : truncate(p.text, TEXT_PREVIEW)}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => onToggle(p.chunkId)}
                className="mt-1.5 text-xs font-medium text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 bg-transparent border-0 p-0"
              >
                {isExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default RelatedWorks;
