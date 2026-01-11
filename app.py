from flask import Flask, render_template, jsonify, request
import requests
from urllib.parse import quote

app = Flask(__name__)
API_BASE = "https://www.sankavollerei.com"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detail')
def detail():
    url = request.args.get('url')
    if not url:
        return render_template('error.html', 
                             error_title="Missing URL",
                             error_message="URL parameter is required"), 400
    
    try:
        encoded_url = quote(url, safe='')
        response = requests.get(f"{API_BASE}/anime/neko/get?url={encoded_url}", timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result.get('status') == 'success' and result.get('data'):
            data = result['data']
            if not data.get('title'):
                return render_template('error.html',
                                     error_title="Incomplete Data",
                                     error_message="Anime details are incomplete. Please try another anime."), 500
            return render_template('detail.html', data=data)
        else:
            return render_template('error.html',
                                 error_title="Failed to Load",
                                 error_message="Failed to load anime details. Please try again."), 500
    except requests.RequestException as e:
        return render_template('error.html',
                             error_title="Connection Error",
                             error_message=f"Error connecting to server: {str(e)}"), 500

@app.route('/api/latest')
def get_latest():
    try:
        response = requests.get(f"{API_BASE}/anime/neko/latest", timeout=10)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/release/<int:page>')
def get_release(page):
    try:
        response = requests.get(f"{API_BASE}/anime/neko/release/{page}", timeout=10)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/detail')
def get_detail():
    url = request.args.get('url')
    if not url:
        return jsonify({"status": "error", "message": "URL parameter is required"}), 400
    
    try:
        encoded_url = quote(url, safe='')
        response = requests.get(f"{API_BASE}/anime/neko/get?url={encoded_url}", timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result.get('status') == 'success' and result.get('data'):
            data = result['data']
            if not data.get('title') or (not data.get('img') and not data.get('sinopsis')):
                return jsonify({
                    "status": "error", 
                    "message": "Incomplete anime data",
                    "data": data
                }), 206
        
        return jsonify(result)
    except requests.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/search/<query>')
def search_anime(query):
    try:
        response = requests.get(f"{API_BASE}/anime/neko/search/{query}", timeout=10)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/categories')
def get_categories():
    categories = [
        {"name": "Action", "icon": "💥"},
        {"name": "Adventure", "icon": "🗺️"},
        {"name": "Comedy", "icon": "😂"},
        {"name": "Drama", "icon": "🎭"},
        {"name": "Fantasy", "icon": "✨"},
        {"name": "Horror", "icon": "👻"},
        {"name": "Mystery", "icon": "🔍"},
        {"name": "Romance", "icon": "💖"},
        {"name": "Sci-Fi", "icon": "🚀"},
        {"name": "Slice of Life", "icon": "🏡"},
        {"name": "Sports", "icon": "⚽"},
        {"name": "Supernatural", "icon": "🔮"},
        {"name": "Ecchi", "icon": "😏"},
        {"name": "Harem", "icon": "👨‍👩‍👧‍👦"},
        {"name": "Mecha", "icon": "🤖"},
        {"name": "Music", "icon": "🎵"},
        {"name": "School", "icon": "🏫"},
        {"name": "Shoujo", "icon": "👧"},
        {"name": "Shounen", "icon": "👦"},
        {"name": "Seinen", "icon": "👨"},
        {"name": "Josei", "icon": "👩"},
        {"name": "Isekai", "icon": "🌍"},
        {"name": "Historical", "icon": "🏛️"},
        {"name": "Military", "icon": "🎖️"}
    ]
    return jsonify({"categories": categories})

@app.route('/api/random')
def get_random():
    max_retries = 5
    for attempt in range(max_retries):
        try:
            response = requests.get(f"{API_BASE}/anime/neko/random", timeout=10)
            response.raise_for_status()
            result = response.json()
            
            if result.get('status') == 'success':
                title = result.get('title', '')
                img = result.get('img', '')
                synopsis = result.get('synopsis', '')
                
                if title and (img or synopsis):
                    return jsonify(result)
                elif attempt < max_retries - 1:
                    continue
                else:
                    return jsonify({
                        "status": "partial",
                        "message": "Random anime found but details are limited",
                        "data": result
                    })
            
            return jsonify(result)
            
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                continue
            return jsonify({"status": "error", "message": str(e)}), 500
    
    return jsonify({"status": "error", "message": "Failed to get random anime after multiple attempts"}), 500

@app.route('/proxy-image')
def proxy_image():
    image_url = request.args.get('url')
    if not image_url:
        return "URL parameter is required", 400
    
    try:
        response = requests.get(image_url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://nekopoi.care/'
        })
        response.raise_for_status()
        
        from flask import Response
        return Response(
            response.content,
            mimetype=response.headers.get('content-type', 'image/jpeg'),
            headers={'Cache-Control': 'public, max-age=86400'}
        )
    except requests.RequestException:
        from flask import send_file
        import io
        return send_file(
            io.BytesIO(b''),
            mimetype='image/png'
        ), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)