const fs = require('fs');
const sql = fs.readFileSync('prisma/migrations/20260612102009_init/migration.sql', 'utf8');
const lines = sql.split('\n');
lines.forEach((line) => {
  if (line.includes('CREATE TABLE')) {
    console.log(line.trim());
  }
});
