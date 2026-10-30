from django.db import models

class StoredFile(models.Model):
    """
    Practical 7 (RDS MySQL): Stores file metadata.
    Practical 3 (S3): File object is stored in S3 with versioning enabled.
    """
    original_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100, blank=True, default='application/octet-stream')
    file_size = models.BigIntegerField(default=0)  # Size in bytes
    
    # Practical 3: S3 key & accessible file URL
    s3_key = models.CharField(max_length=255, blank=True, null=True)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_name} ({self.file_size} bytes)"
