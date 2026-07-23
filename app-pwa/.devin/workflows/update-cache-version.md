---
description: Update cache version after JSON modifications
---

# Update Cache Version Workflow

## When to Use
Use this workflow when you have modified JSON hymn files and need to update the cache version to force refresh for offline users.

## Steps

### 1. Check What Changed
```bash
# See which JSON files were modified
git status | grep "data/hinos"
git diff --name-only | grep "data/hinos"
```

### 2. Update Cache Version
Open `/projetos/mqa/hinario/hinario/pwa/script.js` and update line 1752:

```javascript
let cacheVersion = '1.0.1'; // Auto-increment when JSON files change
```

### 3. Version Guidelines
- **1.0.1 → 1.0.2**: Small corrections (typos, formatting)
- **1.0.2 → 1.1.0**: New hymns added, significant updates
- **1.1.0 → 2.0.0**: Major structural changes

### 4. Deploy
```bash
npm run build
npm run deploy:rsync
```

### 5. Verify Update
After deploy, users will see:
- Alert: "Os hinos foram atualizados! Por favor, sincronize novamente para obter as últimas versões."
- Cache count resets to 0
- Re-sync downloads latest versions

## Quick Commands

### For small corrections:
```bash
# Update script.js cache version to 1.0.1
sed -i "s/cacheVersion = '1.0.0'/cacheVersion = '1.0.1'/" script.js
```

### For new hymns:
```bash
# Update script.js cache version to 1.1.0  
sed -i "s/cacheVersion = '1.0.[0-9]'/cacheVersion = '1.1.0'/" script.js
```

## Manual Force Update (Development)
If you need to force cache update without changing version:

```javascript
// In browser console:
await forceCacheUpdate();
```

This will:
- Clear JSON cache immediately
- Update version timestamp
- Reset cache counter
- Notify user to re-sync

## Verification
After update, check:
1. Cache version changed in script.js
2. Users get update notification
3. Re-sync downloads new files
4. Old files are replaced

## Impact
- ✅ Users with old cache get notification
- ✅ New downloads get latest versions  
- ✅ MP3 cache is preserved
- ✅ No data loss during update
