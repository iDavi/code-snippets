import os
import asyncio
import aiohttp
import feedparser
from datetime import datetime
import sib_api_v3_sdk
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "odavi20527@gmail.com")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL", "odavi20527@gmail.com")
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

# RSS Feeds (International Sources - Expanded List)
RSS_FEEDS = [
    # USA
    {"name": "CNN", "url": "http://rss.cnn.com/rss/edition.rss", "country": "USA"},
    {"name": "ABC News", "url": "https://abcnews.go.com/abcnews/topstories", "country": "USA"},
    {"name": "Fox News", "url": "https://moxie.foxnews.com/google-publisher/latest.xml", "country": "USA"},
    {"name": "NY Times", "url": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", "country": "USA"},
    {"name": "Washington Post", "url": "https://feeds.washingtonpost.com/rss/national", "country": "USA"},
    {"name": "NBC News", "url": "https://www.nbcnews.com/id/3032084/device/news/rss?deviceName=rss&brandingCount=0", "country": "USA"},
    {"name": "CBS News", "url": "https://www.cbsnews.com/latest/rss/main", "country": "USA"},
    {"name": "NPR", "url": "https://feeds.npr.org/1001/rss.xml", "country": "USA"},
    {"name": "Politico", "url": "https://www.politico.com/rss/politics08.xml", "country": "USA"},
    
    # UK
    {"name": "BBC News", "url": "http://feeds.bbci.co.uk/news/rss.xml", "country": "UK"},
    {"name": "The Guardian", "url": "https://www.theguardian.com/uk/rss", "country": "UK"},
    {"name": "Sky News", "url": "https://news.sky.com/tools/rss", "country": "UK"},
    {"name": "Daily Mail", "url": "https://www.dailymail.co.uk/home/index.rss", "country": "UK"},
    {"name": "The Telegraph", "url": "https://www.telegraph.co.uk/rss.xml", "country": "UK"},
    {"name": "Independent", "url": "https://static.independent.co.uk/rss.xml", "country": "UK"},
    {"name": "Reuters UK", "url": "https://www.reutersagency.com/feed/?best-topics=news&post_type=best", "country": "UK"},
    
    # Europe
    {"name": "Le Monde", "url": "https://www.lemonde.fr/rss/une.xml", "country": "France"},
    {"name": "Der Spiegel", "url": "https://www.spiegel.de/schlagzeilen/index.rss", "country": "Germany"},
    {"name": "El País", "url": "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada", "country": "Spain"},
    {"name": "Corriere della Sera", "url": "https://www.corriere.it/rss/homepage.xml", "country": "Italy"},
    {"name": "La Repubblica", "url": "https://www.repubblica.it/rss/homepage/rss2.0.xml", "country": "Italy"},
    {"name": "Euronews", "url": "https://www.euronews.com/rss", "country": "Europe"},
    {"name": "Deutsche Welle", "url": "https://rss.dw.com/xml/rss-en-all", "country": "Germany"},
    {"name": "France 24", "url": "https://www.france24.com/en/rss", "country": "France"},
    {"name": "RT News", "url": "https://www.rt.com/rss/", "country": "Russia"},
    {"name": "TASS", "url": "https://tass.com/rss/v2.xml", "country": "Russia"},
    {"name": "Polityka", "url": "https://www.polityka.pl/rss", "country": "Poland"},
    
    # Asia
    {"name": "NHK World", "url": "https://www3.nhk.or.jp/nhkworld/en/news/feeds/rss/news.xml", "country": "Japan"},
    {"name": "Asahi Shimbun", "url": "https://www.asahi.com/ajw/rss/headline.xml", "country": "Japan"},
    {"name": "Xinhua", "url": "http://www.xinhuanet.com/english/rss/worldrss.xml", "country": "China"},
    {"name": "South China Morning Post", "url": "https://www.scmp.com/rss/320729/feed", "country": "Hong Kong"},
    {"name": "Times of India", "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", "country": "India"},
    {"name": "Hindu", "url": "https://www.thehindu.com/news/national/feeder/default.rss", "country": "India"},
    {"name": "Korea Herald", "url": "http://www.koreaherald.com/common/rss_xml.php?ct=1", "country": "South Korea"},
    {"name": "Yonhap", "url": "https://en.yna.co.kr/channel/RSS/index.xml", "country": "South Korea"},
    {"name": "Bangkok Post", "url": "https://www.bangkokpost.com/rss", "country": "Thailand"},
    {"name": "Jakarta Post", "url": "https://www.thejakartapost.com/rss", "country": "Indonesia"},
    
    # Middle East
    {"name": "Al Jazeera", "url": "https://www.aljazeera.com/xml/rss/all.xml", "country": "Qatar"},
    {"name": "Arab News", "url": "https://www.arabnews.com/rss", "country": "Saudi Arabia"},
    {"name": "Haaretz", "url": "https://www.haaretz.com/cdn/content/rss/export.xml", "country": "Israel"},
    {"name": "Jerusalem Post", "url": "https://www.jpost.com/rss", "country": "Israel"},
    {"name": "Daily Star Lebanon", "url": "https://www.dailystar.com.lb/rss.aspx", "country": "Lebanon"},
    
    # Americas (Non-US)
    {"name": "CBC", "url": "https://www.cbc.ca/cmlink/rss-topstories", "country": "Canada"},
    {"name": "Globe and Mail", "url": "https://www.theglobeandmail.com/rss/", "country": "Canada"},
    {"name": "Globo", "url": "https://g1.globo.com/rss/g1/", "country": "Brazil"},
    {"name": "Folha de S.Paulo", "url": "https://www1.folha.uol.com.br/rss/folhaemportugues.xml", "country": "Brazil"},
    {"name": "Clarín", "url": "https://www.clarin.com/rss/portada/", "country": "Argentina"},
    {"name": "La Nación", "url": "https://www.lanacion.com.ar/rss", "country": "Argentina"},
    {"name": "El Universal", "url": "https://www.eluniversal.com.mx/rss", "country": "Mexico"},
    {"name": "Reforma", "url": "https://www.reforma.com/rss", "country": "Mexico"},
    
    # Africa & Oceania
    {"name": "Sydney Morning Herald", "url": "https://www.smh.com.au/rssfeed/rss_topstories.xml", "country": "Australia"},
    {"name": "ABC Australia", "url": "https://www.abc.net.au/news/feed/51120/rss.xml", "country": "Australia"},
    {"name": "NZ Herald", "url": "https://www.nzherald.co.nz/arc/outboundfeeds/rss/", "country": "New Zealand"},
    {"name": "News24", "url": "https://www.news24.com/rss", "country": "South Africa"},
    {"name": "IOL", "url": "https://www.iol.co.za/rss", "country": "South Africa"},
    {"name": "Daily Nation", "url": "https://www.nation.africa/kenya/rss", "country": "Kenya"},
]

async def fetch_feed(session, url, name, country):
    try:
        async with session.get(url, timeout=10) as response:
            if response.status == 200:
                xml_content = await response.text()
                feed = feedparser.parse(xml_content)
                entries = []
                for entry in feed.entries[:5]: # Get top 5 per source
                    summary = entry.get('summary', '')
                    # Clean HTML tags from summary
                    clean_summary = ''.join([c for c in summary if c.isalnum() or c.isspace() or c in '. ,!?;:'])
                    if len(clean_summary) > 200:
                        clean_summary = clean_summary[:200] + "..."
                    
                    image = None
                    # Try to find image
                    if 'media_content' in entry:
                        for media in entry.media_content:
                            if media.get('medium') == 'image':
                                image = media['url']
                                break
                    elif 'enclosures' in entry:
                        for enc in entry.enclosures:
                            if enc.type.startswith('image'):
                                image = enc.href
                                break
                    
                    entries.append({
                        "title": entry.title,
                        "link": entry.link,
                        "summary": clean_summary,
                        "image": image,
                        "source": name
                    })
                return {"country": country, "source": name, "entries": entries}
            else:
                return None
    except Exception as e:
        print(f"Error fetching {name}: {e}")
        return None

async def main():
    print(f"🚀 Starting Punk News Digest Fetcher...")
    
    # Fetch all feeds in parallel
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_feed(session, feed['url'], feed['name'], feed['country']) for feed in RSS_FEEDS]
        results = await asyncio.gather(*tasks)
    
    # Organize by country
    news_by_country = {}
    for result in results:
        if result:
            country = result['country']
            if country not in news_by_country:
                news_by_country[country] = []
            news_by_country[country].extend(result['entries'])

    # Generate HTML
    html_content = generate_html(news_by_country)
    
    # Send Email
    send_email(html_content)

