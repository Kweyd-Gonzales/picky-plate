// src/pages/TermsAndConditions.js
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Users, AlertTriangle, Scale, Mail } from "lucide-react";
import "./LegalPages.css";

export default function TermsAndConditions() {
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
            <FileText className="w-10 h-10" />
            <h1 className="text-3xl sm:text-4xl font-bold">Terms and Conditions</h1>
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
              <Scale className="w-5 h-5 text-yellow-500" />
              1. Agreement to Terms
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to PickAPlate! By accessing or using our website and mobile application
              (collectively, the "Service"), you agree to be bound by these Terms and Conditions.
              If you do not agree to these terms, please do not use our Service.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              These Terms constitute a legally binding agreement between you and PickAPlate
              ("Company," "we," "us," or "our") concerning your access to and use of the Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" />
              2. Description of Service
            </h2>
            <p className="text-gray-600 leading-relaxed">
              PickAPlate is a food discovery and meal planning platform that provides:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>AI-powered food recommendations based on your preferences</li>
              <li>Restaurant discovery and location services</li>
              <li>Recipe browsing and community recipe sharing</li>
              <li>Meal planning and calendar features</li>
              <li>Group voting features for food decisions (Barkada Vote)</li>
              <li>Personalized dietary preference management</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-500" />
              3. User Accounts
            </h2>
            <p className="text-gray-600 leading-relaxed">
              To access certain features of the Service, you must create an account. When creating
              an account, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              You must be at least 13 years old to create an account. If you are under 18, you
              must have parental or guardian consent to use the Service.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" />
              4. User-Generated Content
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our Service allows you to upload, submit, and share content including recipes,
              images, reviews, and comments ("User Content"). By submitting User Content, you:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Grant us a non-exclusive, worldwide, royalty-free license to use, display,
                  and distribute your content within the Service</li>
              <li>Represent that you own or have rights to the content you submit</li>
              <li>Agree not to submit content that infringes on others' intellectual property rights</li>
              <li>Understand that we may use automated systems to detect copyright violations</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              We reserve the right to remove any User Content that violates these Terms or is
              otherwise objectionable at our sole discretion.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              5. Prohibited Activities
            </h2>
            <p className="text-gray-600 leading-relaxed">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Violating any applicable laws or regulations</li>
              <li>Impersonating another person or entity</li>
              <li>Uploading malicious code, viruses, or harmful content</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Harassing, abusing, or threatening other users</li>
              <li>Posting false, misleading, or deceptive content</li>
              <li>Using the Service for commercial purposes without authorization</li>
              <li>Scraping or collecting user data without consent</li>
              <li>Interfering with the proper functioning of the Service</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-500" />
              6. Intellectual Property Rights
            </h2>
            <p className="text-gray-600 leading-relaxed">
              The Service and its original content (excluding User Content), features, and
              functionality are owned by PickAPlate and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Our trademarks and trade dress may not be used in connection with any product or
              service without our prior written consent.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">7. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              Our Service integrates with third-party services including:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-2 ml-4">
              <li>Google Maps for restaurant locations</li>
              <li>OpenAI for AI-powered recommendations</li>
              <li>Payment processors (if applicable)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Your use of these third-party services is subject to their respective terms and
              privacy policies. We are not responsible for the practices of third-party services.
            </p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">8. Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-gray-600 leading-relaxed">
                <strong>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</strong> We do not
                guarantee the accuracy of restaurant information, nutritional data, or AI recommendations.
                Always verify food allergies and dietary restrictions with restaurants directly.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                We are not responsible for any adverse reactions to food consumed based on our
                recommendations. Users with food allergies should exercise caution and consult
                healthcare professionals.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, PickAPlate shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including but
              not limited to loss of profits, data, or goodwill, arising from your use of the Service.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">10. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately,
              without prior notice, for any reason, including breach of these Terms. Upon
              termination, your right to use the Service will cease immediately.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              You may delete your account at any time through your profile settings or by
              contacting us.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of
              significant changes via email or prominent notice on the Service. Your continued
              use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">12. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the
              Philippines, without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-yellow-500" />
              13. Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
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
            <Link to="/privacy" className="text-yellow-500 hover:text-yellow-600 font-medium">
              Privacy Policy
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
