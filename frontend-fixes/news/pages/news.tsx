import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Globe, Zap, RefreshCw, AlertCircle, ExternalLink, Filter } from 'lucide-react';

interface NewsItem {
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

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  currency?: string;
}

interface NewsStats {
  total_articles: number;
  high_impact: number;
  positive_sentiment: number;
  api_cost: string;
  last_updated: string;
  sources_count: number;
}

export const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadNewsAndMarkets();
    // Auto-refresh every 30 minutes
    const interval = setInterval(loadNewsAndMarkets, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (news.length > 0) {
      updateStats();
    }
  }, [news, selectedCategory, sentimentFilter, impactFilter]);
  
  const loadNewsAndMarkets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load news from cost-free aggregation
      const newsResponse = await fetch(`/api/news/aggregated?category=${selectedCategory}&limit=25`);
      if (!newsResponse.ok) throw new Error('Failed to fetch news');
      
      const newsData = await newsResponse.json();
      setNews(newsData.articles || mockNews);
      
      // Load basic market data (free sources)
      const marketResponse = await fetch('/api/markets/overview');
      const marketResult = await marketResponse.json();
      setMarketData(marketResult.data || mockMarketData);
      
    } catch (error) {
      console.error('Failed to load news:', error);
      setError('Fehler beim Laden der Nachrichten. Verwende lokale Daten.');
      setNews(mockNews);
      setMarketData(mockMarketData);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshNews = async () => {
    setRefreshing(true);
    await loadNewsAndMarkets();
    setRefreshing(false);
  };
  
  const updateStats = () => {
    const filtered = getFilteredNews();
    const stats: NewsStats = {
      total_articles: filtered.length,
      high_impact: filtered.filter(n => n.financial_score >= 7).length,
      positive_sentiment: filtered.filter(n => n.sentiment === 'positive').length,
      api_cost: '€0.00',
      last_updated: new Date().toLocaleTimeString('de-DE'),
      sources_count: [...new Set(filtered.map(n => n.source))].length
    };
    setStats(stats);
  };
  
  // Mock data for development
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'DAX erreicht neues Jahreshoch nach starken Quartalszahlen',
      summary: 'Der deutsche Leitindex steigt um 2,1% auf über 18.500 Punkte. Starke Ergebnisse von SAP und Siemens treiben den Markt an.',
      source: 'Handelsblatt',
      published: '2025-08-04T14:30:00Z',
      financial_score: 8,
      relevance_score: 9,
      sentiment: 'positive',
      url: 'https://handelsblatt.com/dax-jahreshoch',
      category: 'market',
      impact_level: 'high',
      language: 'de'
    },
    {
      id: '2',
      title: 'Bitcoin durchbricht 70.000 Dollar Marke nach ETF-Zuflüssen',
      summary: 'Institutionelle Investoren treiben Bitcoin-ETFs voran. Zuflüsse von über 1 Milliarde Dollar in dieser Woche.',
      source: 'CoinDesk',
      published: '2025-08-04T13:15:00Z',
      financial_score: 9,
      relevance_score: 8,
      sentiment: 'positive',
      url: 'https://coindesk.com/bitcoin-70k',
      category: 'crypto',
      impact_level: 'high',
      language: 'de'
    },
    {
      id: '3',
      title: 'EZB hält Zinssatz bei 4,25% - Inflation weiter rückläufig',
      summary: 'Europäische Zentralbank belässt Leitzins unverändert. Präsidentin Lagarde signalisiert mögliche Senkung im Herbst.',
      source: 'Reuters',
      published: '2025-08-04T12:00:00Z',
      financial_score: 7,
      relevance_score: 8,
      sentiment: 'neutral',
      url: 'https://reuters.com/ezb-zinsentscheidung',
      category: 'market',
      impact_level: 'medium',
      language: 'de'
    },
    {
      id: '4',
      title: 'Tesla erreicht Produktionsziel von 2 Millionen Fahrzeugen',
      summary: 'Elektroauto-Hersteller übertrifft Erwartungen mit starker Produktion in Shanghai und Berlin. Aktie steigt nachbörslich um 5%.',
      source: 'TechCrunch',
      published: '2025-08-04T11:30:00Z',
      financial_score: 6,
      relevance_score: 7,
      sentiment: 'positive',
      url: 'https://techcrunch.com/tesla-production',
      category: 'tech',
      impact_level: 'medium',
      language: 'de'
    },
    {
      id: '5',
      title: 'EUR/USD fällt unter 1,08 nach US-Arbeitsmarktdaten',
      summary: 'Dollar stärkt sich nach überraschend starken Jobdaten. Analysten erwarten weitere Fed-Zinserhöhungen.',
      source: 'ForexLive',
      published: '2025-08-04T10:45:00Z',
      financial_score: 5,
      relevance_score: 6,
      sentiment: 'negative',
      url: 'https://forexlive.com/eur-usd-fall',
      category: 'forex',
      impact_level: 'medium',
      language: 'de'
    }
  ];
  
  const mockMarketData: MarketData[] = [
    { symbol: 'DAX', price: 18567.34, change: 389.23, change_percent: 2.14, currency: 'EUR' },
    { symbol: 'BTC/EUR', price: 64234.50, change: 2456.78, change_percent: 3.98, currency: 'EUR' },
    { symbol: 'EUR/USD', price: 1.0789, change: -0.0067, change_percent: -0.62, currency: 'USD' },
    { symbol: 'Gold', price: 2387.65, change: 15.42, change_percent: 0.65, currency: 'USD' },
    { symbol: 'Öl (Brent)', price: 82.43, change: -1.23, change_percent: -1.47, currency: 'USD' },
    { symbol: 'S&P 500', price: 5234.18, change: 42.67, change_percent: 0.82, currency: 'USD' }
  ];
  
  const getFilteredNews = () => {
    return news.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const sentimentMatch = sentimentFilter === 'all' || item.sentiment === sentimentFilter;
      const impactMatch = impactFilter === 'all' || item.impact_level === impactFilter;
      
      return categoryMatch && sentimentMatch && impactMatch;
    });
  };
  
  const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => (
    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-2 line-clamp-2 leading-tight">
            {item.title}
          </h3>
          <p className="text-gray-300 text-sm mb-3 line-clamp-3 leading-relaxed">
            {item.summary}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
          {/* Financial Impact Score */}
          <div className={`px-2 py-1 rounded-full text-xs text-center font-medium ${
            item.financial_score >= 8 ? 'bg-red-600 text-white' :
            item.financial_score >= 6 ? 'bg-yellow-600 text-white' :
            item.financial_score >= 4 ? 'bg-blue-600 text-white' :
            'bg-gray-600 text-gray-300'
          }`}>
            Impact {item.financial_score}/10
          </div>
          
          {/* Impact Level */}
          <div className={`px-2 py-1 rounded-full text-xs text-center font-medium ${
            item.impact_level === 'high' ? 'bg-red-500 text-white' :
            item.impact_level === 'medium' ? 'bg-yellow-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {item.impact_level === 'high' ? 'Hoch' :
             item.impact_level === 'medium' ? 'Mittel' : 'Niedrig'}
          </div>
          
          {/* Sentiment */}
          <div className={`px-2 py-1 rounded-full text-xs text-center font-medium ${
            item.sentiment === 'positive' ? 'bg-green-600 text-white' :
            item.sentiment === 'negative' ? 'bg-red-600 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {item.sentiment === 'positive' ? '📈 Positiv' :
             item.sentiment === 'negative' ? '📉 Negativ' :
             '➡️ Neutral'}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            {item.source}
          </span>
          <span className="flex items-center gap-1">
            <span>🕒</span>
            {new Date(item.published).toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            item.category === 'crypto' ? 'bg-orange-900 text-orange-300' :
            item.category === 'forex' ? 'bg-green-900 text-green-300' :
            item.category === 'market' ? 'bg-blue-900 text-blue-300' :
            item.category === 'tech' ? 'bg-purple-900 text-purple-300' :
            item.category === 'german' ? 'bg-red-900 text-red-300' :
            'bg-gray-700 text-gray-300'
          }`}>
            {item.category === 'crypto' ? '₿ Crypto' :
             item.category === 'forex' ? '💱 Forex' :
             item.category === 'market' ? '📊 Markt' :
             item.category === 'tech' ? '💻 Tech' :
             item.category === 'german' ? '🇩🇪 DE' :
             'Allgemein'}
          </span>
        </div>
        
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-900/30 transition-colors"
        >
          <span>Lesen</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
  
  const MarketOverview: React.FC = () => (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Live Marktübersicht
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {marketData.map(item => (
          <div key={item.symbol} className="bg-gray-700 rounded-lg p-3 hover:bg-gray-650 transition-colors">
            <div className="text-white font-semibold text-sm mb-1">{item.symbol}</div>
            <div className="text-lg font-bold text-white mb-1">
              {item.symbol.includes('/') ? 
                item.price.toFixed(4) : 
                item.price.toLocaleString('de-DE', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })
              }
              {item.currency && (
                <span className="text-xs text-gray-400 ml-1">{item.currency}</span>
              )}
            </div>
            <div className={`text-sm flex items-center gap-1 ${
              item.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {item.change >= 0 ? 
                <TrendingUp className="w-3 h-3" /> : 
                <TrendingDown className="w-3 h-3" />
              }
              <span>
                {item.change >= 0 ? '+' : ''}{item.change_percent.toFixed(2)}%
              </span>
            </div>
            <div className={`text-xs ${item.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {item.change >= 0 ? '+' : ''}{
                item.symbol.includes('/') ? 
                  item.change.toFixed(4) : 
                  item.change.toFixed(2)
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const filteredNews = getFilteredNews();
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">News & Markets</h1>
          <p className="text-gray-400">
            Aktuelle Finanznachrichten und Marktdaten für Trading-Entscheidungen
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Zap className="w-4 h-4 text-green-500" />
            <span>Kostenfrei • RSS + Free APIs</span>
          </div>
          
          <button
            onClick={refreshNews}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Laden...' : 'Aktualisieren'}
          </button>
        </div>
      </div>
      
      {/* Market Overview */}
      <MarketOverview />
      
      {/* Error Display */}
      {error && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-yellow-300 font-medium">Hinweis</p>
            <p className="text-yellow-200 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-white font-medium">Filter:</span>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: '🌐 Alle', count: news.length },
              { key: 'market', label: '📊 Märkte', count: news.filter(n => n.category === 'market').length },
              { key: 'crypto', label: '₿ Crypto', count: news.filter(n => n.category === 'crypto').length },
              { key: 'forex', label: '💱 Forex', count: news.filter(n => n.category === 'forex').length },
              { key: 'tech', label: '💻 Tech', count: news.filter(n => n.category === 'tech').length },
              { key: 'german', label: '🇩🇪 Deutschland', count: news.filter(n => n.category === 'german').length }
            ].map(category => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                  selectedCategory === category.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Stimmungen</option>
            <option value="positive">📈 Positiv</option>
            <option value="neutral">➡️ Neutral</option>
            <option value="negative">📉 Negativ</option>
          </select>
          
          {/* Impact Filter */}
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Impact-Level</option>
            <option value="high">🔴 Hoch</option>
            <option value="medium">🟡 Mittel</option>
            <option value="low">🟢 Niedrig</option>
          </select>
        </div>
      </div>
      
      {/* News Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.total_articles}</div>
            <div className="text-gray-400 text-sm">Nachrichten</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-500">{stats.high_impact}</div>
            <div className="text-gray-400 text-sm">Hoher Impact</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-500">{stats.positive_sentiment}</div>
            <div className="text-gray-400 text-sm">Positive News</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.sources_count}</div>
            <div className="text-gray-400 text-sm">Quellen</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.api_cost}</div>
            <div className="text-gray-400 text-sm">API Kosten</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-lg font-bold text-purple-500">{stats.last_updated}</div>
            <div className="text-gray-400 text-sm">Letztes Update</div>
          </div>
        </div>
      )}
      
      {/* News Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Lade aktuelle Nachrichten...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Globe className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-400 mb-4">
              Keine Nachrichten in dieser Kategorie gefunden.
            </p>
            <button
              onClick={refreshNews}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Nachrichten aktualisieren
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews
              .sort((a, b) => {
                // Sort by financial score first, then by date
                if (a.financial_score !== b.financial_score) {
                  return b.financial_score - a.financial_score;
                }
                return new Date(b.published).getTime() - new Date(a.published).getTime();
              })
              .map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
          </div>
        )}
      </div>
      
      {/* Auto-refresh indicator */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <p>📡 Automatische Aktualisierung alle 30 Minuten</p>
          <p>⏰ Letzte Aktualisierung: {new Date().toLocaleTimeString('de-DE')}</p>
          <p>💰 Kosten: €0.00/Monat (RSS + Free APIs)</p>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <p>Quellen: RSS Feeds (Handelsblatt, Reuters, TechCrunch) + Google Search API (100 kostenlose Anfragen/Tag)</p>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;