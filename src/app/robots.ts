import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://keralasuperstore.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/downloads/'],
      },
      // Allow ChatGPT / OpenAI search and browse crawlers
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/downloads/'],
      },
      // Allow Perplexity AI search crawler
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/downloads/'],
      },
      // Allow Anthropic Claude crawlers
      {
        userAgent: ['Claude-Web', 'anthropic-ai'],
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/downloads/'],
      },
      // Allow Google Search & Gemini Extended
      {
        userAgent: ['Googlebot', 'Google-Extended'],
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/downloads/'],
      },
      // Allow Applebot (Siri & Spotlight Search)
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/downloads/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
