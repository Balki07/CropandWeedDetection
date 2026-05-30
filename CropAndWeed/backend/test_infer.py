import requests
url = 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png'
img = requests.get(url).content
try:
    r = requests.post('http://127.0.0.1:5000/api/infer/image', files={'file': ('test.png', img, 'image/png')})
    print('STATUS', r.status_code)
    print('TYPE', r.headers.get('content-type'))
    if r.status_code == 200:
        open('out.png','wb').write(r.content)
        print('Saved out.png')
    else:
        print('BODY', r.text[:500])
except Exception as e:
    print('ERROR', e)
