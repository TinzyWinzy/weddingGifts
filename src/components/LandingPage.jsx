import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, ShieldCheck, QrCode, ArrowRight } from 'lucide-react';
import { createWedding } from '../lib/store';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleRegister = async () => {
        // Simulate payment flow
        const confirmPayment = window.confirm("Simulating Stripe Payment: Charge $20?");
        if (confirmPayment) {
            const id = await createWedding("Happy Couple");
            if (id) {
                navigate(`/dashboard?id=${id}`);
            }
        }
    };

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <Gift size={64} color="var(--color-gold)" className="hero-icon" />
                    <h1 className="hero-title">
                        The Modern Wedding Registry
                    </h1>
                    <p className="hero-subtitle">
                        Prevent the "3 Stoves Problem". Let your guests anonymously coordinate gifts so you get exactly what you need, without the awkwardness.
                    </p>
                    <button className="btn-primary hero-cta" onClick={handleRegister}>
                        Create Registry - $20 <ArrowRight size={18} className="cta-icon" />
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <div className="container features-grid">

                    <div className="card feature-card">
                        <ShieldCheck size={48} color="var(--color-gold)" className="hero-icon" />
                        <h3>Anonymous Coordination</h3>
                        <p>Guests see <em>that</em> a toaster was bought, but not <em>who</em> bought it. Maintains the surprise while preventing duplicates.</p>
                    </div>

                    <div className="card feature-card">
                        <QrCode size={48} color="var(--color-gold)" className="hero-icon" />
                        <h3>Simple QR Access</h3>
                        <p>We generate a unique QR code for your physical invitations. Guests scan and instantly see your list. No app download required.</p>
                    </div>

                    <div className="card feature-card">
                        <Gift size={48} color="var(--color-gold)" className="hero-icon" />
                        <h3>Curated Experience</h3>
                        <p>A premium, ad-free experience designed specifically for modern weddings. Elegant, simple, and effective.</p>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default LandingPage;
