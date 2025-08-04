# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/api/endpoints/knowledge.py
# Knowledge management & semantic search APIs for Knowledge Intelligence Hub
# Direct API endpoints with future MCP compatibility
# RELEVANT FILES: services/core_apis.py, models/schemas.py, core/database.py

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
import uuid
import logging

from app.models.schemas import (
    # Knowledge models
    KnowledgeEntry, KnowledgeEntryCreate, KnowledgeEntryUpdate,
    KnowledgeSearchRequest, KnowledgeSearchResult,
    # Response models
    APIResponse, PaginatedResponse, PaginationParams
)
from app.services.core_apis import core_api_service
from app.middleware.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== KNOWLEDGE ENTRY ENDPOINTS ====================

@router.post("/entries", response_model=KnowledgeEntry)
async def create_knowledge_entry(
    entry_data: KnowledgeEntryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new knowledge entry for Knowledge Intelligence Hub"""
    try:
        entry = await core_api_service.create_knowledge_entry(
            user_id=current_user["user_id"],
            entry_data=entry_data
        )
        return entry
    except Exception as e:
        logger.error(f"Error creating knowledge entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entries", response_model=PaginatedResponse)
async def get_knowledge_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    entry_type: Optional[str] = Query(None),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    order_by: Optional[str] = Query("created_at DESC"),
    current_user: dict = Depends(get_current_user)
):
    """Get paginated knowledge entries with filters"""
    try:
        # Build query with filters
        where_conditions = ["user_id = $1"]
        params = [uuid.UUID(current_user["user_id"])]
        param_count = 2
        
        if category:
            where_conditions.append(f"category = ${param_count}")
            params.append(category)
            param_count += 1
            
        if entry_type:
            where_conditions.append(f"entry_type = ${param_count}")
            params.append(entry_type)
            param_count += 1
            
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            where_conditions.append(f"tags && ${param_count}")
            params.append(tag_list)
            param_count += 1
        
        where_clause = " AND ".join(where_conditions)
        base_query = f"SELECT * FROM knowledge_entries WHERE {where_clause}"
        count_query = f"SELECT COUNT(*) FROM knowledge_entries WHERE {where_clause}"
        
        result = await core_api_service.database.fetch_with_pagination(
            base_query=base_query,
            count_query=count_query,
            params=tuple(params),
            page=page,
            page_size=page_size,
            order_by=order_by
        )
        
        # Convert items to KnowledgeEntry models
        result['items'] = [KnowledgeEntry(**item) for item in result['items']]
        
        return PaginatedResponse(**result)
    except Exception as e:
        logger.error(f"Error fetching knowledge entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entries/{entry_id}", response_model=KnowledgeEntry)
async def get_knowledge_entry(
    entry_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Get specific knowledge entry by ID"""
    try:
        entry = await core_api_service.database.execute(
            "SELECT * FROM knowledge_entries WHERE id = $1 AND user_id = $2",
            uuid.UUID(entry_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not entry:
            raise HTTPException(status_code=404, detail="Knowledge entry not found")
            
        return KnowledgeEntry(**entry)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID format")
    except Exception as e:
        logger.error(f"Error fetching knowledge entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/entries/{entry_id}", response_model=KnowledgeEntry)
async def update_knowledge_entry(
    entry_id: str = Path(...),
    update_data: KnowledgeEntryUpdate = ...,
    current_user: dict = Depends(get_current_user)
):
    """Update knowledge entry"""
    try:
        import json
        
        # Build dynamic UPDATE query
        updates = []
        params = []
        param_count = 1
        
        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                if field == 'metadata':
                    updates.append(f"{field} = ${param_count}")
                    params.append(json.dumps(value))
                elif field == 'related_entries':
                    # Convert UUID list to strings for database
                    updates.append(f"{field} = ${param_count}")
                    params.append([str(uuid_val) for uuid_val in value])
                else:
                    updates.append(f"{field} = ${param_count}")
                    params.append(value)
                param_count += 1
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add timestamp and conditions
        updates.append(f"updated_at = NOW()")
        params.extend([uuid.UUID(current_user["user_id"]), uuid.UUID(entry_id)])
        
        query = f"""
            UPDATE knowledge_entries 
            SET {', '.join(updates)}
            WHERE user_id = ${param_count} AND id = ${param_count + 1}
            RETURNING *
        """
        
        result = await core_api_service.database.execute(
            query, *params, fetch_one=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Knowledge entry not found")
            
        return KnowledgeEntry(**result)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID format")
    except Exception as e:
        logger.error(f"Error updating knowledge entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/entries/{entry_id}", response_model=APIResponse)
async def delete_knowledge_entry(
    entry_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Delete knowledge entry"""
    try:
        result = await core_api_service.database.execute(
            "DELETE FROM knowledge_entries WHERE user_id = $1 AND id = $2",
            uuid.UUID(current_user["user_id"]), uuid.UUID(entry_id)
        )
        
        if "DELETE 0" in str(result):
            raise HTTPException(status_code=404, detail="Knowledge entry not found")
            
        return APIResponse(
            success=True,
            message="Knowledge entry deleted successfully"
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID format")
    except Exception as e:
        logger.error(f"Error deleting knowledge entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SEARCH ENDPOINTS ====================

@router.post("/search")
async def search_knowledge_entries(
    search_request: KnowledgeSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """Search knowledge entries (text-based for now, vector search with future Sub-Agent)"""
    try:
        results = await core_api_service.search_knowledge_entries(
            user_id=current_user["user_id"],
            search_request=search_request
        )
        
        return {
            "query": search_request.query,
            "total_results": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Error searching knowledge entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_knowledge_entries_get(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = Query(None),
    entry_type: Optional[str] = Query(None),
    similarity_threshold: float = Query(0.7, ge=0.0, le=1.0),
    current_user: dict = Depends(get_current_user)
):
    """Search knowledge entries via GET (for easy URL sharing)"""
    try:
        search_request = KnowledgeSearchRequest(
            query=q,
            limit=limit,
            category=category,
            entry_type=entry_type,
            similarity_threshold=similarity_threshold
        )
        
        results = await core_api_service.search_knowledge_entries(
            user_id=current_user["user_id"],
            search_request=search_request
        )
        
        return {
            "query": q,
            "total_results": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Error searching knowledge entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== KNOWLEDGE ANALYTICS ====================

@router.get("/analytics/summary")
async def get_knowledge_analytics_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get knowledge base analytics summary"""
    try:
        # Get knowledge statistics
        stats = await core_api_service.database.execute(
            """
            SELECT 
                COUNT(*) as total_entries,
                COUNT(DISTINCT category) as categories_count,
                COUNT(DISTINCT entry_type) as entry_types_count,
                AVG(importance_score) as avg_importance,
                AVG(confidence_score) as avg_confidence,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_entries,
                COUNT(*) FILTER (WHERE source_url IS NOT NULL) as entries_with_sources
            FROM knowledge_entries 
            WHERE user_id = $1
            """,
            uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        # Get category breakdown
        category_breakdown = await core_api_service.database.execute(
            """
            SELECT 
                COALESCE(category, 'Uncategorized') as category,
                COUNT(*) as count,
                AVG(importance_score) as avg_importance
            FROM knowledge_entries 
            WHERE user_id = $1
            GROUP BY category
            ORDER BY count DESC
            LIMIT 10
            """,
            uuid.UUID(current_user["user_id"]),
            fetch=True
        )
        
        # Get entry type breakdown
        type_breakdown = await core_api_service.database.execute(
            """
            SELECT 
                entry_type,
                COUNT(*) as count,
                AVG(confidence_score) as avg_confidence
            FROM knowledge_entries 
            WHERE user_id = $1
            GROUP BY entry_type
            ORDER BY count DESC
            """,
            uuid.UUID(current_user["user_id"]),
            fetch=True
        )
        
        # Get most used tags
        popular_tags = await core_api_service.database.execute(
            """
            SELECT 
                unnest(tags) as tag,
                COUNT(*) as usage_count
            FROM knowledge_entries 
            WHERE user_id = $1 AND tags IS NOT NULL
            GROUP BY tag
            ORDER BY usage_count DESC
            LIMIT 10
            """,
            uuid.UUID(current_user["user_id"]),
            fetch=True
        )
        
        return {
            "summary": {
                "total_entries": stats['total_entries'],
                "categories_count": stats['categories_count'],
                "entry_types_count": stats['entry_types_count'],
                "avg_importance_score": float(stats['avg_importance']) if stats['avg_importance'] else 0,
                "avg_confidence_score": float(stats['avg_confidence']) if stats['avg_confidence'] else 0,
                "recent_entries_30d": stats['recent_entries'],
                "entries_with_sources": stats['entries_with_sources']
            },
            "category_breakdown": [
                {
                    "category": cat['category'],
                    "count": cat['count'],
                    "avg_importance": float(cat['avg_importance']) if cat['avg_importance'] else 0
                }
                for cat in category_breakdown
            ],
            "type_breakdown": [
                {
                    "entry_type": type_entry['entry_type'],
                    "count": type_entry['count'],
                    "avg_confidence": float(type_entry['avg_confidence']) if type_entry['avg_confidence'] else 0
                }
                for type_entry in type_breakdown
            ],
            "popular_tags": [
                {
                    "tag": tag['tag'],
                    "usage_count": tag['usage_count']
                }
                for tag in popular_tags
            ]
        }
    except Exception as e:
        logger.error(f"Error generating knowledge analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_knowledge_categories(
    current_user: dict = Depends(get_current_user)
):
    """Get all knowledge categories with counts"""
    try:
        categories = await core_api_service.database.execute(
            """
            SELECT 
                COALESCE(category, 'Uncategorized') as category,
                COUNT(*) as entry_count,
                AVG(importance_score) as avg_importance,
                MAX(created_at) as last_updated
            FROM knowledge_entries 
            WHERE user_id = $1
            GROUP BY category
            ORDER BY entry_count DESC
            """,
            uuid.UUID(current_user["user_id"]),
            fetch=True
        )
        
        return {
            "total_categories": len(categories),
            "categories": [
                {
                    "name": cat['category'],
                    "entry_count": cat['entry_count'],
                    "avg_importance": float(cat['avg_importance']) if cat['avg_importance'] else 0,
                    "last_updated": cat['last_updated'].isoformat() if cat['last_updated'] else None
                }
                for cat in categories
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching knowledge categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tags")
async def get_knowledge_tags(
    min_usage: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """Get all knowledge tags with usage counts"""
    try:
        tags = await core_api_service.database.execute(
            """
            SELECT 
                unnest(tags) as tag,
                COUNT(*) as usage_count,
                AVG(importance_score) as avg_importance
            FROM knowledge_entries 
            WHERE user_id = $1 AND tags IS NOT NULL
            GROUP BY tag
            HAVING COUNT(*) >= $2
            ORDER BY usage_count DESC
            """,
            uuid.UUID(current_user["user_id"]), min_usage,
            fetch=True
        )
        
        return {
            "total_tags": len(tags),
            "tags": [
                {
                    "name": tag['tag'],
                    "usage_count": tag['usage_count'],
                    "avg_importance": float(tag['avg_importance']) if tag['avg_importance'] else 0
                }
                for tag in tags
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching knowledge tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== KNOWLEDGE RELATIONSHIPS ====================

@router.get("/entries/{entry_id}/related")
async def get_related_entries(
    entry_id: str = Path(...),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get related knowledge entries"""
    try:
        # First, get the entry to check ownership
        entry = await core_api_service.database.execute(
            "SELECT * FROM knowledge_entries WHERE id = $1 AND user_id = $2",
            uuid.UUID(entry_id), uuid.UUID(current_user["user_id"]),
            fetch_one=True
        )
        
        if not entry:
            raise HTTPException(status_code=404, detail="Knowledge entry not found")
        
        # Get explicitly related entries
        explicit_related = []
        if entry.get('related_entries'):
            related_ids = [uuid.UUID(rid) for rid in entry['related_entries'] if rid]
            if related_ids:
                explicit_related = await core_api_service.database.execute(
                    """
                    SELECT * FROM knowledge_entries 
                    WHERE user_id = $1 AND id = ANY($2)
                    ORDER BY importance_score DESC
                    """,
                    uuid.UUID(current_user["user_id"]), related_ids,
                    fetch=True
                )
        
        # Get entries with similar tags (implicit relationships)
        similar_by_tags = []
        if entry.get('tags'):
            similar_by_tags = await core_api_service.database.execute(
                """
                SELECT *, 
                       array_length(array(SELECT unnest(tags) INTERSECT SELECT unnest($3)), 1) as tag_overlap
                FROM knowledge_entries 
                WHERE user_id = $1 AND id != $2 AND tags && $3
                ORDER BY tag_overlap DESC, importance_score DESC
                LIMIT $4
                """,
                uuid.UUID(current_user["user_id"]), uuid.UUID(entry_id), 
                entry['tags'], limit,
                fetch=True
            )
        
        # Get entries in same category
        similar_by_category = []
        if entry.get('category'):
            similar_by_category = await core_api_service.database.execute(
                """
                SELECT * FROM knowledge_entries 
                WHERE user_id = $1 AND id != $2 AND category = $3
                ORDER BY importance_score DESC
                LIMIT $4
                """,
                uuid.UUID(current_user["user_id"]), uuid.UUID(entry_id),
                entry['category'], min(5, limit),
                fetch=True
            )
        
        # Combine and deduplicate results
        all_related = {}
        
        # Add explicit relationships (highest priority)
        for rel in explicit_related:
            all_related[str(rel['id'])] = {
                **dict(rel),
                "relationship_type": "explicit",
                "relationship_strength": 1.0
            }
        
        # Add tag-based relationships
        for rel in similar_by_tags:
            if str(rel['id']) not in all_related:
                tag_overlap = rel.get('tag_overlap', 0)
                total_tags = len(entry.get('tags', []))
                strength = tag_overlap / total_tags if total_tags > 0 else 0
                all_related[str(rel['id'])] = {
                    **dict(rel),
                    "relationship_type": "similar_tags",
                    "relationship_strength": strength
                }
        
        # Add category-based relationships
        for rel in similar_by_category:
            if str(rel['id']) not in all_related:
                all_related[str(rel['id'])] = {
                    **dict(rel),
                    "relationship_type": "same_category",
                    "relationship_strength": 0.5
                }
        
        # Sort by relationship strength and limit
        sorted_related = sorted(
            all_related.values(), 
            key=lambda x: x['relationship_strength'], 
            reverse=True
        )[:limit]
        
        return {
            "entry_id": entry_id,
            "total_related": len(sorted_related),
            "related_entries": [
                {
                    "id": str(rel['id']),
                    "title": rel['title'],
                    "entry_type": rel['entry_type'],
                    "category": rel.get('category'),
                    "importance_score": rel.get('importance_score', 0),
                    "relationship_type": rel['relationship_type'],
                    "relationship_strength": rel['relationship_strength'],
                    "tags": rel.get('tags', [])
                }
                for rel in sorted_related
            ]
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID format")
    except Exception as e:
        logger.error(f"Error fetching related entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/entries/{entry_id}/link/{related_entry_id}", response_model=APIResponse)
async def link_knowledge_entries(
    entry_id: str = Path(...),
    related_entry_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Create explicit link between two knowledge entries"""
    try:
        # Verify both entries exist and belong to user
        entries = await core_api_service.database.execute(
            "SELECT id FROM knowledge_entries WHERE user_id = $1 AND id IN ($2, $3)",
            uuid.UUID(current_user["user_id"]), uuid.UUID(entry_id), uuid.UUID(related_entry_id),
            fetch=True
        )
        
        if len(entries) != 2:
            raise HTTPException(status_code=404, detail="One or both entries not found")
        
        # Add bidirectional relationship
        await core_api_service.database.execute_transaction([
            (
                """
                UPDATE knowledge_entries 
                SET related_entries = array_append(
                    COALESCE(related_entries, '{}'), $1::text
                ),
                updated_at = NOW()
                WHERE id = $2 AND user_id = $3
                AND NOT ($1::text = ANY(COALESCE(related_entries, '{}')))
                """,
                (related_entry_id, uuid.UUID(entry_id), uuid.UUID(current_user["user_id"]))
            ),
            (
                """
                UPDATE knowledge_entries 
                SET related_entries = array_append(
                    COALESCE(related_entries, '{}'), $1::text
                ),
                updated_at = NOW()
                WHERE id = $2 AND user_id = $3
                AND NOT ($1::text = ANY(COALESCE(related_entries, '{}')))
                """,
                (entry_id, uuid.UUID(related_entry_id), uuid.UUID(current_user["user_id"]))
            )
        ])
        
        return APIResponse(
            success=True,
            message="Knowledge entries linked successfully"
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID format")
    except Exception as e:
        logger.error(f"Error linking knowledge entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/entries/{entry_id}/link/{related_entry_id}", response_model=APIResponse)
async def unlink_knowledge_entries(
    entry_id: str = Path(...),
    related_entry_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """Remove explicit link between two knowledge entries"""
    try:
        # Remove bidirectional relationship
        await core_api_service.database.execute_transaction([
            (
                """
                UPDATE knowledge_entries 
                SET related_entries = array_remove(related_entries, $1),
                    updated_at = NOW()
                WHERE id = $2 AND user_id = $3
                """,
                (related_entry_id, uuid.UUID(entry_id), uuid.UUID(current_user["user_id"]))
            ),
            (
                """
                UPDATE knowledge_entries 
                SET related_entries = array_remove(related_entries, $1),
                    updated_at = NOW()
                WHERE id = $2 AND user_id = $3
                """,
                (entry_id, uuid.UUID(related_entry_id), uuid.UUID(current_user["user_id"]))
            )
        ])
        
        return APIResponse(
            success=True,
            message="Knowledge entries unlinked successfully"
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entry ID format")
    except Exception as e:
        logger.error(f"Error unlinking knowledge entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))