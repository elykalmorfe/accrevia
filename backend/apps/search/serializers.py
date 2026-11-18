from rest_framework import serializers


class SearchRequestSerializer(serializers.Serializer):
    q = serializers.CharField()
    limit = serializers.IntegerField(required=False, min_value=1, max_value=50)
    frameworkId = serializers.CharField(required=False, allow_blank=True)
    areaId = serializers.CharField(required=False, allow_blank=True)
    criterionId = serializers.CharField(required=False, allow_blank=True)
    indicatorId = serializers.CharField(required=False, allow_blank=True)
    campusId = serializers.CharField(required=False, allow_blank=True)
    program = serializers.CharField(required=False, allow_blank=True)
    confidentiality = serializers.CharField(required=False, allow_blank=True)