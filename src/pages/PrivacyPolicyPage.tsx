import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Introduction</h2>
          <p>
            GazeWheel is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
          </p>
          <h2>Information We Collect</h2>
          <ul>
            <li><strong>Personal Information:</strong> We do not require you to provide personal information to use the app. If you contact us for support, we may collect your email address and any information you provide.</li>
            <li><strong>Device Information:</strong> We may collect non-personal information about your device, such as browser type, operating system, and Bluetooth device names, solely for the purpose of connecting and controlling your wheelchair.</li>
            <li><strong>Gaze Data:</strong> Gaze tracking data is processed locally in your browser and is not transmitted or stored on any server.</li>
          </ul>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and improve the functionality of the app.</li>
            <li>To assist with troubleshooting and support requests.</li>
            <li>To ensure the security and safety of device connections.</li>
          </ul>
          <h2>Data Security</h2>
          <p>
            We implement reasonable security measures to protect your information. All gaze tracking and Bluetooth data is processed locally and not shared with third parties.
          </p>
          <h2>Third-Party Services</h2>
          <p>
            The app uses third-party libraries (such as WebGazer.js) for gaze tracking. These libraries do not transmit your data externally.
          </p>
          <h2>Children's Privacy</h2>
          <p>
            GazeWheel is not intended for children under 13. We do not knowingly collect personal information from children.
          </p>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted within the app and on our website.
          </p>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:ihamzatarar@gmail.com">ihamzatarar@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 