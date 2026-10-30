from django.contrib import admin
from .models import StoredFile

@admin.register(StoredFile)
class StoredFileAdmin(admin.ModelAdmin):
    list_display = ('original_name', 'file_size', 'file_type', 'uploaded_at', 's3_key')
    search_fields = ('original_name', 's3_key')
