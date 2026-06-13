const fs = require('fs');

// Fix network.tsx
let networkTsx = fs.readFileSync('apps/mobile/app/network.tsx', 'utf8');
networkTsx = networkTsx.replace(
  /@\{item\.username\s*\|\|\s*displayName\.toLowerCase\(\)\.replace\(\/\\\\s\+\/g,\s*''\)\}/g,
  "@{displayName.toLowerCase().replace(/\\s+/g, '')}"
);
fs.writeFileSync('apps/mobile/app/network.tsx', networkTsx);

// Fix matches.tsx
let matchesTsx = fs.readFileSync('apps/mobile/app/(tabs)/matches.tsx', 'utf8');
matchesTsx = matchesTsx.replace(
  /\{item\.username && <Text style=\{styles\.convTime\}>@\{item\.username\}<\/Text>\}/g,
  ""
);
fs.writeFileSync('apps/mobile/app/(tabs)/matches.tsx', matchesTsx);

// Fix profile.tsx
let profileTsx = fs.readFileSync('apps/mobile/app/(tabs)/profile.tsx', 'utf8');
profileTsx = profileTsx.replace(/const \[editUsername, setEditUsername\] = useState\(''\);\n?/g, '');
profileTsx = profileTsx.replace(/setEditUsername\(user\.username \|\| ''\);\n?/g, '');
profileTsx = profileTsx.replace(/username:\s*editUsername\.trim\(\) === '' \? undefined : editUsername\.trim\(\),\n?/g, '');
profileTsx = profileTsx.replace(/<TextInput style=\{styles\.input\} value=\{editUsername\} onChangeText=\{setEditUsername\} placeholder="Kullanıcı Adı" autoCapitalize="none" \/>\n?/g, '');
profileTsx = profileTsx.replace(/<Text style=\{styles\.userUsername\}>@\{user\?\.username\}<\/Text>\n?/g, '');
fs.writeFileSync('apps/mobile/app/(tabs)/profile.tsx', profileTsx);

console.log("Mobile files fixed");
