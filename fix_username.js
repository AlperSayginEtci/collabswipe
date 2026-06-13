const fs = require('fs');

const files = [
  'packages/api/src/routers/admin.ts',
  'packages/api/src/routers/connection.ts',
  'packages/api/src/routers/post.ts'
];

files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  // Remove `username: true,` and `username: true`
  text = text.replace(/username:\s*true,?\s*/g, '');
  text = text.replace(/username:\s*true/g, '');
  // Replace `(user?.username || "Birisi")` with `"Birisi"`
  // Replace `(addresseeUser?.username || "Birisi")` with `"Birisi"`
  // Using a generic regex for `([a-zA-Z]+User|user)\?\.username\s*\|\|\s*"Birisi"`
  text = text.replace(/\(?(?:[a-zA-Z]+User|user)\?\.username\s*\|\|\s*"Birisi"\)?/g, '"Birisi"');
  fs.writeFileSync(f, text);
});

console.log("Done");
