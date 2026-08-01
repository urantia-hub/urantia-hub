// Node modules.
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
// Relative modules.
import PaperNavbar from "@/components/PaperNavbar";
import { deriveReadLink } from "@/utils/readPaperLink";
import { useEffect, useState } from "react";

type NavbarProps = {
  audioContent?: JSX.Element;
  audioOnPlay?: () => void;
  audioIsPlaying?: boolean;
  paperId?: number;
  paperTitle?: string;
  showAudio?: boolean;
  skipToNextParagraph?: () => void;
  skipToPreviousParagraph?: () => void;
  setPlaybackRate?: (rate: number) => void;
  playbackRate?: number;
};

const Navbar = ({
  audioContent,
  audioOnPlay,
  audioIsPlaying,
  paperId,
  paperTitle,
  showAudio,
  skipToNextParagraph,
  skipToPreviousParagraph,
  setPlaybackRate,
  playbackRate,
}: NavbarProps) => {
  // Hooks.
  const router = useRouter();
  const { status } = useSession();

  // Derive the Read link based on the authentication status.
  const continueReadingLink = deriveReadLink(status);

  // Hidden state.
  const [hidden, setHidden] = useState<boolean>(false);

  // Hide the Navbar on scroll down and show it on scroll up.
  useEffect(() => {
    if (router.pathname.startsWith("/papers/")) {
      let lastScrollTop = 0;
      const handleScroll = () => {
        const currentScrollTop =
          window.scrollY || document.documentElement.scrollTop;

        if (currentScrollTop > lastScrollTop) {
          setHidden(true);
        } else {
          setHidden(false);
        }

        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
      };

      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [router.pathname]);

  return (
    <>
      <header
        className={`flex flex-col items-center pt-2 pb-1 px-2 fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-neutral-800 dark:border-t dark:border-neutral-700 mx-auto dark:shadow-none shadow ${
          hidden ? "translate-y-16" : "translate-y-0"
        } transition-transform duration-300 ease-in-out`}
      >
        <PaperNavbar
          audioContent={audioContent}
          audioOnPlay={audioOnPlay}
          audioIsPlaying={audioIsPlaying}
          paperId={paperId}
          paperTitle={paperTitle}
          showAudio={showAudio}
          skipToNextParagraph={skipToNextParagraph}
          skipToPreviousParagraph={skipToPreviousParagraph}
          setPlaybackRate={setPlaybackRate}
          playbackRate={playbackRate}
        />

        <div className="flex items-center justify-around w-full max-w-sm pt-1 pb-2">
          <Link
            className={`flex-1 flex flex-col items-center text-xs text-center ${
              router.asPath === "/explore"
                ? "text-gray-600 dark:text-white"
                : "text-gray-400 dark:text-gray-400"
            } line-clamp-1 hover:text-gray-600 hover:dark:text-white hover:no-underline transition duration-300 ease-in-out`}
            href="/explore"
          >
            <svg className="w-7 h-7 fill-current" viewBox="0 0 512 512">
              <path d="M127.923 267.983h.016a73.67 73.67 0 0 0-10.434-.743c-36.165.008-67.677 26.589-72.902 63.389a74.044 74.044 0 0 0-.736 10.41c0 36.164 26.589 67.677 63.381 72.918 3.498.488 6.974.735 10.419.735 36.164-.007 67.676-26.589 72.909-63.388l-7.849-1.115 7.849 1.107c.495-3.498.736-6.982.736-10.426 0-36.158-26.59-67.662-63.389-72.887zm46.955 81.091c-4.071 28.888-28.88 49.765-57.211 49.758a59.24 59.24 0 0 1-8.206-.573c-28.865-4.08-49.742-28.888-49.742-57.22 0-2.701.186-5.434.581-8.182 4.071-28.888 28.88-49.765 57.204-49.765 2.701 0 5.434.186 8.19.588h.007c28.889 4.072 49.758 28.873 49.758 57.188a58.243 58.243 0 0 1-.581 8.206z" />
              <path d="M510.823 324.475c-.665-4.691-1.686-9.227-2.872-13.693l.697-.263c-.007-.024-2.547-6.758-6.51-17.517-5.952-16.132-15.071-41.242-23.492-65.858-8.414-24.569-16.147-48.828-19.174-62.506l-.023-.086-.023-.085c-7.439-30.212-28.494-54.162-55.54-66.137-.208-.843-.41-1.657-.565-2.368l-.015-.078-.031-.108c-6.146-24.91-28.54-42.318-54.015-42.334-2.601 0-5.224.186-7.865.558-27.796 3.948-47.868 27.727-47.868 55.044 0 .75.015 1.509.046 2.26v.094l.008.077c.14 2.284.318 5.148.512 8.236-16.891 17.393-27.186 40.832-27.712 66.144h-20.776c-.518-25.312-10.814-48.751-27.704-66.144.193-3.089.371-5.953.51-8.236l.008-.085v-.093a54.61 54.61 0 0 0 .047-2.252c0-27.317-20.072-51.096-47.876-55.044h.031a54.679 54.679 0 0 0-7.888-.558c-25.475.008-47.861 17.433-53.999 42.342l-.023.094-.016.054c-.162.72-.364 1.548-.58 2.399-27.046 11.967-48.109 35.925-55.547 66.145l-.024.077-.023.086c-2.012 9.087-6.13 22.974-11.139 38.424-7.508 23.207-17.029 50.106-24.662 71.16a3162.657 3162.657 0 0 1-9.552 26.055c-2.384 6.44-3.816 10.225-3.816 10.225l.697.271c-1.184 4.474-2.206 9.01-2.872 13.701A118.675 118.675 0 0 0 0 341.102c0 57.66 42.396 107.951 101.109 116.28a117.612 117.612 0 0 0 16.634 1.168c57.653 0 107.928-42.396 116.258-101.1.612-4.335.914-8.639 1.045-12.912l.759.046v-.008l.038-.596h40.306l.039.596.759-.046c.131 4.28.433 8.584 1.044 12.92 8.329 58.705 58.605 101.1 116.257 101.108 5.496 0 11.054-.387 16.635-1.176 58.714-8.329 101.109-58.62 101.117-116.28 0-5.497-.387-11.047-1.177-16.627zm-348.09-255.18c1.866 0 3.739.124 5.612.394l.604.086-.573-.078c19.05 2.678 32.89 18.5 34.02 36.954-11.913-8.019-25.776-13.554-40.956-15.706a97.728 97.728 0 0 0-13.84-.976c-7.129 0-14.088.859-20.853 2.346 6.44-13.808 20.427-23.035 35.986-23.02zm55.57 285.933c-7.175 50.794-50.74 87.477-100.559 87.469-4.753 0-9.567-.333-14.42-1.014-50.78-7.168-87.47-50.756-87.47-100.582 0-4.754.333-9.56 1.022-14.398 7.176-50.779 50.756-87.47 100.583-87.47 4.752 0 9.552.325 14.398 1.022 50.778 7.176 87.47 50.748 87.47 100.575a102.614 102.614 0 0 1-1.024 14.398zm11.479-164.133c-1.223 19.622-3.669 57.691-5.813 90.875-.17 2.678-.341 5.256-.511 7.857-16.487-34.066-49.091-59.557-89.374-65.27a117.664 117.664 0 0 0-16.626-1.176c-28.393 0-54.975 10.319-75.665 27.766 5.047-14.359 10.194-29.36 14.676-43.201 5.055-15.62 9.234-29.616 11.487-39.694 9.002-36.675 42.148-62.444 79.644-62.429 3.824 0 7.702.263 11.611.821 41.018 5.79 70.642 40.987 70.634 81.208a78.498 78.498 0 0 1-.063 3.243zm7.091 137.033c1.92-29.732 5.984-92.501 8.128-126.421h21.991c2.144 33.92 6.208 96.689 8.128 126.421h-38.247zM343.617 69.697a40.091 40.091 0 0 1 5.643-.402c15.559-.015 29.539 9.212 35.994 23.014-6.765-1.479-13.732-2.346-20.861-2.346-4.567 0-9.188.325-13.84.983-15.179 2.152-29.042 7.686-40.956 15.706 1.13-18.454 14.962-34.276 34.02-36.955zM282.21 191.095a76.59 76.59 0 0 1-.069-3.243c0-40.221 29.624-75.418 70.641-81.208a82.038 82.038 0 0 1 11.611-.821c37.465-.015 70.572 25.707 79.613 62.328 2.26 10.086 6.448 24.12 11.518 39.794 4.474 13.826 9.621 28.842 14.669 43.193-20.691-17.439-47.265-27.758-75.65-27.758-5.488 0-11.038.379-16.635 1.176-40.282 5.713-72.886 31.203-89.382 65.27-2.244-34.847-4.984-77.529-6.316-98.731zm126.459 250.589a105.004 105.004 0 0 1-14.421 1.022c-49.818 0-93.383-36.683-100.559-87.477a102.224 102.224 0 0 1-1.022-14.398c0-49.827 36.683-93.399 87.477-100.575a100.887 100.887 0 0 1 14.398-1.022c49.819 0 93.407 36.691 100.583 87.47a102.055 102.055 0 0 1 1.022 14.398c0 49.826-36.691 93.414-87.478 100.582z" />
              <path d="M394.489 267.24c-3.437 0-6.928.24-10.434.743h.008c-36.792 5.225-63.381 36.73-63.381 72.887 0 3.444.239 6.928.735 10.434 5.225 36.799 36.745 63.381 72.91 63.388 3.444 0 6.92-.247 10.403-.735 36.814-5.241 63.396-36.754 63.396-72.918 0-3.436-.24-6.92-.735-10.41-5.225-36.8-36.738-63.389-72.902-63.389zm8.027 131.019a58.927 58.927 0 0 1-8.19.573c-28.331.007-53.14-20.87-57.212-49.758a57.94 57.94 0 0 1-.58-8.205c-.008-28.316 20.869-53.117 49.757-57.188h.008a56.444 56.444 0 0 1 8.19-.588c28.331 0 53.132 20.877 57.204 49.757.387 2.756.58 5.496.58 8.19 0 28.331-20.869 53.139-49.757 57.219z" />
            </svg>
            Explore
          </Link>
          {/* A plain anchor, not next/link: the href is an API route that 307s,
              and a client-side transition to it renders the target page with
              empty props. */}
          <a
            className={`flex-1 flex flex-col items-center text-xs text-center ${
              router.asPath.startsWith("/papers/")
                ? "text-gray-600 dark:text-white"
                : "text-gray-400 dark:text-gray-400"
            } line-clamp-1 hover:text-gray-600 hover:dark:text-white hover:no-underline transition duration-300 ease-in-out`}
            href={continueReadingLink}
            onClick={(event) => {
              // Prevent the default behavior if the user is already on the Read page.
              if (router.asPath.startsWith("/papers/")) event.preventDefault();
            }}
          >
            <svg
              className="w-6 h-6 fill-current mb-1"
              viewBox="0 0 122.88 101.37"
            >
              <path d="m12.64 77.27.31-54.92h-6.2v69.88c8.52-2.2 17.07-3.6 25.68-3.66 7.95-.05 15.9 1.06 23.87 3.76a50.968 50.968 0 0 0-16.36-8.88c-7.42-2.42-15.44-3.22-23.66-2.52a3.38 3.38 0 0 1-3.64-3.08c-.02-.2-.02-.39 0-.58zm90.98-57.79c-.02-.16-.04-.33-.04-.51 0-.17.01-.34.04-.51V7.34c-7.8-.74-15.84.12-22.86 2.78-6.56 2.49-12.22 6.58-15.9 12.44V85.9c5.72-3.82 11.57-6.96 17.58-9.1 6.85-2.44 13.89-3.6 21.18-3.02v-54.3zm6.75-3.88h9.14c1.86 0 3.37 1.51 3.37 3.37v77.66a3.372 3.372 0 0 1-4.46 3.19c-9.4-2.69-18.74-4.48-27.99-4.54-9.02-.06-18.03 1.53-27.08 5.52-.56.37-1.23.57-1.92.56-.68.01-1.35-.19-1.92-.56-9.04-4-18.06-5.58-27.08-5.52-9.25.06-18.58 1.85-27.99 4.54-.34.12-.71.18-1.09.18-1.84.01-3.35-1.5-3.35-3.36V18.97c0-1.86 1.51-3.37 3.37-3.37h9.61l.06-11.26a3.366 3.366 0 0 1 2.68-3.28c8.87-1.85 19.65-1.39 29.1 2.23 6.53 2.5 12.46 6.49 16.79 12.25 4.37-5.37 10.21-9.23 16.78-11.72 8.98-3.41 19.34-4.23 29.09-2.8 1.68.24 2.88 1.69 2.88 3.33V15.6h.01zM68.13 91.82c7.45-2.34 14.89-3.3 22.33-3.26 8.61.05 17.16 1.46 25.68 3.66V22.35h-5.77v55.22a3.372 3.372 0 0 1-4.15 3.28c-7.38-1.16-14.53-.2-21.51 2.29-5.62 2.01-11.14 5.01-16.58 8.68zm-10.01-6.57V22.46c-3.53-6.23-9.24-10.4-15.69-12.87-7.31-2.8-15.52-3.43-22.68-2.41l-.38 66.81c7.81-.28 15.45.71 22.64 3.06a57.689 57.689 0 0 1 16.11 8.2z" />
            </svg>
            Read
          </a>
          <Link
            className={`flex-1 flex flex-col items-center text-xs text-center ${
              router.asPath.startsWith("/search")
                ? "text-gray-600 dark:text-white"
                : "text-gray-400 dark:text-gray-400"
            } line-clamp-1 hover:text-gray-600 hover:dark:text-white hover:no-underline transition duration-300 ease-in-out`}
            href="/search"
          >
            <svg
              className="w-6 h-6 fill-current mb-1"
              viewBox="0 0 119.828 122.88"
            >
              <path d="M48.319 0C61.662 0 73.74 5.408 82.484 14.152s14.152 20.823 14.152 34.166c0 12.809-4.984 24.451-13.117 33.098.148.109.291.23.426.364l34.785 34.737a3.723 3.723 0 0 1-5.25 5.28L78.695 87.06a3.769 3.769 0 0 1-.563-.715 48.116 48.116 0 0 1-29.814 10.292c-13.343 0-25.423-5.408-34.167-14.152C5.408 73.741 0 61.661 0 48.318s5.408-25.422 14.152-34.166C22.896 5.409 34.976 0 48.319 0zm28.763 19.555c-7.361-7.361-17.53-11.914-28.763-11.914s-21.403 4.553-28.764 11.914c-7.361 7.361-11.914 17.53-11.914 28.763s4.553 21.403 11.914 28.764c7.36 7.361 17.53 11.914 28.764 11.914 11.233 0 21.402-4.553 28.763-11.914 7.361-7.36 11.914-17.53 11.914-28.764 0-11.233-4.553-21.402-11.914-28.763z" />
            </svg>
            Search
          </Link>
          <Link
            className={`flex-1 flex flex-col items-center text-xs text-center ${
              router.asPath === "/papers"
                ? "text-gray-600 dark:text-white"
                : "text-gray-400 dark:text-gray-400"
            } line-clamp-1 hover:text-gray-600 hover:dark:text-white hover:no-underline transition duration-300 ease-in-out`}
            href="/papers"
          >
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M7 3h2v18H7zM4 3h2v18H4zm6 0h2v18h-2zm9.062 17.792-6.223-16.89 1.877-.692 6.223 16.89z" />
            </svg>
            Papers
          </Link>
          {status === "unauthenticated" && (
            <button
              className="flex-1 flex flex-col border-0 dark:border-0 items-center p-0 dark:p-0 text-xs text-center text-gray-500 hover:text-gray-600 dark:text-gray-400 hover:dark:text-white bg-transparent line-clamp-1 hover:no-underline transition duration-300 ease-in-out focus:outline-none"
              onClick={() => {
                router.push("/auth/sign-in");
              }}
            >
              <svg
                className="w-6 h-6 fill-current mb-1"
                viewBox="0 0 113.055 122.88"
              >
                <path d="M53.114 2.457C53.114 1.1 54.643 0 56.527 0s3.413 1.1 3.413 2.457v44.377c0 1.357-1.528 2.457-3.413 2.457s-3.413-1.1-3.413-2.457V2.457zm20.501 17.204a3.406 3.406 0 0 1-2.026-4.373 3.406 3.406 0 0 1 4.372-2.026c10.962 4.015 20.339 11.339 26.924 20.766a56.262 56.262 0 0 1 10.17 32.325c0 15.606-6.329 29.738-16.559 39.969-10.23 10.229-24.362 16.559-39.969 16.559s-29.739-6.329-39.969-16.559C6.329 96.091 0 81.959 0 66.353a56.261 56.261 0 0 1 10.169-32.325c6.585-9.427 15.962-16.751 26.924-20.766a3.408 3.408 0 0 1 2.346 6.399A49.88 49.88 0 0 0 15.741 37.92c-5.619 8.044-8.916 17.846-8.916 28.433 0 13.723 5.564 26.148 14.559 35.143 8.995 8.995 21.42 14.56 35.143 14.56s26.148-5.564 35.143-14.56c8.995-8.994 14.559-21.42 14.559-35.143 0-10.587-3.297-20.389-8.916-28.433a49.873 49.873 0 0 0-23.698-18.259z" />
              </svg>
              Sign In
            </button>
          )}
          {status !== "unauthenticated" && (
            <>
              <Link
                className={`flex-1 flex flex-col items-center text-xs text-center ${
                  router.asPath.startsWith("/more")
                    ? "text-gray-600 dark:text-white"
                    : "text-gray-400 dark:text-gray-400"
                } hover:text-gray-600 hover:dark:text-white line-clamp-1 hover:no-underline transition duration-300 ease-in-out`}
                href="/more"
              >
                <svg
                  className="w-6 h-6 fill-current mb-1"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 15h80v10H10zM10 45h80v10H10zM10 75h80v10H10z" />
                </svg>
                More
              </Link>
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default Navbar;
