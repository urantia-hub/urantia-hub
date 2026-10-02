// Node modules.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
// Relative modules.
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import HomepageNavbar from "@/components/HomepageNavbar";
import ParticleBackground from "@/components/ParticleBackground";
import TiltButton from "@/components/TiltButton";
import { deriveReadLink } from "@/utils/readPaperLink";
import {
  AlertCircle,
  Atom,
  BookX,
  Bookmark,
  Dna,
  Notebook,
  SearchX,
  Share2,
  Sparkles,
  MessageSquare,
  Store,
} from "lucide-react";
import FeatureCard, { modernFeatures } from "@/components/HomepageFeatureCard";
import CommunityFeature from "@/components/HomepageCommunityFeature";

const HomePage = () => {
  // Hooks.
  const { status } = useSession();
  const searchParams = useSearchParams();

  // State.
  const [lastVisitedNode, setLastVisitedNode] =
    useState<LastVisitedNode | null>(null);
  const [showDownButton, setShowDownButton] = useState<boolean>(true);

  const fetchLastVisitedNode = async () => {
    try {
      const response = await fetch(`/api/user/nodes/last-visited`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setLastVisitedNode(data);
      localStorage.setItem("lastVisitedNode", JSON.stringify(data));
    } catch (error) {
      console.error(`Unable to fetch last visited node`, error);

      // Fallback to local storage.
      console.warn(`Falling back to local storage for last visited node`);
      const lastVisitedNode: LastVisitedNode = localStorage.getItem(
        "lastVisitedNode"
      )
        ? JSON.parse(localStorage.getItem("lastVisitedNode") as string)
        : null;
      setLastVisitedNode(lastVisitedNode);
    }
  };

  const onAuthenticated = async () => {
    await fetchLastVisitedNode();
  };

  useEffect(() => {
    if (status === "authenticated") {
      void onAuthenticated();
    }
    if (status === "unauthenticated") {
      const lastVisitedNode: LastVisitedNode = localStorage.getItem(
        "lastVisitedNode"
      )
        ? JSON.parse(localStorage.getItem("lastVisitedNode") as string)
        : null;
      setLastVisitedNode(lastVisitedNode);
    }
  }, [status]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY !== 0;
      setShowDownButton(!isScrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribed = searchParams.get("unsubscribed");
    if (unsubscribed === "true") {
      toast.success("You've been successfully unsubscribed from emails", {
        description:
          "You can re-enable notifications anytime from your settings",
      });
    } else if (unsubscribed === "false") {
      toast.error("Unable to unsubscribe from emails", {
        description:
          "Please log in and visit your settings page to manage email notifications",
      });
    }

    const genericError = searchParams.get("genericError");
    if (genericError) {
      toast.error(
        "There was an error, our team has been notified and are looking into it"
      );
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-600">
      <HeadTag canonicalUrl="https://www.urantiahub.com" />

      <HomepageNavbar />

      <main>
        {/* Hero Section */}
        <section className="bg-hero-homepage relative min-h-screen pt-8 px-6 text-center bg-cover bg-center bg-slate-100 flex flex-col items-center justify-center overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 to-blue-800/40 mix-blend-multiply" />

          {/* Particle effect */}
          <ParticleBackground />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto w-full mt-[-5vh]">
            <h1 className="mt-0 mb-8 text-5xl md:text-7xl font-bold text-white max-w-4xl mx-auto leading-tight drop-shadow-lg">
              Revolutionary Ideas for Life&apos;s Biggest Questions
            </h1>
            <p className="text-xl md:text-2xl text-white mb-14 max-w-2xl mx-auto leading-relaxed drop-shadow">
              Discover the Urantia Papers - a unique revelation that bridges
              lost history with modern science, offering unprecedented insights
              into our origin, history, and destiny.
            </p>

            {status === "authenticated" && (
              <TiltButton href={deriveReadLink(status)}>
                Continue Reading
              </TiltButton>
            )}
            {status === "unauthenticated" && (
              <TiltButton href="/auth/sign-in">Start Reading</TiltButton>
            )}
          </div>

          {showDownButton && (
            <div
              className="fade-in fixed bottom-0 left-0 right-0 mx-auto w-12 h-12 mb-8 backdrop-blur-md bg-white/10 rounded-full p-2 z-10 cursor-pointer hover:bg-white/20 transition duration-300 ease-in-out"
              onClick={() => {
                const afterHero = document.getElementById("after-hero");
                afterHero?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              <svg
                aria-hidden="true"
                className="w-full h-full text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          )}
        </section>

        {/* What's New Banner */}
        <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-b border-sky-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link
              href="/changelog"
              className="flex items-center justify-center gap-3 text-sm md:text-base text-gray-700 hover:text-sky-700 transition-colors duration-200 group"
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 group-hover:bg-sky-200 transition-colors duration-200">
                What&apos;s New
              </span>
              <span className="font-medium">v1.1.0: Search, Security & Performance</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Unique Ideas Section */}
        <section className="py-36 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2
              id="after-hero"
              className="text-4xl md:text-5xl font-semibold pb-1 mb-14 text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-slate-400"
            >
              Ideas That Challenge Our Understanding
            </h2>

            <p className="text-xl text-center mb-16 max-w-3xl mx-auto text-gray-600 leading-relaxed">
              The Urantia Papers present groundbreaking concepts about our
              universe, human history, and spiritual reality that had never been
              articulated before their publication in 1955.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
              {/* Beyond Modern Science */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 blur-sm bg-[length:200%_100%] border-laser" />

                <div className="relative h-full bg-gradient-to-br from-indigo-50 to-blue-100 p-8 rounded-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600/10 backdrop-blur-sm">
                      <Atom
                        className="w-8 h-8 text-blue-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-blue-900">
                      Beyond Modern Science
                    </h3>
                  </div>
                  <div className="relative">
                    {/* Decorative elements */}
                    <div className="absolute -right-4 top-0 w-20 h-20 bg-blue-600/5 rounded-full blur-2xl" />
                    <div className="absolute -left-4 bottom-0 w-16 h-16 bg-indigo-600/5 rounded-full blur-xl" />

                    <p className="relative text-blue-900/80 leading-relaxed">
                      Detailed descriptions of universe mechanics and cosmic
                      organization that transcend contemporary scientific
                      understanding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Human Origins Revealed */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 blur-sm bg-[length:200%_100%] border-laser" />

                <div className="relative h-full bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-600/10 backdrop-blur-sm">
                      <Dna
                        className="w-8 h-8 text-emerald-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-emerald-900">
                      Human Origins Revealed
                    </h3>
                  </div>
                  <div className="relative">
                    {/* Decorative elements */}
                    <div className="absolute -right-4 top-0 w-20 h-20 bg-emerald-600/5 rounded-full blur-2xl" />
                    <div className="absolute -left-4 bottom-0 w-16 h-16 bg-green-600/5 rounded-full blur-xl" />

                    <p className="relative text-emerald-900/80 leading-relaxed">
                      A comprehensive account of human civilization&apos;s
                      beginnings that bridges anthropological findings with
                      spiritual purpose.
                    </p>
                  </div>
                </div>
              </div>

              {/* Spiritual Reality Unified */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 blur-sm bg-[length:200%_100%] border-laser" />

                <div className="relative h-full bg-gradient-to-br from-violet-100 to-purple-50 p-8 rounded-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-violet-600/10 backdrop-blur-sm">
                      <Sparkles
                        className="w-8 h-8 text-violet-600"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-violet-900">
                      Spiritual Reality Unified
                    </h3>
                  </div>
                  <div className="relative">
                    {/* Decorative elements */}
                    <div className="absolute -right-4 top-0 w-20 h-20 bg-violet-600/5 rounded-full blur-2xl" />
                    <div className="absolute -left-4 bottom-0 w-16 h-16 bg-purple-600/5 rounded-full blur-xl" />

                    <p className="relative text-violet-900/80 leading-relaxed">
                      A unique synthesis of science, philosophy, and religion
                      that provides new perspectives on life&apos;s deepest
                      questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction to Urantia Papers */}
        <section className="pb-48 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            {/* <h2 className="text-4xl md:text-5xl font-semibold mb-12 text-center"> */}
            <h2 className="text-4xl md:text-5xl font-semibold pb-1 mb-14 text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-400 to-gray-900">
              What are the Urantia Papers?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xl leading-relaxed mb-6">
                  The Urantia Papers are a unique collection of 196 papers
                  authored by numerous celestial beings in 1934-1935, offering
                  profound insights into human history, cosmology, and spiritual
                  truth that bridge science, philosophy, and religion.
                </p>
                <p className="text-xl leading-relaxed">
                  <Link
                    className="text-blue-400 hover:text-blue-600 hover:no-underline transition-colors duration-200"
                    href="https://urantia.org"
                  >
                    The Urantia Book Foundation
                  </Link>{" "}
                  compiled and published these papers as a book in 1955,
                  inspiring millions worldwide with their groundbreaking
                  insights into our relationship with the universe and divine
                  purpose.
                </p>
              </div>
              <div className="relative h-96">
                <Image
                  alt="Celestial host writing the Urantia Papers"
                  className="object-cover rounded-lg"
                  fill
                  src="/homepage1.jpg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Cosmic Perspective Divider */}
        <div className="relative">
          {/* Purple gradient transition at top */}
          <div className="absolute inset-x-0 -top-10 h-36 bg-gradient-to-b from-white via-purple-300 to-transparent" />

          {/* Wave SVG */}
          <svg
            className="absolute -top-24 w-full h-24 transform translate-y-1"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path
              fill="black"
              fillOpacity="1"
              d="M0,0
         C360,20 720,80 1080,80
         C1260,80 1350,60 1440,30
         L1440,100
         L0,100
         Z"
            >
              <animate
                attributeName="d"
                dur="20s"
                repeatCount="indefinite"
                values="
          M0,0 C360,20 720,80 1080,80 C1260,80 1350,60 1440,30 L1440,100 L0,100 Z;
          M0,0 C360,40 720,60 1080,60 C1260,60 1350,40 1440,20 L1440,100 L0,100 Z;
          M0,0 C360,20 720,80 1080,80 C1260,80 1350,60 1440,30 L1440,100 L0,100 Z"
              />
            </path>
          </svg>

          {/* Background atmosphere effect */}
          <div className="absolute inset-0 bg-black" />

          <div className="relative flex items-center justify-center h-64">
            {/* Stars in background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(100)].map((_, i) => (
                <div
                  key={i}
                  className="twinkle absolute w-0.5 h-0.5 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.8 + 0.2,
                    animationDelay: `${Math.random() * 4 + 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Planet container with comets */}
            <div className="relative">
              {/* Comet 1 */}
              <div className="absolute left-1/2 top-1/2 comet-path-1">
                <div className="relative w-2 h-2">
                  <div className="absolute w-2 h-2 bg-blue-200 rounded-full" />
                  <div className="absolute w-8 h-1 -right-8 top-0.5 bg-gradient-to-r from-blue-200 to-transparent rounded-full blur-[2px]" />
                </div>
              </div>

              {/* Comet 2 */}
              <div className="absolute left-1/2 top-1/2 comet-path-2">
                <div className="relative w-2 h-2">
                  <div className="absolute w-3 h-3 bg-blue-200 rounded-full" />
                  <div className="absolute w-8 h-1 -left-8 bottom-0.5 transform rotate-180 bg-gradient-to-r from-blue-200 to-transparent rounded-full blur-[2px]" />
                </div>
              </div>

              {/* Main planet */}
              <div
                className="w-32 h-32 rounded-full relative overflow-hidden z-10
                  bg-gradient-to-br from-blue-950 via-blue-800 to-blue-800
                  shadow-[inset_-12px_-12px_24px_rgba(0,0,0,0.6)]"
              >
                {/* Atmosphere glow (static) */}
                <div className="absolute -inset-1 bg-blue-400/10 blur-sm" />

                {/* Rotating surface details */}
                <div className="absolute inset-0 planet-spin">
                  {/* Dark patches / continents */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,transparent_30%,rgba(0,0,0,0.3)_70%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,transparent_20%,rgba(0,0,0,0.2)_50%)]" />
                </div>

                {/* Light reflections (static) */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/60" />
                <div className="absolute top-2 left-4 w-3 h-3 bg-white/20 rounded-full blur-sm" />

                {/* Orbital rings (static) */}
                <div className="absolute -inset-6 border-2 border-blue-200/10 rounded-full transform -rotate-45 scale-[1.2]" />
                <div className="absolute -inset-5 border border-blue-100/5 rounded-full transform -rotate-45 scale-[1.3]" />

                {/* Outer glow (static) */}
                <div className="absolute -inset-2 bg-blue-500/5 blur-xl rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Revolutionary Insights Section */}
        <section className="pt-10 pb-56 bg-black text-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-semibold pb-1 mb-16 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
              Revolutionary Insights
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {/* Glowing node */}
              <div className="border-node md:hidden" />

              <div className="group relative border border-transparent hover:border-blue-500 transition-all duration-300 rounded-xl">
                {/* Card content */}
                <div className="relative p-8 rounded-xl bg-slate-900/50 backdrop-blur-sm group-hover:bg-slate-900 transition-all duration-300">
                  <h3 className="text-2xl font-semibold mb-4 text-blue-100 group-hover:text-white transition-colors duration-300">
                    Who Created Us?
                  </h3>
                  <p className="text-slate-300/80 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                    Discover our Creator who set in motion a vast family of
                    celestial beings dedicated to helping humanity grow and
                    progress.
                  </p>
                </div>
              </div>

              <div className="group relative border border-transparent hover:border-blue-500 transition-all duration-300 rounded-xl">
                <div className="relative p-8 rounded-xl bg-slate-900/50 backdrop-blur-sm group-hover:bg-slate-900 transition-all duration-300">
                  <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-white transition-colors duration-300">
                    How is Our Universe Organized?
                  </h3>
                  <p className="text-slate-300/80 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                    Explore the intricate structure of our local universe and
                    its relationship to the greater cosmos.
                  </p>
                </div>
              </div>

              <div className="group relative border border-transparent hover:border-blue-500 transition-all duration-300 rounded-xl">
                <div className="relative p-8 rounded-xl bg-slate-900/50 backdrop-blur-sm group-hover:bg-slate-900 transition-all duration-300">
                  <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-white transition-colors duration-300">
                    What is Humanity&apos;s Story?
                  </h3>
                  <p className="text-slate-300/80 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                    Uncover the fascinating history of our world, from the
                    origins of human civilization to our modern global society.
                  </p>
                </div>
              </div>

              <div className="group relative border border-transparent hover:border-blue-500 transition-all duration-300 rounded-xl">
                <div className="relative p-8 rounded-xl bg-slate-900/50 backdrop-blur-sm group-hover:bg-slate-900 transition-all duration-300">
                  <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-white transition-colors duration-300">
                    Who Was Jesus?
                  </h3>
                  <p className="text-slate-300/80 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                    Experience a unique perspective on the life and teachings of
                    Jesus, revealing the human story behind the historical
                    figure.
                  </p>
                </div>
              </div>
            </div>

            {/* Attribution note */}
            <p className="text-center mt-16 text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              These topics represent the four major parts of the Urantia Papers.
            </p>

            <div className="text-center mt-8">
              <Link
                href="https://urantia.dev"
                className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-100 transition-colors duration-200 text-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                For Developers: Explore the Urantia Papers API
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Double Wave SVG overlay */}
        <div className="relative">
          <div className="absolute w-full overflow-hidden h-48 -top-48">
            <svg
              className="absolute w-full h-full"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              fill="#0f172a" // slate-800
            >
              <path
                d="M0,0
                   C480,120 960,120 1440,0
                   L1440,120
                   L0,120
                   Z"
              />
            </svg>
          </div>
        </div>

        {/* Traditional Reading Challenges */}
        <section className="pt-24 pb-56 bg-gradient-to-b from-slate-900 to-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-semibold mb-16 text-center text-white">
              The Challenge of Studying the Papers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="relative h-96">
                  <Image
                    src="/homepage2.jpg"
                    alt="Traditional book reading experience"
                    fill
                    className="object-cover rounded-lg opacity-80"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="space-y-6">
                  <p className="text-xl leading-relaxed text-slate-300">
                    Traditional study methods present several key challenges:
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <BookX
                        className="w-6 h-6 mt-1 text-red-400"
                        strokeWidth={1.5}
                      />
                      <p className="text-lg text-slate-300">
                        2,000+ pages of complex concepts make comprehension
                        difficult
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <SearchX
                        className="w-6 h-6 mt-1 text-red-400"
                        strokeWidth={1.5}
                      />
                      <p className="text-lg text-slate-300">
                        Hard to track progress and locate specific passages
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <Notebook
                        className="w-6 h-6 mt-1 text-red-400"
                        strokeWidth={1.5}
                      />
                      <p className="text-lg text-slate-300">
                        Limited note-taking and sharing capabilities
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <AlertCircle
                        className="w-6 h-6 mt-1 text-red-400"
                        strokeWidth={1.5}
                      />
                      <p className="text-lg text-slate-300">
                        No integrated study aids for complex topics
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Textured border transition */}
        <div className="relative">
          {/* Additional textured rectangle for softer transition */}
          <div className="absolute w-full h-32 -top-32">
            <div className="w-full h-full bg-gradient-to-b from-slate-800 via-emerald-800/90 to-emerald-600/95 relative">
              {/* Organic noise texture */}
              <div
                className="absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundSize: "150px 150px",
                }}
              />
              {/* Subtle shadow at bottom */}
              <div className="absolute bottom-0 w-full h-8 bg-gradient-to-b from-transparent to-black/10" />
            </div>
          </div>

          {/* Original embossed border effect */}
          <div className="absolute w-full h-16 -top-16">
            <div className="w-full h-full bg-gradient-to-b from-emerald-600/95 to-emerald-500 relative">
              {/* Noise texture overlay */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
              {/* Embossed line effect */}
              <div className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent" />
              <div className="absolute bottom-[1px] w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-100/10 to-transparent" />
            </div>
          </div>
        </div>

        {/* Modern Reading Experience */}
        <section className="pt-24 pb-56 bg-gradient-to-b from-emerald-500 to-emerald-600 relative">
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="max-w-7xl mx-auto px-6 relative">
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-center text-white">
              A Modern Reading Experience
            </h2>
            <p className="text-xl text-center mb-16 max-w-3xl mx-auto text-emerald-50">
              We&apos;ve reimagined how these timeless teachings can be accessed
              and studied in the digital age, addressing traditional challenges
              with innovative solutions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {modernFeatures.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Community Hub Section */}
        <section className="py-36 bg-slate-50 relative">
          {/* Transition to Community Hub */}
          <div className="absolute top-16 w-full">
            {/* Textured border transition */}
            <div className="absolute w-full h-16 -top-32">
              <div className="w-full h-full bg-gradient-to-b from-emerald-600 to-emerald-400 relative">
                {/* Organic noise texture */}
                <div
                  className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: "150px 150px",
                  }}
                />
                {/* Subtle shadow at bottom */}
                <div className="absolute bottom-0 w-full h-8 bg-gradient-to-b from-transparent to-black/10" />
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-400 to-gray-900">
              Community Hub
            </h2>
            <p className="text-xl text-center mb-16 max-w-3xl mx-auto text-slate-600">
              Discover insights from fellow readers and share your own
              contributions to this growing community of truth-seekers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CommunityFeature
                icon={Share2}
                title="Easy Sharing"
                description="Share inspiring passages on social media or copy direct links to your favorite sections to discuss with friends."
              />
              <CommunityFeature
                icon={Bookmark}
                title="Popular Passages"
                description="See which passages resonate most with other readers. Discover how many others found specific teachings meaningful and impactful."
              />
              <CommunityFeature
                comingSoon
                icon={MessageSquare}
                title="Public Notes"
                description="Share your insights on specific passages and engage in meaningful discussions with other readers about their interpretations."
              />
              <CommunityFeature
                comingSoon
                icon={Store}
                title="Community Marketplace"
                description="Discover books, art, and other creative works inspired by these teachings. Share your own derivative works with the community."
              />
            </div>
          </div>
        </section>

        {/* Enhanced CTA */}
        <section className="relative py-36 bg-indigo-900 text-white overflow-hidden">
          {/* Decorative transition to CTA */}
          <div className="absolute inset-0 h-32">
            <div className="absolute inset-0 overflow-hidden">
              {/* Sacred geometry patterns */}
              <div className="relative w-full h-full">
                {/* Flower of Life pattern */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 sacred-circle"
                    style={{
                      transform: `rotate(${i * 60}deg) translateX(30px)`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                ))}

                {/* Metatron's Cube elements */}
                <div className="absolute left-1/2 top-1/2 sacred-hexagon" />

                {/* Trinity symbols */}
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 trinity-symbol"
                    style={{
                      transform: `rotate(${i * 120}deg) translateY(-20px)`,
                      animationDelay: `${i * 1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Animated background patterns */}
          <div className="absolute inset-0">
            {/* Concentric circles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`circle-${i}`}
                className="absolute concentric-circles"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDuration: `${Math.random() * 30}s`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              >
                <span />
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-5xl md:text-7xl pb-2 font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200">
              Let&apos;s Learn Together
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-indigo-200">
              Join a vibrant community of curious minds exploring life&apos;s
              deepest mysteries. Share insights, connect ideas, and discover new
              perspectives as we piece together this fascinating cosmic puzzle.
            </p>
            <p className="text-lg mb-12 max-w-2xl mx-auto leading-relaxed text-indigo-300/80">
              Whether you&apos;re a first-time reader or a long-time student,
              there&apos;s always something new to discover when we learn
              together.
            </p>
            <div className="inline-block p-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-lg">
              <p className="text-indigo-200 px-4 sm:px-6 py-3 bg-indigo-900/50 backdrop-blur-sm rounded-lg text-sm sm:text-base whitespace-nowrap">
                Free access • Start your journey today
              </p>
            </div>
            <div className="mt-12">
              {status === "authenticated" && (
                <TiltButton href={deriveReadLink(status)}>
                  Continue Reading
                </TiltButton>
              )}
              {status === "unauthenticated" && (
                <TiltButton href="/auth/sign-in">Join the Community</TiltButton>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
