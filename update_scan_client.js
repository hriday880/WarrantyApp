const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/scan/[id]/ScanClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace export default function ScanPage with ScanClient
content = content.replace(
  /export default function ScanPage\(\{ params \}: \{ params: Promise<\{ id: string \}> \}\) \{/,
  'export default function ScanClient({ productId }: { productId: string }) {'
);

// Remove the use(params) lines
content = content.replace(/  const resolvedParams = use\(params\);\n/, '');
content = content.replace(/  const productId = resolvedParams.id;\n/, '');

// Remove the import { use } from 'react'
content = content.replace(/import \{ useEffect, useState, use \} from 'react';/, "import { useEffect, useState } from 'react';");

// Remove router since we don't use it anymore
content = content.replace(/import \{ useRouter \} from 'next\/navigation';\n/, '');
content = content.replace(/  const router = useRouter\(\);\n/, '');

// Remove 401 checks
content = content.replace(/      if \(getRes\.status === 401\) \{\n        window\.location\.assign\(\`\/login\?returnTo=\/scan\/\$\{productId\}\`\);\n        return;\n      \}\n/, '');
content = content.replace(/      if \(res\.status === 401\) \{\n        window\.location\.assign\(\`\/login\?returnTo=\/scan\/\$\{productId\}\`\);\n        return;\n      \}\n/, '');

fs.writeFileSync(filePath, content);
