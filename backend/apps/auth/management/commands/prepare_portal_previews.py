"""Export browser previews for legacy Office formats; preserve every original."""
import json
import os
import subprocess
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.auth.models import PortalFile
from apps.auth.portal_storage import store_file
from apps.auth.workspace_storage import workspace_source


OFFICE_EXPORT = r'''
$ErrorActionPreference = 'Stop'
$job = Get-Content -LiteralPath $env:ACCREVIA_PREVIEW_JOB -Raw | ConvertFrom-Json
$application = $null
try {
    if ($job.kind -eq '.pub') {
        $application = New-Object -ComObject Publisher.Application
        $document = $application.Open($job.input, $true, $false)
        $application.ActiveWindow.Visible = $false
        $document.ExportAsFixedFormat(2, $job.output)
    } else {
        $application = New-Object -ComObject Word.Application
        $application.Visible = $false
        $application.DisplayAlerts = 0
        $application.AutomationSecurity = 3
        $document = $application.Documents.Open($job.input, $false, $true, $false)
        $document.ExportAsFixedFormat($job.output, 17)
        $document.Close(0)
    }
} finally {
    if ($application) {
        $application.Quit()
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($application)
    }
}
'''


class Command(BaseCommand):
    help = "Create PDF previews for original Publisher and Word files using installed Microsoft Office (Windows)."

    def add_arguments(self, parser):
        parser.add_argument("--source")
        parser.add_argument("--formats", nargs="+", default=[".pub", ".doc", ".docx"], choices=[".pub", ".doc", ".docx"])
        parser.add_argument("--timeout", type=int, default=180, help="Maximum seconds per Office export.")

    def handle(self, *args, **options):
        if os.name != "nt":
            raise CommandError("Generate these previews on Windows with Publisher/Word, then include them in the portable bundle.")
        source = options["source"] or workspace_source()
        if not source:
            raise CommandError("Select a workspace source first.")
        folder = Path(settings.MEDIA_ROOT) / "previews"
        folder.mkdir(parents=True, exist_ok=True)
        seen = set()
        failed = []
        count = 0
        for file in PortalFile.objects.filter(source=source).select_related("content"):
            kind = Path(file.name).suffix.lower()
            if kind not in options["formats"] or file.content_id in seen:
                continue
            seen.add(file.content_id)
            if PortalFile.objects.filter(source="preview", key=file.content_id).exists():
                continue
            original = folder / (file.content_id + kind)
            output = folder / (file.content_id + ".pdf")
            if not original.exists():
                with original.open("wb") as stream:
                    for chunk in file.content.chunks.order_by("position").iterator(chunk_size=4):
                        stream.write(bytes(chunk.data))
            job = folder / (file.content_id + ".json")
            job.write_text(json.dumps({"kind": kind, "input": str(original.resolve()), "output": str(output.resolve())}))
            try:
                subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", OFFICE_EXPORT],
                               env={**os.environ, "ACCREVIA_PREVIEW_JOB": str(job.resolve())},
                               check=True, capture_output=True, timeout=options["timeout"])
                if not output.read_bytes().startswith(b"%PDF-"):
                    raise ValueError("Office did not export a PDF.")
                with output.open("rb") as stream:
                    store_file("preview", file.content_id, file.name + ".pdf", "application/pdf", stream)
                count += 1
                self.stdout.write("Preview: " + file.name)
            except (subprocess.SubprocessError, OSError, ValueError) as exc:
                failed.append(file.name)
                self.stderr.write("Preview unavailable: " + file.name + " (" + type(exc).__name__ + ")")
                if isinstance(exc, subprocess.CalledProcessError):
                    self.stderr.write(exc.stderr.decode(errors="replace")[-2000:])
        self.stdout.write(f"Created {count} PDF previews; originals preserved.")
        if failed:
            raise CommandError("Could not prepare previews for: " + ", ".join(failed))
