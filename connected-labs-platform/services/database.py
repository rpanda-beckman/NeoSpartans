"""
Database Layer for Connected Labs Platform
SQLite database for logs and anomalies with connection management
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
import os


# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), "connected_labs.db")


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_database():
    """Initialize database schema"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Create logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id TEXT PRIMARY KEY,
                instrument_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create index on instrument_id and timestamp for fast queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_logs_instrument_timestamp 
            ON logs(instrument_id, timestamp DESC)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_logs_level 
            ON logs(level)
        """)
        
        # Create anomalies table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS anomalies (
                id TEXT PRIMARY KEY,
                instrument_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                severity TEXT NOT NULL,
                description TEXT NOT NULL,
                confidence REAL NOT NULL,
                suggested_actions TEXT,
                log_ids TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create index on anomalies
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_anomalies_instrument_timestamp 
            ON anomalies(instrument_id, timestamp DESC)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_anomalies_severity 
            ON anomalies(severity)
        """)
        
        conn.commit()
        print(f"Database initialized at {DB_PATH}")


def insert_log(log: Dict[str, Any]) -> bool:
    """
    Insert a single log entry
    
    Args:
        log: Log entry dictionary with keys: id, instrument_id, timestamp, level, message, metadata
    
    Returns:
        True if successful, False otherwise
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO logs (id, instrument_id, timestamp, level, message, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                log["id"],
                log["instrument_id"],
                log["timestamp"],
                log["level"],
                log["message"],
                json.dumps(log.get("metadata", {}))
            ))
            return True
    except Exception as e:
        print(f"Error inserting log: {e}")
        return False


def insert_logs_batch(logs: List[Dict[str, Any]]) -> int:
    """
    Insert multiple log entries in a batch
    
    Args:
        logs: List of log entry dictionaries
    
    Returns:
        Number of logs successfully inserted
    """
    success_count = 0
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            for log in logs:
                try:
                    cursor.execute("""
                        INSERT INTO logs (id, instrument_id, timestamp, level, message, metadata)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        log["id"],
                        log["instrument_id"],
                        log["timestamp"],
                        log["level"],
                        log["message"],
                        json.dumps(log.get("metadata", {}))
                    ))
                    success_count += 1
                except sqlite3.IntegrityError:
                    # Skip duplicates
                    continue
            conn.commit()
    except Exception as e:
        print(f"Error in batch insert: {e}")
    
    return success_count


def get_recent_logs(
    instrument_id: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Get recent logs with optional filters
    
    Args:
        instrument_id: Filter by instrument ID (optional)
        level: Filter by log level (optional)
        limit: Maximum number of logs to return
    
    Returns:
        List of log dictionaries
    """
    query = "SELECT * FROM logs WHERE 1=1"
    params = []
    
    if instrument_id:
        query += " AND instrument_id = ?"
        params.append(instrument_id)
    
    if level:
        query += " AND level = ?"
        params.append(level)
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            logs = []
            for row in rows:
                log = dict(row)
                # Parse metadata JSON
                if log.get("metadata"):
                    log["metadata"] = json.loads(log["metadata"])
                logs.append(log)
            
            return logs
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []


def get_logs_in_time_range(
    instrument_id: str,
    start_time: datetime,
    end_time: datetime
) -> List[Dict[str, Any]]:
    """
    Get logs for an instrument within a time range
    
    Args:
        instrument_id: Instrument ID
        start_time: Start of time range
        end_time: End of time range
    
    Returns:
        List of log dictionaries
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM logs
                WHERE instrument_id = ?
                AND timestamp BETWEEN ? AND ?
                ORDER BY timestamp ASC
            """, (
                instrument_id,
                start_time.isoformat(),
                end_time.isoformat()
            ))
            rows = cursor.fetchall()
            
            logs = []
            for row in rows:
                log = dict(row)
                if log.get("metadata"):
                    log["metadata"] = json.loads(log["metadata"])
                logs.append(log)
            
            return logs
    except Exception as e:
        print(f"Error fetching logs in time range: {e}")
        return []


def insert_anomaly(anomaly: Dict[str, Any]) -> bool:
    """
    Insert an anomaly alert
    
    Args:
        anomaly: Anomaly dictionary with keys: id, instrument_id, timestamp, 
                 severity, description, confidence, suggested_actions, log_ids
    
    Returns:
        True if successful, False otherwise
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO anomalies (id, instrument_id, timestamp, severity, 
                                      description, confidence, suggested_actions, log_ids)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                anomaly["id"],
                anomaly["instrument_id"],
                anomaly["timestamp"],
                anomaly["severity"],
                anomaly["description"],
                anomaly["confidence"],
                json.dumps(anomaly.get("suggested_actions", [])),
                json.dumps(anomaly.get("log_ids", []))
            ))
            return True
    except Exception as e:
        print(f"Error inserting anomaly: {e}")
        return False


