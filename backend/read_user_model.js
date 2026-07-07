const fs = require('fs');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const start = schema.indexOf('model User {');
if (start === -1) {
  console.log('model User not found');
} else {
  const end = schema.indexOf('}', start);
  console.log(schema.substring(start, end + 1));
}
