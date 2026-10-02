// Node modules.
import NextImage from "next/image";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

// Relative modules.
import Footer from "@/components/Footer";
import HeadTag from "@/components/HeadTag";
import HomepageNavbar from "@/components/HomepageNavbar";
import { track } from "@/libs/analytics";

// Import resource data
import { resourceCategories } from "../data/resources";

// Helper function to generate gradient based on resource name
const getGradientColors = (resourceName: string, index: number) => {
  // Color palettes organized by category
  const palettes = [
    // Official Organizations (blues)
    [
      "from-blue-500 to-indigo-600",
      "from-blue-600 to-indigo-700",
      "from-blue-700 to-indigo-800",
      "from-indigo-600 to-blue-500",
    ],

    // Center for Unity Projects (purples)
    [
      "from-purple-500 to-violet-600",
      "from-violet-500 to-purple-600",
      "from-purple-600 to-violet-700",
    ],

    // Online Communities (greens)
    [
      "from-emerald-500 to-green-600",
      "from-green-600 to-emerald-500",
      "from-emerald-600 to-teal-600",
    ],

    // Study Resources (oranges/ambers)
    [
      "from-amber-500 to-orange-600",
      "from-orange-600 to-amber-500",
      "from-amber-600 to-yellow-500",
      "from-yellow-500 to-amber-600",
    ],

    // International Resources (teals/cyans)
    [
      "from-cyan-500 to-teal-600",
      "from-teal-600 to-cyan-500",
      "from-cyan-600 to-sky-600",
    ],

    // Additional Resources (reds/roses)
    [
      "from-rose-500 to-red-600",
      "from-red-600 to-rose-500",
      "from-rose-600 to-pink-600",
      "from-pink-500 to-rose-600",
    ],
  ];

  // Get category index and resource index within category
  const categoryIndex = Math.min(Math.floor(index / 10), palettes.length - 1);
  const resourceIndexInCategory = index % palettes[categoryIndex].length;

  return palettes[categoryIndex][resourceIndexInCategory];
};

// Helper function to get screenshot path for a URL
const getScreenshotPath = (url: string): string => {
  const urlDomain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const filename = urlDomain.replace(/[\/\.\:]/g, "-") + ".png";
  return `/screenshots/${filename}`;
};

const CommunityResourcesPage = () => {
  // Track overall resource index across all categories
  let globalResourceIndex = 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-gray-600">
      <HeadTag
        titlePrefix="Community Resources"
        metaDescription="Discover a comprehensive collection of Urantia-related communities, organizations, and study resources from around the world."
      />

      <HomepageNavbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-hero-static-page relative py-36 bg-gradient-to-b from-blue-900 to-indigo-800 text-white">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Urantia Community Resources
            </h1>
            <p className="text-xl max-w-3xl mx-auto text-blue-100 leading-relaxed">
              Connect with fellow truth-seekers through these Urantia-related
              organizations, online communities, and study resources from around
              the world.
            </p>
          </div>
        </section>

        {/* Resources Grid Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            {resourceCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-16">
                <h2 className="text-3xl font-semibold mb-10 pb-2 text-gray-800 border-b border-gray-200">
                  {category.title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {category.resources.map((resource, resourceIndex) => {
                    const currentResourceIndex = globalResourceIndex++;
                    const gradientClass = getGradientColors(
                      resource.name,
                      currentResourceIndex
                    );
                    const screenshotPath = getScreenshotPath(resource.url);

                    return (
                      <a
                        key={resourceIndex}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          track("community_resource_clicked", {
                            resource_name: resource.name,
                            resource_host: new URL(resource.url).hostname,
                            category: category.title,
                          })
                        }
                        className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200"
                      >
                        <div className="relative h-48 overflow-hidden">
                          {/* Screenshot with fallback to gradient */}
                          <ResourcePreview
                            url={resource.url}
                            name={resource.name}
                            gradientClass={gradientClass}
                          />
                        </div>

                        <div className="flex flex-col flex-grow p-6">
                          <h3 className="text-xl font-semibold mb-2 text-gray-800 group-hover:text-blue-600 flex items-center">
                            {resource.name}
                            <ExternalLink className="w-4 h-4 ml-2 inline-block opacity-60" />
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {resource.description}
                          </p>

                          <div className="mt-auto pt-4 flex items-center text-sm text-blue-500">
                            <span className="truncate">
                              {resource.url
                                .replace(/^https?:\/\//, "")
                                .replace(/\/$/, "")}
                            </span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Resource Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-semibold mb-6 text-gray-800">
              Know of Another Resource?
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              If you know of a valuable Urantia-related resource that isn&apos;t
              listed here, we&apos;d love to hear about it.
            </p>
            <a
              href="mailto:openurantia@gmail.com?subject=New%20Urantia%20Resource%20Suggestion"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-300 no-underline"
            >
              Submit a Resource
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Component to handle screenshot display with fallback to gradient
const ResourcePreview = ({
  url,
  name,
  gradientClass,
}: {
  url: string;
  name: string;
  gradientClass: string;
}) => {
  const [imageExists, setImageExists] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const screenshotPath = getScreenshotPath(url);

  // Check if screenshot file exists
  useEffect(() => {
    const img = new Image();
    img.src = screenshotPath;
    img.onload = () => {
      setImageExists(true);
      setIsLoading(false);
    };
    img.onerror = () => {
      setImageExists(false);
      setIsLoading(false);
    };
  }, [screenshotPath]);

  if (isLoading) {
    // Show loading state (gradient with loading indicator)
    return (
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
      >
        <div className="animate-pulse w-8 h-8 rounded-full bg-white/30"></div>
      </div>
    );
  }

  if (imageExists) {
    // Show screenshot
    return (
      <div className="absolute inset-0">
        <NextImage
          src={screenshotPath}
          alt={`Screenshot of ${name}`}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
      </div>
    );
  }

  // Fallback to gradient if no screenshot
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
    >
      <span className="text-4xl font-bold text-white/90 drop-shadow-md">
        {name.substring(0, 1)}
      </span>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
    </div>
  );
};

export default CommunityResourcesPage;
