---
description: Auto-update cache version when JSON files are modified
---

# Cache Version Update Rule

## When to Apply
This rule should be triggered automatically when:
- Any JSON file in `public/data/hinos/` is modified
- `public/data/hymns-index.json` is modified
- New JSON files are added to the hinos directory

## What to Do
When JSON files are modified, automatically update the `cacheVersion` variable in `script.js`:

### Steps:
1. **Increment cache version** in `/projetos/mqa/hinario/hinario/pwa/script.js` line 1752:
   ```javascript
   let cacheVersion = '1.0.1'; // Auto-increment when JSON files change
   ```

2. **Version format**: Use semantic versioning `major.minor.patch`
   - **Patch**: Small corrections (1.0.1 → 1.0.2)
   - **Minor**: New hymns added (1.0.2 → 1.1.0)  
   - **Major**: Structural changes (1.1.0 → 2.0.0)

3. **Update logic**: The system will automatically:
   - Clear old JSON cache on next load
   - Notify users to re-sync
   - Preserve MP3 cache

## Examples

### After correcting hymn 013.json:
```javascript
let cacheVersion = '1.0.1'; // Increment patch version
```

### After adding new hymns:
```javascript
let cacheVersion = '1.1.0'; // Increment minor version
```

### After major restructuring:
```javascript
let cacheVersion = '2.0.0'; // Increment major version
```

## Why This Matters
- Ensures users get corrected/updated hymn lyrics
- Forces cache refresh for offline users
- Maintains data consistency across all installations
- Prevents serving outdated content

## Auto-Trigger
This rule should be automatically applied by Windsurf when:
- `git diff` shows changes in `public/data/hinos/*.json`
- `git diff` shows changes in `public/data/hymns-index.json`
- New files are detected in the hinos directory
