import asyncio
import boto3
from botocore.client import Config
from app.config import get_settings

class R2StorageService:
    def __init__(self):
        settings = get_settings()
        self.client = boto3.client(
            's3',
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        self.bucket_name = settings.r2_bucket_name
        self.public_url = settings.r2_public_url

    async def upload_file(self, file_path: str, key: str, content_type: str = 'image/webp') -> str:
        def _upload():
            self.client.upload_file(
                file_path, 
                self.bucket_name, 
                key, 
                ExtraArgs={'ContentType': content_type}
            )
        await asyncio.to_thread(_upload)
        return f"{self.public_url}/{key}"

    async def upload_bytes(self, data: bytes, key: str, content_type: str = 'image/webp') -> str:
        def _upload():
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=data,
                ContentType=content_type
            )
        await asyncio.to_thread(_upload)
        return f"{self.public_url}/{key}"

    async def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        def _get_url():
            return self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': key},
                ExpiresIn=expires_in
            )
        return await asyncio.to_thread(_get_url)

    async def delete_file(self, key: str) -> bool:
        def _delete():
            try:
                self.client.delete_object(Bucket=self.bucket_name, Key=key)
                return True
            except Exception:
                return False
        return await asyncio.to_thread(_delete)
