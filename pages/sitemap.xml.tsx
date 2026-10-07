import { getValidPaperUrls } from "@/utils/paperFormatters";

const Sitemap = () => {
  // This page will not be rendered directly, so return null
  return null;
};

export const getServerSideProps = async ({ res }: any) => {
  const baseUrl = process.env.NEXT_PUBLIC_HOST || "https://www.urantiahub.com";

  const staticPages = [
    { url: `${baseUrl}/`, priority: "1.0" },
    { url: `${baseUrl}/changelog`, priority: "1.0" },
    { url: `${baseUrl}/blockchain-archive`, priority: "1.0" },
    { url: `${baseUrl}/community-resources`, priority: "1.0" },
    { url: `${baseUrl}/explore`, priority: "1.0" },
    { url: `${baseUrl}/explore/parallels`, priority: "1.0" },
    { url: `${baseUrl}/papers`, priority: "1.0" },
    { url: `${baseUrl}/search`, priority: "1.0" },
    {
      url: `${baseUrl}/blockchain-archive/urantia-papers/json`,
      priority: "1.0",
    },
    {
      url: `${baseUrl}/blockchain-archive/urantia-papers/txt`,
      priority: "1.0",
    },
    { url: `${baseUrl}/auth/sign-in`, priority: "0.1" },
    { url: `${baseUrl}/auth/error`, priority: "0.1" },
    { url: `${baseUrl}/auth/sign-out`, priority: "0.1" },
    { url: `${baseUrl}/auth/verify-request`, priority: "0.1" },
    { url: `${baseUrl}/privacy-policy`, priority: "0.1" },
    { url: `${baseUrl}/terms-of-service`, priority: "0.1" },
    { url: `${baseUrl}/cookie-policy`, priority: "0.1" },
  ];

  // Add all paper URLs.
  const validPaperUrls = getValidPaperUrls();
  const papers = validPaperUrls.map((url) => ({
    url: `${baseUrl}/papers/${url}`,
    priority: "1.0",
  }));

  // Combine all URLs and sort by priority.
  const urls = [...staticPages, ...papers].sort((a, b) =>
    parseFloat(a.priority) > parseFloat(b.priority) ? -1 : 1
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `<url>
        <loc>${url.url}</loc>
        <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
        <priority>${url.priority}</priority>
      </url>`
    )
    .join("")}
  </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default Sitemap;
