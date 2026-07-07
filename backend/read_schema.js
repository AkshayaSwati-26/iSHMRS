const fs = require('fs');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = schema.split('\n');
lines.forEach((line, index) => {
  if (line.includes('@@map')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
