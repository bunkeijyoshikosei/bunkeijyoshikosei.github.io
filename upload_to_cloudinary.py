import os
from PIL import Image
from pathlib import Path
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

def resize_image(input_path, output_path, size):
    """画像を指定サイズにリサイズ"""
    with Image.open(input_path) as img:
        img = img.convert('RGB')
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path, 'JPEG', quality=80)

def upload_to_cloudinary(file_path, folder, public_id):
    """Cloudinaryに画像をアップロード"""
    try:
        result = cloudinary.uploader.upload(
            file_path,
            folder=folder,
            public_id=public_id,
            resource_type="image"
        )
        print(f"アップロード成功: {result['secure_url']}")
        return result['secure_url']
    except Exception as e:
        print(f"アップロードエラー: {e}")
        return None

def main():
    # 環境変数の読み込み
    load_dotenv()
    
    # Cloudinaryの設定
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )

    # ハードコーディングされた設定
    VIDEO_TITLE = "好きなこと＝仕事ってほんとにできるの？"  # 動画タイトル
    INPUT_IMAGE = "/Users/user_name/Library/CloudStorage/OneDrive-個人用/画像/YouTube Pictures/ゆっくり好きなこと/サムネイル.jpg"  # 入力画像パス

    # サイズの定義
    sizes = {
        '': (1280, 720),      # オリジナルサイズ
        '_middle': (640, 360), # 中サイズ
        '_small': (320, 180)   # 小サイズ
    }

    # 出力ディレクトリの作成
    output_dir = Path('thumbnails') / VIDEO_TITLE
    output_dir.mkdir(parents=True, exist_ok=True)

    # 入力ファイルの確認
    if not os.path.exists(INPUT_IMAGE):
        print(f"エラー: 入力画像が見つかりません: {INPUT_IMAGE}")
        return

    # 各サイズで処理
    for suffix, size in sizes.items():
        # 出力ファイル名の生成
        output_file = output_dir / f'thumbnail{suffix}.jpg'
        
        try:
            # リサイズ
            resize_image(INPUT_IMAGE, output_file, size)
            print(f"成功: {output_file} を作成しました")

            # Cloudinaryにアップロード
            cloudinary_folder = f"youtube/bunkeijyoshikosei/{VIDEO_TITLE}"
            cloudinary_public_id = f"thumbnail{suffix}"
            upload_to_cloudinary(str(output_file), cloudinary_folder, cloudinary_public_id)

        except Exception as e:
            print(f"エラー: {output_file} の処理に失敗しました: {e}")

if __name__ == '__main__':
    main()