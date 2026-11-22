"""Windows dialog that lets the user select several folders at once.

The browser folder window can highlight only one folder. This opens the
Windows folder window with multi-select, so Ctrl+click chooses many folders.
"""
from __future__ import annotations

import ctypes
import os
import sys
import threading
import time
import uuid
from ctypes import POINTER, byref, c_void_p, c_wchar_p
from pathlib import Path

FOS_PICKFOLDERS = 0x20
FOS_FORCEFILESYSTEM = 0x40
FOS_ALLOWMULTISELECT = 0x200
FOS_PATHMUSTEXIST = 0x800
SIGDN_FILESYSPATH = 0x80058000
COINIT_APARTMENTTHREADED = 0x2
CLSCTX_INPROC_SERVER = 1
RPC_E_CHANGED_MODE = 0x80010106
ERROR_CANCELLED = 0x800704C7
S_OK = 0

_PICK_TTL_SECONDS = 15 * 60
_lock = threading.Lock()
_picks: dict[str, dict] = {}


class GUID(ctypes.Structure):
    _fields_ = [
        ("Data1", ctypes.c_ulong),
        ("Data2", ctypes.c_ushort),
        ("Data3", ctypes.c_ushort),
        ("Data4", ctypes.c_ubyte * 8),
    ]


def _guid(text: str) -> GUID:
    value = uuid.UUID(text)
    return GUID(value.fields[0], value.fields[1], value.fields[2], (ctypes.c_ubyte * 8).from_buffer_copy(value.bytes[8:]))


CLSID_FileOpenDialog = _guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")
IID_IFileOpenDialog = _guid("D57C7288-D4AD-4768-BE02-9D969532D960")


def _method(pointer, index, *argtypes):
    vtable = ctypes.cast(ctypes.cast(pointer, POINTER(c_void_p))[0], POINTER(c_void_p))
    prototype = ctypes.WINFUNCTYPE(ctypes.c_long, c_void_p, *argtypes)
    return prototype(vtable[index])


def _release(pointer) -> None:
    if pointer:
        _method(pointer, 2)(pointer)


def _show_dialog(owner) -> list[str] | None:
    ole32 = ctypes.WinDLL("ole32", use_last_error=True)
    ole32.CoInitializeEx.argtypes = [c_void_p, ctypes.c_ulong]
    ole32.CoInitializeEx.restype = ctypes.c_long
    ole32.CoCreateInstance.argtypes = [POINTER(GUID), c_void_p, ctypes.c_ulong, POINTER(GUID), POINTER(c_void_p)]
    ole32.CoCreateInstance.restype = ctypes.c_long
    ole32.CoTaskMemFree.argtypes = [c_void_p]
    ole32.CoUninitialize.argtypes = []

    started = ole32.CoInitializeEx(None, COINIT_APARTMENTTHREADED)
    if started not in (S_OK, 1) and (started & 0xFFFFFFFF) != RPC_E_CHANGED_MODE:
        raise OSError(f"CoInitializeEx failed: 0x{started & 0xFFFFFFFF:08X}")
    should_uninit = started in (S_OK, 1)

    dialog = c_void_p()
    created = ole32.CoCreateInstance(
        byref(CLSID_FileOpenDialog),
        None,
        CLSCTX_INPROC_SERVER,
        byref(IID_IFileOpenDialog),
        byref(dialog),
    )
    if created != S_OK or not dialog:
        if should_uninit:
            ole32.CoUninitialize()
        raise OSError(f"Could not open the folder window (0x{created & 0xFFFFFFFF:08X})")

    try:
        options = ctypes.c_uint()
        _method(dialog, 10, POINTER(ctypes.c_uint))(dialog, byref(options))
        _method(dialog, 9, ctypes.c_uint)(
            dialog,
            options.value | FOS_PICKFOLDERS | FOS_ALLOWMULTISELECT | FOS_FORCEFILESYSTEM | FOS_PATHMUSTEXIST,
        )
        _method(dialog, 17, c_wchar_p)(dialog, "Select folders to upload — hold Ctrl and click each folder")
        _method(dialog, 18, c_wchar_p)(dialog, "Upload these folders")

        shown = _method(dialog, 3, c_void_p)(dialog, c_void_p(owner or 0))
        if (shown & 0xFFFFFFFF) == ERROR_CANCELLED or shown != S_OK:
            return None

        results = c_void_p()
        got = _method(dialog, 27, POINTER(c_void_p))(dialog, byref(results))
        if got != S_OK or not results:
            return None
        try:
            count = ctypes.c_ulong()
            _method(results, 7, POINTER(ctypes.c_ulong))(results, byref(count))
            paths: list[str] = []
            for index in range(count.value):
                item = c_void_p()
                if _method(results, 8, ctypes.c_ulong, POINTER(c_void_p))(results, index, byref(item)) != S_OK or not item:
                    continue
                try:
                    name = c_wchar_p()
                    if _method(item, 5, ctypes.c_int, POINTER(c_wchar_p))(item, SIGDN_FILESYSPATH, byref(name)) == S_OK and name.value:
                        paths.append(name.value)
                        ole32.CoTaskMemFree(ctypes.cast(name, c_void_p))
                finally:
                    _release(item)
            return paths
        finally:
            _release(results)
    finally:
        _release(dialog)
        if should_uninit:
            ole32.CoUninitialize()


