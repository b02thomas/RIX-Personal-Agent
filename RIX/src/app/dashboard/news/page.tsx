'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  AlertTriangle,
  Star,
  Clock,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import {
  mockNewsArticles,
  mockFinancialData,
  mockPersonalizedRecommendations,
  mockNewsCategories,
  mockTrendingTopics,
  NewsArticle,
  FinancialData,
  PersonalizedRecommendation
} from '@/lib/dummy-data/news';

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');

  const getSentimentIcon = (sentiment: NewsArticle['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: NewsArticle['sentiment']) => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800',
    };
    return colors[sentiment] || 'bg-gray-100 text-gray-800';
  };

  const getStockTrendColor = (trend: FinancialData['trend']) => {
    const colors = {
      up: 'text-green-600',
      down: 'text-red-600',
      stable: 'text-gray-600',
    };
    return colors[trend] || 'text-gray-600';
  };

  const getRecommendationPriorityColor = (priority: PersonalizedRecommendation['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const filteredArticles = mockNewsArticles.filter(article => {
    const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
    const sentimentMatch = selectedSentiment === 'all' || article.sentiment === selectedSentiment;
    return categoryMatch && sentimentMatch;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Gerade eben';
    if (diffInHours === 1) return 'Vor 1 Stunde';
    if (diffInHours < 24) return `Vor ${diffInHours} Stunden`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Vor 1 Tag';
    return `Vor ${diffInDays} Tagen`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">News Intelligence</h1>
          <p className="text-muted-foreground">
            Personalisierte Nachrichten und Marktanalysen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Suchen
          </Button>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        {mockFinancialData.map((stock) => (
          <Card key={stock.symbol}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stock.symbol}</CardTitle>
              <div className={`text-sm font-medium ${getStockTrendColor(stock.trend)}`}>
                {stock.change > 0 ? '+' : ''}{stock.changePercent}%
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stock.price}</div>
              <p className="text-xs text-muted-foreground">
                {stock.name}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* News Articles */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Top Nachrichten
              </CardTitle>
              <CardDescription>
                Personalisierte Nachrichten basierend auf Ihren Interessen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{article.title}</h4>
                        <Badge variant="outline" className={getSentimentColor(article.sentiment)}>
                          {article.sentiment}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {article.summary}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(article.publishedAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {article.readTime} Min. Lesezeit
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {article.relevance}% Relevanz
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {article.source}
                          </span>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Personalized Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Für Sie empfohlen
              </CardTitle>
              <CardDescription>
                Personalisierte Empfehlungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPersonalizedRecommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${recommendation.priority === 'high' ? 'bg-red-500' :
                        recommendation.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{recommendation.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {recommendation.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRecommendationPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {recommendation.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trendende Themen
              </CardTitle>
              <CardDescription>
                Aktuelle Diskussionen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTrendingTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{topic.topic}</span>
                    <Badge variant="outline" className={getSentimentColor(topic.sentiment as 'positive' | 'negative' | 'neutral')}>
                      {topic.sentiment}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {topic.mentions} Mentions
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* News Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Kategorien</CardTitle>
              <CardDescription>
                Nachrichten nach Kategorie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockNewsCategories.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCategory(category.name.toLowerCase())}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <Badge variant="outline" className={getSentimentColor(category.sentiment)}>
                      {category.sentiment}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {category.count} Artikel
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 