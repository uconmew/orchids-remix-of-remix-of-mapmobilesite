
import requests
import os

# Products that still have remote URLs
products_to_download = [
    {"id": "da2a7ea9-e029-489d-8b9d-eaffeba9b789", "url": "https://m.media-amazon.com/images/I/61pVoN2YQGL._AC_SL1500_.jpg"},
    {"id": "9be8b774-d05e-401f-8513-41ec30fdfd73", "url": "https://m.media-amazon.com/images/I/71BdDh2YGSL._AC_SL1500_.jpg"},
    {"id": "03e9f3a9-85be-4e15-85ea-12c81a8c35e9", "url": "https://m.media-amazon.com/images/I/71SjCF9-f7L._AC_SL1500_.jpg"},
    {"id": "1657aac0-db54-4019-a45b-77a951ee59da", "url": "https://m.media-amazon.com/images/I/71X7tPd3URL._AC_SL1500_.jpg"},
    {"id": "94cfc32f-aaee-49f1-990c-6aa8cf17fcaa", "url": "https://images.crutchfieldonline.com/ImageHandler/trim/3000/1950/products/2019/30/067/g067PROR5-F.jpg"},
    {"id": "7b0d3604-217a-4677-a828-718b136802c8", "url": "https://m.media-amazon.com/images/I/71VLy6dLs5L._AC_SL1500_.jpg"},
    {"id": "1b2ebbd5-4510-4783-8395-0ebf71e597ba", "url": "https://images.crutchfieldonline.com/ImageHandler/trim/3000/1950/products/2020/14/500/g500SA32F-F.jpg"},
    {"id": "b234a5b3-058a-495c-ad36-267a19d527c6", "url": "https://m.media-amazon.com/images/I/71f7wJPwJCL._AC_SL1500_.jpg"},
    {"id": "7e7a4a64-a2a6-4622-8b07-03b3d7b39cd5", "url": "https://m.media-amazon.com/images/I/71wRqVwXE5L._AC_SL1500_.jpg"},
    {"id": "5530949f-3dd2-42ab-93ac-a1e187fe5b8e", "url": "https://m.media-amazon.com/images/I/71jLFRMxFgL._AC_SL1500_.jpg"},
    {"id": "9098c2cd-47b2-4dea-93c2-bcefd8063363", "url": "https://m.media-amazon.com/images/I/61dhFNpRG8L._AC_SL1500_.jpg"},
    {"id": "2ee56d9a-93f3-4a4d-9d4f-be9630a2f99e", "url": "https://m.media-amazon.com/images/I/51zWR5hJ6BL._AC_SL1024_.jpg"},
    {"id": "ee692225-f813-4555-b2e7-5219addc4d7e", "url": "https://m.media-amazon.com/images/I/71e0gNFwIZL._AC_SL1500_.jpg"},
    {"id": "03e66186-e5d6-444b-924d-25325dd714b0", "url": "https://m.media-amazon.com/images/I/71MK5YQn0EL._AC_SL1500_.jpg"},
    {"id": "a5439a2b-62cc-4491-ba8f-72f768a6645c", "url": "https://m.media-amazon.com/images/I/71TQTQcrQGL._AC_SL1500_.jpg"},
    {"id": "e92cfe13-c521-4139-a4cf-2bf91bc38e9f", "url": "https://m.media-amazon.com/images/I/71nKZCGzQGL._AC_SL1500_.jpg"},
    {"id": "2ec0951d-4588-4e65-a1ea-491e62ed1555", "url": "https://m.media-amazon.com/images/I/71F5BDXVGTL._AC_SL1500_.jpg"},
    {"id": "130d2709-fa30-44dd-89f5-9aceed0c06ba", "url": "https://m.media-amazon.com/images/I/81d8fXPkQUL._AC_SL1500_.jpg"},
    {"id": "ff16b9bd-06fd-4521-874f-226de7e08547", "url": "https://m.media-amazon.com/images/I/71KxV9EHjKL._AC_SL1500_.jpg"},
    {"id": "aec451a4-32e1-4c63-a1f5-fa7d86e0591f", "url": "https://m.media-amazon.com/images/I/71zSA3I4PcL._AC_SL1500_.jpg"},
    {"id": "e12b8f25-b654-4da9-a3d5-2cfb923f573f", "url": "https://m.media-amazon.com/images/I/81V4TIZiCFL._AC_SL1500_.jpg"},
    {"id": "8ac76a8a-3e14-4b32-b837-26d95f5e9ec2", "url": "https://images.crutchfieldonline.com/ImageHandler/trim/3000/1950/products/2017/28/206/g20643C124-F.jpg"}
]

os.makedirs("public/products", exist_ok=True)
sql_updates = []

def download_image(url, filename):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, stream=True, timeout=15)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

for product in products_to_download:
    filename = f"public/products/{product['id']}.jpg"
    if download_image(product['url'], filename):
        print(f"Downloaded image for {product['id']}")
        sql_updates.append(f"UPDATE products SET image_url = '/products/{product['id']}.jpg' WHERE id = '{product['id']}';")

with open("update_images.sql", "w") as f:
    f.write("\n".join(sql_updates))
