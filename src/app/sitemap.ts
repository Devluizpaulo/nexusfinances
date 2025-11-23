import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://xoplanilhas.app.br';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
        url: `${baseUrl}/dashboard`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
    },
    {
        url: `${baseUrl}/income`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    },
    {
        url: `${baseUrl}/expenses`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    },
     {
        url: `${baseUrl}/debts`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    },
     {
        url: `${baseUrl}/goals`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    },
  ]
}