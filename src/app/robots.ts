import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://keralasuperstore.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
      // Allow ChatGPT / OpenAI search and browse crawlers
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
      // Allow Perplexity AI search crawler
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
      // Allow Anthropic Claude crawlers
      {
        userAgent: ['Claude-Web', 'anthropic-ai'],
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
      // Allow Google Search & Gemini Extended
      {
        userAgent: ['Googlebot', 'Google-Extended'],
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
      // Allow Applebot (Siri & Spotlight Search)
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/admin/', '/api/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
