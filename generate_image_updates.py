
import requests
import os

# High-quality car audio gear images for specific brands
brand_images = {
    "Kicker": "https://images.unsplash.com/photo-1616763355548-1b606f439f86?q=80&w=1000&auto=format&fit=crop", # Speaker/Sub style
    "Kenwood": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop", # Headunit style
    "JVC": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop", # Headunit style
    "Wet Sounds": "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop", # Marine/Outdoor speaker style
    "Skar Audio": "https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=1000&auto=format&fit=crop", # Subwoofer style
    "Compustar": "https://images.unsplash.com/photo-1562141961-b5d1856de1fb?q=80&w=1000&auto=format&fit=crop", # Security style
}

# Product-specific mapping using the correct IDs from the last SELECT
product_mapping = {
    "1dfa8777-d1ea-48f0-9dac-78f6091a8b5f": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop", # Alpine iLX-W650
    "e72fbdb1-d1bd-4a30-9d34-f12cc0348141": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1000&auto=format&fit=crop", # Alpine iLX-W670
    "56161179-27e8-42b5-8eb7-e5c77c0e2d8c": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1000&auto=format&fit=crop", # Sony XAV-AX5500
    "44fa7592-4390-414c-8440-34be36b5908a": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop", # Pioneer DMH-1770NEX
    "688b8c7f-b5c4-4f97-913b-f1edd0654207": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop", # Viper 4105V
    "8ce03f09-3ad9-4d2f-b327-e393678d1235": "https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=1000&auto=format&fit=crop", # Rockford P300-12
    "4a72948d-d432-46f9-8ecd-d5255be56737": "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop", # Kicker 46CSC654
    "c44d3a01-63a0-4994-a1a0-59521341e689": "https://images.unsplash.com/photo-1616763355548-1b606f439f86?q=80&w=1000&auto=format&fit=crop", # JL Audio C2-650
    "db21a579-5e80-4670-abbe-3cdc74038838": "https://images.unsplash.com/photo-1580238053495-b9720401fd45?q=80&w=1000&auto=format&fit=crop", # Skar RP-1200.1D
}

# Brands for remaining products to use brand_images
brand_map = {
    "da2a7ea9-e029-489d-8b9d-eaffeba9b789": "Viper",
    "9be8b774-d05e-401f-8513-41ec30fdfd73": "Viper",
    "03e9f3a9-85be-4e15-85ea-12c81a8c35e9": "Alpine",
    "1657aac0-db54-4019-a45b-77a951ee59da": "Alpine",
    "94cfc32f-aaee-49f1-990c-6aa8cf17fcaa": "Compustar",
    "7b0d3604-217a-4677-a828-718b136802c8": "Alpine",
    "1b2ebbd5-4510-4783-8395-0ebf71e597ba": "Alpine",
    "b234a5b3-058a-495c-ad36-267a19d527c6": "Alpine",
    "7e7a4a64-a2a6-4622-8b07-03b3d7b39cd5": "Alpine",
    "5530949f-3dd2-42ab-93ac-a1e187fe5b8e": "Alpine",
    "9098c2cd-47b2-4dea-93c2-bcefd8063363": "Compustar",
    "2ee56d9a-93f3-4a4d-9d4f-be9630a2f99e": "Compustar",
    "b73bb583-d806-4b40-9430-80ec45a4de97": "Kenwood",
    "fb8e935a-b36b-4af4-a065-5f6613002a09": "Kenwood",
    "39ab75dd-cc85-4465-afd0-12513ca5aa59": "Kenwood",
    "82f32f05-9c60-423f-aecf-804489b30e35": "JVC",
    "9b97cd90-7a1a-4af8-be5d-891efe5b0381": "Wet Sounds",
    "10d9df5e-c48a-4338-8a33-97e23bfaf8ff": "Wet Sounds",
    "0c22481e-8591-4132-9ac8-ddd1f3f6773f": "Skar Audio",
    "7163c910-12ae-40d1-9b32-bb323d8b5a75": "Skar Audio",
}

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

# Download specific products
for product_id, url in product_mapping.items():
    filename = f"public/products/{product_id}.jpg"
    if download_image(url, filename):
        sql_updates.append(f"UPDATE products SET image_url = '/products/{product_id}.jpg' WHERE id = '{product_id}';")

# Download brand-based fallbacks for others
for product_id, brand in brand_map.items():
    if brand in brand_images:
        url = brand_images[brand]
        filename = f"public/products/{product_id}.jpg"
        if download_image(url, filename):
            sql_updates.append(f"UPDATE products SET image_url = '/products/{product_id}.jpg' WHERE id = '{product_id}';")

with open("update_images.sql", "w") as f:
    f.write("\n".join(sql_updates))
