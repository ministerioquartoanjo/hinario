const fs = require('fs');

const lines = fs.readFileSync('remote-control.html', 'utf-8').split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<script type="module">')) {
        startIdx = i;
    }
    if (startIdx !== -1 && lines[i].includes('</script>') && i > startIdx) {
        endIdx = i;
        break;
    }
}

if (startIdx === -1 || endIdx === -1) {
    console.log("Could not find boundaries");
    process.exit(1);
}

const scriptLines = lines.slice(startIdx + 1, endIdx);

for (let i = 0; i < scriptLines.length; i++) {
    if (scriptLines[i].includes('import { searchLogic }')) {
        scriptLines[i] = scriptLines[i].replace('./src/utils/searchLogic.js', './searchLogic.js');
    }
}

fs.writeFileSync('src/utils/remote-control.js', scriptLines.join('\n'));

const newHtmlLines = [
    ...lines.slice(0, startIdx),
    '    <script type="module" src="src/utils/remote-control.js"></script>',
    ...lines.slice(endIdx + 1)
];

fs.writeFileSync('remote-control.html', newHtmlLines.join('\n'));
console.log("Extraction complete");
