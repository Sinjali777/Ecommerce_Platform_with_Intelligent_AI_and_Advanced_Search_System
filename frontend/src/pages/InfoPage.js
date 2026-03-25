import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './InfoPage.css';

function InfoPage() {
  const { type } = useParams();
  const [formSubmitted, setFormSubmitted] = useState(false);

  const contentMap = {
    'about': {
      title: 'About LaptopKinneHainaTa',
      subtitle: 'Revolutionizing the way Nepal buys laptops.',
      icon: '💻',
      body: [
        { h: 'The LaptopKinneHainaTa Mission', p: 'We found that most people in Nepal feel overwhelmed by tech jargon. Our mission is to use Artificial Intelligence to simplify the shopping experience, matching your specific budget and needs with the perfect machine.' },
        { h: 'Rooted in Kathmandu', p: 'Based in Kalanki, we are a local team that understands the challenges of Nepali students and creators—from power backup requirements to the need for reliable local warranties.' },
        { h: 'AI-First Approach', p: 'Our personalized AI recommendation engine doesn’t just show you the most expensive laptop; it analyzes thousands of benchmarks to suggest what actually works for your specific workflow.' },
        { h: 'Genuine Quality', p: 'Every product on LaptopKinneHainaTa is sourced from authorized distributors. We stand against "refurbished-as-new" scams, ensuring you get the authentic hardware you paid for.' }
      ]
    },
    'contact': {
      title: 'Get in Touch',
      subtitle: 'Have a question? Our team is ready to help.',
      icon: '📞',
      isContact: true
    },
    'privacy': {
      title: 'Privacy Policy',
      subtitle: 'Your data safety is our top priority.',
      icon: '🛡️',
      body: [
        { h: 'Information We Collect', p: 'We collect basic profile data and order history. To improve our AI, we analyze search patterns, but these are anonymized and never sold to third parties.' },
        { h: 'Chat Privacy', p: 'Conversations with LaptopKinneHainaTa AI are encrypted. We use these interactions solely to refine your product recommendations and provide better support.' },
        { h: 'Secure Payments', p: 'We do not store your credit card or e-banking credentials on our servers. All transactions are handled via secure, industry-standard payment gateways.' },
        { h: 'User Rights', p: 'You have the right to request a copy of your data or ask for the deletion of your account and chat history at any time through our support channel.' }
      ]
    },
    'terms': {
      title: 'Terms of Service',
      subtitle: 'Clear rules for a better shopping experience.',
      icon: '📜',
      body: [
        { h: 'Pricing & Availability', p: 'All prices are in NPR. Due to market volatility, prices may change without notice. If a price changes after you order but before shipping, we will honor the original price.' },
        { h: 'AI Disclaimer', p: 'While LaptopKinneHainaTa AI provides highly accurate suggestions, these are for guidance only. Please verify critical technical specs (like specific port types) in the product description before final purchase.' },
        { h: 'Delivery & Shipping', p: 'Standard delivery within Kathmandu Valley takes 24-48 hours. Outside the valley, we use trusted couriers with an estimated arrival of 3-5 business days.' },
        { h: 'Warranty & Returns', p: 'Returns are accepted within 7 days for manufacturing defects. All laptops carry a minimum 1-year brand warranty unless specified otherwise in the "Budget" or "Open-box" categories.' }
      ]
    }
  };

  const page = contentMap[type] || { title: 'Not Found', subtitle: 'Error 404', icon: '❓' };

  return (
    <div className="info-page">
      <header className="info-hero">
        <div className="info-hero-icon">{page.icon}</div>
        <h1>{page.title}</h1>
        <p className="subtitle">{page.subtitle}</p>
      </header>

      <div className="info-container">
        {page.isContact ? (
          <div className="contact-grid">
            <div className="contact-info">
              <div className="info-card">📍 <span>Kalanki, Kathmandu</span></div>
              <div className="info-card">📧 <span>support@LaptopKinneHainaTa.com</span></div>
              <div className="info-card">📞 <span>+977-974166131</span></div>
            </div>
            
            <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setFormSubmitted(true); }}>
              {formSubmitted ? (
                <div className="success-msg">✅ Message sent! We'll contact you soon.</div>
              ) : (
                <>
                  <input type="text" placeholder="Your Name" required />
                  <input type="email" placeholder="Email Address" required />
                  <textarea placeholder="How can we help?" rows="5" required></textarea>
                  <button type="submit">Send Message</button>
                </>
              )}
            </form>
          </div>
        ) : (
          <div className="content-grid">
            {page.body?.map((item, i) => (
              <div key={i} className="content-card">
                <h3>{item.h}</h3>
                <p>{item.p}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InfoPage;