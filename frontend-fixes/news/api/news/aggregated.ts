import { NextApiRequest, NextApiResponse } from 'next';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  published: string;
  financial_score: number;
  relevance_score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
  category: 'market' | 'crypto' | 'forex' | 'general' | 'german' | 'tech';
  impact_level: 'high' | 'medium' | 'low';
  language: 'de' | 'en';
}

interface RSSFeed {
  url: string;
  source: string;
  category: string;
  language: 'de' | 'en';
}

// Cost-free RSS feeds
const RSS_FEEDS: RSSFeed[] = [
  {
    url: 'https://www.tagesschau.de/xml/rss2/',
    source: 'Tagesschau',
    category: 'german',
    language: 'de'
  },
  {
    url: 'https://www.handelsblatt.com/contentexport/feed/schlagzeilen',
    source: 'Handelsblatt',
    category: 'market',
    language: 'de'
  },
  {
    url: 'https://feeds.feedburner.com/TechCrunch',
    source: 'TechCrunch',
    category: 'tech',
    language: 'en'
  },
  {
    url: 'https://feeds.reuters.com/reuters/businessNews',
    source: 'Reuters',
    category: 'market',
    language: 'en'
  },
  {
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss',
    source: 'CoinDesk',
    category: 'crypto',
    language: 'en'
  }
];

// Financial keywords for scoring
const FINANCIAL_KEYWORDS = [
  // German
  'DAX', 'Bitcoin', 'Euro', 'Inflation', 'Zinssatz', 'Aktie', 'Börse', 
  'Kryptowährung', 'Quartal', 'Gewinn', 'Verlust', 'Umsatz', 'Bilanz',
  'Dividende', 'ETF', 'Fonds', 'Anleihe', 'Rohstoff', 'Gold', 'Öl',
  // English
  'stock', 'market', 'trading', 'investment', 'earnings', 'profit',
  'loss', 'revenue', 'dividend', 'cryptocurrency', 'forex', 'commodity'
];

// Mock implementation - in production this would fetch from actual RSS feeds
const fetchRSSFeed = async (feed: RSSFeed): Promise<NewsArticle[]> => {
  // Simulate RSS parsing with mock data
  const mockArticles: NewsArticle[] = [];
  
  if (feed.source === 'Handelsblatt') {
    mockArticles.push({
      id: `handelsblatt-${Date.now()}`,
      title: 'DAX erreicht neues Jahreshoch nach starken Quartalszahlen',
      summary: 'Der deutsche Leitindex steigt um 2,1% auf über 18.500 Punkte. Starke Ergebnisse von SAP und Siemens treiben den Markt an.',
      source: 'Handelsblatt',
      published: new Date().toISOString(),
      financial_score: 8,
      relevance_score: 9,
      sentiment: 'positive',
      url: 'https://handelsblatt.com/dax-jahreshoch',
      category: 'market',
      impact_level: 'high',
      language: 'de'
    });
  }
  
  if (feed.source === 'CoinDesk') {
    mockArticles.push({
      id: `coindesk-${Date.now()}`,
      title: 'Bitcoin durchbricht 70.000 Dollar Marke nach ETF-Zuflüssen',
      summary: 'Institutionelle Investoren treiben Bitcoin-ETFs voran. Zuflüsse von über 1 Milliarde Dollar in dieser Woche.',
      source: 'CoinDesk',
      published: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      financial_score: 9,
      relevance_score: 8,
      sentiment: 'positive',
      url: 'https://coindesk.com/bitcoin-70k',
      category: 'crypto',
      impact_level: 'high',
      language: 'de'
    });
  }
  
  if (feed.source === 'Reuters') {
    mockArticles.push({
      id: `reuters-${Date.now()}`,
      title: 'EZB hält Zinssatz bei 4,25% - Inflation weiter rückläufig',
      summary: 'Europäische Zentralbank belässt Leitzins unverändert. Präsidentin Lagarde signalisiert mögliche Senkung im Herbst.',
      source: 'Reuters',
      published: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      financial_score: 7,
      relevance_score: 8,
      sentiment: 'neutral',
      url: 'https://reuters.com/ezb-zinsentscheidung',
      category: 'market',
      impact_level: 'medium',
      language: 'de'
    });
  }
  
  if (feed.source === 'TechCrunch') {
    mockArticles.push({
      id: `techcrunch-${Date.now()}`,
      title: 'Tesla erreicht Produktionsziel von 2 Millionen Fahrzeugen',
      summary: 'Elektroauto-Hersteller übertrifft Erwartungen mit starker Produktion in Shanghai und Berlin. Aktie steigt nachbörslich um 5%.',
      source: 'TechCrunch',
      published: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      financial_score: 6,
      relevance_score: 7,
      sentiment: 'positive',
      url: 'https://techcrunch.com/tesla-production',
      category: 'tech',
      impact_level: 'medium',
      language: 'de'
    });
  }
  
  if (feed.source === 'Tagesschau') {
    mockArticles.push({
      id: `tagesschau-${Date.now()}`,
      title: 'Bundestag beschließt Steuerreform für Kleinunternehmer',
      summary: 'Entlastung für kleine und mittlere Unternehmen geplant. Steuerliche Vorteile sollen Gründungen fördern.',
      source: 'Tagesschau',
      published: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      financial_score: 4,
      relevance_score: 6,
      sentiment: 'positive',
      url: 'https://tagesschau.de/steuerreform',
      category: 'german',
      impact_level: 'medium',
      language: 'de'
    });
  }
  
  return mockArticles;
};