def pick_multiple_folders() -> list[str] | None:
    """Open the multi-folder window. None means the user cancelled."""
    if sys.platform != "win32":
        raise OSError("Multiple folder selection is available on Windows.")
    owner = ctypes.windll.user32.GetForegroundWindow()
    box: dict[str, list[str] | None | BaseException] = {}

    def run() -> None:
        try:
            box["paths"] = _show_dialog(owner)
        except BaseException as error:  # noqa: BLE001 - surfaced to the request thread
            box["error"] = error

    worker = threading.Thread(target=run, name="accrevia-folder-picker")
    worker.start()
    worker.join()
    if "error" in box:
        raise box["error"]
    paths = box.get("paths")
    if not paths:
        return None
    return _without_nested(paths)


def _without_nested(paths: list[str]) -> list[str]:
    absolute = [os.path.normcase(os.path.abspath(path)) for path in paths if os.path.isdir(path)]
    kept: list[str] = []
    for path in absolute:
        if any(path != other and path.startswith(other + os.sep) for other in absolute):
            continue
        kept.append(path)
    return kept


def _purge_expired() -> None:
    now = time.time()
    expired = [key for key, pick in _picks.items() if now - pick["created"] > _PICK_TTL_SECONDS]
    for key in expired:
        _picks.pop(key, None)


def remember_folders(paths: list[str], max_bytes: int) -> dict:
    files: list[dict] = []
    skipped = 0
    names = [Path(path).name for path in paths]
    colliding = len(names) != len(set(n.lower() for n in names))
    for folder in paths:
        folder_path = Path(folder)
        root_name = f"{folder_path.parent.name}/{folder_path.name}" if colliding else folder_path.name
        for current, _dirs, filenames in os.walk(folder):
            for filename in filenames:
                if filename.startswith(".") or filename.startswith("~$") or filename.lower() in {"thumbs.db", "desktop.ini"}:
                    continue
                full = Path(current) / filename
                try:
                    size = full.stat().st_size
                except OSError:
                    skipped += 1
                    continue
                if size > max_bytes:
                    skipped += 1
                    continue
                relative = Path(root_name) / full.relative_to(folder_path)
                files.append({"path": str(full), "name": filename, "relative": relative.as_posix(), "size": size})

    pick_id = uuid.uuid4().hex
    with _lock:
        _purge_expired()
        _picks[pick_id] = {"created": time.time(), "files": files, "roots": paths}
    return {
        "pickId": pick_id,
        "folders": [Path(path).name for path in paths],
        "skipped": skipped,
        "files": [{"index": index, "name": item["name"], "path": item["relative"], "size": item["size"]} for index, item in enumerate(files)],
    }


def picked_file(pick_id: str, index: int) -> Path | None:
    with _lock:
        _purge_expired()
        pick = _picks.get(pick_id)
    if not pick or index < 0 or index >= len(pick["files"]):
        return None
    path = Path(pick["files"][index]["path"])
    roots = [os.path.normcase(os.path.abspath(root)) for root in pick["roots"]]
    absolute = os.path.normcase(os.path.abspath(path))
    if not any(absolute == root or absolute.startswith(root + os.sep) for root in roots):
        return None
    return path if path.is_file() else None


def forget_pick(pick_id: str) -> None:
    with _lock:
        _picks.pop(pick_id, None)


def probe_dialog() -> str:
    """Create the folder dialog and turn on multi-select, without showing it."""
    if sys.platform != "win32":
        return "not-windows"
    ole32 = ctypes.WinDLL("ole32", use_last_error=True)
    ole32.CoInitializeEx.argtypes = [c_void_p, ctypes.c_ulong]
    ole32.CoInitializeEx.restype = ctypes.c_long
    ole32.CoCreateInstance.argtypes = [POINTER(GUID), c_void_p, ctypes.c_ulong, POINTER(GUID), POINTER(c_void_p)]
    ole32.CoCreateInstance.restype = ctypes.c_long
    ole32.CoUninitialize.argtypes = []
    started = ole32.CoInitializeEx(None, COINIT_APARTMENTTHREADED)
    dialog = c_void_p()
    created = ole32.CoCreateInstance(
        byref(CLSID_FileOpenDialog), None, CLSCTX_INPROC_SERVER, byref(IID_IFileOpenDialog), byref(dialog)
    )
    if created != S_OK:
        return f"create-failed 0x{created & 0xFFFFFFFF:08X}"
    options = ctypes.c_uint()
    _method(dialog, 10, POINTER(ctypes.c_uint))(dialog, byref(options))
    flags = options.value | FOS_PICKFOLDERS | FOS_ALLOWMULTISELECT | FOS_FORCEFILESYSTEM | FOS_PATHMUSTEXIST
    set_hr = _method(dialog, 9, ctypes.c_uint)(dialog, flags)
    _release(dialog)
    if started in (S_OK, 1):
        ole32.CoUninitialize()
    if set_hr != S_OK:
        return f"options-failed 0x{set_hr & 0xFFFFFFFF:08X}"
    return "ok"
