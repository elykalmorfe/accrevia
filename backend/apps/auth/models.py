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