const calculateFinancialScore = (title: string, summary: string): number => {
  const text = (title + ' ' + summary).toLowerCase();
  let score = 0;
  
  // Keyword-based scoring
  for (const keyword of FINANCIAL_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      score += 1;
    }
  }
  
  // Pattern-based scoring
  const patterns = [
    /\d+[%]\s*(?:steigen|fallen|gestiegen|gefallen|up|down)/i,
    /(?:steigt|fällt|sinkt|rises|falls)\s+(?:um\s+)?\d+/i,
    /(?:milliarden?|millionen?|billion|million)\s+(?:euro|dollar)/i,
    /quartal\s*(?:ergebnis|zahlen|results|earnings)/i,
    /(?:profit|gewinn|verlust|loss).*\d+/i,
    /(?:aktie|stock|share).*(?:steigt|fällt|rises|falls)/i
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      score += 2;
    }
  }
  
  // Cap score at 10
  return Math.min(score, 10);
};

const calculateSentiment = (title: string, summary: string): 'positive' | 'negative' | 'neutral' => {
  const text = (title + ' ' + summary).toLowerCase();
  
  const positiveWords = [
    'steigt', 'gewinn', 'profit', 'erfolg', 'übertrifft', 'stark', 'hoch',
    'positiv', 'gut', 'besser', 'wachstum', 'erhöht', 'verbessert',
    'rises', 'gains', 'profit', 'success', 'beats', 'strong', 'high',
    'positive', 'good', 'better', 'growth', 'increased', 'improved'
  ];
  
  const negativeWords = [
    'fällt', 'verlust', 'krise', 'rückgang', 'schwach', 'niedrig',
    'negativ', 'schlecht', 'schlechter', 'sinkt', 'reduziert',
    'falls', 'loss', 'crisis', 'decline', 'weak', 'low',
    'negative', 'bad', 'worse', 'drops', 'reduced'
  ];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  for (const word of positiveWords) {
    if (text.includes(word)) positiveScore++;
  }
  
  for (const word of negativeWords) {
    if (text.includes(word)) negativeScore++;
  }
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
};

const determineImpactLevel = (financialScore: number): 'high' | 'medium' | 'low' => {
  if (financialScore >= 7) return 'high';
  if (financialScore >= 4) return 'medium';
  return 'low';
};

const deduplicateArticles = (articles: NewsArticle[]): NewsArticle[] => {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];
  
  for (const article of articles) {
    // Use first 50 characters of title as deduplication key
    const key = article.title.substring(0, 50).toLowerCase().trim();
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(article);
    }
  }
  
  return unique;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { category = 'all', limit = '20', language = 'de' } = req.query;
    const maxArticles = parseInt(limit as string, 10);
    
    console.log(`📰 News aggregation requested: category=${category}, limit=${maxArticles}`);
    
    // Aggregate from all RSS feeds
    const allArticles: NewsArticle[] = [];
    
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`🔄 Fetching from ${feed.source}...`);
        const articles = await fetchRSSFeed(feed);
        
        // Enhance articles with calculated scores
        const enhancedArticles = articles.map(article => ({
          ...article,
          financial_score: calculateFinancialScore(article.title, article.summary),
          sentiment: calculateSentiment(article.title, article.summary),
          impact_level: determineImpactLevel(article.financial_score),
          relevance_score: article.financial_score + (article.language === language ? 2 : 0)
        }));
        
        allArticles.push(...enhancedArticles);
        console.log(`✅ ${feed.source}: ${articles.length} articles`);
      } catch (error) {
        console.error(`❌ Error fetching ${feed.source}:`, error);
        // Continue with other sources
      }
    }
    
    // Deduplicate articles
    const uniqueArticles = deduplicateArticles(allArticles);
    console.log(`🧹 Deduplicated: ${allArticles.length} → ${uniqueArticles.length} articles`);
    
    // Filter by category if specified
    let filteredArticles = uniqueArticles;
    if (category !== 'all') {
      filteredArticles = uniqueArticles.filter(article => article.category === category);
    }
    
    // Sort by relevance score (financial impact + language preference)
    filteredArticles.sort((a, b) => b.relevance_score - a.relevance_score);
    
    // Limit results
    const finalArticles = filteredArticles.slice(0, maxArticles);
    
    console.log(`📊 Final results: ${finalArticles.length} articles`);
    
    // Calculate statistics
    const stats = {
      total_processed: allArticles.length,
      total_unique: uniqueArticles.length,
      total_returned: finalArticles.length,
      high_impact: finalArticles.filter(a => a.impact_level === 'high').length,
      positive_sentiment: finalArticles.filter(a => a.sentiment === 'positive').length,
      sources: [...new Set(finalArticles.map(a => a.source))],
      api_cost: '€0.00', // RSS feeds are free
      processing_time: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      articles: finalArticles,
      stats,
      cost: '€0.00',
      sources: ['RSS Feeds (Kostenfrei)', 'Handelsblatt', 'Reuters', 'TechCrunch', 'CoinDesk', 'Tagesschau'],
      last_updated: new Date().toISOString(),
      message: `${finalArticles.length} Nachrichten erfolgreich aggregiert (Kosten: €0.00)`
    });
    
  } catch (error) {
    console.error('❌ News aggregation error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to aggregate news',
      articles: [],
      cost: '€0.00',
      message: 'Fehler beim Aggregieren der Nachrichten. Bitte versuchen Sie es später erneut.',
      last_updated: new Date().toISOString()
    });
  }
}