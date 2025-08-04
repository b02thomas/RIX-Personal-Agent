# /Users/benediktthomas/RIX Personal Agent/RIX/main-agent/app/utils/secure_query_builder.py
# Secure SQL query builder utility to prevent SQL injection
# This utility provides safe methods for constructing dynamic queries with field validation
# RELEVANT FILES: app/api/endpoints/*.py, app/core/database.py, app/services/core_apis.py

import re
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple


class QueryType(Enum):
    """Supported query types"""

    SELECT = "SELECT"
    UPDATE = "UPDATE"
    INSERT = "INSERT"
    DELETE = "DELETE"


class SecureQueryBuilder:
    """
    Secure SQL query builder that prevents SQL injection by:
    1. Whitelisting allowed table names and field names
    2. Using parameterized queries for all values
    3. Validating field names against schema definitions
    4. Sanitizing input to prevent malicious code injection
    """

    # Define allowed tables and their fields to prevent SQL injection
    ALLOWED_TABLES = {
        "calendar_events": {
            "id",
            "user_id",
            "title",
            "description",
            "start_time",
            "end_time",
            "location",
            "attendees",
            "status",
            "priority",
            "category",
            "recurrence_rule",
            "metadata",
            "created_at",
            "updated_at",
        },
        "user_goals": {
            "id",
            "user_id",
            "title",
            "description",
            "category",
            "status",
            "priority",
            "target_date",
            "completion_percentage",
            "ai_insights",
            "metadata",
            "created_at",
            "updated_at",
        },
        "knowledge_entries": {
            "id",
            "user_id",
            "title",
            "content",
            "category",
            "tags",
            "source_url",
            "metadata",
            "embedding",
            "created_at",
            "updated_at",
        },
        "user_routines": {
            "id",
            "user_id",
            "name",
            "description",
            "habits",
            "frequency",
            "time_of_day",
            "is_active",
            "metadata",
            "created_at",
            "updated_at",
        },
        "tasks": {
            "id",
            "user_id",
            "title",
            "description",
            "status",
            "priority",
            "project_id",
            "assigned_to",
            "due_date",
            "estimated_hours",
            "tags",
            "completion_percentage",
            "metadata",
            "created_at",
            "updated_at",
        },
        "projects": {
            "id",
            "user_id",
            "name",
            "description",
            "status",
            "priority",
            "start_date",
            "end_date",
            "tags",
            "metadata",
            "created_at",
            "updated_at",
        },
    }

    # Define operators that are safe to use in WHERE clauses
    ALLOWED_OPERATORS = {
        "=",
        "!=",
        "<>",
        "<",
        ">",
        "<=",
        ">=",
        "LIKE",
        "ILIKE",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "&&",  # && for PostgreSQL array operations
    }

    @classmethod
    def validate_table_name(cls, table_name: str) -> bool:
        """
        Validate that table name is in our whitelist to prevent SQL injection

        Args:
            table_name: Name of the table to validate

        Returns:
            bool: True if table name is allowed, False otherwise
        """
        return table_name in cls.ALLOWED_TABLES

    @classmethod
    def validate_field_name(cls, table_name: str, field_name: str) -> bool:
        """
        Validate that field name exists in the specified table schema

        Args:
            table_name: Name of the table
            field_name: Name of the field to validate

        Returns:
            bool: True if field name is allowed for this table, False otherwise
        """
        if not cls.validate_table_name(table_name):
            return False

        allowed_fields = cls.ALLOWED_TABLES[table_name]
        return field_name in allowed_fields

    @classmethod
    def sanitize_identifier(cls, identifier: str) -> str:
        """
        Sanitize SQL identifier to prevent injection attacks
        Only allows alphanumeric characters, underscores, and dots

        Args:
            identifier: The identifier to sanitize

        Returns:
            str: Sanitized identifier

        Raises:
            ValueError: If identifier contains invalid characters
        """
        # Only allow alphanumeric, underscore, and dot characters
        if not re.match(r"^[a-zA-Z0-9_\.]+$", identifier):
            raise ValueError(f"Invalid identifier: {identifier}")
        return identifier

    @classmethod
    def build_update_query(
        cls, table_name: str, update_fields: Dict[str, Any], where_conditions: Dict[str, Any], add_updated_at: bool = True
    ) -> Tuple[str, List[Any]]:
        """
        Build a secure UPDATE query with parameterized values

        Args:
            table_name: Name of the table to update
            update_fields: Dictionary of field names and values to update
            where_conditions: Dictionary of field names and values for WHERE clause
            add_updated_at: Whether to automatically add updated_at = NOW()

        Returns:
            Tuple of (query_string, parameters_list)

        Raises:
            ValueError: If table or field names are invalid
        """
        # Validate table name
        if not cls.validate_table_name(table_name):
            raise ValueError(f"Table name not allowed: {table_name}")

        # Validate and build SET clause
        set_clauses = []
        params = []
        param_count = 1

        for field_name, value in update_fields.items():
            if not cls.validate_field_name(table_name, field_name):
                raise ValueError(f"Field name not allowed for table {table_name}: {field_name}")

            # Sanitize field name (though it should already be valid)
            safe_field = cls.sanitize_identifier(field_name)
            set_clauses.append(f"{safe_field} = ${param_count}")
            params.append(value)
            param_count += 1

        # Add updated_at timestamp if requested
        if add_updated_at and cls.validate_field_name(table_name, "updated_at"):
            set_clauses.append("updated_at = NOW()")

        if not set_clauses:
            raise ValueError("No valid fields to update")

        # Validate and build WHERE clause
        where_clauses = []
        for field_name, value in where_conditions.items():
            if not cls.validate_field_name(table_name, field_name):
                raise ValueError(f"Field name not allowed for table {table_name}: {field_name}")

            safe_field = cls.sanitize_identifier(field_name)
            where_clauses.append(f"{safe_field} = ${param_count}")
            params.append(value)
            param_count += 1

        if not where_clauses:
            raise ValueError("WHERE conditions are required for UPDATE queries")

        # Build final query
        safe_table = cls.sanitize_identifier(table_name)
        query = f"""
            UPDATE {safe_table}
            SET {', '.join(set_clauses)}
            WHERE {' AND '.join(where_clauses)}
            RETURNING *
        """

        return query.strip(), params

    @classmethod
    def build_select_query(
        cls,
        table_name: str,
        select_fields: Optional[List[str]] = None,
        where_conditions: Optional[Dict[str, Any]] = None,
        order_by: Optional[List[str]] = None,
        limit: Optional[int] = None,
    ) -> Tuple[str, List[Any]]:
        """
        Build a secure SELECT query with parameterized values

        Args:
            table_name: Name of the table to select from
            select_fields: List of field names to select (None for *)
            where_conditions: Dictionary of field names and values for WHERE clause
            order_by: List of field names for ORDER BY clause
            limit: Maximum number of rows to return

        Returns:
            Tuple of (query_string, parameters_list)

        Raises:
            ValueError: If table or field names are invalid
        """
        # Validate table name
        if not cls.validate_table_name(table_name):
            raise ValueError(f"Table name not allowed: {table_name}")

        # Build SELECT clause
        if select_fields:
            # Validate all field names
            for field_name in select_fields:
                if not cls.validate_field_name(table_name, field_name):
                    raise ValueError(f"Field name not allowed for table {table_name}: {field_name}")

            safe_fields = [cls.sanitize_identifier(field) for field in select_fields]
            select_clause = ", ".join(safe_fields)
        else:
            select_clause = "*"

        # Build WHERE clause
        where_clause = ""
        params = []
        param_count = 1

        if where_conditions:
            where_clauses = []
            for field_name, value in where_conditions.items():
                if not cls.validate_field_name(table_name, field_name):
                    raise ValueError(f"Field name not allowed for table {table_name}: {field_name}")

                safe_field = cls.sanitize_identifier(field_name)
                where_clauses.append(f"{safe_field} = ${param_count}")
                params.append(value)
                param_count += 1

            where_clause = f"WHERE {' AND '.join(where_clauses)}"

        # Build ORDER BY clause
        order_clause = ""
        if order_by:
            safe_order_fields = []
            for field_name in order_by:
                # Handle DESC/ASC modifiers
                parts = field_name.split()
                base_field = parts[0]

                if not cls.validate_field_name(table_name, base_field):
                    raise ValueError(f"Field name not allowed for table {table_name}: {base_field}")

                safe_field = cls.sanitize_identifier(base_field)
                if len(parts) > 1 and parts[1].upper() in ["ASC", "DESC"]:
                    safe_field += f" {parts[1].upper()}"

                safe_order_fields.append(safe_field)

            order_clause = f"ORDER BY {', '.join(safe_order_fields)}"

        # Build LIMIT clause
        limit_clause = ""
        if limit is not None:
            if not isinstance(limit, int) or limit < 0:
                raise ValueError("LIMIT must be a non-negative integer")
            limit_clause = f"LIMIT {limit}"

        # Build final query
        safe_table = cls.sanitize_identifier(table_name)
        query_parts = [f"SELECT {select_clause}", f"FROM {safe_table}", where_clause, order_clause, limit_clause]

        query = " ".join(part for part in query_parts if part)
        return query.strip(), params

    @classmethod
    def build_where_conditions(cls, table_name: str, conditions: Dict[str, Any]) -> Tuple[str, List[Any]]:
        """
        Build a secure WHERE clause with parameterized values

        Args:
            table_name: Name of the table (for field validation)
            conditions: Dictionary of field names and values

        Returns:
            Tuple of (where_clause_string, parameters_list)

        Raises:
            ValueError: If table or field names are invalid
        """
        if not conditions:
            return "", []

        # Validate table name
        if not cls.validate_table_name(table_name):
            raise ValueError(f"Table name not allowed: {table_name}")

        where_clauses = []
        params = []
        param_count = 1

        for field_name, value in conditions.items():
            if not cls.validate_field_name(table_name, field_name):
                raise ValueError(f"Field name not allowed for table {table_name}: {field_name}")

            safe_field = cls.sanitize_identifier(field_name)

            # Handle different value types
            if value is None:
                where_clauses.append(f"{safe_field} IS NULL")
            elif isinstance(value, list):
                # Handle IN clauses for arrays/lists
                placeholders = ", ".join([f"${param_count + i}" for i in range(len(value))])
                where_clauses.append(f"{safe_field} IN ({placeholders})")
                params.extend(value)
                param_count += len(value)
            else:
                where_clauses.append(f"{safe_field} = ${param_count}")
                params.append(value)
                param_count += 1

        where_clause = " AND ".join(where_clauses)
        return where_clause, params
