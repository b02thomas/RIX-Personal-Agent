# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/intelligence/routine_coach.py
# Routine coaching logic & streak analysis for Routine Intelligence Hub
# Pattern-based coaching insights without LLM integration (prepared for future Sub-Agent)
# RELEVANT FILES: core/database.py, models/schemas.py, api/endpoints/routines.py

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date, timedelta
import statistics
import uuid

from app.core.database import database
from app.models.schemas import (
    RoutineCoachingResponse, IntelligenceResponse
)

logger = logging.getLogger(__name__)


class RoutineCoachingService:
    """
    Routine coaching service providing pattern-based analysis and insights
    Calculates streaks, identifies success patterns, and generates coaching messages
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def get_coaching_insights(self, user_id: str, routine_id: str, 
                                   recent_completion: Optional[Dict[str, Any]] = None) -> RoutineCoachingResponse:
        """
        Generate comprehensive coaching insights for a routine
        
        Args:
            user_id: User identifier
            routine_id: Routine identifier  
            recent_completion: Latest completion data for immediate feedback
            
        Returns:
            Coaching response with insights and recommendations
        """
        start_time = datetime.now()
        
        try:
            # Get routine details
            routine = await database.execute(
                "SELECT * FROM user_routines WHERE id = $1 AND user_id = $2",
                uuid.UUID(routine_id), uuid.UUID(user_id),
                fetch_one=True
            )
            
            if not routine:
                return RoutineCoachingResponse(
                    success=False,
                    data={},
                    insights={"error": "Routine not found"}
                )
            
            # Calculate streaks
            streak_info = await self._calculate_streaks(user_id, routine_id)
            
            # Get recent completion history (last 30 days)
            completion_history = await self._get_completion_history(user_id, routine_id, days=30)
            
            # Analyze patterns
            patterns = await self._analyze_completion_patterns(completion_history)
            
            # Generate coaching message
            coaching_message = self._generate_coaching_message(
                routine, streak_info, patterns, recent_completion
            )
            
            # Calculate motivation score
            motivation_score = self._calculate_motivation_score(streak_info, patterns)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(routine, patterns, streak_info)
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return RoutineCoachingResponse(
                success=True,
                data={
                    "routine_id": routine_id,
                    "completion_history": completion_history[-7:],  # Last week
                    "patterns": patterns
                },
                insights={
                    "success_factors": patterns.get("success_factors", []),
                    "challenge_areas": patterns.get("challenge_areas", []),
                    "optimal_conditions": patterns.get("optimal_conditions", {})
                },
                recommendations=recommendations,
                streak_info=streak_info,
                coaching_message=coaching_message,
                motivation_score=motivation_score,
                confidence_score=0.85,  # Pattern-based confidence
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            self.logger.error(f"Error generating coaching insights: {e}")
            return RoutineCoachingResponse(
                success=False,
                data={},
                insights={"error": str(e)}
            )
    
    async def _calculate_streaks(self, user_id: str, routine_id: str) -> Dict[str, Any]:
        """Calculate current and historical streaks"""
        # Current streak using database function
        current_streak = await database.execute(
            "SELECT calculate_routine_streak($1, $2) as streak",
            uuid.UUID(user_id), uuid.UUID(routine_id),
            fetch_val=True
        )
        
        # Get historical streak data
        analytics = await database.execute(
            """
            SELECT longest_streak, completion_rate, created_at
            FROM routine_analytics 
            WHERE user_id = $1 AND routine_id = $2
            ORDER BY created_at DESC
            LIMIT 12  -- Last 12 analysis periods
            """,
            uuid.UUID(user_id), uuid.UUID(routine_id),
            fetch=True
        )
        
        longest_streak = max([a['longest_streak'] for a in analytics], default=current_streak or 0)
        avg_completion_rate = statistics.mean([a['completion_rate'] for a in analytics]) if analytics else 0.0
        
        # Calculate streak momentum (trend over last 4 weeks)
        recent_completions = await database.execute(
            """
            SELECT completion_date, completion_percentage
            FROM daily_routine_completions 
            WHERE user_id = $1 AND routine_id = $2 
            AND completion_date >= $3
            ORDER BY completion_date DESC
            """,
            uuid.UUID(user_id), uuid.UUID(routine_id), 
            date.today() - timedelta(days=28),
            fetch=True
        )
        
        momentum = self._calculate_momentum(recent_completions)
        
        return {
            "current_streak": current_streak or 0,
            "longest_streak": longest_streak,
            "avg_completion_rate": avg_completion_rate,
            "momentum": momentum,
            "streak_quality": "excellent" if current_streak >= 7 else "good" if current_streak >= 3 else "building"
        }
    
    async def _get_completion_history(self, user_id: str, routine_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get completion history with quality metrics"""
        result = await database.execute(
            """
            SELECT completion_date, completion_percentage, quality_rating, 
                   mood_before, mood_after, energy_level, notes,
                   habits_completed
            FROM daily_routine_completions 
            WHERE user_id = $1 AND routine_id = $2 
            AND completion_date >= $3
            ORDER BY completion_date DESC
            """,
            uuid.UUID(user_id), uuid.UUID(routine_id),
            date.today() - timedelta(days=days),
            fetch=True
        )
        
        return [dict(row) for row in result]
    
    async def _analyze_completion_patterns(self, completion_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze patterns in completion history"""
        if not completion_history:
            return {"insufficient_data": True}
        
        # Group by day of week
        weekday_performance = {}
        mood_impact = []
        energy_patterns = []
        quality_trends = []
        
        for completion in completion_history:
            weekday = completion['completion_date'].weekday()
            weekday_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weekday]
            
            if weekday_name not in weekday_performance:
                weekday_performance[weekday_name] = []
            
            weekday_performance[weekday_name].append(completion['completion_percentage'])
            
            # Analyze mood impact
            if completion.get('mood_before') and completion.get('mood_after'):
                mood_improvement = completion['mood_after'] - completion['mood_before']
                mood_impact.append({
                    'before': completion['mood_before'],
                    'after': completion['mood_after'],
                    'improvement': mood_improvement,
                    'completion_quality': completion['completion_percentage']
                })
            
            # Energy patterns
            if completion.get('energy_level'):
                energy_patterns.append({
                    'energy': completion['energy_level'],
                    'completion': completion['completion_percentage'],
                    'date': completion['completion_date']
                })
            
            # Quality trends
            if completion.get('quality_rating'):
                quality_trends.append({
                    'rating': completion['quality_rating'],
                    'completion': completion['completion_percentage'],
                    'date': completion['completion_date']
                })
        
        # Calculate insights
        best_days = self._find_best_performance_days(weekday_performance)
        mood_insights = self._analyze_mood_patterns(mood_impact)
        energy_insights = self._analyze_energy_patterns(energy_patterns)
        
        # Identify success factors
        high_performance = [c for c in completion_history if c['completion_percentage'] >= 80]
        low_performance = [c for c in completion_history if c['completion_percentage'] < 50]
        
        success_factors = []
        challenge_areas = []
        
        if high_performance:
            avg_energy_high = statistics.mean([c.get('energy_level', 5) for c in high_performance if c.get('energy_level')])
            avg_mood_high = statistics.mean([c.get('mood_before', 5) for c in high_performance if c.get('mood_before')])
            success_factors.extend([
                f"Higher energy levels (avg {avg_energy_high:.1f}) correlate with better completion",
                f"Better starting mood (avg {avg_mood_high:.1f}) supports routine success"
            ])
        
        if low_performance:
            challenge_patterns = self._identify_challenge_patterns(low_performance)
            challenge_areas.extend(challenge_patterns)
        
        return {
            "weekday_performance": weekday_performance,
            "best_days": best_days,
            "mood_insights": mood_insights,
            "energy_insights": energy_insights,
            "success_factors": success_factors,
            "challenge_areas": challenge_areas,
            "completion_rate_30d": statistics.mean([c['completion_percentage'] for c in completion_history]),
            "consistency_score": self._calculate_consistency_score(completion_history),
            "optimal_conditions": {
                "best_days": best_days[:3],
                "energy_threshold": energy_insights.get('optimal_energy', 6),
                "mood_threshold": mood_insights.get('optimal_mood', 6)
            }
        }
    
    def _calculate_momentum(self, recent_completions: List[Dict[str, Any]]) -> str:
        """Calculate streak momentum trend"""
        if len(recent_completions) < 7:
            return "insufficient_data"
        
        # Split into recent and older periods
        recent_week = recent_completions[:7]
        previous_week = recent_completions[7:14] if len(recent_completions) >= 14 else []
        
        recent_avg = statistics.mean([c['completion_percentage'] for c in recent_week])
        
        if previous_week:
            previous_avg = statistics.mean([c['completion_percentage'] for c in previous_week])
            
            if recent_avg > previous_avg + 10:
                return "accelerating"
            elif recent_avg < previous_avg - 10:
                return "declining"
            else:
                return "stable"
        
        if recent_avg >= 75:
            return "strong"
        elif recent_avg >= 50:
            return "moderate"
        else:
            return "building"
    
    def _find_best_performance_days(self, weekday_performance: Dict[str, List[int]]) -> List[str]:
        """Find days with best performance"""
        day_averages = {}
        for day, performances in weekday_performance.items():
            if performances:
                day_averages[day] = statistics.mean(performances)
        
        # Sort by average performance
        sorted_days = sorted(day_averages.items(), key=lambda x: x[1], reverse=True)
        return [day for day, avg in sorted_days]
    
    def _analyze_mood_patterns(self, mood_impact: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze mood patterns and impact"""
        if not mood_impact:
            return {"insufficient_data": True}
        
        avg_improvement = statistics.mean([m['improvement'] for m in mood_impact])
        positive_impact_rate = len([m for m in mood_impact if m['improvement'] > 0]) / len(mood_impact)
        
        # Find optimal starting mood
        high_completions = [m for m in mood_impact if m['completion_quality'] >= 75]
        optimal_mood = statistics.mean([m['before'] for m in high_completions]) if high_completions else 6
        
        return {
            "avg_mood_improvement": avg_improvement,
            "positive_impact_rate": positive_impact_rate,
            "optimal_mood": optimal_mood,
            "mood_boost_correlation": 0.7 if avg_improvement > 1 else 0.5
        }
    
    def _analyze_energy_patterns(self, energy_patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze energy level patterns"""
        if not energy_patterns:
            return {"insufficient_data": True}
        
        # Find optimal energy level
        high_completions = [e for e in energy_patterns if e['completion'] >= 75]
        optimal_energy = statistics.mean([e['energy'] for e in high_completions]) if high_completions else 6
        
        # Energy trend
        recent_energy = energy_patterns[:7]
        energy_trend = statistics.mean([e['energy'] for e in recent_energy]) if recent_energy else 5
        
        return {
            "optimal_energy": optimal_energy,
            "recent_energy_avg": energy_trend,
            "energy_completion_correlation": 0.8 if optimal_energy > 6 else 0.6
        }
    
    def _identify_challenge_patterns(self, low_performance: List[Dict[str, Any]]) -> List[str]:
        """Identify patterns in low performance periods"""
        challenges = []
        
        if low_performance:
            avg_energy = statistics.mean([c.get('energy_level', 5) for c in low_performance if c.get('energy_level')])
            if avg_energy < 4:
                challenges.append("Low energy levels impact routine completion")
            
            avg_mood = statistics.mean([c.get('mood_before', 5) for c in low_performance if c.get('mood_before')])
            if avg_mood < 4:
                challenges.append("Poor starting mood affects routine success")
            
            # Check for weekend patterns
            weekend_low = len([c for c in low_performance if c['completion_date'].weekday() >= 5])
            if weekend_low > len(low_performance) * 0.6:
                challenges.append("Weekend routine consistency needs attention")
        
        return challenges
    
    def _calculate_consistency_score(self, completion_history: List[Dict[str, Any]]) -> float:
        """Calculate routine consistency score (0-1)"""
        if not completion_history:
            return 0.0
        
        # Calculate variance in completion percentages
        completions = [c['completion_percentage'] for c in completion_history]
        variance = statistics.variance(completions) if len(completions) > 1 else 0
        
        # Lower variance = higher consistency
        consistency = max(0, 1 - (variance / 10000))  # Normalize variance
        
        return min(1.0, consistency)
    
    def _generate_coaching_message(self, routine: Dict[str, Any], streak_info: Dict[str, Any], 
                                 patterns: Dict[str, Any], recent_completion: Optional[Dict[str, Any]]) -> str:
        """Generate personalized coaching message"""
        name = routine['name']
        current_streak = streak_info['current_streak']
        momentum = streak_info['momentum']
        
        # Base message on streak and momentum
        if current_streak == 0:
            if recent_completion:
                return f"Great job completing {name}! Starting fresh - let's build a new streak together. 🎯"
            else:
                return f"Ready to restart your {name}? Every expert was once a beginner. Let's take it one day at a time! 💪"
        
        elif current_streak == 1:
            return f"Excellent start with {name}! Day 1 complete - the hardest part is behind you. Keep the momentum going! ⭐"
        
        elif current_streak < 7:
            return f"Amazing progress! {current_streak} days strong with {name}. You're building a powerful habit - keep pushing! 🔥"
        
        elif current_streak < 21:
            encouragement = "incredible" if momentum == "accelerating" else "fantastic"
            return f"{encouragement.title()} work! {current_streak} days of {name} shows real commitment. You're in the habit-forming zone! 🚀"
        
        else:
            return f"Outstanding! {current_streak} days of {name} - you've mastered this routine. You're an inspiration! 🏆"
    
    def _calculate_motivation_score(self, streak_info: Dict[str, Any], patterns: Dict[str, Any]) -> float:
        """Calculate motivation score (0-10)"""
        base_score = 5.0
        
        # Streak bonus
        current_streak = streak_info.get('current_streak', 0)
        if current_streak >= 21:
            base_score += 2.0
        elif current_streak >= 7:
            base_score += 1.5
        elif current_streak >= 3:
            base_score += 1.0
        elif current_streak >= 1:
            base_score += 0.5
        
        # Momentum bonus/penalty
        momentum = streak_info.get('momentum', 'building')
        if momentum == 'accelerating':
            base_score += 1.0
        elif momentum == 'declining':
            base_score -= 1.0
        
        # Consistency bonus
        consistency = patterns.get('consistency_score', 0.5)
        base_score += consistency * 1.5
        
        # Completion rate bonus
        completion_rate = patterns.get('completion_rate_30d', 50)
        if completion_rate >= 80:
            base_score += 1.0
        elif completion_rate >= 60:
            base_score += 0.5
        
        return min(10.0, max(0.0, base_score))
    
    def _generate_recommendations(self, routine: Dict[str, Any], patterns: Dict[str, Any], 
                                streak_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Streak-based recommendations
        current_streak = streak_info.get('current_streak', 0)
        if current_streak == 0:
            recommendations.append({
                "type": "restart",
                "priority": "high",
                "title": "Start Fresh",
                "description": "Begin with just one habit from your routine to rebuild momentum",
                "action": "Choose the easiest habit and focus on consistency"
            })
        
        elif current_streak < 7:
            recommendations.append({
                "type": "consistency",
                "priority": "high", 
                "title": "Build the Streak",
                "description": "Focus on completing your routine daily to reach the 7-day milestone",
                "action": "Set a daily reminder and prepare the night before"
            })
        
        # Pattern-based recommendations
        best_days = patterns.get('best_days', [])
        if best_days and len(best_days) >= 3:
            worst_day = best_days[-1] if len(best_days) >= 7 else None
            if worst_day:
                recommendations.append({
                    "type": "scheduling",
                    "priority": "medium",
                    "title": f"Optimize {worst_day}",
                    "description": f"Your {worst_day} completion rate could improve",
                    "action": f"Consider adjusting your {worst_day} routine or environment"
                })
        
        # Energy-based recommendations
        energy_insights = patterns.get('energy_insights', {})
        if energy_insights.get('optimal_energy', 5) > 6:
            recommendations.append({
                "type": "timing",
                "priority": "medium",
                "title": "Energy Optimization",
                "description": "Your routine works best when your energy is above 6/10",
                "action": "Schedule your routine when energy levels are naturally higher"
            })
        
        # Consistency recommendations
        consistency_score = patterns.get('consistency_score', 0.5)
        if consistency_score < 0.6:
            recommendations.append({
                "type": "consistency",
                "priority": "high",
                "title": "Improve Consistency",
                "description": "Focus on completing the same habits each day",
                "action": "Reduce routine complexity or adjust difficulty level"
            })
        
        return recommendations[:5]  # Limit to top 5 recommendations


# Global service instance
routine_coaching_service = RoutineCoachingService()