---
description: Update version in centralized location
---

# Version Update Rule

## When to Apply
This rule should be triggered when:
- You need to update the app version number
- New features are added
- Bug fixes are released
- Major/minor/patch updates

## What to Do
Update the version in **one place only**:

### File to Edit: `/projetos/mqa/hinario/hinario/pwa/version.js`

```javascript
export const APP_VERSION = '26.02.13.2'; // Change this line only
```

## Auto-Update Locations
The system will automatically update version in:
- `index.html` - Main app header
- `remote-control.html` - Remote control header
- Any element with `id="app-version"`

## Version Format
Use semantic versioning: `YY.MM.DD.PATCH`
- **YY**: Year (26 = 2026)
- **MM**: Month (02 = February)  
- **DD**: Day (13 = 13th)
- **PATCH**: Increment for multiple releases per day

## Examples

### New feature:
```javascript
export const APP_VERSION = '26.02.13.3';
```

### Bug fix:
```javascript
export const APP_VERSION = '26.02.13.4';
```

### Next day:
```javascript
export const APP_VERSION = '26.02.14.1';
```

## Benefits
- ✅ Single source of truth
- ✅ No duplicate version management
- ✅ Automatic synchronization across files
- ✅ Consistent version display everywhere

## Verification
After updating `version.js`:
1. Build the project: `npm run build`
2. Check both HTML files show new version
3. Deploy: `npm run deploy:rsync`

## Do NOT Edit Directly
Never edit version in these files (they auto-update):
- ❌ `index.html`
- ❌ `remote-control.html` 
- ❌ Any other HTML files

Only edit: `/projetos/mqa/hinario/hinario/pwa/version.js`
