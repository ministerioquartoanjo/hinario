import sys

with open('remote-control.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find script boundaries safely
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '<script type="module">' in line:
        start_idx = i
    if start_idx != -1 and '</script>' in line and i > start_idx:
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
    sys.exit(1)

script_lines = lines[start_idx+1:end_idx]

# Fix import
for i, line in enumerate(script_lines):
    if 'import { searchLogic }' in line:
        script_lines[i] = line.replace('./src/utils/searchLogic.js', './searchLogic.js')

with open('src/utils/remote-control.js', 'w', encoding='utf-8') as f:
    f.writelines(script_lines)

new_html_lines = lines[:start_idx] + ['    <script type="module" src="src/utils/remote-control.js"></script>\n'] + lines[end_idx+1:]

with open('remote-control.html', 'w', encoding='utf-8') as f:
    f.writelines(new_html_lines)
print("Extraction complete")
