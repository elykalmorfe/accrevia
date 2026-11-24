"""Shared login accounts so every browser sees the same directory."""
from __future__ import annotations

from django.db import models


class DirectoryRevision(models.Model):
    """Monotonic counter bumped whenever the account directory changes."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    value = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "account_directory_revision"


class PortalAccount(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=120, blank=True, default="")
    middle_name = models.CharField(max_length=120, blank=True, default="")
    last_name = models.CharField(max_length=120, blank=True, default="")
    name = models.CharField(max_length=255, blank=True, default="")
    role = models.CharField(max_length=40, default="Faculty")
    password_hash = models.CharField(max_length=255, blank=True, default="")
    # pending | approved | rejected — checked at sign-in
    approval_status = models.CharField(max_length=20, default="pending")
    # Active | Pending Approval | Rejected | Deactivated | Invited
    portal_status = models.CharField(max_length=40, default="Pending Approval")
    office = models.CharField(max_length=255, blank=True, default="")
    employee_id = models.CharField(max_length=80, blank=True, default="")
    personnel_classification = models.CharField(max_length=160, blank=True, default="")
    affiliation_verified = models.BooleanField(default=False)
    last_login = models.CharField(max_length=40, blank=True, default="")
    registered_at = models.CharField(max_length=40, blank=True, default="")
    approved_by = models.CharField(max_length=255, blank=True, default="")
    approved_at = models.CharField(max_length=40, blank=True, default="")
    campus_id = models.CharField(max_length=80, blank=True, default="")
    assigned_areas = models.JSONField(default=list, blank=True)
    assigned_programs = models.JSONField(default=list, blank=True)
    allowed_features = models.JSONField(default=list, blank=True)
    must_change_password = models.BooleanField(default=False)
    is_default_superadmin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_accounts"
        indexes = [
            models.Index(fields=["portal_status"]),
            models.Index(fields=["approval_status"]),
        ]

    def display_name(self) -> str:
        if self.name.strip():
            return self.name.strip()
        composed = " ".join(
            part.strip() for part in (self.first_name, self.middle_name, self.last_name) if part and part.strip()
        )
        return composed or self.email

    def to_portal(self) -> dict:
        payload = {
            "id": self.id,
            "name": self.display_name(),
            "email": self.email,
            "role": self.role,
            "office": self.office,
            "status": self.portal_status,
            "lastLogin": self.last_login or None,
            "affiliationVerified": self.affiliation_verified,
            "registeredAt": self.registered_at or None,
        }
        if self.employee_id:
            payload["employeeId"] = self.employee_id
        if self.personnel_classification:
            payload["personnelClassification"] = self.personnel_classification
        if self.approved_by:
            payload["approvedBy"] = self.approved_by
        if self.approved_at:
            payload["approvedAt"] = self.approved_at
        if self.campus_id:
            payload["campusId"] = self.campus_id
        if self.assigned_areas:
            payload["assignedAreas"] = self.assigned_areas
        if self.assigned_programs:
            payload["assignedPrograms"] = self.assigned_programs
        # An empty list is not a restriction. The admin UI treats a missing list as full access.
        if self.allowed_features:
            payload["allowedFeatures"] = self.allowed_features
        return payload

    def to_session(self) -> dict:
        return {
            "id": self.id,
            "firstName": self.first_name,
            "middleName": self.middle_name,
            "lastName": self.last_name,
            "email": self.email,
            "role": self.role,
            "campusId": self.campus_id or None,
            "approvalStatus": self.approval_status,
            "mustChangePassword": self.must_change_password,
            "createdAt": self.registered_at or None,
        }


class PortalLiveBoard(models.Model):
    """Shared requests and notices. Each browser receives the slice for its role."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    revision = models.PositiveIntegerField(default=0)
    document_requests = models.JSONField(default=list, blank=True)
    notifications = models.JSONField(default=list, blank=True)
    access_requests = models.JSONField(default=list, blank=True)
    technical_reviews = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "portal_live_board"


class PortalCollection(models.Model):
    id = models.CharField(primary_key=True, max_length=160)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_collections"


class PortalRecord(models.Model):
    collection = models.ForeignKey(PortalCollection, on_delete=models.CASCADE, related_name="records")
    record_key = models.CharField(max_length=190)
    position = models.PositiveIntegerField()
    data = models.JSONField(null=True)

    class Meta:
        db_table = "portal_records"
        constraints = [models.UniqueConstraint(fields=["collection", "position"], name="portal_record_position")]


class PortalFileContent(models.Model):
    sha256 = models.CharField(primary_key=True, max_length=64)
    size_bytes = models.PositiveBigIntegerField()

    class Meta:
        db_table = "portal_file_contents"


class PortalFileChunk(models.Model):
    content = models.ForeignKey(PortalFileContent, on_delete=models.CASCADE, related_name="chunks")
    position = models.PositiveIntegerField()
    data = models.BinaryField()

    class Meta:
        db_table = "portal_file_chunks"
        constraints = [models.UniqueConstraint(fields=["content", "position"], name="portal_file_chunk_position")]


