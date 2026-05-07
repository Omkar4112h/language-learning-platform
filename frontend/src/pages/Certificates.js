import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { certificateAPI } from '../services/api';
import { FiAward, FiDownload, FiCheck, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Certificates.css';

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const fetchData = async () => {
  try {
    const eligibilityRes = await certificateAPI.checkEligibility();
    setEligibility(eligibilityRes.data);

    // 🔥 ADD THIS (IMPORTANT)
    const certRes = await certificateAPI.getMyCertificates();
    setCertificates(certRes.data);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  

  const levels = [
    { code: 'A1', name: 'Beginner', color: 'green', xpRequired: 500 },
    { code: 'A2', name: 'Elementary', color: 'blue', xpRequired: 1000 },
    { code: 'B1', name: 'Intermediate', color: 'purple', xpRequired: 2000 },
    { code: 'B2', name: 'Upper Intermediate', color: 'orange', xpRequired: 3500 },
    { code: 'C1', name: 'Advanced', color: 'red', xpRequired: 5000 },
    { code: 'C2', name: 'Proficient', color: 'gold', xpRequired: 8000 }
  ];

  useEffect(() => {
  fetchData(); 
  }, []);

  const handleGenerate = async (level) => {
    setGenerating(level);
    try {
      const response = await certificateAPI.generate(level);

      toast.success(`${level} certificate generated!`);

// 🔥 ADD THIS LINE
      const certId = response.data.certificate_id;

      // Download via authenticated request (JWT is in headers)
      const pdfRes = await certificateAPI.downloadCertificate(certId);
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank');
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);

    fetchData();
        } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to generate certificate');
      } finally {
        setGenerating(null);
      }
    };

  const handleDownload = async (certId, level) => {
    try {
      const pdfRes = await certificateAPI.downloadCertificate(certId);
      const blobUrl = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank');
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to download ${level || ''} certificate`);
    }
  };
  const getCertificateForLevel = (level) => {
    return certificates.find(c => c.level_completed === level);
  };

  const isEligibleForLevel = (level) => {
  const userXP = user?.total_xp || 0;
  const requiredXP = levels.find(l => l.code === level)?.xpRequired || 0;

  return userXP >= requiredXP;
};

  if (loading) {
    return (
      <div className="certificates-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificates-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certificates</h1>
          <p className="page-subtitle">Earn official certificates for your language proficiency</p>
        </div>
        <div className="xp-status">
          <span>Your XP:</span>
          <span className="xp-value">{user?.total_xp || 0}</span>
        </div>
      </div>

      <div className="certificates-info card">
        <FiAward className="info-icon" />
        <div className="info-content">
          <h3>How to Earn Certificates</h3>
          <p>
            Complete lessons, quizzes, and conversations to earn XP. 
            Once you reach the required XP for each level, you can generate your official certificate.
          </p>
        </div>
      </div>

      <div className="certificates-grid">
        {levels.map(level => {
          const cert = getCertificateForLevel(level.code);
          const isEligible = isEligibleForLevel(level.code);
          const userXP = user?.total_xp || 0;
          const progress = Math.min((userXP / level.xpRequired) * 100, 100);
          
          return (
            <div 
              key={level.code} 
              className={`certificate-card card level-${level.color} ${cert ? 'earned' : ''}`}
            >
              <div className="cert-header">
                <div className={`level-badge level-${level.color}`}>
                  {level.code}
                </div>
                {cert && <span className="earned-badge"><FiCheck /> Earned</span>}
              </div>

              <h3 className="cert-level-name">{level.name}</h3>
              
              <div className="cert-requirement">
                <span>{level.xpRequired} XP Required</span>
              </div>

              {!cert && (
                <div className="cert-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {userXP} / {level.xpRequired} XP ({Math.round(progress)}%)
                  </span>
                </div>
              )}

              <div className="cert-actions">
                {cert ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleDownload(cert.certificate_id, level.code)}
                  >
                    <FiDownload /> Download PDF
                  </button>
                ) : isEligible ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleGenerate(level.code)}
                    disabled={generating === level.code}
                  >
                    {generating === level.code ? 'Generating...' : 'Generate Certificate'}
                  </button>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    <FiLock /> Not Yet Eligible
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Certificates;
