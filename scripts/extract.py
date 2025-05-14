import json
import re
import logging
import os
from bs4 import BeautifulSoup

# Ensure the logging directory exists
log_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(log_dir, 'debug.log')

# Configuração do logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[logging.FileHandler(log_file), logging.StreamHandler()])

# Function to extract hymn data from HTML
def extract_hymns(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    hymns = []
    
    for div in soup.find_all('div', id=True):
        hymn = {}
        hymn['title'] = div.find('h1').text.strip()
        
        # Extract author
        author_tag = div.find('p', class_='MsoQuote')
        hymn['author'] = author_tag.text.strip() if author_tag else ''
        
        # Extract verses
        verses = []
        current_verse = []
        
        for p in div.find_all('p', class_='Corpo'):
            text = p.text.strip()
            if text.startswith(('1.', '2.', '3.', '4.', '5.')) and current_verse:
                verses.append(current_verse)
                current_verse = []
            current_verse.append(text)
        
        if current_verse:
            verses.append(current_verse)
        
        hymn['verses'] = verses
        
        # Extract chorus if exists
        chorus = []
        for p in div.find_all('p', class_='Corpo'):
            if p.find('span', style='color:#0070C0'):
                chorus.append(p.text.strip())
        
        if chorus:
            hymn['coro'] = chorus
        
        hymns.append(hymn)
    
    return hymns

# Main function to convert HTML to JS
def convert_hymns_to_js(html_file, js_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    hymns = extract_hymns(html_content)
    
    js_content = 'const hymns = ' + json.dumps(hymns, indent=4, ensure_ascii=False) + ';'
    
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)

# Execute the conversion
convert_hymns_to_js('hinos.html', '__hinos.js')