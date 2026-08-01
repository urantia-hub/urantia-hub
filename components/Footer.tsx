// Node modules.
import Link from "next/link";
import { deriveReadLink } from "@/utils/readPaperLink";
import { useSession } from "next-auth/react";

const Footer = ({ marginBottom }: { marginBottom?: string }) => {
  // Hooks.
  const { status } = useSession();

  return (
    <footer
      className="bg-slate-100 text-gray-400"
      style={{ marginBottom: marginBottom || "4.3rem" }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-gray-600 text-lg font-bold tracking-wide mb-4 flex items-center text-center md:text-left w-full">
              <span className="flex items-center font-light">Urantia</span>
              Hub
            </h3>
          </div>
          <div>
            <h4 className="text-gray-600 text-sm font-semibold mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/"
                >
                  Home
                </Link>
              </li>
              <li>
                {/* A plain anchor, not next/link: the href is an API route that
                    307s, and a client-side transition to it renders the target
                    page with empty props. */}
                <a
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href={deriveReadLink(status)}
                >
                  Read
                </a>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/papers"
                >
                  Papers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-600 text-sm font-semibold mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/community-resources"
                >
                  Community Resources
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="https://github.com/urantia-hub/data"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open-Source Papers (audio + text)
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/blockchain-archive"
                >
                  Blockchain Archive
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/changelog"
                >
                  Latest Updates
                </Link>
              </li>
              <li>
                <a
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="mailto:team@urantiahub.com"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/about"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-600 text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/privacy-policy"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/terms-of-service"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:no-underline"
                  href="/cookie-policy"
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-sm border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p>
            &copy; {new Date().getFullYear()} UrantiaHub. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              aria-label="Uptime Robot status page"
              className="flex items-center text-green-400 text-xs hover:text-green-500 ml-4"
              href="https://stats.uptimerobot.com/6qzJEHV7rN"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="flex relative h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>{" "}
              All systems normal.
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
