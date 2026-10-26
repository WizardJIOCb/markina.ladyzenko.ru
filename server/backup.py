"""Online SQLite backup; uploaded originals are immutable and kept separately."""
from datetime import datetime, timezone
from pathlib import Path
import os
import sqlite3

data = Path(os.environ.get('MARKINA_DATA', '/var/lib/markina-cms'))
backups = data / 'backups'
backups.mkdir(exist_ok=True, mode=0o750)
path = backups / (datetime.now(timezone.utc).strftime('%Y-%m-%d') + '.sqlite3')
with sqlite3.connect(data / 'cms.sqlite3') as source, sqlite3.connect(path) as target:
    source.backup(target)
os.chmod(path, 0o640)
for old in sorted(backups.glob('*.sqlite3'))[:-14]:
    old.unlink()
print('Database backup complete; 14 daily snapshots retained.')
