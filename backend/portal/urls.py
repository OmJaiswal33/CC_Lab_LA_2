from django.urls import path
from .views import FileListUploadView, FileDetailDeleteView

urlpatterns = [
    path('files/', FileListUploadView.as_view(), name='file-list-upload'),
    path('files/<int:pk>/', FileDetailDeleteView.as_view(), name='file-detail-delete'),
]
