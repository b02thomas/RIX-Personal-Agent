# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/services/intelligence/project_health.py
# Project health scoring algorithms for Task Intelligence Hub
# Pattern-based risk assessment and completion prediction (no LLM integration)
# RELEVANT FILES: core/database.py, models/schemas.py, api/endpoints/tasks.py

import logging
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date, timedelta
import statistics
import uuid

from app.core.database import database
from app.models.schemas import ProjectHealthResponse, IntelligenceResponse

logger = logging.getLogger(__name__)


class ProjectHealthService:
    """
    Project health assessment service providing pattern-based analysis
    Calculates health scores, identifies risks, and predicts completion
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def assess_project_health(self, user_id: str, project_id: str) -> ProjectHealthResponse:
        """
        Comprehensive project health assessment
        
        Args:
            user_id: User identifier
            project_id: Project identifier
            
        Returns:
            Project health response with score, risks, and recommendations
        """
        start_time = datetime.now()
        
        try:
            # Get project details
            project = await database.execute(
                "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
                uuid.UUID(project_id), uuid.UUID(user_id),
                fetch_one=True
            )
            
            if not project:
                return ProjectHealthResponse(
                    success=False,
                    data={},
                    health_score=0,
                    insights={"error": "Project not found"}
                )
            
            # Get project tasks
            tasks = await database.execute(
                "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC",
                uuid.UUID(project_id),
                fetch=True
            )
            
            # Calculate health components
            completion_health = self._assess_completion_health(project, tasks)
            timeline_health = self._assess_timeline_health(project, tasks)
            task_velocity_health = self._assess_task_velocity(tasks)
            dependency_health = await self._assess_dependency_health(project_id)
            
            # Calculate overall health score
            health_score = self._calculate_overall_health_score(
                completion_health, timeline_health, task_velocity_health, dependency_health
            )
            
            # Identify risk factors
            risk_factors = self._identify_risk_factors(
                project, tasks, completion_health, timeline_health, task_velocity_health
            )
            
            # Identify success indicators
            success_indicators = self._identify_success_indicators(
                project, tasks, completion_health, timeline_health, task_velocity_health
            )
            
            # Generate optimization suggestions
            optimization_suggestions = self._generate_optimization_suggestions(
                project, tasks, risk_factors, health_score
            )
            
            # Predict completion
            completion_prediction = self._predict_completion(
                project, tasks, task_velocity_health
            )
            
            # Store health metrics
            await self._store_health_metrics(
                project_id, health_score, risk_factors, 
                success_indicators, optimization_suggestions, completion_prediction
            )
            
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return ProjectHealthResponse(
                success=True,
                data={
                    "project_id": project_id,
                    "assessment_date": datetime.now().isoformat(),
                    "health_components": {
                        "completion": completion_health,
                        "timeline": timeline_health,
                        "velocity": task_velocity_health,
                        "dependencies": dependency_health
                    }
                },
                health_score=health_score,
                risk_factors=risk_factors,
                success_indicators=success_indicators,
                optimization_suggestions=optimization_suggestions,
                completion_prediction=completion_prediction,
                insights={
                    "key_metrics": {
                        "total_tasks": len(tasks),
                        "completed_tasks": len([t for t in tasks if t['status'] == 'completed']),
                        "overdue_tasks": len([t for t in tasks if t.get('due_date') and t['due_date'] < datetime.now() and t['status'] != 'completed']),
                        "days_until_due": (project.get('due_date') - date.today()).days if project.get('due_date') else None
                    }
                },
                confidence_score=0.82,  # Pattern-based confidence
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            self.logger.error(f"Error assessing project health: {e}")
            return ProjectHealthResponse(
                success=False,
                data={},
                health_score=0,
                insights={"error": str(e)}
            )
    
    def _assess_completion_health(self, project: Dict[str, Any], tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess project completion health"""
        total_tasks = len(tasks)
        if total_tasks == 0:
            return {"score": 30, "status": "no_tasks", "completion_rate": 0}
        
        completed_tasks = len([t for t in tasks if t['status'] == 'completed'])
        in_progress_tasks = len([t for t in tasks if t['status'] == 'in_progress'])
        
        completion_rate = completed_tasks / total_tasks
        progress_rate = (completed_tasks + in_progress_tasks) / total_tasks
        
        # Calculate completion health score (0-100)
        base_score = completion_rate * 70  # Completed tasks weight
        progress_bonus = (progress_rate - completion_rate) * 20  # In-progress bonus
        consistency_bonus = self._calculate_completion_consistency(tasks) * 10
        
        score = min(100, base_score + progress_bonus + consistency_bonus)
        
        return {
            "score": int(score),
            "completion_rate": completion_rate,
            "progress_rate": progress_rate,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "status": self._get_completion_status(completion_rate, progress_rate)
        }
    
    def _assess_timeline_health(self, project: Dict[str, Any], tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess project timeline health"""
        due_date = project.get('due_date')
        
        if not due_date:
            return {"score": 60, "status": "no_deadline", "urgency": "low"}
        
        days_remaining = (due_date - date.today()).days
        
        # Assess overdue tasks
        overdue_tasks = [
            t for t in tasks 
            if t.get('due_date') and t['due_date'].date() < date.today() and t['status'] != 'completed'
        ]
        
        overdue_count = len(overdue_tasks)
        total_tasks = len(tasks)
        
        # Calculate timeline health score
        if days_remaining < 0:
            # Project is overdue
            overdue_penalty = min(50, abs(days_remaining) * 2)
            score = max(0, 50 - overdue_penalty)
        elif days_remaining == 0:
            score = 40  # Due today
        elif days_remaining <= 7:
            score = 60 + (days_remaining * 5)  # Due soon
        else:
            score = 90  # Plenty of time
        
        # Penalty for overdue tasks
        if overdue_tasks and total_tasks > 0:
            overdue_penalty = (overdue_count / total_tasks) * 30
            score = max(0, score - overdue_penalty)
        
        return {
            "score": int(score),
            "days_remaining": days_remaining,
            "overdue_tasks": overdue_count,
            "urgency": self._calculate_urgency(days_remaining, overdue_count),
            "status": self._get_timeline_status(days_remaining, overdue_count)
        }
    
    def _assess_task_velocity(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Assess task completion velocity"""
        if not tasks:
            return {"score": 30, "velocity": 0, "trend": "insufficient_data"}
        
        # Get completed tasks with completion dates
        completed_tasks = [
            t for t in tasks 
            if t['status'] == 'completed' and t.get('completion_date')
        ]
        
        if len(completed_tasks) < 2:
            return {"score": 40, "velocity": 0, "trend": "insufficient_completions"}
        
        # Sort by completion date
        completed_tasks.sort(key=lambda x: x['completion_date'])
        
        # Calculate velocity over different periods
        weekly_velocity = self._calculate_velocity(completed_tasks, days=7)
        monthly_velocity = self._calculate_velocity(completed_tasks, days=30)
        
        # Calculate velocity trend
        recent_velocity = self._calculate_velocity(completed_tasks, days=14)
        older_velocity = self._calculate_velocity(completed_tasks[:-7] if len(completed_tasks) > 7 else [], days=14)
        
        trend = self._calculate_velocity_trend(recent_velocity, older_velocity)
        
        # Calculate velocity health score
        if weekly_velocity >= 3:
            score = 90
        elif weekly_velocity >= 2:
            score = 80
        elif weekly_velocity >= 1:
            score = 70
        elif weekly_velocity >= 0.5:
            score = 60
        else:
            score = 40
        
        # Trend adjustment
        if trend == "accelerating":
            score += 10
        elif trend == "declining":
            score -= 10
        
        return {
            "score": min(100, max(0, int(score))),
            "weekly_velocity": weekly_velocity,
            "monthly_velocity": monthly_velocity,
            "trend": trend,
            "total_completed": len(completed_tasks),
            "avg_completion_time": self._calculate_avg_completion_time(completed_tasks)
        }
    
    async def _assess_dependency_health(self, project_id: str) -> Dict[str, Any]:
        """Assess task dependency health"""
        # Get task dependencies
        dependencies = await database.execute(
            """
            SELECT td.*, t1.title as task_title, t1.status as task_status,
                   t2.title as dependent_task_title, t2.status as dependent_task_status
            FROM task_dependencies td
            JOIN tasks t1 ON td.task_id = t1.id
            JOIN tasks t2 ON td.dependent_task_id = t2.id
            WHERE t1.project_id = $1
            """,
            uuid.UUID(project_id),
            fetch=True
        )
        
        if not dependencies:
            return {"score": 80, "status": "no_dependencies", "blocked_tasks": 0}
        
        # Analyze dependency blocks
        blocked_tasks = []
        for dep in dependencies:
            if dep['task_status'] != 'completed' and dep['dependent_task_status'] in ['todo', 'in_progress']:
                blocked_tasks.append({
                    "task": dep['dependent_task_title'],
                    "blocked_by": dep['task_title'],
                    "type": dep['dependency_type']
                })
        
        blocked_count = len(blocked_tasks)
        total_deps = len(dependencies)
        
        # Calculate dependency health score
        if blocked_count == 0:
            score = 95
        else:
            block_ratio = blocked_count / total_deps
            score = max(20, 95 - (block_ratio * 60))
        
        return {
            "score": int(score),
            "total_dependencies": total_deps,
            "blocked_tasks": blocked_count,
            "status": "healthy" if blocked_count <= 1 else "attention_needed" if blocked_count <= 3 else "critical",
            "blocking_details": blocked_tasks[:5]  # Top 5 blocks
        }
    
    def _calculate_overall_health_score(self, completion: Dict, timeline: Dict, 
                                      velocity: Dict, dependencies: Dict) -> int:
        """Calculate weighted overall health score"""
        weights = {
            "completion": 0.35,    # Most important
            "timeline": 0.25,      # Second most important
            "velocity": 0.25,      # Third most important  
            "dependencies": 0.15   # Supporting factor
        }
        
        weighted_score = (
            completion["score"] * weights["completion"] +
            timeline["score"] * weights["timeline"] +
            velocity["score"] * weights["velocity"] +
            dependencies["score"] * weights["dependencies"]
        )
        
        return int(weighted_score)
    
    def _identify_risk_factors(self, project: Dict, tasks: List[Dict], 
                             completion: Dict, timeline: Dict, velocity: Dict) -> List[Dict[str, Any]]:
        """Identify project risk factors"""
        risks = []
        
        # Completion risks
        if completion["completion_rate"] < 0.3 and len(tasks) > 5:
            risks.append({
                "type": "low_completion",
                "severity": "high",
                "title": "Low Completion Rate",
                "description": f"Only {completion['completion_rate']:.1%} tasks completed",
                "impact": "Project may miss deadline",
                "mitigation": "Focus on completing existing tasks before adding new ones"
            })
        
        # Timeline risks
        if timeline["days_remaining"] < 7 and timeline["days_remaining"] > 0:
            risks.append({
                "type": "deadline_pressure", 
                "severity": "high",
                "title": "Approaching Deadline",
                "description": f"Only {timeline['days_remaining']} days remaining",
                "impact": "High stress and potential quality issues",
                "mitigation": "Prioritize critical tasks and consider scope reduction"
            })
        
        if timeline["overdue_tasks"] > 0:
            risks.append({
                "type": "overdue_tasks",
                "severity": "medium" if timeline["overdue_tasks"] <= 2 else "high",
                "title": "Overdue Tasks",
                "description": f"{timeline['overdue_tasks']} tasks are overdue",
                "impact": "Creates bottlenecks and delays downstream tasks",
                "mitigation": "Address overdue tasks immediately or reassess priorities"
            })
        
        # Velocity risks
        if velocity["trend"] == "declining":
            risks.append({
                "type": "declining_velocity",
                "severity": "medium",
                "title": "Declining Task Velocity", 
                "description": "Task completion rate is slowing down",
                "impact": "Project timeline may be at risk",
                "mitigation": "Identify and resolve velocity blockers"
            })
        
        # Scope risks
        incomplete_tasks = len([t for t in tasks if t['status'] != 'completed'])
        if timeline.get("days_remaining", 30) > 0 and incomplete_tasks > timeline["days_remaining"] * 1.5:
            risks.append({
                "type": "scope_risk",
                "severity": "medium",
                "title": "Scope vs Timeline Mismatch",
                "description": f"{incomplete_tasks} tasks remaining for {timeline['days_remaining']} days",
                "impact": "Current scope may not be achievable within timeline",
                "mitigation": "Consider scope reduction or timeline extension"
            })
        
        return risks
    
    def _identify_success_indicators(self, project: Dict, tasks: List[Dict],
                                   completion: Dict, timeline: Dict, velocity: Dict) -> List[Dict[str, Any]]:
        """Identify positive project indicators"""
        indicators = []
        
        # High completion rate
        if completion["completion_rate"] >= 0.7:
            indicators.append({
                "type": "high_completion",
                "title": "Strong Completion Rate",
                "description": f"{completion['completion_rate']:.1%} of tasks completed",
                "impact": "Project is on track for successful delivery"
            })
        
        # Good velocity
        if velocity["weekly_velocity"] >= 2:
            indicators.append({
                "type": "good_velocity",
                "title": "Healthy Task Velocity",
                "description": f"Completing {velocity['weekly_velocity']:.1f} tasks per week",
                "impact": "Maintaining good progress momentum"
            })
        
        # Accelerating trend
        if velocity["trend"] == "accelerating":
            indicators.append({
                "type": "accelerating_progress", 
                "title": "Accelerating Progress",
                "description": "Task completion rate is increasing",
                "impact": "Project may finish ahead of schedule"
            })
        
        # Good timeline buffer
        if timeline["days_remaining"] > 14 and completion["completion_rate"] > 0.5:
            indicators.append({
                "type": "timeline_buffer",
                "title": "Healthy Timeline Buffer", 
                "description": f"{timeline['days_remaining']} days remaining with good progress",
                "impact": "Low risk of timeline issues"
            })
        
        # No major blockers
        if timeline["overdue_tasks"] == 0:
            indicators.append({
                "type": "no_blockers",
                "title": "No Overdue Tasks",
                "description": "All tasks are on schedule",
                "impact": "Smooth project execution without major blockers"
            })
        
        return indicators
    
    def _generate_optimization_suggestions(self, project: Dict, tasks: List[Dict],
                                         risk_factors: List[Dict], health_score: int) -> List[Dict[str, Any]]:
        """Generate actionable optimization suggestions"""
        suggestions = []
        
        # Health score based suggestions
        if health_score < 50:
            suggestions.append({
                "priority": "high",
                "category": "critical",
                "title": "Project Recovery Plan",
                "description": "Project health is critical - immediate action required",
                "actions": [
                    "Conduct project review meeting",
                    "Reassess scope and timeline",
                    "Identify and remove blockers",
                    "Consider additional resources"
                ]
            })
        
        # Task management suggestions
        todo_tasks = [t for t in tasks if t['status'] == 'todo']
        if len(todo_tasks) > 10:
            suggestions.append({
                "priority": "medium", 
                "category": "task_management",
                "title": "Task Prioritization",
                "description": f"{len(todo_tasks)} pending tasks need prioritization",
                "actions": [
                    "Use MoSCoW method (Must, Should, Could, Won't)",
                    "Focus on high-impact, low-effort tasks first",
                    "Break down large tasks into smaller ones"
                ]
            })
        
        # Timeline optimization
        due_date = project.get('due_date')
        if due_date and (due_date - date.today()).days < 14:
            suggestions.append({
                "priority": "high",
                "category": "timeline",
                "title": "Sprint to Finish",
                "description": "Approaching deadline - optimize for completion",
                "actions": [
                    "Daily progress check-ins",
                    "Remove non-essential tasks", 
                    "Parallelize independent tasks",
                    "Prepare contingency plan"
                ]
            })
        
        # Velocity improvement
        completed_recently = len([
            t for t in tasks 
            if t['status'] == 'completed' and t.get('completion_date') 
            and t['completion_date'] >= datetime.now() - timedelta(days=7)
        ])
        
        if completed_recently < 2:
            suggestions.append({
                "priority": "medium",
                "category": "velocity",
                "title": "Boost Task Completion",
                "description": "Task completion velocity needs improvement",
                "actions": [
                    "Set daily completion targets",
                    "Use time-boxing techniques", 
                    "Identify and remove obstacles",
                    "Celebrate small wins"
                ]
            })
        
        return suggestions[:5]  # Top 5 suggestions
    
    def _predict_completion(self, project: Dict, tasks: List[Dict], 
                          velocity: Dict) -> Dict[str, Any]:
        """Predict project completion date and confidence"""
        incomplete_tasks = len([t for t in tasks if t['status'] != 'completed'])
        
        if incomplete_tasks == 0:
            return {
                "status": "completed",
                "estimated_date": None,
                "confidence": 1.0,
                "days_ahead_behind": 0
            }
        
        weekly_velocity = velocity.get("weekly_velocity", 0.5)
        
        if weekly_velocity <= 0:
            return {
                "status": "stalled",
                "estimated_date": None,
                "confidence": 0.1,
                "days_ahead_behind": None
            }
        
        # Estimate weeks to completion
        weeks_remaining = incomplete_tasks / weekly_velocity
        estimated_completion = date.today() + timedelta(weeks=weeks_remaining)
        
        # Calculate confidence based on velocity consistency
        trend = velocity.get("trend", "stable")
        base_confidence = 0.7
        
        if trend == "accelerating":
            confidence = min(0.9, base_confidence + 0.15)
        elif trend == "declining":
            confidence = max(0.3, base_confidence - 0.2)
        else:
            confidence = base_confidence
        
        # Adjust for task variety and complexity
        if len(tasks) > 20:
            confidence *= 0.9  # More complex projects less predictable
        
        # Compare with actual due date
        due_date = project.get('due_date')
        days_ahead_behind = None
        if due_date:
            days_ahead_behind = (due_date - estimated_completion).days
        
        return {
            "status": "in_progress",
            "estimated_date": estimated_completion.isoformat(),
            "confidence": round(confidence, 2),
            "weeks_remaining": round(weeks_remaining, 1),
            "days_ahead_behind": days_ahead_behind
        }
    
    async def _store_health_metrics(self, project_id: str, health_score: int,
                                  risk_factors: List[Dict], success_indicators: List[Dict],
                                  optimization_suggestions: List[Dict], 
                                  completion_prediction: Dict) -> None:
        """Store health metrics for historical tracking"""
        await database.execute(
            """
            INSERT INTO project_health_metrics 
            (project_id, health_score, risk_factors, success_indicators, 
             optimization_suggestions, completion_prediction)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            uuid.UUID(project_id), health_score,
            json.dumps(risk_factors), json.dumps(success_indicators),
            json.dumps(optimization_suggestions), json.dumps(completion_prediction)
        )
    
    # Helper methods
    def _calculate_completion_consistency(self, tasks: List[Dict[str, Any]]) -> float:
        """Calculate completion consistency score (0-1)"""
        completed_tasks = [t for t in tasks if t['status'] == 'completed' and t.get('completion_date')]
        
        if len(completed_tasks) < 3:
            return 0.5  # Insufficient data
        
        # Calculate time between completions
        completed_tasks.sort(key=lambda x: x['completion_date'])
        intervals = []
        
        for i in range(1, len(completed_tasks)):
            delta = completed_tasks[i]['completion_date'] - completed_tasks[i-1]['completion_date']
            intervals.append(delta.days)
        
        if not intervals:
            return 0.5
        
        # Lower variance = higher consistency
        variance = statistics.variance(intervals) if len(intervals) > 1 else 0
        consistency = max(0, 1 - (variance / 100))  # Normalize
        
        return min(1.0, consistency)
    
    def _get_completion_status(self, completion_rate: float, progress_rate: float) -> str:
        """Get completion status label"""
        if completion_rate >= 0.9:
            return "nearly_complete"
        elif completion_rate >= 0.7:
            return "on_track"
        elif progress_rate >= 0.6:
            return "progressing"
        elif progress_rate >= 0.3:
            return "slow_progress"
        else:
            return "stalled"
    
    def _get_timeline_status(self, days_remaining: int, overdue_count: int) -> str:
        """Get timeline status label"""
        if days_remaining < 0:
            return "overdue"
        elif overdue_count > 0:
            return "at_risk"
        elif days_remaining <= 3:
            return "critical"
        elif days_remaining <= 7:
            return "urgent"
        elif days_remaining <= 14:
            return "approaching"
        else:
            return "healthy"
    
    def _calculate_urgency(self, days_remaining: int, overdue_count: int) -> str:
        """Calculate urgency level"""
        if days_remaining < 0 or overdue_count > 2:
            return "critical"
        elif days_remaining <= 3 or overdue_count > 0:
            return "high"
        elif days_remaining <= 7:
            return "medium"
        else:
            return "low"
    
    def _calculate_velocity(self, completed_tasks: List[Dict], days: int) -> float:
        """Calculate task velocity for given period"""
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_completions = [
            t for t in completed_tasks 
            if t['completion_date'] >= cutoff_date
        ]
        
        return len(recent_completions) / (days / 7)  # Tasks per week
    
    def _calculate_velocity_trend(self, recent_velocity: float, older_velocity: float) -> str:
        """Calculate velocity trend"""
        if older_velocity == 0:
            return "insufficient_data"
        
        change_ratio = (recent_velocity - older_velocity) / older_velocity
        
        if change_ratio > 0.2:
            return "accelerating"
        elif change_ratio < -0.2:
            return "declining"
        else:
            return "stable"
    
    def _calculate_avg_completion_time(self, completed_tasks: List[Dict]) -> Optional[float]:
        """Calculate average time from creation to completion"""
        completion_times = []
        
        for task in completed_tasks:
            if task.get('completion_date') and task.get('created_at'):
                delta = task['completion_date'] - task['created_at']
                completion_times.append(delta.days)
        
        return statistics.mean(completion_times) if completion_times else None


# Global service instance
project_health_service = ProjectHealthService()