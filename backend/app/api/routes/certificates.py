"""
Certificate API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.certificate import Certificate
from app.schemas.certificate import CertificateResponse, CertificateEligibility
from app.services.certificate_service import CertificateService

router = APIRouter()

@router.get("/eligibility", response_model=List[CertificateEligibility])
async def check_eligibility(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check eligibility for all level certificates"""
    cert_service = CertificateService(db)
    
    levels = ["A1", "A2", "B1", "B2", "C1", "C2"]
    eligibilities = []
    
    for level in levels:
        eligibility = cert_service.check_eligibility(current_user, level)
        eligibility.update({
            "level": level,
            "language": current_user.target_language,
        })
        eligibilities.append(CertificateEligibility(**eligibility))
    
    return eligibilities

@router.post("/generate/{level}", response_model=CertificateResponse)
async def generate_certificate(
    level: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a certificate for a completed level"""
    if level not in settings.LEVEL_XP_THRESHOLDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid level. Choose from: A1, A2, B1, B2, C1, C2"
        )
    
    cert_service = CertificateService(db)
    
    # Check eligibility
    eligibility = cert_service.check_eligibility(current_user, level)
    if not eligibility["is_eligible"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not eligible for {level} certificate. Need {eligibility['xp_remaining']} more XP."
        )
    
    # Check if already has this certificate
    existing = db.query(Certificate).filter(
        Certificate.user_id == current_user.id,
        Certificate.level_completed == level,
        Certificate.language == current_user.target_language
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a {level} certificate for {current_user.target_language}"
        )
    
    # Generate certificate
    try:
        certificate = cert_service.generate_certificate(current_user, level)
        return CertificateResponse(
            id=certificate.id,
            certificate_id=certificate.certificate_id,
            level_completed=certificate.level_completed,
            language=certificate.language,
            total_xp=certificate.total_xp,
            total_sessions=certificate.total_sessions,
            accuracy_average=certificate.accuracy_average,
            words_learned=certificate.words_learned,
            issued_at=certificate.issued_at,
            pdf_path=certificate.pdf_path,
            user_name=current_user.full_name or current_user.username
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate certificate: {str(e)}"
        )

@router.get("/my-certificates", response_model=List[CertificateResponse])
async def get_my_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all certificates for current user"""
    cert_service = CertificateService(db)
    certificates = cert_service.get_user_certificates(current_user.id)
    
    return [
        CertificateResponse(
            id=c.id,
            certificate_id=c.certificate_id,
            level_completed=c.level_completed,
            language=c.language,
            total_xp=c.total_xp,
            total_sessions=c.total_sessions,
            accuracy_average=c.accuracy_average,
            words_learned=c.words_learned,
            issued_at=c.issued_at,
            pdf_path=c.pdf_path,
            user_name=current_user.full_name or current_user.username
        )
        for c in certificates
    ]

@router.get("/download/{certificate_id}")
async def download_certificate(
    certificate_id: str,
    regenerate: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a certificate PDF"""
    certificate = db.query(Certificate).filter(
        Certificate.certificate_id == certificate_id,
        Certificate.user_id == current_user.id
    ).first()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )

    cert_service = CertificateService(db)
    certificate = cert_service.ensure_certificate_pdf(certificate, current_user, force_regenerate=regenerate)

    if not certificate.pdf_path or not os.path.exists(certificate.pdf_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate file not found"
        )
    
    return FileResponse(
        path=certificate.pdf_path,
        filename=f"Certificate_{certificate_id}.pdf",
        media_type="application/pdf"
    )

@router.get("/verify/{certificate_id}")
async def verify_certificate(
    certificate_id: str,
    db: Session = Depends(get_db)
):
    """Verify a certificate by ID (public endpoint)"""
    certificate = db.query(Certificate).filter(
        Certificate.certificate_id == certificate_id
    ).first()
    
    if not certificate:
        return {
            "valid": False,
            "message": "Certificate not found"
        }
    
    user = db.query(User).filter(User.id == certificate.user_id).first()
    
    return {
        "valid": True,
        "certificate_id": certificate.certificate_id,
        "holder_name": user.full_name or user.username if user else "Unknown",
        "level": certificate.level_completed,
        "language": certificate.language,
        "issued_at": certificate.issued_at.isoformat(),
        "total_xp": certificate.total_xp
    }
