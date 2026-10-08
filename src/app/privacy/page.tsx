'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 8, 2026';
  const companyName = 'Het Automations';
  const appName = 'LeadFlow';
  const contactEmail = 'privacy@hetautomations.com';
  const websiteUrl = 'https://hetautomations.com';

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
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Legal
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '64px 24px 32px',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '100px',
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            fontSize: '13px',
            color: '#22d3ee',
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '640px' }}>
          Your privacy matters to us. This policy explains how <strong style={{ color: '#e2e8f0' }}>{appName}</strong> by{' '}
          <strong style={{ color: '#e2e8f0' }}>{companyName}</strong> collects, uses, and protects your information.
        </p>
      </section>

      {/* Content */}
      <main
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 24px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          <PolicySection number="1" title="Information We Collect">
            <PolicySubsection title="Account Information">
              <p>When you register, we collect your name, email address, and authentication credentials through secure third-party providers (e.g., Google OAuth, Supabase Auth).</p>
            </PolicySubsection>
            <PolicySubsection title="WhatsApp Business Data">
              <p>When you connect your WhatsApp Business account via Meta&apos;s official API, we access:</p>
              <ul>
                <li>Your WhatsApp Business phone number and profile</li>
                <li>Messages sent and received through the WhatsApp Business API</li>
                <li>Contact information of your customers who message your business</li>
                <li>Message delivery status and read receipts</li>
              </ul>
            </PolicySubsection>
            <PolicySubsection title="Usage Data">
              <p>We collect analytics on how you use the dashboard, including pages visited, features used, and campaign performance metrics.</p>
            </PolicySubsection>
          </PolicySection>

          <PolicySection number="2" title="How We Use Your Information">
            <ul>
              <li><strong>Provide our services:</strong> Process and route WhatsApp messages, manage conversations, and run campaigns on your behalf.</li>
              <li><strong>AI-powered responses:</strong> We use AI models to generate suggested replies based on your trained knowledge base. Message content is processed in real-time and not stored for AI training purposes.</li>
              <li><strong>Analytics &amp; insights:</strong> Provide you with dashboards showing message volumes, response times, and campaign performance.</li>
              <li><strong>Improve our platform:</strong> Understand usage patterns to enhance features, performance, and reliability.</li>
              <li><strong>Communication:</strong> Send you important service updates and billing notifications.</li>
            </ul>
          </PolicySection>

          <PolicySection number="3" title="Data Storage & Security">
            <p>Your data is stored securely using industry-standard infrastructure:</p>
            <ul>
              <li>All data is stored on <strong>Supabase</strong> (backed by PostgreSQL) with encryption at rest and in transit.</li>
              <li>API keys and tokens are stored as encrypted environment variables, never in client-side code.</li>
              <li>We use HTTPS/TLS for all data transmission.</li>
              <li>Access to production databases is restricted to authorized personnel only.</li>
              <li>We implement Row Level Security (RLS) policies to ensure users can only access their own data.</li>
            </ul>
          </PolicySection>

          <PolicySection number="4" title="Third-Party Services">
            <p>We integrate with the following third-party services, each with their own privacy policies:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <ThirdPartyCard name="Meta (WhatsApp Business API)" purpose="Message delivery & webhooks" />
              <ThirdPartyCard name="Supabase" purpose="Database & authentication" />
              <ThirdPartyCard name="OpenRouter / Google AI" purpose="AI response generation" />
              <ThirdPartyCard name="Razorpay" purpose="Payment processing" />
              <ThirdPartyCard name="Google Calendar" purpose="Appointment scheduling" />
            </div>
          </PolicySection>

          <PolicySection number="5" title="Data Sharing">
            <p>We do <strong>not sell</strong> your personal data or your customers&apos; data to any third party. We share data only when:</p>
            <ul>
              <li>Required to provide our services (e.g., sending messages via Meta&apos;s WhatsApp API).</li>
              <li>Required by law, regulation, or legal process.</li>
              <li>Necessary to protect the rights, safety, or property of our users or the public.</li>
              <li>You explicitly consent to sharing with a specific third party.</li>
            </ul>
          </PolicySection>

          <PolicySection number="6" title="Data Retention">
            <ul>
              <li><strong>Messages:</strong> Stored as long as your account is active. You can delete individual conversations at any time.</li>
              <li><strong>Account data:</strong> Retained until you delete your account or request deletion.</li>
              <li><strong>Analytics data:</strong> Aggregated and anonymized data may be retained for up to 24 months for trend analysis.</li>
              <li><strong>Payment records:</strong> Retained as required by applicable tax and financial regulations.</li>
            </ul>
          </PolicySection>

          <PolicySection number="7" title="Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access</strong> your personal data stored with us.</li>
              <li><strong>Correct</strong> inaccurate or incomplete data.</li>
              <li><strong>Delete</strong> your account and associated data.</li>
              <li><strong>Export</strong> your data in a portable format.</li>
              <li><strong>Withdraw consent</strong> for data processing at any time.</li>
              <li><strong>Disconnect</strong> your WhatsApp Business account from our platform.</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href={`mailto:${contactEmail}`} style={{ color: '#22d3ee' }}>{contactEmail}</a>.</p>
          </PolicySection>

          <PolicySection number="8" title="WhatsApp & Meta Platform Compliance">
            <p>Our use of WhatsApp Business API data complies with:</p>
            <ul>
              <li>Meta&apos;s Platform Terms and Developer Policies</li>
              <li>WhatsApp Business API Terms of Service</li>
              <li>Meta&apos;s Data Use Policy requirements</li>
            </ul>
            <p>We access WhatsApp data only through official Meta APIs and do not scrape, crawl, or collect data through unauthorized means.</p>
          </PolicySection>

          <PolicySection number="9" title="Cookies & Tracking">
            <p>We use essential cookies for authentication and session management. We do not use third-party advertising trackers. Analytics cookies are used solely to improve our service and are not shared with advertisers.</p>
          </PolicySection>

          <PolicySection number="10" title="Children's Privacy">
            <p>Our service is designed for businesses and is not intended for individuals under 18 years of age. We do not knowingly collect personal data from children.</p>
          </PolicySection>

          <PolicySection number="11" title="Changes to This Policy">
            <p>We may update this privacy policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
          </PolicySection>

          <PolicySection number="12" title="Contact Us">
            <p>If you have questions about this privacy policy or our data practices, contact us:</p>
            <div
              style={{
                marginTop: '16px',
                padding: '20px 24px',
                background: 'rgba(34, 211, 238, 0.05)',
                border: '1px solid rgba(34, 211, 238, 0.15)',
                borderRadius: '12px',
              }}
            >
              <p style={{ margin: '4px 0' }}><strong>{companyName}</strong></p>
              <p style={{ margin: '4px 0' }}>Email: <a href={`mailto:${contactEmail}`} style={{ color: '#22d3ee' }}>{contactEmail}</a></p>
              <p style={{ margin: '4px 0' }}>Website: <a href={websiteUrl} style={{ color: '#22d3ee' }} target="_blank" rel="noopener noreferrer">{websiteUrl}</a></p>
            </div>
          </PolicySection>
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
          <Link href="/privacy" style={{ color: '#22d3ee', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function PolicySection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: '16px',
        padding: '32px',
        transition: 'border-color 0.2s',
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
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(139, 92, 246, 0.2))',
            fontSize: '14px',
            fontWeight: 700,
            color: '#22d3ee',
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{title}</h2>
      </div>
      <div
        className="policy-content"
        style={{
          fontSize: '15px',
          lineHeight: 1.8,
          color: '#94a3b8',
          paddingLeft: '44px',
        }}
      >
        <style>{`
          .policy-content ul {
            list-style: none;
            padding: 0;
            margin: 12px 0;
          }
          .policy-content ul li {
            position: relative;
            padding-left: 20px;
            margin-bottom: 8px;
          }
          .policy-content ul li::before {
            content: '→';
            position: absolute;
            left: 0;
            color: #22d3ee;
          }
          .policy-content strong {
            color: #e2e8f0;
          }
          .policy-content p {
            margin: 8px 0;
          }
        `}</style>
        {children}
      </div>
    </section>
  );
}

function PolicySubsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>{title}</h3>
      {children}
    </div>
  );
}

function ThirdPartyCard({ name, purpose }: { name: string; purpose: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: '10px',
      }}
    >
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px 0' }}>{name}</p>
      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{purpose}</p>
    </div>
  );
}
