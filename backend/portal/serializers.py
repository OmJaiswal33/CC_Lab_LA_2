from rest_framework import serializers
from .models import StoredFile

class StoredFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredFile
        fields = ['id', 'original_name', 'file_type', 'file_size', 's3_key', 'file_url', 'uploaded_at']