def get_recent_anomalies(
    instrument_id: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get recent anomalies with optional filters
    
    Args:
        instrument_id: Filter by instrument ID (optional)
        severity: Filter by severity level (optional)
        limit: Maximum number of anomalies to return
    
    Returns:
        List of anomaly dictionaries
    """
    query = "SELECT * FROM anomalies WHERE 1=1"
    params = []
    
    if instrument_id:
        query += " AND instrument_id = ?"
        params.append(instrument_id)
    
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            anomalies = []
            for row in rows:
                anomaly = dict(row)
                # Parse JSON fields
                if anomaly.get("suggested_actions"):
                    anomaly["suggested_actions"] = json.loads(anomaly["suggested_actions"])
                if anomaly.get("log_ids"):
                    anomaly["log_ids"] = json.loads(anomaly["log_ids"])
                anomalies.append(anomaly)
            
            return anomalies
    except Exception as e:
        print(f"Error fetching anomalies: {e}")
        return []


def get_log_stats(instrument_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get statistics about logs
    
    Args:
        instrument_id: Filter by instrument ID (optional)
    
    Returns:
        Dictionary with log statistics
    """
    query = "SELECT level, COUNT(*) as count FROM logs"
    params = []
    
    if instrument_id:
        query += " WHERE instrument_id = ?"
        params.append(instrument_id)
    
    query += " GROUP BY level"
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            stats = {
                "total": 0,
                "by_level": {}
            }
            
            for row in rows:
                level = row["level"]
                count = row["count"]
                stats["by_level"][level] = count
                stats["total"] += count
            
            return stats
    except Exception as e:
        print(f"Error fetching log stats: {e}")
        return {"total": 0, "by_level": {}}


def clear_old_logs(days_to_keep: int = 30) -> int:
    """
    Delete logs older than specified days
    
    Args:
        days_to_keep: Number of days of logs to keep
    
    Returns:
        Number of logs deleted
    """
    try:
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM logs
                WHERE timestamp < ?
            """, (cutoff_date.isoformat(),))
            deleted = cursor.rowcount
            conn.commit()
            return deleted
    except Exception as e:
        print(f"Error clearing old logs: {e}")
        return 0


if __name__ == "__main__":
    # Initialize database and test
    from datetime import timedelta
    
    print("Initializing database...")
    init_database()
    
    # Test insert
    print("\nTesting log insertion...")
    test_log = {
        "id": "test-001",
        "instrument_id": "test-instrument",
        "timestamp": datetime.now().isoformat(),
        "level": "info",
        "message": "Test log entry",
        "metadata": {"temperature": 25.5, "test": True}
    }
    
    success = insert_log(test_log)
    print(f"Insert test: {'Success' if success else 'Failed'}")
    
    # Test retrieval
    print("\nTesting log retrieval...")
    logs = get_recent_logs(limit=5)
    print(f"Retrieved {len(logs)} logs")
    
    if logs:
        print("\nSample log:")
        print(f"  ID: {logs[0]['id']}")
        print(f"  Instrument: {logs[0]['instrument_id']}")
        print(f"  Level: {logs[0]['level']}")
        print(f"  Message: {logs[0]['message']}")
    
    # Test stats
    print("\nLog statistics:")
    stats = get_log_stats()
    print(f"  Total logs: {stats['total']}")
    print(f"  By level: {stats['by_level']}")
