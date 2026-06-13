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
      
      // We want to replace `https://api.dicebear.com/7.x/notionists/svg?seed=${name}` 
      // with `https://ui-avatars.com/api/?name=${name}&background=random&size=256`
      let newContent = content.replace(
        /https:\/\/api\.dicebear\.com\/[^\/]+\/[^\/]+\/(svg|png)\?seed=\$\{([^}]+)\}/g,
        "https://ui-avatars.com/api/?name=${$2}&background=random&size=512"
      );
      
      // Also catch literal seeds in seed files (e.g. seed=Felix)
      newContent = newContent.replace(
        /https:\/\/api\.dicebear\.com\/[^\/]+\/[^\/]+\/(svg|png)\?seed=([a-zA-Z0-9_-]+)/g,
        "https://ui-avatars.com/api/?name=$2&background=random&size=512"
      );
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
});
