'use client';

import Link from 'next/link';

export default function TermsOfServicePage() {
  const lastUpdated = 'October 8, 2026';
  const companyName = 'Het Automations';
  const appName = 'LeadFlow';
  const contactEmail = 'support@hetautomations.com';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: '#e2e8f0',
        fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(15, 23, 42, 0.8)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none',
            }}
          >
            {appName}
          </Link>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Legal</span>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px 32px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '100px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            fontSize: '13px',
            color: '#a78bfa',
            marginBottom: '20px',
          }}
        >
          Last Updated: {lastUpdated}
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Terms of Service
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '640px' }}>
          By using <strong style={{ color: '#e2e8f0' }}>{appName}</strong>, you agree to the following terms and conditions.
        </p>
      </section>

      {/* Content */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Section number="1" title="Acceptance of Terms">
            <p>By accessing or using {appName} (&quot;the Service&quot;), provided by {companyName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </Section>

          <Section number="2" title="Description of Service">
            <p>{appName} is a WhatsApp Business automation platform that enables businesses to:</p>
            <ul>
              <li>Manage WhatsApp Business conversations through an AI-powered dashboard</li>
              <li>Automate responses using trained AI knowledge bases</li>
              <li>Run marketing campaigns via WhatsApp Business API</li>
              <li>Track message delivery, analytics, and customer interactions</li>
              <li>Schedule appointments through integrated calendar services</li>
            </ul>
          </Section>

          <Section number="3" title="Account Responsibilities">
            <ul>
              <li>You must provide accurate and complete registration information.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use this Service.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must have authorization to use the WhatsApp Business phone number you connect.</li>
            </ul>
          </Section>

          <Section number="4" title="Acceptable Use">
            <p>You agree <strong>not</strong> to:</p>
            <ul>
              <li>Send spam, unsolicited messages, or bulk messaging that violates WhatsApp&apos;s policies</li>
              <li>Use the Service for illegal, fraudulent, or deceptive purposes</li>
              <li>Violate Meta&apos;s WhatsApp Business API Terms of Service or Commerce Policy</li>
              <li>Attempt to reverse-engineer, hack, or compromise the platform&apos;s security</li>
              <li>Transmit malicious content, viruses, or harmful code</li>
              <li>Impersonate another person or business</li>
              <li>Resell or redistribute the Service without written authorization</li>
            </ul>
          </Section>

          <Section number="5" title="Subscription & Payments">
            <ul>
              <li>Some features require a paid subscription plan.</li>
              <li>Payments are processed securely through Razorpay.</li>
              <li>Subscriptions renew automatically unless cancelled before the billing date.</li>
              <li>Refund requests are evaluated on a case-by-case basis within 7 days of billing.</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
            </ul>
          </Section>

          <Section number="6" title="WhatsApp & Meta API Usage">
            <p>Your use of WhatsApp through our platform is subject to:</p>
            <ul>
              <li>Meta&apos;s Platform Terms of Service</li>
              <li>WhatsApp Business API Terms of Service</li>
              <li>WhatsApp Commerce Policy and Business Messaging Policy</li>
            </ul>
            <p>We act as a technology provider connecting your business to Meta&apos;s APIs. We are not responsible for changes to Meta&apos;s APIs, policies, or service availability.</p>
          </Section>

          <Section number="7" title="AI-Generated Content">
            <p>Our AI features generate automated responses based on your trained data. You acknowledge that:</p>
            <ul>
              <li>AI responses may not always be accurate or appropriate.</li>
              <li>You are ultimately responsible for all messages sent from your WhatsApp Business account.</li>
              <li>You should review and monitor AI-generated content regularly.</li>
              <li>We do not guarantee the accuracy of AI-generated responses.</li>
            </ul>
          </Section>

          <Section number="8" title="Intellectual Property">
            <ul>
              <li>The Service, its design, features, and code are owned by {companyName}.</li>
              <li>Your content (knowledge base data, messages, contacts) remains your property.</li>
              <li>You grant us a limited license to process your content solely to provide the Service.</li>
            </ul>
          </Section>

          <Section number="9" title="Limitation of Liability">
            <p>To the maximum extent permitted by law:</p>
            <ul>
              <li>The Service is provided &quot;as is&quot; without warranties of any kind.</li>
              <li>We are not liable for any indirect, incidental, or consequential damages.</li>
              <li>Our total liability is limited to the amount you paid us in the past 12 months.</li>
              <li>We are not responsible for losses caused by Meta API changes, downtime, or policy changes.</li>
            </ul>
          </Section>

          <Section number="10" title="Termination">
            <ul>
              <li>You may cancel your account at any time from the dashboard settings.</li>
              <li>We may suspend or terminate accounts that violate these terms.</li>
              <li>Upon termination, your data will be retained for 30 days, after which it will be permanently deleted.</li>
            </ul>
          </Section>

          <Section number="11" title="Governing Law">
            <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Gujarat, India.</p>
          </Section>

          <Section number="12" title="Contact">
            <p>For questions about these terms, contact us:</p>
            <div
              style={{
                marginTop: '16px',
                padding: '20px 24px',
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '12px',
              }}
            >
              <p style={{ margin: '4px 0' }}><strong>{companyName}</strong></p>
              <p style={{ margin: '4px 0' }}>
                Email: <a href={`mailto:${contactEmail}`} style={{ color: '#a78bfa' }}>{contactEmail}</a>
              </p>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '32px 24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#64748b',
        }}
      >
        <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
          <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: '#a78bfa', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: '16px',
        padding: '32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(34, 211, 238, 0.2))',
            fontSize: '14px',
            fontWeight: 700,
            color: '#a78bfa',
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{title}</h2>
      </div>
      <div
        className="terms-content"
        style={{ fontSize: '15px', lineHeight: 1.8, color: '#94a3b8', paddingLeft: '44px' }}
      >
        <style>{`
          .terms-content ul { list-style: none; padding: 0; margin: 12px 0; }
          .terms-content ul li { position: relative; padding-left: 20px; margin-bottom: 8px; }
          .terms-content ul li::before { content: '→'; position: absolute; left: 0; color: #a78bfa; }
          .terms-content strong { color: #e2e8f0; }
          .terms-content p { margin: 8px 0; }
        `}</style>
        {children}
      </div>
    </section>
  );
}
