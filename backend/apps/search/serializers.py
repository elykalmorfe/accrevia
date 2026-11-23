from rest_framework import serializers


class SearchRequestSerializer(serializers.Serializer):
    q = serializers.CharField()
    limit = serializers.IntegerField(required=False, min_value=1, max_value=50)
    docType = serializers.CharField(required=False, allow_blank=True)
    program = serializers.CharField(required=False, allow_blank=True)
    academicYear = serializers.CharField(required=False, allow_blank=True)
    workspaceDocumentIds = serializers.ListField(child=serializers.CharField(), required=False)
