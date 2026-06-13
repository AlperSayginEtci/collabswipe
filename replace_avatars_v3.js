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
      
      let newContent = content.replace(
        /https:\/\/api\.dicebear\.com\/7\.x\/[a-zA-Z]+\/(png|svg)\?seed=\$\{([^}]+)\}(&backgroundColor=[a-zA-Z0-9,]+)?(&size=\d+)?/g,
        "https://i.pravatar.cc/1000?u=${$2}"
      );
      
      newContent = newContent.replace(
        /https:\/\/api\.dicebear\.com\/7\.x\/[a-zA-Z]+\/(png|svg)\?seed=([a-zA-Z0-9_-]+)(&backgroundColor=[a-zA-Z0-9,]+)?(&size=\d+)?/g,
        "https://i.pravatar.cc/1000?u=$2"
      );

      // Also there was a specific replacement for `ui-avatars` if anything was missed.
      newContent = newContent.replace(
        /https:\/\/ui-avatars\.com\/api\/\?name=\$\{([^}]+)\}&background=random&size=512/g,
        "https://i.pravatar.cc/1000?u=${$1}"
      );

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
});
