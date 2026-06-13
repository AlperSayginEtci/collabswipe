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
        /https:\/\/i\.pravatar\.cc\/1000\?u=[^`'"]+/g,
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024"
      );

      // Just in case there are any dicebear or ui-avatars left over
      newContent = newContent.replace(
        /https:\/\/api\.dicebear\.com\/7\.x\/[^\/]+\/(png|svg)\?seed=[^`'"]+/g,
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024"
      );

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
});
