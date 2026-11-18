"""View DTOs for documents."""
from rest_framework import serializers


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    frameworkId = serializers.CharField(required=False, default="ia")
    areaId = serializers.CharField(required=False, allow_blank=True, default="")
    criterionId = serializers.CharField(required=False, allow_blank=True, default="")
    indicatorId = serializers.CharField(required=False, allow_blank=True, default="")
    folderId = serializers.CharField(required=False, allow_blank=True, default="")
    docType = serializers.CharField(required=False, default="Other")
    academicYear = serializers.CharField(required=False, allow_blank=True, default="")
    cycle = serializers.CharField(required=False, allow_blank=True, default="")
    program = serializers.CharField(required=False, allow_blank=True, default="")
    college = serializers.CharField(required=False, allow_blank=True, default="")
    department = serializers.CharField(required=False, allow_blank=True, default="")
    office = serializers.CharField(required=False, allow_blank=True, default="")
    campus = serializers.CharField(required=False, allow_blank=True, default="")
    campusId = serializers.CharField(required=False, allow_blank=True, default="")
    confidentiality = serializers.CharField(required=False, default="Internal")
    uploadedBy = serializers.CharField(required=False, default="system")
    keywords = serializers.CharField(required=False, allow_blank=True, default="")


class DocumentStatusSerializer(serializers.Serializer):
    id = serializers.CharField()
    status = serializers.CharField()
    progress = serializers.DictField()
    chunkCount = serializers.IntegerField()
    ocrApplied = serializers.BooleanField()
    errorMessage = serializers.CharField(allow_null=True, required=False)
    indexedAt = serializers.CharField(allow_null=True, required=False)