def generate_html(news_by_country):
    css = """
    <style>
        body { font-family: 'Courier New', Courier, monospace; background-color: #000000; color: #FFFFFF; margin: 0; padding: 20px; }
        h1 { color: #FF0000; text-transform: uppercase; border-bottom: 4px solid #0000FF; padding-bottom: 10px; font-size: 32px; letter-spacing: 2px; }
        h2 { color: #0000FF; text-transform: uppercase; border-left: 5px solid #FF0000; padding-left: 15px; margin-top: 40px; font-size: 24px; }
        .card { border: 2px solid #FF0000; background-color: #111; margin-bottom: 20px; padding: 15px; }
        .card:hover { background-color: #222; border-color: #0000FF; }
        .title { color: #FFFFFF; font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; display: block; text-decoration: none; }
        .title:hover { color: #FF0000; text-decoration: underline; }
        .summary { color: #CCCCCC; font-size: 16px; line-height: 1.5; margin-top: 10px; }
        .meta { color: #0000FF; font-size: 14px; margin-top: 10px; font-weight: bold; }
        .footer { margin-top: 50px; border-top: 2px solid #0000FF; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }
        img { max-width: 100%; height: auto; border: 1px solid #333; margin-top: 10px; }
    </style>
    """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>{css}</head>
    <body>
        <h1>⚡ INTERNATIONAL PUNK NEWS DIGEST ⚡</h1>
        <p style="color: #666; font-size: 14px;">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    """
    
    for country, articles in sorted(news_by_country.items()):
        html += f"<h2>/// {country.upper()} ///</h2>"
        for article in articles:
            img_tag = f'<img src="{article["image"]}" alt="News Image">' if article["image"] else '<div style="background:#333; color:#666; padding:20px; text-align:center;">NO IMAGE AVAILABLE</div>'
            html += f"""
            <div class="card">
                <a href="{article['link']}" class="title">{article['title']}</a>
                {img_tag}
                <div class="summary">{article['summary']}</div>
                <div class="meta">SOURCE: {article['source'].upper()}</div>
            </div>
            """
    
    html += """
        <div class="footer">
            GENERATED BY VIBE-CODED NEWS DIGEST // NO GRADIENTS ALLOWED // SOLID COLORS ONLY
        </div>
    </body>
    </html>
    """
    return html

def send_email(html_content):
    if not BREVO_API_KEY:
        print("❌ Brevo API Key not found. Saving HTML locally only.")
        with open("news_digest.html", "w", encoding="utf-8") as f:
            f.write(html_content)
        print("✅ HTML saved to news_digest.html")
        return

    try:
        client = Brevo(api_key=BREVO_API_KEY)
        
        send_smtp_email = SendTransacEmailRequest(
            sender={"email": SENDER_EMAIL, "name": "Punk News Bot"},
            to=[{"email": RECIPIENT_EMAIL}],
            subject="⚡ PUNK NEWS DIGEST // INTERNATIONAL EDITION",
            html_content=html_content
        )

        api_response = client.transactional_emails.send_transac_email(send_smtp_email)
        print(f"✅ Email sent successfully! Message ID: {api_response.message_id}")
        
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        with open("news_digest.html", "w", encoding="utf-8") as f:
            f.write(html_content)
        print("✅ HTML saved to news_digest.html")

if __name__ == "__main__":
    asyncio.run(main())
