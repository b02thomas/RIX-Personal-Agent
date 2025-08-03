// /src/app/api/intelligence/search/route.ts
// Intelligence search API endpoint for frontend integration
// Provides knowledge search in the format expected by the intelligence dashboard
// RELEVANT FILES: /src/app/api/knowledge/search/route.ts, /src/lib/vector-search.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { searchKnowledgeByVector, searchKnowledgeByText } from '@/lib/vector-search';

// GET - Search knowledge entries for intelligence dashboard
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
    const filters = searchParams.getAll('filter');
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    try {
      // Filter valid types
      const validTypes = ['routine', 'project', 'calendar', 'insight'];
      const types = filters.filter(f => validTypes.includes(f)) as ('routine' | 'project' | 'calendar' | 'insight')[];
      
      // Try vector search first, fallback to text search
      let results;
      try {
        results = await searchKnowledgeByVector(query, {
          userId: payload.userId,
          limit: 10,
          threshold: 0.3,
          types: types.length > 0 ? types : undefined
        });
      } catch (vectorError) {
        console.warn('Vector search failed, using text search:', vectorError);
        results = await searchKnowledgeByText(query, {
          userId: payload.userId,
          limit: 10,
          types: types.length > 0 ? types : undefined
        });
      }
      
      // Transform to frontend format expected by intelligence dashboard
      const knowledgeItems = results.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        type: result.type,
        relevance: result.similarity, // Use similarity as relevance for search results
        lastAccessed: result.last_accessed,
        tags: result.tags,
        source: result.source
      }));
      
      return NextResponse.json(knowledgeItems);
      
    } catch (searchError) {
      console.error('Intelligence search operation failed:', searchError);
      return NextResponse.json(
        { 
          error: 'Search operation failed',
          details: searchError instanceof Error ? searchError.message : 'Unknown search error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Intelligence search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}