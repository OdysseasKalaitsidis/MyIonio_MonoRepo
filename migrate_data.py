import psycopg2
import os
import json
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv()

# Register JSON adapter for psycopg2 to handle dict/JSONB
psycopg2.extensions.register_adapter(dict, Json)

# --- CONFIGURATION ---
# Source (Supabase - Using the URI you provided, URL-encoded)
SOURCE_URI = "postgresql://postgres%2Ejbtxfenmmhviyxjnffbf:myionio2026@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Target (Local Docker)
TARGET_CONN = os.getenv("DB_CONNECTION") or "Host=localhost;Port=5432;Database=myionio;Username=admin;Password=password123"

# Tables to migrate in order (to respect foreign keys)
TABLES = [
    "Users", 
    "Majors", 
    "Toolboxes", 
    "Questions", 
    "Answers", 
    "RefreshTokens",
    "ScoringRules",
    "AnswersQuestion", 
    "UserRecommendation", 
    "UserAnswers",
    "class_schedules", 
    "exam_schedules", 
    "weekly_menus", 
    "CourseReviews", 
    "notes"
]

def migrate():
    src_conn = None
    tgt_conn = None
    
    # Fix local DSN to URI for consistency
    def fix_dsn_to_uri(dsn):
        if dsn.startswith("postgresql://"): return dsn
        import urllib.parse
        parts = {p.split('=', 1)[0].strip().lower(): p.split('=', 1)[1].strip() for p in dsn.strip().split(';') if '=' in p}
        user = urllib.parse.quote_plus(parts.get('username') or parts.get('user', ''))
        password = urllib.parse.quote_plus(parts.get('password', ''))
        host = parts.get('host')
        port = parts.get('port', '5432')
        dbname = parts.get('database') or parts.get('dbname')
        sslmode = (parts.get('ssl mode') or parts.get('sslmode', 'require')).lower()
        return f"postgresql://{user}:{password}@{host}:{port}/{dbname}?sslmode={sslmode}"

    target_uri = fix_dsn_to_uri(TARGET_CONN)

    try:
        print("🔗 Connecting to Supabase (Source)...")
        src_conn = psycopg2.connect(SOURCE_URI)
        
        print("🔗 Connecting to Local Docker (Target)...")
        tgt_conn = psycopg2.connect(target_uri)
        
        src_cur = src_conn.cursor()
        tgt_cur = tgt_conn.cursor()

        # DIAGNOSTIC: List all tables in the public schema
        print("🔍 Scanning Supabase for available tables...")
        src_cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        available_tables = [t[0] for t in src_cur.fetchall()]
        print(f"  📝 Tables found on Supabase: {', '.join(available_tables) if available_tables else 'NONE'}")

        # DIAGNOSTIC: List all tables in the public schema
        def get_tables(conn):
            cur = conn.cursor()
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
            return [t[0] for t in cur.fetchall()]

        print("🔍 Scanning databases...")
        supabase_tables = get_tables(src_conn)
        local_tables = get_tables(tgt_conn)
        print(f"  📝 Tables on Supabase: {', '.join(supabase_tables) if supabase_tables else 'NONE'}")
        print(f"  📝 Tables on Local:    {', '.join(local_tables) if local_tables else 'NONE'}")

        print("\n🚀 Starting data migration...")
        print("-" * 40)

        for table in TABLES:
            try:
                print(f"📦 Processing table: {table}...")
                
                # Identify source table
                actual_src_table = table if table in supabase_tables else (table.lower() if table.lower() in supabase_tables else None)
                if not actual_src_table:
                    print(f"  ❌ '{table}' not found on Supabase. Skipping.")
                    continue

                # Identify target table
                actual_tgt_table = table if table in local_tables else (table.lower() if table.lower() in local_tables else None)
                if not actual_tgt_table:
                    print(f"  ❌ '{table}' not found on Local DB. Skipping.")
                    continue

                # Get columns for both sides
                src_cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{actual_src_table}'")
                src_cols = set(c[0] for c in src_cur.fetchall())
                
                tgt_cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{actual_tgt_table}'")
                tgt_cols = set(c[0] for c in tgt_cur.fetchall())

                # Common columns only
                common_cols = [c for c in src_cols if c in tgt_cols]
                if not common_cols:
                    print(f"  ⚠️ No common columns found for {table}. Skipping.")
                    continue

                # Fetch data from source (selecting only common columns)
                col_selection = ', '.join([f'"{c}"' for c in common_cols])
                src_cur.execute(f'SELECT {col_selection} FROM "{actual_src_table}"')
                rows = src_cur.fetchall()
                
                if not rows:
                    print(f"  (Skipping {table}: No data found at source)")
                    continue

                # Clear target table
                tgt_cur.execute(f'TRUNCATE TABLE "{actual_tgt_table}" CASCADE')
                
                # Prepare insert
                target_columns = list(common_cols)
                has_dept_id = "DepartmentId" in tgt_cols and "DepartmentId" not in src_cols
                if has_dept_id:
                    target_columns.append("DepartmentId")

                col_names = ', '.join([f'"{c}"' for c in target_columns])
                placeholders = ', '.join(['%s'] * len(target_columns))
                insert_query = f'INSERT INTO "{actual_tgt_table}" ({col_names}) VALUES ({placeholders})'
                
                # Dept ID Mapping logic
                DEPT_ID_MAP = {
                    "Τμήμα Πληροφορικής": 1, "Department of Informatics": 1, "INFORMATICS": 1, "Informatics": 1,
                    "Τμήμα Τουρισμού": 2, "Tourism": 2,
                    "Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας": 3, "Translation": 3
                }

                # Process rows to ensure JSON conversion and inject DepartmentId
                processed_rows = []
                for row in rows:
                    row_dict = dict(zip(common_cols, row))
                    processed_row = []
                    
                    # Add standard columns
                    for c in common_cols:
                        val = row_dict[c]
                        if isinstance(val, list):
                            processed_row.append(json.dumps(val))
                        else:
                            processed_row.append(val)
                    
                    # Inject DepartmentId if needed
                    if has_dept_id:
                        dept_name = row_dict.get("department") or row_dict.get("Department") or ""
                        processed_row.append(DEPT_ID_MAP.get(dept_name, 1))

                    processed_rows.append(tuple(processed_row))

                # Batch insert
                tgt_cur.executemany(insert_query, processed_rows)
                print(f"  ✅ Successfully migrated {len(rows)} rows into {actual_tgt_table}")
                
            except Exception as table_err:
                print(f"  ⚠️ Error on table {table}: {table_err}")
                tgt_conn.rollback()
                continue

        tgt_conn.commit()
        print("-" * 40)
        print("✨ Migration completed successfully!")

    except Exception as e:
        print(f"\n❌ Global Migration Error: {e}")
        if tgt_conn:
            tgt_conn.rollback()
    finally:
        if src_conn: src_conn.close()
        if tgt_conn: tgt_conn.close()

if __name__ == "__main__":
    migrate()
