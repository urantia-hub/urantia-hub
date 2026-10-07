// Node modules.
import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
// Relative modules.
import { track } from "@/libs/analytics";
import {
  PARALLELS_ROOT,
  paragraphPath,
  parseLookup,
  passagePath,
  type CorpusRef,
} from "@/utils/parallels";

const EXAMPLES = ["hatred ceases by love", "the one God", "do your duty without attachment", "140:3.15", "Dhp 5"];

type LookupBoxProps = { corpora: CorpusRef[]; initial?: string };

// One box: a Urantia ref opens its parallels, a scripture ref opens the passage, and
// anything else is a search by meaning.
const LookupBox = ({ corpora, initial = "" }: LookupBoxProps) => {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  const submit = (input: string) => {
    const lookup = parseLookup(input, corpora);
    if (lookup.kind === "search" && !lookup.q) return;
    track("parallels_searched", { kind: lookup.kind });
    if (lookup.kind === "paragraph") void router.push(paragraphPath(lookup.ref));
    else if (lookup.kind === "passage") void router.push(passagePath(lookup.slug, lookup.ref));
    else void router.push({ pathname: PARALLELS_ROOT, query: { q: lookup.q } });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(value);
  };

  return (
    <form onSubmit={onSubmit} role="search">
      <label htmlFor="parallels-lookup" className="sr-only">
        Search by meaning, or enter a reference
      </label>
      <div className="flex rounded-lg bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <input
          id="parallels-lookup"
          className="flex-1 min-w-0 bg-transparent border-0 dark:border-0 px-4 py-3 text-base text-gray-600 dark:text-white focus:outline-none"
          placeholder="Search by meaning, or a reference"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          enterKeyHint="search"
        />
        <button
          type="submit"
          className="px-4 bg-transparent border-0 dark:border-0 text-sky-600 dark:text-sky-400 font-semibold"
        >
          Go
        </button>
      </div>
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setValue(q);
              submit(q);
            }}
            className="whitespace-nowrap text-xs rounded-full border border-gray-200 dark:border-zinc-600 bg-white dark:bg-neutral-700 text-gray-600 dark:text-gray-200 px-3 py-1.5"
          >
            {q}
          </button>
        ))}
      </div>
    </form>
  );
};

export default LookupBox;
