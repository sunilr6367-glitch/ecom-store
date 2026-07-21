import urllib.request
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://odhvica.com/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        html = response.read().decode('utf-8')
        match = re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', html)
        if match:
            print(f"Canonical URL: {match.group(1)}")
        else:
            print("No canonical tag found.")
except Exception as e:
    print(f"Error: {e}")
