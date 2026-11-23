"""Account directory writes, password checks, and live-update signaling."""
from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone

import bcrypt
from django.db import IntegrityError, transaction
from django.db.models import F

from apps.auth.models import DirectoryRevision, PortalAccount

SUPERADMIN_ID = "u-superadmin"
SUPERADMIN_EMAIL = "superadmin@nemsu.edu.ph"
SUPERADMIN_PASSWORD = "superadmin123"
SELF_REGISTER_ROLES = {"Faculty", "Staff"}
PLACEHOLDER_OFFICE = "Academic / Administrative Unit"
CAMPUSES = {"tandag", "cantilan", "cagwait", "san-miguel", "lianga", "tagbina", "bislig"}
ROLE_CLASSIFICATIONS = {
    "Faculty": {
        "Faculty (Teaching - Accreditation Committee)",
        "Faculty (Non-Teaching Coordinator)",
    },
    "Staff": {"Staff (Administrative)", "Staff (Technical)"},
}

_condition = threading.Condition()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()



def normalize_email(email: str | None) -> str:
    return (email or "").strip().lower()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def password_matches(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def current_revision() -> int:
    row, _ = DirectoryRevision.objects.get_or_create(pk=1, defaults={"value": 0})
    return int(row.value)


def bump_revision() -> int:
    DirectoryRevision.objects.get_or_create(pk=1, defaults={"value": 0})
    DirectoryRevision.objects.filter(pk=1).update(value=F("value") + 1)
    revision = current_revision()
    with _condition:
        _condition.notify_all()
    return revision


def wait_for_revision(since: int, timeout: float) -> int:
    """Block until the directory changes or the timeout elapses."""
    with _condition:
        latest = current_revision()
        if latest != since:
            return latest
        _condition.wait(timeout)
    return current_revision()


def _text(value, limit: int = 255) -> str:
    if value is None:
        return ""
    return str(value).strip()[:limit]


def _list(value) -> list:
    if isinstance(value, list):
        return value
    return []


def _status_pair(account: dict, portal: dict) -> tuple[str, str]:
    portal_status = _text(portal.get("status"), 40)
    approval = _text(account.get("approvalStatus") or portal.get("approvalStatus"), 20)
    if portal_status == "Pending Approval" or approval == "pending":
        return "pending", "Pending Approval"
    if portal_status == "Rejected" or approval == "rejected":
        return "rejected", "Rejected"
    if portal_status == "Deactivated":
        return "approved", "Deactivated"
    if portal_status == "Invited":
        return "approved", "Invited"
    if portal_status:
        return "approved", portal_status
    if approval == "approved":
        return "approved", "Active"
    return "pending", "Pending Approval"


def _approval_for_portal_status(status: str) -> str:
    if status == "Pending Approval":
        return "pending"
    if status == "Rejected":
        return "rejected"
    return "approved"


def _apply_profile(row: PortalAccount, portal: dict, account: dict | None = None) -> None:
    account = account or {}
    first = _text(account.get("firstName") or portal.get("firstName"), 120)
    middle = _text(account.get("middleName") or portal.get("middleName"), 120)
    last = _text(account.get("lastName") or portal.get("lastName"), 120)
    if first:
        row.first_name = first
    if middle:
        row.middle_name = middle
    if last:
        row.last_name = last
    name = _text(portal.get("name"), 255)
    if not name:
        name = " ".join(part for part in (row.first_name, row.middle_name, row.last_name) if part)
    if name:
        row.name = name
    role = _text(portal.get("role") or account.get("role"), 40)
    if role:
        row.role = role
    account_office = _text(account.get("office"), 255)
    portal_office = _text(portal.get("office"), 255)
    office = account_office if account_office and account_office != PLACEHOLDER_OFFICE else portal_office
    if office and (office != PLACEHOLDER_OFFICE or not row.office):
        row.office = office
    employee_id = _text(account.get("employeeId") or portal.get("employeeId"), 80)
    if employee_id:
        row.employee_id = employee_id
    classification = _text(account.get("personnelClassification") or portal.get("personnelClassification"), 160)
    if classification:
        row.personnel_classification = classification
    if "affiliationVerified" in portal:
        row.affiliation_verified = bool(portal.get("affiliationVerified"))
    registered = _text(portal.get("registeredAt") or account.get("createdAt"), 40)
    if registered and not row.registered_at:
        row.registered_at = registered
    approved_by = _text(portal.get("approvedBy"), 255)
    if approved_by:
        row.approved_by = approved_by
    approved_at = _text(portal.get("approvedAt"), 40)
    if approved_at:
        row.approved_at = approved_at
    campus_id = _text(account.get("campusId") or portal.get("campusId"), 80)
    if campus_id:
        row.campus_id = campus_id
    if _list(portal.get("assignedAreas")):
        row.assigned_areas = _list(portal.get("assignedAreas"))
    if _list(portal.get("assignedPrograms")):
        row.assigned_programs = _list(portal.get("assignedPrograms"))
    if _list(portal.get("allowedFeatures")):
        row.allowed_features = _list(portal.get("allowedFeatures"))
    if account.get("mustChangePassword") is not None and "mustChangePassword" in account:
        row.must_change_password = bool(account.get("mustChangePassword"))
    if account.get("isDefaultSuperadmin") or row.email == SUPERADMIN_EMAIL:
        row.is_default_superadmin = True


def _new_id(preferred: str | None = None) -> str:
    candidate = _text(preferred, 64)
    if candidate and not PortalAccount.objects.filter(pk=candidate).exists():
        return candidate
    return f"u-{uuid.uuid4().hex[:12]}"


def ensure_superadmin() -> PortalAccount | None:
    """Existing accounts are provisioned explicitly, never recreated during login."""
    return PortalAccount.objects.filter(email=SUPERADMIN_EMAIL).first()


def list_directory() -> dict:
    ensure_superadmin()
    users = [row.to_portal() for row in PortalAccount.objects.all().order_by("created_at")]
    return {"revision": current_revision(), "users": users}


def register_account(payload: dict) -> tuple[int, dict]:
    ensure_superadmin()
    email = normalize_email(payload.get("email"))
    role = _text(payload.get("role"), 40) or "Faculty"
    password = payload.get("password") or ""
    if not email or "@" not in email:
        return 400, {"detail": "A valid email address is required."}
    if role not in SELF_REGISTER_ROLES:
        return 400, {"detail": "Self-registration is limited to Faculty or Staff accounts."}
    if not isinstance(password, str) or len(password) < 8:
        return 400, {"detail": "Password must be at least 8 characters."}
    classification = _text(payload.get("personnelClassification"), 160)
    office = _text(payload.get("office"), 255)
    campus_id = _text(payload.get("campusId"), 80)
    if role == "Faculty" and classification not in ROLE_CLASSIFICATIONS["Faculty"]:
        return 400, {"detail": "Choose a classification that matches the account type."}
    if role == "Staff":
        classification = ""
    if campus_id not in CAMPUSES:
        return 400, {"detail": "Select a NEMSU campus."}
    if not office or office == PLACEHOLDER_OFFICE:
        return 400, {"detail": "Enter the actual department or office."}
    if PortalAccount.objects.filter(email=email).exists():
        return 409, {"detail": "An account with this institutional email already exists."}

    first = _text(payload.get("firstName"), 120)
    middle = _text(payload.get("middleName"), 120)
    last = _text(payload.get("lastName"), 120)
    name = " ".join(part for part in (first, middle, last) if part) or email
    registered_at = _text(payload.get("createdAt"), 40) or now_iso()
    row = PortalAccount(
        id=_new_id(payload.get("id")),
        email=email,
        first_name=first,
        middle_name=middle,
        last_name=last,
        name=name,
        role=role,
        password_hash=hash_password(password),
        approval_status="pending",
        portal_status="Pending Approval",
        office=office,
        personnel_classification=classification,
        campus_id=campus_id,
        affiliation_verified=False,
        registered_at=registered_at,
        must_change_password=False,
    )
    try:
        with transaction.atomic():
            row.save()
    except IntegrityError:
        return 409, {"detail": "An account with this institutional email already exists."}
    revision = bump_revision()
    return 201, {"revision": revision, "user": row.to_portal(), "account": row.to_session()}


def authenticate(email: str, password: str) -> tuple[int, dict]:
    ensure_superadmin()
    target = normalize_email(email)
    row = PortalAccount.objects.filter(email=target).first()
    if not row:
        return 404, {"reason": "invalid", "detail": "We could not find an account matching these credentials."}
    if not password_matches(password or "", row.password_hash):
        return 401, {"reason": "invalid", "detail": "We could not find an account matching these credentials."}
    if row.portal_status == "Pending Approval" or row.approval_status == "pending":
        return 403, {
            "reason": "pending",
            "detail": "Your account is pending administrator approval. You can sign in after it is approved.",
        }
    if row.portal_status == "Rejected" or row.approval_status == "rejected":
        return 403, {
            "reason": "rejected",
            "detail": "This registration was not approved. Contact the Quality Assurance Office for help.",
        }
    if row.portal_status == "Deactivated":
        return 403, {
            "reason": "deactivated",
            "detail": "This account has been deactivated. Contact an administrator for help.",
        }
    row.last_login = now_iso()
    row.save(update_fields=["last_login", "updated_at"])
    bump_revision()
    return 200, {"account": row.to_session(), "user": row.to_portal()}


def sync_snapshot(accounts: list, users: list) -> dict:
    """Insert browser-local accounts the server has never seen. Never downgrade an existing row."""
    ensure_superadmin()
    account_map: dict[str, dict] = {}
    user_map: dict[str, dict] = {}
    for item in accounts or []:
        if isinstance(item, dict) and normalize_email(item.get("email")):
            account_map[normalize_email(item.get("email"))] = item
    for item in users or []:
        if isinstance(item, dict) and normalize_email(item.get("email")):
            user_map[normalize_email(item.get("email"))] = item

    created = 0
    changed = False
    for email in set(account_map) | set(user_map):
        account = account_map.get(email, {})
        portal = user_map.get(email, {})
        existing = PortalAccount.objects.filter(email=email).first()
        password_hash = _text(account.get("passwordHash"), 255)
        if existing:
            updates = []
            if password_hash and not existing.password_hash:
                existing.password_hash = password_hash
                updates.append("password_hash")
            account_office = _text(account.get("office"), 255)
            portal_office = _text(portal.get("office"), 255)
            office = account_office if account_office and account_office != PLACEHOLDER_OFFICE else portal_office
            if office and office != PLACEHOLDER_OFFICE and (not existing.office or existing.office == PLACEHOLDER_OFFICE):
                existing.office = office
                updates.append("office")
            classification = _text(account.get("personnelClassification") or portal.get("personnelClassification"), 160)
            if classification and not existing.personnel_classification:
                existing.personnel_classification = classification
                updates.append("personnel_classification")
            campus_id = _text(account.get("campusId") or portal.get("campusId"), 80)
            if campus_id and not existing.campus_id:
                existing.campus_id = campus_id
                updates.append("campus_id")
            employee_id = _text(account.get("employeeId") or portal.get("employeeId"), 80)
            if employee_id and not existing.employee_id:
                existing.employee_id = employee_id
                updates.append("employee_id")
            if updates:
                updates.append("updated_at")
                existing.save(update_fields=updates)
                changed = True
            continue
        approval, status = _status_pair(account, portal)
        preferred_id = _text(portal.get("id") or account.get("id"), 64)
        row = PortalAccount(
            id=_new_id(preferred_id),
            email=email,
            password_hash=password_hash,
            approval_status=approval,
            portal_status=status,
            affiliation_verified=bool(portal.get("affiliationVerified")) or status == "Active",
            registered_at=_text(portal.get("registeredAt") or account.get("createdAt"), 40) or now_iso(),
            must_change_password=bool(account.get("mustChangePassword")),
            is_default_superadmin=bool(account.get("isDefaultSuperadmin")) or email == SUPERADMIN_EMAIL,
        )
        _apply_profile(row, portal, account)
        if not row.office:
            row.office = (
                "Office of the University President"
                if row.role == "Superadmin"
                else "Quality Assurance Office"
                if row.role == "Administrator"
                else "Academic / Administrative Unit"
            )
        try:
            with transaction.atomic():
                row.save()
        except IntegrityError:
            continue
        created += 1
        changed = True
    revision = bump_revision() if changed else current_revision()
    return {"created": created, "revision": revision}


def upsert_portal_user(payload: dict) -> tuple[int, dict]:
    """Admin write: create or update the shared profile. Public signup must use register_account."""
    ensure_superadmin()
    portal = payload.get("user") if isinstance(payload.get("user"), dict) else payload
    if not isinstance(portal, dict):
        return 400, {"detail": "A user profile is required."}
    email = normalize_email(portal.get("email"))
    if not email:
        return 400, {"detail": "Email is required."}
    row = PortalAccount.objects.filter(email=email).first()
    created = False
    if not row:
        created = True
        row = PortalAccount(
            id=_new_id(portal.get("id")),
            email=email,
            registered_at=_text(portal.get("registeredAt"), 40) or now_iso(),
        )
    status = _text(portal.get("status"), 40)
    if status:
        row.portal_status = status
        row.approval_status = _approval_for_portal_status(status)
        if status == "Active":
            row.affiliation_verified = bool(portal.get("affiliationVerified", True))
        elif status in {"Pending Approval", "Rejected"}:
            row.affiliation_verified = False
    _apply_profile(row, portal, payload if isinstance(payload, dict) else {})
    password = payload.get("password") if isinstance(payload, dict) else None
    password_hash = payload.get("passwordHash") if isinstance(payload, dict) else None
    if isinstance(password, str) and password:
        row.password_hash = hash_password(password)
        row.must_change_password = True
        if row.approval_status == "pending":
            row.approval_status = "approved"
        if not status:
            row.portal_status = "Active"
    elif isinstance(password_hash, str) and password_hash.strip():
        row.password_hash = password_hash.strip()
    if row.email == SUPERADMIN_EMAIL:
        row.role = "Superadmin"
        row.approval_status = "approved"
        row.portal_status = "Active"
        row.is_default_superadmin = True
    try:
        with transaction.atomic():
            row.save()
    except IntegrityError:
        return 409, {"detail": "An account with this institutional email already exists."}
    revision = bump_revision()
    return (201 if created else 200), {"revision": revision, "user": row.to_portal()}


def set_password_hash(email: str, password_hash: str) -> tuple[int, dict]:
    target = normalize_email(email)
    digest = (password_hash or "").strip()
    if not target or len(digest) < 20:
        return 400, {"detail": "A password hash is required."}
    row = PortalAccount.objects.filter(email=target).first()
    if not row:
        return 404, {"detail": "Account not found."}
    row.password_hash = digest
    row.must_change_password = False
    row.save(update_fields=["password_hash", "must_change_password", "updated_at"])
    return 200, {"ok": True}


def set_approval(email: str, decision: str) -> tuple[int, dict]:
    ensure_superadmin()
    target = normalize_email(email)
    if decision not in {"approved", "rejected", "pending"}:
        return 400, {"detail": "Decision must be approved, rejected, or pending."}
    row = PortalAccount.objects.filter(email=target).first()
    if not row:
        return 404, {"detail": "Account not found."}
    if row.is_default_superadmin or row.email == SUPERADMIN_EMAIL:
        return 200, {"revision": current_revision(), "user": row.to_portal()}
    row.approval_status = decision
    if decision == "approved":
        row.portal_status = "Active"
        row.affiliation_verified = True
        if not row.approved_at:
            row.approved_at = now_iso()
    elif decision == "rejected":
        row.portal_status = "Rejected"
        row.affiliation_verified = False
    else:
        row.portal_status = "Pending Approval"
        row.affiliation_verified = False
    row.save()
    revision = bump_revision()
    return 200, {"revision": revision, "user": row.to_portal()}
