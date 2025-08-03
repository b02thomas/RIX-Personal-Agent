// /src/app/api/knowledge/search/route.ts
// Vector-based semantic search API for knowledge entries
// Provides context-aware search using pgvector cosine similarity with fallback to text search
// RELEVANT FILES: /src/lib/vector-search.ts, /src/lib/auth.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { searchKnowledgeByVector, searchKnowledgeByText, updateKnowledgeAccess } from '@/lib/vector-search';

// GET - Search knowledge entries using vector similarity
export async function GET(request: NextRequest) {
  try {
    // Extract token from cookie or Authorization header
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    let payload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const threshold = parseFloat(searchParams.get('threshold') || '0.3');
    const useVector = searchParams.get('vector') !== 'false'; // Default to true
    
    // Parse filter types
    const filterParam = searchParams.get('filter');
    const filters = searchParams.getAll('filter');
    if (filterParam && !filters.includes(filterParam)) {
      filters.push(filterParam);
    }
    
    const validTypes = ['routine', 'project', 'calendar', 'insight'];
    const types = filters.filter(f => validTypes.includes(f)) as ('routine' | 'project' | 'calendar' | 'insight')[];
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    try {
      // Try vector search first, fallback to text search if it fails
      let results;
      let searchMethod = 'vector';
      
      if (useVector) {
        try {
          results = await searchKnowledgeByVector(query, {
            userId: payload.userId,
            limit,
            threshold,
            types: types.length > 0 ? types : undefined
          });
        } catch (vectorError) {
          console.warn('Vector search failed, falling back to text search:', vectorError);
          results = await searchKnowledgeByText(query, {
            userId: payload.userId,
            limit,
            types: types.length > 0 ? types : undefined
          });
          searchMethod = 'text_fallback';
        }
      } else {
        results = await searchKnowledgeByText(query, {
          userId: payload.userId,
          limit,
          types: types.length > 0 ? types : undefined
        });
        searchMethod = 'text';
      }
      
      // Update access timestamp for the most relevant results (top 3)
      const topResults = results.slice(0, 3);
      await Promise.all(
        topResults.map(result => 
          updateKnowledgeAccess(result.id, payload.userId).catch(console.error)
        )
      );
      
      return NextResponse.json({
        query,
        results,
        metadata: {
          searchMethod,
          resultCount: results.length,
          filters: {
            types,
            threshold: searchMethod === 'vector' ? threshold : undefined,
            limit
          },
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (searchError) {
      console.error('Search operation failed:', searchError);
      return NextResponse.json(
        { 
          error: 'Search operation failed',
          details: searchError instanceof Error ? searchError.message : 'Unknown search error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Advanced search with custom parameters and context
export async function POST(request: NextRequest) {
  try {
    // Extract token from cookie or Authorization header
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    let payload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestData = await request.json();
    
    // Validate required fields
    if (!requestData.query || requestData.query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Extract search parameters with defaults
    const {
      query,
      limit = 10,
      threshold = 0.3,
      types = [],
      useVector = true,
      includeMetadata = false,
      context = {}
    } = requestData;
    
    // Validate limit
    if (limit > 50) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 50' },
        { status: 400 }
      );
    }
    
    // Validate types
    const validTypes = ['routine', 'project', 'calendar', 'insight'];
    const filteredTypes = types.filter((type: string) => validTypes.includes(type));
    
    // Build enhanced query with context
    let enhancedQuery = query;
    if (context.currentTime) {
      enhancedQuery += ` (current context: ${context.currentTime})`;
    }
    if (context.activeProjects) {
      enhancedQuery += ` (projects: ${context.activeProjects.join(', ')})`;
    }
    if (context.recentActivities) {
      enhancedQuery += ` (recent: ${context.recentActivities.join(', ')})`;
    }

    try {
      // Perform search with enhanced query
      let results;
      let searchMethod = 'vector';
      
      if (useVector) {
        try {
          results = await searchKnowledgeByVector(enhancedQuery, {
            userId: payload.userId,
            limit,
            threshold,
            types: filteredTypes.length > 0 ? filteredTypes : undefined
          });
        } catch (vectorError) {
          console.warn('Vector search failed, falling back to text search:', vectorError);
          results = await searchKnowledgeByText(enhancedQuery, {
            userId: payload.userId,
            limit,
            types: filteredTypes.length > 0 ? filteredTypes : undefined
          });
          searchMethod = 'text_fallback';
        }
      } else {
        results = await searchKnowledgeByText(enhancedQuery, {
          userId: payload.userId,
          limit,
          types: filteredTypes.length > 0 ? filteredTypes : undefined
        });
        searchMethod = 'text';
      }
      
      // Update access timestamp for relevant results
      const accessUpdatePromises = results.slice(0, 5).map(result => 
        updateKnowledgeAccess(result.id, payload.userId).catch(console.error)
      );
      await Promise.all(accessUpdatePromises);
      
      // Filter metadata if not requested
      const filteredResults = includeMetadata ? results : results.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        type: result.type,
        relevance: result.relevance,
        similarity: result.similarity,
        lastAccessed: result.last_accessed,
        tags: result.tags,
        source: result.source
      }));
      
      return NextResponse.json({
        query: {
          original: query,
          enhanced: enhancedQuery,
          context
        },
        results: filteredResults,
        metadata: {
          searchMethod,
          resultCount: results.length,
          filters: {
            types: filteredTypes,
            threshold: searchMethod === 'vector' ? threshold : undefined,
            limit
          },
          performance: {
            queryEnhanced: enhancedQuery !== query,
            accessUpdated: Math.min(results.length, 5)
          },
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (searchError) {
      console.error('Advanced search operation failed:', searchError);
      return NextResponse.json(
        { 
          error: 'Advanced search operation failed',
          details: searchError instanceof Error ? searchError.message : 'Unknown search error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Advanced knowledge search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}