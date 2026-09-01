const fs = require('fs');

// 1. Update App.tsx
let appTsx = fs.readFileSync('mobile/App.tsx', 'utf8');
appTsx = appTsx.replace(
  "import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';",
  "import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';\nimport { Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';"
);
appTsx = appTsx.replace(
  "IBMPlexSansArabic_600SemiBold,",
  "IBMPlexSansArabic_600SemiBold,\n    Cairo_400Regular,\n    Cairo_500Medium,\n    Cairo_600SemiBold,\n    Cairo_700Bold,"
);
fs.writeFileSync('mobile/App.tsx', appTsx);

// 2. Update tokens.ts
let tokensTs = fs.readFileSync('mobile/src/theme/tokens.ts', 'utf8');
tokensTs = tokensTs.replace(/IBMPlexSansArabic_400Regular/g, 'Cairo_400Regular');
tokensTs = tokensTs.replace(/IBMPlexSansArabic_500Medium/g, 'Cairo_500Medium');
tokensTs = tokensTs.replace(/IBMPlexSansArabic_600SemiBold/g, 'Cairo_600SemiBold');
fs.writeFileSync('mobile/src/theme/tokens.ts', tokensTs);

