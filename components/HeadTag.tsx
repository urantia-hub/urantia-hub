import Head from "next/head";

const DEFAULT_META_DESCRIPTION =
  "Read and study the Urantia Papers online. Track your progress, keep bookmarks and notes, and search the full text.";

type HeadTagProps = {
  metaDescription?: string;
  titlePrefix?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown>;
};

const HeadTag = ({ metaDescription, titlePrefix, canonicalUrl, jsonLd }: HeadTagProps) => {
  const derivedTitle = titlePrefix ? `${titlePrefix} | UrantiaHub` : "UrantiaHub";
  const derivedUrl = canonicalUrl || "https://www.urantiahub.com";

  return (
    <Head>
      <title>
        {titlePrefix ? `${titlePrefix} | UrantiaHub` : "UrantiaHub"}
      </title>

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Favicon */}
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Web App Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Meta Tags */}
      <meta name="application-name" content="UrantiaHub" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="UrantiaHub" />
      <meta
        name="description"
        content={metaDescription || DEFAULT_META_DESCRIPTION}
      />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#e2e8f0" />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="theme-color" content="#e2e8f0" />

      {/* Social Media Meta Tags */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:url" content={derivedUrl} />
      <meta name="twitter:title" content={derivedTitle} />
      <meta
        name="twitter:description"
        content={metaDescription || DEFAULT_META_DESCRIPTION}
      />
      <meta
        name="twitter:image"
        content="https://www.urantiahub.com/sharing.png"
      />
      <meta name="twitter:creator" content="@urantiahub" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={derivedTitle} />
      <meta
        property="og:description"
        content={metaDescription || DEFAULT_META_DESCRIPTION}
      />
      <meta property="og:site_name" content="UrantiaHub" />
      <meta property="og:url" content={derivedUrl} />
      <meta
        property="og:image"
        content="https://www.urantiahub.com/sharing.png"
      />

      {/* Viewport Meta Tag */}
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
      />

      {/* JSON-LD: Default WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "UrantiaHub",
            "url": "https://www.urantiahub.com",
            "description": "Explore the Urantia Papers through a modern digital platform with study tools and collaborative features.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.urantiahub.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }),
        }}
      />

      {/* JSON-LD: Page-specific Schema */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      )}
    </Head>
  );
};

export default HeadTag;