class PortalFile(models.Model):
    source = models.CharField(max_length=64)
    key = models.CharField(max_length=512)
    name = models.CharField(max_length=512)
    mime_type = models.CharField(max_length=128)
    content = models.ForeignKey(PortalFileContent, on_delete=models.PROTECT, related_name="files")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "portal_files"
        constraints = [models.UniqueConstraint(fields=["source", "key"], name="portal_file_key")]


class RepositoryClock(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    revision = models.PositiveBigIntegerField(default=0)


class RepositoryEntry(models.Model):
    kind = models.CharField(max_length=16)
    record_id = models.CharField(max_length=190)
    origin = models.CharField(max_length=32)
    framework = models.CharField(max_length=16)
    campus = models.CharField(max_length=64, blank=True)
    parent_id = models.CharField(max_length=190, blank=True)
    version = models.PositiveBigIntegerField(default=1)
    data = models.JSONField(default=dict)
    deleted = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['kind', 'record_id'], name='repository_record_identity')]
        indexes = [models.Index(fields=['kind', 'campus', 'deleted'])]


class RepositoryChange(models.Model):
    revision = models.PositiveBigIntegerField(primary_key=True)
    kind = models.CharField(max_length=16)
    record_id = models.CharField(max_length=190)
    before = models.JSONField(null=True)
    after = models.JSONField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class RepositoryOperation(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    account_id = models.CharField(max_length=64)
    result = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class RepositoryIndexDelivery(models.Model):
    record_id = models.CharField(primary_key=True, max_length=190)
    target_version = models.PositiveBigIntegerField()
    next_attempt = models.DateTimeField(db_index=True)
    attempts = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)


class RepositoryAccessAssignment(models.Model):
    user = models.ForeignKey(PortalAccount, on_delete=models.CASCADE, related_name='repository_access')
    campus = models.CharField(max_length=64)
    framework = models.CharField(max_length=16)
    area = models.CharField(max_length=64)
    program = models.CharField(max_length=64, blank=True)
    level = models.CharField(max_length=16, default='none', choices=[('none', 'No access'), ('viewer', 'Viewer'), ('editor', 'Editor')])
    updated_by = models.CharField(max_length=64)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'repository_access_assignments'
        constraints = [models.UniqueConstraint(fields=['user', 'campus', 'framework', 'area', 'program'], name='repository_access_scope')]
        indexes = [models.Index(fields=['campus', 'framework', 'area', 'level'], name='repository__campus_0dbd59_idx')]


class RepositoryAccessAudit(models.Model):
    actor_id = models.CharField(max_length=64)
    user_id = models.CharField(max_length=64, blank=True)
    action = models.CharField(max_length=32)
    campus = models.CharField(max_length=64)
    framework = models.CharField(max_length=16)
    area = models.CharField(max_length=64)
    program = models.CharField(max_length=64, blank=True)
    previous_level = models.CharField(max_length=16, blank=True)
    level = models.CharField(max_length=16, blank=True)
    actor_role = models.CharField(max_length=40, blank=True)
    resource_id = models.CharField(max_length=190, blank=True)
    previous = models.JSONField(null=True)
    updated = models.JSONField(null=True)
    status = models.CharField(max_length=16, default='success')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'repository_access_audit'
        indexes = [models.Index(fields=['user_id', 'created_at'], name='repository__user_id_9d5cfc_idx')]


class RepositoryAreaDefinition(models.Model):
    framework = models.CharField(max_length=16)
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=190)
    position = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=['framework', 'code'], name='repository_official_area')]


class CertificatePolicy(models.Model):
    certificate = models.OneToOneField(RepositoryEntry, on_delete=models.CASCADE, related_name='certificate_policy')
    general = models.CharField(max_length=16, default='inherit')
    allow_cross_campus = models.BooleanField(default=False)
    inherited_level = models.CharField(max_length=16, default='viewer')
    inherited_cross_campus = models.BooleanField(default=False)
    inherited_from = models.JSONField(default=dict)
    version = models.PositiveBigIntegerField(default=1)
    updated_by = models.CharField(max_length=64, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class CertificateGrant(models.Model):
    policy = models.ForeignKey(CertificatePolicy, on_delete=models.CASCADE, related_name='grants')
    user = models.ForeignKey(PortalAccount, on_delete=models.CASCADE)
    level = models.CharField(max_length=16)
    allow_cross_campus = models.BooleanField(default=False)
    updated_by = models.CharField(max_length=64)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['policy', 'user'], name='certificate_user_permission')]


class CertificateDefault(models.Model):
    campus = models.CharField(max_length=64, blank=True)
    framework = models.CharField(max_length=16, blank=True)
    area = models.CharField(max_length=64, blank=True)
    program = models.CharField(max_length=64, blank=True)
    folder = models.CharField(max_length=190, blank=True)
    level = models.CharField(max_length=16, default='viewer')
    allow_cross_campus = models.BooleanField(default=False)
    version = models.PositiveBigIntegerField(default=1)
    updated_by = models.CharField(max_length=64, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['campus', 'framework', 'area', 'program', 'folder'], name='certificate_default_scope')]
