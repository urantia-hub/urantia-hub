// Node modules.
import Link from "next/link";
import type { ReactNode } from "react";
// Relative modules.
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import Navbar from "@/components/Navbar";
import Trail from "@/components/parallels/Trail";

export type Filter = { label: string; href: string; active: boolean };

type InsightPageProps = {
  title: string;
  path: string;
  intro: string;
  method: string;
  filters?: Filter[];
  page: number;
  totalPages: number;
  pageHref: (page: number) => string;
  empty: boolean;
  children: ReactNode;
};

// The shared frame of the four insight lists: intro, filters, list, pager, and method.
const InsightPage = ({ title, path, intro, method, filters, page, totalPages, pageHref, empty, children }: InsightPageProps) => (
  <div className="flex flex-col min-h-screen bg-slate-100 text-gray-700 dark:bg-neutral-800 dark:text-white">
    <HeadTag titlePrefix={`${title} | Parallels`} metaDescription={intro} canonicalUrl={`https://www.urantiahub.com${path}`} />
    <Navbar />
    {/* ph-no-capture: no autocapture here; these pages send named events instead. */}
    <main className="ph-no-capture flex-grow container mx-auto px-4 mt-4 mb-16 max-w-2xl">
      <Trail href={path} label={title} />
      <h1 className="text-3xl font-bold mt-6 mb-2">{title}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{intro}</p>
      {filters && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {filters.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              aria-current={f.active ? "page" : undefined}
              className={`whitespace-nowrap text-xs rounded-full border px-3 py-1.5 hover:no-underline ${
                f.active
                  ? "bg-sky-500 border-sky-500 text-white"
                  : "bg-white dark:bg-neutral-700 border-gray-200 dark:border-zinc-600 text-gray-600 dark:text-gray-200"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}
      {empty ? (
        <p className="text-sm text-gray-400 py-6 text-center">Nothing to show for this choice.</p>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">{children}</ul>
      )}
      <div className="flex justify-between text-sm mt-6">
        {page > 0 ? (
          <Link href={pageHref(page - 1)} className="text-sky-600 dark:text-sky-400">
            ‹ Previous
          </Link>
        ) : (
          <span />
        )}
        {page + 1 < totalPages && (
          <Link href={pageHref(page + 1)} className="text-sky-600 dark:text-sky-400">
            Next ›
          </Link>
        )}
      </div>
      <h2 className="text-base font-bold mt-10 mb-1">How this is measured</h2>
      <p className="text-xs text-gray-400 leading-relaxed m-0">{method}</p>
    </main>
    <Footer />
  </div>
);

export default InsightPage;
