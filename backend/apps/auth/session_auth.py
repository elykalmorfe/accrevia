"""Database-backed portal sessions, independent of browser-provided account data."""
from .models import PortalAccount
from django.utils.crypto import constant_time_compare, salted_hmac

SESSION_ACCOUNT_KEY = "portal_account_id"


def password_stamp(account):
    return salted_hmac("accrevia.portal.session", account.password_hash).hexdigest()


def establish_session(request, account):
    request.session.cycle_key()
    request.session[SESSION_ACCOUNT_KEY] = account.pk
    request.session["portal_password_stamp"] = password_stamp(account)
    request.session.set_expiry(8 * 60 * 60)


def session_account(request):
    account_id = request.session.get(SESSION_ACCOUNT_KEY)
    if not account_id:
        return None
    account = PortalAccount.objects.filter(pk=account_id).first()
    if (not account or account.approval_status != "approved" or account.portal_status != "Active"
            or not constant_time_compare(request.session.get("portal_password_stamp", ""), password_stamp(account))):
        request.session.flush()
        return None
    return account
