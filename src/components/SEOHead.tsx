import { Helmet, HelmetProvider } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
  canonical?: string;
  lang?: string;
  children?: React.ReactNode;
}

const DEFAULT_TITLE = "Vowz – Create Free Indian Wedding Invitations & Websites Online";
const DEFAULT_DESCRIPTION = "Design beautiful digital wedding invitations and personalized wedding websites for Indian weddings. Free to start. Easy WhatsApp sharing. Made for couples in India & abroad.";
const DEFAULT_OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bde9119f-2cda-415d-b811-ed72667bba8f/id-preview-ac2c9ed6--aa1d95d2-74a0-4055-a405-08cbdb8d38b0.lovable.app-1772842931475.png";

export const SEOHead = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogUrl,
  ogTitle,
  ogDescription,
  ogType = "website",
  twitterCard = "summary_large_image",
  twitterSite = "@vowzco",
  twitterCreator = "@vowzco",
  robots = "index, follow",
  canonical,
  lang = "en",
  children,
}: SEOHeadProps) => {
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedCanonical = canonical || (typeof window !== "undefined" ? window.location.href : "");
  const resolvedOgUrl = ogUrl || resolvedCanonical;

  return (
    <Helmet htmlAttributes={{ lang }}>
      {/* Basic Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      {resolvedOgUrl && <meta property="og:url" content={resolvedOgUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      <meta property="og:site_name" content="Vowz" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDescription} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Additional meta can be passed as children */}
      {children}
    </Helmet>
  );
};

export { HelmetProvider };
export default SEOHead;
