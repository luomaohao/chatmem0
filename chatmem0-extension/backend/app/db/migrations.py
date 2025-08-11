"""
Lightweight migration helpers for SQLite.

Usage examples:

1) Rebuild conversations table in-place (preserve data):
   python -m app.db.migrations --rebuild

2) Drop and recreate all tables (DANGEROUS, wipes data):
   python -m app.db.migrations --recreate
"""

from __future__ import annotations

import argparse
import logging
from sqlalchemy import text
from app.db.database import engine

logger = logging.getLogger(__name__)


def rebuild_conversations_table_preserve_data() -> None:
    """Recreate conversations table with updated schema and migrate data.

    Works for SQLite. Strategy:
    - Create conversations_new with desired schema
    - Copy rows from conversations into conversations_new
    - Drop old conversations
    - Rename conversations_new -> conversations
    - Recreate indexes
    """

    if not str(engine.url).startswith("sqlite"):
        raise RuntimeError("This helper currently supports SQLite only")

    with engine.begin() as conn:
        logger.info("Creating conversations_new table with updated schema...")
        conn.execute(text(
            """
            CREATE TABLE IF NOT EXISTS conversations_new (
              id VARCHAR(255) PRIMARY KEY,
              platform VARCHAR(50) NOT NULL,
              title VARCHAR(500) NOT NULL,
              url VARCHAR(1000) NOT NULL,
              created_at DATETIME NOT NULL,
              updated_at DATETIME NOT NULL,
              messages JSON NOT NULL,
              processed BOOLEAN,
              processed_at DATETIME,
              tags JSON,
              summary TEXT,
              metadata TEXT,
              db_created_at DATETIME,
              db_updated_at DATETIME
            )
            """
        ))

        logger.info("Copying data from conversations -> conversations_new (if exists)...")
        # Copy only if old table exists
        conn.execute(text(
            """
            INSERT INTO conversations_new (
              id, platform, title, url, created_at, updated_at,
              messages, processed, processed_at, tags, summary, metadata,
              db_created_at, db_updated_at
            )
            SELECT 
              id, platform, title, url, created_at, updated_at,
              messages, processed, processed_at, tags, summary, metadata,
              db_created_at, db_updated_at
            FROM conversations
            """
        ))

        logger.info("Dropping old conversations table...")
        conn.execute(text("DROP TABLE IF EXISTS conversations"))

        logger.info("Renaming conversations_new -> conversations...")
        conn.execute(text("ALTER TABLE conversations_new RENAME TO conversations"))

        logger.info("Recreating indexes...")
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_platform_processed ON conversations (platform, processed)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_created_at ON conversations (created_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_updated_at ON conversations (updated_at)"))

    logger.info("Conversations table rebuild completed")


def drop_and_recreate_all_tables() -> None:
    """Dangerous: drops and recreates all tables via metadata.create_all()."""
    if not str(engine.url).startswith("sqlite"):
        raise RuntimeError("This helper currently supports SQLite only")

    from app.db.database import Base

    with engine.begin() as conn:
        logger.warning("Dropping ALL tables... This will wipe data!")
        # SQLite: get existing tables and drop
        res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [r[0] for r in res]
        for t in tables:
            conn.execute(text(f"DROP TABLE IF EXISTS {t}"))

    # Recreate
    Base.metadata.create_all(bind=engine)
    logger.info("All tables recreated")


def main():
    parser = argparse.ArgumentParser(description="DB migration helpers")
    parser.add_argument("--rebuild", action="store_true", help="Rebuild conversations table preserving data")
    parser.add_argument("--recreate", action="store_true", help="Drop and recreate all tables (DANGEROUS)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    if args.recreate:
        drop_and_recreate_all_tables()
    elif args.rebuild:
        rebuild_conversations_table_preserve_data()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

 