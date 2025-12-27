// src/components/TermsConsentModal.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, X, ChevronDown, ChevronUp } from "lucide-react";
import "./TermsConsentModal.css";

const TERMS_VERSION = "1.0"; // Increment this when T&C are updated to force re-acceptance
const CONSENT_KEY = "pap:termsConsent";

export default function TermsConsentModal({
  isOpen,
  onAccept,
  onClose,
  showCloseButton = false,
  mode = "consent" // "consent" | "view"
}) {
  const [showTermsPreview, setShowTermsPreview] = useState(false);
  const [showPrivacyPreview, setShowPrivacyPreview] = useState(false);

  // Check if user has already accepted current terms version
  const hasAcceptedTerms = () => {
    try {
      const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}");
      return consent.version === TERMS_VERSION && consent.accepted === true;
    } catch {
      return false;
    }
  };

  // Save consent to localStorage
  const saveConsent = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: TERMS_VERSION,
        accepted: true,
        acceptedAt: new Date().toISOString()
      }));
    } catch {}
  };

  const handleAccept = () => {
    saveConsent();
    if (onAccept) onAccept();
  };

  if (!isOpen) return null;

  return (
    <div className="terms-consent-overlay">
      <div className="terms-consent-modal">
        {/* Header */}
        <div className="terms-consent-header">
          <div className="terms-consent-logo">
            <div className="terms-consent-logo-icon">
              <span>P</span>
            </div>
            <div className="terms-consent-logo-text">
              <h2>Welcome to PickAPlate</h2>
              <p>Before you continue</p>
            </div>
          </div>
          {showCloseButton && (
            <button onClick={onClose} className="terms-consent-close">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="terms-consent-content">
          <p className="terms-consent-intro">
            To use PickAPlate, please review and accept our Terms of Service and Privacy Policy.
          </p>

          {/* Terms Preview Section */}
          <div className="terms-consent-section">
            <button
              className="terms-consent-section-header"
              onClick={() => setShowTermsPreview(!showTermsPreview)}
            >
              <div className="terms-consent-section-title">
                <FileText className="terms-consent-section-icon" />
                <span>Terms of Service</span>
              </div>
              {showTermsPreview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showTermsPreview && (
              <div className="terms-consent-preview">
                <ul>
                  <li>You must be 13+ years old to use PickAPlate</li>
                  <li>You're responsible for your account security</li>
                  <li>Content you upload must not infringe copyrights</li>
                  <li>We may remove content that violates our policies</li>
                  <li>Food recommendations are suggestions only - verify allergens with restaurants</li>
                  <li>We're not liable for adverse food reactions</li>
                </ul>
                <Link to="/terms" target="_blank" className="terms-consent-read-full">
                  Read Full Terms →
                </Link>
              </div>
            )}
          </div>

          {/* Privacy Preview Section */}
          <div className="terms-consent-section">
            <button
              className="terms-consent-section-header"
              onClick={() => setShowPrivacyPreview(!showPrivacyPreview)}
            >
              <div className="terms-consent-section-title">
                <Shield className="terms-consent-section-icon" />
                <span>Privacy Policy</span>
              </div>
              {showPrivacyPreview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showPrivacyPreview && (
              <div className="terms-consent-preview">
                <ul>
                  <li>We collect your name, email, and food preferences</li>
                  <li>Your data is used to personalize recommendations</li>
                  <li>We use secure encryption for passwords</li>
                  <li>We share data with service providers (MongoDB, OpenAI, Google Maps)</li>
                  <li>We do NOT sell your personal information</li>
                  <li>You can delete your account and data anytime</li>
                </ul>
                <Link to="/privacy" target="_blank" className="terms-consent-read-full">
                  Read Full Privacy Policy →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="terms-consent-links">
            <Link to="/terms" target="_blank" className="terms-consent-link">
              <FileText size={16} />
              Full Terms
            </Link>
            <Link to="/privacy" target="_blank" className="terms-consent-link">
              <Shield size={16} />
              Full Privacy Policy
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="terms-consent-footer">
          <p className="terms-consent-agreement">
            By clicking "Accept & Continue", you agree to our Terms of Service and Privacy Policy.
          </p>
          <button onClick={handleAccept} className="terms-consent-accept-btn">
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to check consent status
export function useTermsConsent() {
  const [hasConsent, setHasConsent] = useState(true); // Default to true to avoid flash

  useEffect(() => {
    try {
      const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}");
      setHasConsent(consent.version === TERMS_VERSION && consent.accepted === true);
    } catch {
      setHasConsent(false);
    }
  }, []);

  const grantConsent = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: TERMS_VERSION,
        accepted: true,
        acceptedAt: new Date().toISOString()
      }));
      setHasConsent(true);
    } catch {}
  };

  return { hasConsent, grantConsent, TERMS_VERSION };
}
