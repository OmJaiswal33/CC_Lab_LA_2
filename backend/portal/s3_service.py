import os
import uuid
import boto3
from django.conf import settings
from django.core.files.storage import default_storage

def upload_file_to_storage(uploaded_file):
    """
    Handles file upload for CloudDrive.
    - If AWS S3 bucket name is configured (Practical 3 & 8): uploads to S3.
    - Otherwise (Local mode): stores in local media/files folder.
    Returns: (s3_key, file_url)
    """
    clean_name = os.path.basename(uploaded_file.name).replace(" ", "_")
    unique_prefix = uuid.uuid4().hex[:8]
    s3_key = f"files/{unique_prefix}_{clean_name}"

    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '').strip()
    region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')

    if bucket:
        # AWS S3 Upload using Boto3
        session_kwargs = {'region_name': region}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            session_kwargs['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
            session_kwargs['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY

        s3_client = boto3.client('s3', **session_kwargs)

        content_type = uploaded_file.content_type or 'application/octet-stream'
        s3_client.upload_fileobj(
            uploaded_file,
            bucket,
            s3_key,
            ExtraArgs={'ContentType': content_type}
        )

        file_url = f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"
        return s3_key, file_url
    else:
        # Local development fallback
        saved_path = default_storage.save(f"files/{unique_prefix}_{clean_name}", uploaded_file)
        file_url = f"/media/{saved_path}"
        return s3_key, file_url


def delete_file_from_storage(s3_key):
    """
    Deletes object from S3 if configured, or from local media storage.
    """
    bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '').strip()
    region = getattr(settings, 'AWS_S3_REGION_NAME', 'ap-south-1')

    if bucket and s3_key:
        try:
            session_kwargs = {'region_name': region}
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                session_kwargs['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
                session_kwargs['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
            s3_client = boto3.client('s3', **session_kwargs)
            s3_client.delete_object(Bucket=bucket, Key=s3_key)
        except Exception:
            pass
    elif s3_key:
        try:
            if default_storage.exists(s3_key):
                default_storage.delete(s3_key)
        except Exception:
            pass
