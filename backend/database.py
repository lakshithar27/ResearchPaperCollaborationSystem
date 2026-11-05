import pymysql
import pymysql.cursors
from contextlib import contextmanager
from typing import Generator, Any, Dict, List, Optional
from config import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB

def create_connection():
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

@contextmanager
def get_db() -> Generator[pymysql.connections.Connection, None, None]:
    conn = create_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def execute_query(sql: str, params: Optional[tuple] = None, fetch_one: bool = False, fetch_all: bool = True) -> Any:
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            if fetch_one:
                return cursor.fetchone()
            if fetch_all:
                return cursor.fetchall()
            return cursor.lastrowid

def execute_modify(sql: str, params: Optional[tuple] = None) -> int:
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.lastrowid or cursor.rowcount

def call_procedure(proc_name: str, params: tuple) -> List[Dict[str, Any]]:
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.callproc(proc_name, params)
            return cursor.fetchall()
