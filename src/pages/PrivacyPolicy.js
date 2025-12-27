// src/pages/PrivacyPolicy.js
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Database, Lock, Share2, Trash2, Bell, Mail } from "lucide-react";
import "./LegalPages.css";

export default function PrivacyPolicy() {
  const lastUpdated = "December 16, 2025";

  return (
    <div className="legal-page-container">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10" />
            <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-white/90">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 space-y-8">

          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-500" />
              1. Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed">
              PickAPlate ("we," "our," or "us") is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our website and mobile application (the "Service").
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Please read this Privacy Policy carefully. By using the Service, you consent to the
              data practices described in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-yellow-500" />
              2. Information We Collect
            </h2>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Personal Information</h3>
            <p className="text-gray-600 leading-relaxed">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1 ml-4">
              <li>Name and email address (when you create an account)</li>
              <li>Password (stored securely using encryption)</li>
              <li>Food preferences and dietary restrictions</li>
              <li>Cuisine preferences and food dislikes</li>
              <li>Allergen information</li>
            </ul>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">User-Generated Content</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Recipes you upload or create</li>
              <li>Images associated with recipes</li>
              <li>Meal plans and calendar entries</li>
              <li>Chat conversations with our AI assistant</li>
              <li>Votes and participation in Barkada Vote sessions</li>
            </ul>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Location Data</h3>
            <p className="text-gray-600 leading-relaxed">
              With your permission, we collect location data to provide restaurant recommendations
              near you. You can disable location services through your device settings.
            </p>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-yellow-500" />
              3. How We Use Your Information
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Provide, maintain, and improve our Service</li>
              <li>Personalize your food recommendations based on preferences</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage trends to improve user experience</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
              <li>Train and improve our AI recommendation systems</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-yellow-500" />
              4. Information Sharing
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We may share your information in the following circumstances:
            </p>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">With Service Providers</h3>
            <p className="text-gray-600 leading-relaxed">
              We share data with third-party vendors who assist us in operating the Service:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1 ml-4">
              <li><strong>MongoDB Atlas</strong> - Database hosting</li>
              <li><strong>Render.com</strong> - Backend hosting</li>
              <li><strong>Netlify</strong> - Frontend hosting</li>
              <li><strong>OpenAI</strong> - AI-powered recommendations</li>
              <li><strong>Google Maps</strong> - Location and restaurant data</li>
              <li><strong>Gmail SMTP</strong> - Email delivery</li>
            </ul>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">With Other Users</h3>
            <p className="text-gray-600 leading-relaxed">
              When you share recipes publicly or participate in Barkada Vote sessions, your
              name and content may be visible to other users.
            </p>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">For Legal Reasons</h3>
            <p className="text-gray-600 leading-relaxed">
              We may disclose information if required by law, court order, or government request,
              or to protect our rights, privacy, safety, or property.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
              <p className="text-green-800 font-medium">
                We do NOT sell your personal information to third parties.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-500" />
              5. Data Security
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Passwords are encrypted using bcrypt hashing</li>
              <li>All data transmission uses HTTPS encryption</li>
              <li>JWT tokens for secure authentication</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              However, no method of transmission over the Internet is 100% secure. While we
              strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-yellow-500" />
              6. Data Retention
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your information for as long as your account is active or as needed to
              provide you services. We will retain and use your information as necessary to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Chat history and AI conversations may be retained for up to 90 days to improve
              our services, after which they are automatically deleted.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-yellow-500" />
              7. Your Rights and Choices
            </h2>
            <p className="text-gray-600 leading-relaxed">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              To exercise these rights, please contact us at support@pickaplate.com or use
              the settings in your profile page.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-600 leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze site traffic and usage</li>
              <li>Improve our Service</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              You can control cookies through your browser settings. Disabling cookies may
              affect some features of the Service.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13. If you believe we have
              collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-600 leading-relaxed">
              Your information may be transferred to and processed in countries other than your
              own. Our servers and service providers are located in various countries. By using
              the Service, you consent to the transfer of your information to these locations.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              11. Changes to This Policy
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date. Significant changes will be communicated via email or prominent
              notice on the Service.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-yellow-500" />
              12. Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please
              contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mt-3">
              <p className="text-gray-700">
                <strong>Email:</strong> support@pickaplate.com<br />
                <strong>Website:</strong> https://pickaplate.netlify.app
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="pt-8 border-t border-gray-200 flex flex-wrap gap-4 justify-center">
            <Link to="/terms" className="text-yellow-500 hover:text-yellow-600 font-medium">
              Terms and Conditions
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/" className="text-yellow-500 hover:text-yellow-600 font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
