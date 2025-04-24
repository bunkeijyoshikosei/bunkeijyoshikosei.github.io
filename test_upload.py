# test_upload.py
import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from PIL import Image

def main():
    # .envファイルから環境変数を読み込む
    load_dotenv()
    
    # Cloudinaryの設定
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )

    # テスト画像のパス
    test_image = 'images/profile.jpg'
    
    # アップロード
    try:
        result = cloudinary.uploader.upload(
            test_image,
            folder="youtube/bunkeijyoshikosei/test",
            public_id="test_thumbnail",
            resource_type="image"
        )
        print("アップロード成功！")
        print(f"URL: {result['secure_url']}")
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == '__main__':
    main()