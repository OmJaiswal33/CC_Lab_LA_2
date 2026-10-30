from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import StoredFile
from .serializers import StoredFileSerializer
from .s3_service import upload_file_to_storage, delete_file_from_storage

class FileListUploadView(APIView):
    """
    GET: List all files stored in database (RDS MySQL in AWS)
    POST: Upload a new file (Stores file in S3, saves metadata in RDS MySQL)
    """
    def get(self, request):
        files = StoredFile.objects.all()
        serializer = StoredFileSerializer(files, many=True)
        
        # Calculate summary statistics
        total_files = files.count()
        total_bytes = sum(f.file_size for f in files)
        
        storage_mode = "AWS S3" if getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '') else "Local Storage"
        db_mode = "AWS RDS (MySQL)" if getattr(settings, 'USE_AWS_RDS', False) else "Local SQLite"

        return Response({
            "files": serializer.data,
            "stats": {
                "total_files": total_files,
                "total_bytes": total_bytes,
                "storage_mode": storage_mode,
                "db_mode": db_mode,
                "bucket_name": getattr(settings, 'AWS_STORAGE_BUCKET_NAME', '') or "Not connected"
            }
        }, status=status.HTTP_200_OK)

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Upload to S3 (or local media fallback)
            s3_key, file_url = upload_file_to_storage(uploaded_file)

            # Store metadata in RDS
            stored_file = StoredFile.objects.create(
                original_name=uploaded_file.name,
                file_type=uploaded_file.content_type or 'application/octet-stream',
                file_size=uploaded_file.size,
                s3_key=s3_key,
                file_url=file_url
            )

            serializer = StoredFileSerializer(stored_file)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileDetailDeleteView(APIView):
    """
    DELETE: Delete a file from S3 and remove metadata from RDS
    """
    def delete(self, request, pk):
        try:
            stored_file = StoredFile.objects.get(pk=pk)
            delete_file_from_storage(stored_file.s3_key)
            stored_file.delete()
            return Response({"message": "File deleted successfully"}, status=status.HTTP_200_OK)
        except StoredFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
