import { supabase } from '@/integrations/supabase/client';

export type ScrapedSiteData = {
  companyName: string;
  description: string;
  industry: string;
  language: string;
};

type FirecrawlMetadata = {
  title?: string;
  description?: string;
  language?: string | string[];
  ogLocale?: string | string[];
  ogTitle?: string;
  ogDescription?: string;
};

type FirecrawlScrapeResponse = {
  success: boolean;
  error?: string;
  markdown?: string;
  summary?: string;
  metadata?: FirecrawlMetadata;
  // Firecrawl v1 wraps everything under data
  data?: {
    markdown?: string;
    summary?: string;
    metadata?: FirecrawlMetadata;
  };
};

const INDUSTRY_LIST = [
  'Technology & Software',
  'E-commerce & Retail',
  'Food & Beverages',
  'Healthcare & Medical',
  'Finance & Banking',
  'Real Estate',
  'Education & Training',
  'Marketing & Advertising',
  'Consulting & Professional Services',
  'Manufacturing & Industrial',
  'Travel & Hospitality',
  'Media & Entertainment',
  'Non-Profit & NGO',
  'Legal Services',
  'Other',
];

function inferIndustry(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/software|saas|app|tech|ai|cloud|data|api|developer|startup/)) return 'Technology & Software';
  if (lower.match(/shop|store|retail|ecommerce|product|buy|order|cart/)) return 'E-commerce & Retail';
  if (lower.match(/food|restaurant|bakery|cafe|beverage|drink|eat|meal|cook/)) return 'Food & Beverages';
  if (lower.match(/health|medical|clinic|doctor|patient|pharma|hospital|wellness/)) return 'Healthcare & Medical';
  if (lower.match(/finance|bank|invest|insurance|loan|credit|payment|fintech/)) return 'Finance & Banking';
  if (lower.match(/real estate|property|realty|mortgage|rent|apartment|house/)) return 'Real Estate';
  if (lower.match(/education|school|university|course|learn|training|teach/)) return 'Education & Training';
  if (lower.match(/marketing|advertising|agency|campaign|seo|social media|brand/)) return 'Marketing & Advertising';
  if (lower.match(/consult|advisory|professional service|law|legal|attorney/)) return 'Consulting & Professional Services';
  if (lower.match(/manufactur|industrial|factory|supply chain|logistics|warehouse/)) return 'Manufacturing & Industrial';
  if (lower.match(/travel|hotel|hospitality|tourism|booking|airline|vacation/)) return 'Travel & Hospitality';
  if (lower.match(/media|entertainment|news|music|film|game|streaming|content/)) return 'Media & Entertainment';
  if (lower.match(/nonprofit|ngo|charity|foundation|volunteer|social impact/)) return 'Non-Profit & NGO';
  if (lower.match(/legal|law firm|attorney|lawyer|court/)) return 'Legal Services';
  return 'Other';
}

function inferLanguage(text: string, locale?: string): string {
  if (locale) {
    const lang = locale.toLowerCase();
    if (lang.startsWith('en')) return 'English (US)';
    if (lang.startsWith('ro')) return 'Romanian';
    if (lang.startsWith('fr')) return 'French';
    if (lang.startsWith('de')) return 'German';
    if (lang.startsWith('es')) return 'Spanish';
    if (lang.startsWith('it')) return 'Italian';
    if (lang.startsWith('pt')) return 'Portuguese';
    if (lang.startsWith('nl')) return 'Dutch';
    if (lang.startsWith('pl')) return 'Polish';
  }
  // Detect from common words in content
  const lower = text.toLowerCase();
  if (lower.match(/\b(si|sau|pentru|este|sunt|care|prin|despre|toate)\b/g)?.length ?? 0 > 3) return 'Romanian';
  if (lower.match(/\b(et|les|des|pour|une|avec|dans|sur|par)\b/g)?.length ?? 0 > 3) return 'French';
  if (lower.match(/\b(und|oder|der|die|das|für|mit|auf|von)\b/g)?.length ?? 0 > 3) return 'German';
  if (lower.match(/\b(und|oder|der|die|das|für|mit|auf|von)\b/g)?.length ?? 0 > 3) return 'German';
  if (lower.match(/\b(los|las|para|una|con|que|por|del|como)\b/g)?.length ?? 0 > 3) return 'Spanish';
  return 'English (US)';
}

function extractCompanyName(title: string, url: string): string {
  if (title) {
    // Remove common suffixes
    const cleaned = title
      .replace(/\s*[-|–—]\s*.+$/, '')
      .replace(/\s*(LLC|Inc|Ltd|GmbH|SRL|SA|AG)\s*$/i, '')
      .trim();
    if (cleaned.length > 0 && cleaned.length < 60) return cleaned;
  }
  // Fall back to domain name
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    const domain = hostname.replace(/^www\./, '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return '';
  }
}

export async function scrapeWebsite(url: string): Promise<ScrapedSiteData> {
  const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
    body: {
      url,
      options: {
        formats: ['markdown', 'summary'],
        onlyMainContent: true,
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to call scrape function');
  }

  const response = data as FirecrawlScrapeResponse;

  if (!response.success) {
    throw new Error(response.error || 'Scrape failed');
  }

  // Normalise nested data structure from Firecrawl v1
  const markdown = response.data?.markdown ?? response.markdown ?? '';
  const summary = response.data?.summary ?? response.summary ?? '';
  const metadata = response.data?.metadata ?? response.metadata ?? {};
  const title = (metadata.ogTitle ?? metadata.title ?? '') as string;

  // language/ogLocale can be string or string[] — always normalise to string
  const rawLang = metadata.ogLocale ?? metadata.language ?? '';
  const locale = Array.isArray(rawLang) ? (rawLang[0] ?? '') : rawLang;

  const contentText = summary || markdown.slice(0, 2000);

  const companyName = extractCompanyName(title, url);
  const description = summary
    ? summary.slice(0, 400)
    : ((metadata.ogDescription ?? metadata.description) as string | undefined ?? markdown.slice(0, 300));
  const industry = inferIndustry(contentText || title);
  const language = inferLanguage(contentText, locale);

  return { companyName, description, industry, language };
}

export { INDUSTRY_LIST };
