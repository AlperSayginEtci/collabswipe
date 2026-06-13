const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!dirPath.includes('node_modules') && !dirPath.includes('.next') && !dirPath.includes('dist')) {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const targetDirs = [
  path.join(__dirname, 'apps', 'web', 'src'),
  path.join(__dirname, 'apps', 'mobile', 'app'),
  path.join(__dirname, 'apps', 'mobile', 'components'),
  path.join(__dirname, 'packages', 'db'),
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // General replacement for most files
      let newContent = content.replace(
        /https:\/\/ui-avatars\.com\/api\/\?name=\$\{([^}]+)\}&background=random&size=512/g,
        "https://api.dicebear.com/7.x/avataaars/png?seed=${$1}&backgroundColor=c0aede,b6e3f4,ffdfbf&size=512"
      );
      
      // Catch literal seeds
      newContent = newContent.replace(
        /https:\/\/ui-avatars\.com\/api\/\?name=([a-zA-Z0-9_-]+)&background=random&size=512/g,
        "https://api.dicebear.com/7.x/avataaars/png?seed=$1&backgroundColor=c0aede,b6e3f4,ffdfbf&size=512"
      );

      // Specifically fix discover.tsx for companies using shapes instead of avataaars
      // We can look for the publisher line
      newContent = newContent.replace(
        /\(item\.publisher\?\.image \|\| `https:\/\/api\.dicebear\.com\/7\.x\/avataaars\/png\?seed=\$\{encodeURIComponent\(item\.id\)\}&backgroundColor=[^`]+`\)/g,
        "(item.publisher?.image || `https://api.dicebear.com/7.x/shapes/png?seed=${encodeURIComponent(item.id)}&size=512`)"
      );

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
});
