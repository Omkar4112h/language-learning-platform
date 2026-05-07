"""Certificate Generation Service.

Uses ReportLab to generate PDF certificates.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import os
import uuid

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.certificate import Certificate
from app.models.user import User

class CertificateService:
    """Service for generating PDF certificates"""

    CERTIFICATES_DIR_NAME = "certificates"
    
    def __init__(self, db: Session):
        self.db = db

        backend_root = Path(__file__).resolve().parents[2]
        self.certificates_dir = backend_root / self.CERTIFICATES_DIR_NAME
        self.certificates_dir.mkdir(parents=True, exist_ok=True)

    def _build_certificate_file_path(self, user_id: int, level: str, language: str) -> Path:
        safe_language = "".join(ch for ch in (language or "") if ch.isalnum() or ch in ("-", "_")) or "lang"
        return self.certificates_dir / f"{user_id}_{safe_language}_{level}.pdf"

    def _render_certificate_pdf(
        self,
        *,
        file_path: Path,
        user_name: str,
        level: str,
        language: str,
        issued_at: datetime,
        certificate_id: str,
        total_xp: int | None = None,
        total_sessions: int | None = None,
        accuracy_average: float | None = None,
        words_learned: int | None = None,
    ) -> None:
        file_path.parent.mkdir(parents=True, exist_ok=True)

        c = canvas.Canvas(str(file_path), pagesize=A4)
        width, height = A4

        website_name = getattr(settings, "APP_NAME", "") or "LangLearn Platform"

        # Framing
        margin = 40
        c.setFillColor(colors.whitesmoke)
        c.rect(margin, margin, width - 2 * margin, height - 2 * margin, fill=1, stroke=0)

        c.setStrokeColorRGB(0.12, 0.22, 0.45)
        c.setLineWidth(3)
        c.rect(margin, margin, width - 2 * margin, height - 2 * margin, fill=0, stroke=1)

        c.setStrokeColorRGB(0.75, 0.8, 0.9)
        c.setLineWidth(1)
        inset = 10
        c.rect(margin + inset, margin + inset, width - 2 * (margin + inset), height - 2 * (margin + inset), fill=0, stroke=1)

        # Title + underline
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 34)
        c.drawCentredString(width / 2, height - 120, "Certificate of Completion")
        c.setLineWidth(1)
        c.setStrokeColor(colors.black)
        c.line(150, height - 130, width - 150, height - 130)

        # Platform name
        c.setFont("Helvetica-Oblique", 14)
        c.drawCentredString(width / 2, height - 160, website_name)

        # Subtitle
        c.setFont("Helvetica", 16)
        c.drawCentredString(width / 2, height - 200, "This is to certify that")

        # User name
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(width / 2, height - 240, user_name)

        # Completion text
        c.setFont("Helvetica", 16)
        c.drawCentredString(width / 2, height - 280, "has successfully completed")

        # Level (kept simple here; routes may pass formatted label)
        c.setFont("Helvetica-Bold", 22)
        c.setFillColorRGB(0, 0.5, 0.3)
        c.drawCentredString(width / 2, height - 310, level)
        c.setFillColor(colors.black)

        # Language
        c.setFont("Helvetica", 16)
        c.drawCentredString(width / 2, height - 340, f"in {language}")

        # Summary box
        box_w = width - 2 * margin - 120
        box_h = 110
        box_x = (width - box_w) / 2
        box_y = 165

        c.setFillColor(colors.white)
        c.setStrokeColorRGB(0.75, 0.8, 0.9)
        c.setLineWidth(1)
        c.roundRect(box_x, box_y, box_w, box_h, radius=12, fill=1, stroke=1)

        c.setFillColorRGB(0.12, 0.22, 0.45)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(box_x + 18, box_y + box_h - 22, "Summary")
        c.setFillColor(colors.black)

        def _fmt(value, formatter=None):
            if value is None:
                return "—"
            return formatter(value) if formatter else str(value)

        summary_left_x = box_x + 18
        summary_right_x = box_x + (box_w / 2) + 10
        row1_y = box_y + box_h - 48
        row2_y = box_y + box_h - 72
        row3_y = box_y + box_h - 96

        c.setFont("Helvetica-Bold", 11)
        c.drawString(summary_left_x, row1_y, "Total XP:")
        c.drawString(summary_left_x, row2_y, "Sessions:")
        c.drawString(summary_right_x, row1_y, "Avg Accuracy:")
        c.drawString(summary_right_x, row2_y, "Words Learned:")

        c.setFont("Helvetica", 11)
        c.drawString(summary_left_x + 75, row1_y, _fmt(total_xp))
        c.drawString(summary_left_x + 75, row2_y, _fmt(total_sessions))
        c.drawString(summary_right_x + 95, row1_y, _fmt(accuracy_average, lambda v: f"{v:.0f}%"))
        c.drawString(summary_right_x + 95, row2_y, _fmt(words_learned))

        # Date + Certificate ID
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2, height - 380, f"Issued on: {issued_at.strftime('%d %B %Y')}")
        c.setFont("Helvetica-Oblique", 10)
        c.drawCentredString(width / 2, height - 400, f"Certificate ID: {certificate_id}")

        # Signature
        c.setStrokeColor(colors.black)
        c.setLineWidth(1)
        c.line(100, 110, 250, 110)
        c.setFont("Helvetica", 10)
        c.drawCentredString((100 + 250) / 2, 95, "Instructor Signature")

        c.save()

    def _render_certificate_pdf_landscape_spec(
        self,
        *,
        file_path: Path,
        user_name: str,
        level: str,
        level_name: str,
        language: str,
        issued_at: datetime,
        certificate_id: str,
        total_xp: int,
        total_sessions: int,
        accuracy_average: float,
        words_learned: int,
    ) -> None:
        file_path.parent.mkdir(parents=True, exist_ok=True)

        c = canvas.Canvas(str(file_path), pagesize=landscape(A4))
        width, height = landscape(A4)

        date = issued_at.strftime('%d %B %Y')

        # Outer border
        c.setLineWidth(4)
        c.rect(30, 30, width - 60, height - 60)

        # Inner border
        c.setLineWidth(1)
        c.rect(50, 50, width - 100, height - 100)

        # Title
        c.setFont("Helvetica-Bold", 36)
        c.drawCentredString(width / 2, height - 120, "Certificate of Completion")

        # Subtitle
        c.setFont("Helvetica", 16)
        c.drawCentredString(width / 2, height - 160, "Language Learning Platform")

        # Line
        c.line(200, height - 170, width - 200, height - 170)

        # This is to certify that
        c.setFont("Helvetica", 18)
        c.drawCentredString(width / 2, height - 220, "This is to certify that")

        # User name
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(width / 2, height - 270, user_name)

        # Description
        c.setFont("Helvetica", 18)
        c.drawCentredString(width / 2, height - 320, "has successfully completed the")

        # Level (green highlight)
        c.setFont("Helvetica-Bold", 26)
        c.setFillColorRGB(0, 0.5, 0)
        c.drawCentredString(width / 2, height - 360, f"{level} - {level_name}")

        # Reset color
        c.setFillColorRGB(0, 0, 0)

        # Language line
        c.setFont("Helvetica", 18)
        c.drawCentredString(width / 2, height - 400, f"in {language}")

        # Performance box (centered) — positioned to leave a clean footer area
        box_w, box_h = 420, 90
        box_x = (width - box_w) / 2
        box_y = 95
        c.rect(box_x, box_y, box_w, box_h)

        # Inside performance box
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2, box_y + box_h - 20, "Performance Summary")

        left_x = box_x + 24
        right_x = box_x + (box_w / 2) + 24
        row1_y = box_y + box_h - 45
        row2_y = box_y + box_h - 65

        c.drawString(left_x, row1_y, f"Total XP: {total_xp}")
        c.drawString(right_x, row1_y, f"Accuracy: {accuracy_average}%")
        c.drawString(left_x, row2_y, f"Sessions: {total_sessions}")
        c.drawString(right_x, row2_y, f"Words: {words_learned}")

        # Footer (kept safely above the inner border at y=50)
        footer_date_y = 74
        footer_id_y = 60

        # Date
        c.setFont("Helvetica", 12)
        c.drawCentredString(width / 2, footer_date_y, f"Issued on: {date}")

        # Certificate ID
        c.setFont("Helvetica-Oblique", 10)
        c.drawCentredString(width / 2, footer_id_y, f"Certificate ID: {certificate_id}")

        # Signature (bottom-right, outside the box)
        c.setFont("Helvetica", 12)
        c.drawRightString(width - 80, footer_date_y, "Authorized Signature")

        # Save PDF
        c.save()
    
    def check_eligibility(self, user: User, level: str):
        """Check if user is eligible for certificate"""

        required_xp = settings.LEVEL_XP_THRESHOLDS[level]
        current_xp = user.total_xp or 0

        return {
            "is_eligible": current_xp >= required_xp,
            "current_xp": current_xp,
            "required_xp": required_xp,
            "xp_remaining": max(0, required_xp - current_xp)
        }

    # ✅ MOVE FUNCTION HERE (INSIDE CLASS)
    def generate_certificate(self, user: User, level: str) -> Certificate:
        """Generate a PDF certificate for the user"""

        # Check eligibility
        eligibility = self.check_eligibility(user, level)
        if not eligibility["is_eligible"]:
            raise ValueError(f"User does not have enough XP for {level} certificate")

        user_name = (user.full_name or user.username).title()
        certificate_id = str(uuid.uuid4())[:8]
        issued_at = datetime.now()
        file_path = self._build_certificate_file_path(user.id, level, user.target_language)

        level_names = {
            "A1": "Beginner",
            "A2": "Elementary",
            "B1": "Intermediate",
            "B2": "Upper Intermediate",
            "C1": "Advanced",
            "C2": "Proficient",
        }
        level_name = level_names.get(level, level)

        accuracy_average = getattr(user, "accuracy_average", None)
        if accuracy_average is None:
            accuracy_average = user.calculate_accuracy() if hasattr(user, "calculate_accuracy") else 0.0

        self._render_certificate_pdf_landscape_spec(
            file_path=file_path,
            user_name=user_name,
            level=level,
            level_name=level_name,
            language=user.target_language,
            issued_at=issued_at,
            certificate_id=certificate_id,
            total_xp=user.total_xp or 0,
            total_sessions=user.total_sessions or 0,
            accuracy_average=accuracy_average or 0.0,
            words_learned=user.words_learned or 0,
        )

        certificate = Certificate(
            user_id=user.id,
            certificate_id=certificate_id,
            level_completed=level,
            language=user.target_language,
            total_xp=eligibility["current_xp"],
            total_sessions=user.total_sessions or 0,
            accuracy_average=accuracy_average or 0.0,
            words_learned=user.words_learned or 0,
            pdf_path=str(file_path),
            issued_at=issued_at,
        )

        self.db.add(certificate)
        self.db.commit()
        self.db.refresh(certificate)

        return certificate

    def get_user_certificates(self, user_id: int) -> list[Certificate]:
        """Get all certificates for a user."""
        return (
            self.db.query(Certificate)
            .filter(Certificate.user_id == user_id)
            .order_by(Certificate.issued_at.desc())
            .all()
        )

    def ensure_certificate_pdf(self, certificate: Certificate, user: User, *, force_regenerate: bool = False) -> Certificate:
        """Ensure an existing certificate has a readable PDF on disk."""
        if not force_regenerate and certificate.pdf_path and os.path.exists(certificate.pdf_path):
            return certificate

        file_path = self._build_certificate_file_path(user.id, certificate.level_completed, certificate.language)
        issued_at = certificate.issued_at or datetime.now()

        if force_regenerate:
            accuracy_average = user.calculate_accuracy() if hasattr(user, "calculate_accuracy") else 0.0
            certificate.total_xp = user.total_xp or certificate.total_xp
            certificate.total_sessions = user.total_sessions or 0
            certificate.accuracy_average = accuracy_average or 0.0
            certificate.words_learned = user.words_learned or 0

        level_names = {
            "A1": "Beginner",
            "A2": "Elementary",
            "B1": "Intermediate",
            "B2": "Upper Intermediate",
            "C1": "Advanced",
            "C2": "Proficient",
        }
        level_name = level_names.get(certificate.level_completed, certificate.level_completed)

        self._render_certificate_pdf_landscape_spec(
            file_path=file_path,
            user_name=(user.full_name or user.username).title(),
            level=certificate.level_completed,
            level_name=level_name,
            language=certificate.language,
            issued_at=issued_at,
            certificate_id=certificate.certificate_id,
            total_xp=certificate.total_xp or 0,
            total_sessions=certificate.total_sessions or 0,
            accuracy_average=certificate.accuracy_average or 0.0,
            words_learned=certificate.words_learned or 0,
        )

        certificate.pdf_path = str(file_path)
        self.db.add(certificate)
        self.db.commit()
        self.db.refresh(certificate)
        return certificate
    
    def get_certificate_by_id(self, cert_id: str) -> Certificate:
        """Get certificate by ID"""
        return self.db.query(Certificate).filter(
            Certificate.certificate_id == cert_id
        ).first()
