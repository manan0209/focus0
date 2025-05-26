// Basic SEO Structured Data Component
export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Focus0 - YouTube Study Tool",
    "description": "Transform YouTube into a laser-focused study tool with distraction-free video experience and Pomodoro timer.",
    "url": "https://focusmnn.vercel.app",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
