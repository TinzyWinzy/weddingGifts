import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, ShieldCheck, QrCode, ArrowRight, CreditCard, Lock, User } from 'lucide-react';
import { createWedding } from '../lib/store';
import Modal from './ui/Modal';

const LandingPage = () => {
    const navigate = useNavigate();

    // Registration Wizard State
    const [wizardState, setWizardState] = useState({ isOpen: false, step: 'NAME', name: '', pin: '' });
    const [inputVal, setInputVal] = useState('');
    const [error, setError] = useState('');

    const startRegister = () => {
        setWizardState({ isOpen: true, step: 'NAME', name: '', pin: '' });
        setInputVal(''); // Reset input for name step
        setError('');
    };

    const handleNext = async () => {
        setError('');

        // Step 1: Name
        if (wizardState.step === 'NAME') {
            if (!inputVal.trim()) {
                setError('Please enter a name.');
                return;
            }
            setWizardState(prev => ({ ...prev, name: inputVal, step: 'PIN' }));
            setInputVal(''); // Clear for PIN
            return;
        }

        // Step 2: PIN
        if (wizardState.step === 'PIN') {
            if (!inputVal || inputVal.length < 4) {
                setError('PIN must be at least 4 digits.');
                return;
            }
            setWizardState(prev => ({ ...prev, pin: inputVal, step: 'PAYMENT' }));
            return;
        }

        // Step 3: Payment (Final)
        if (wizardState.step === 'PAYMENT') {
            const { name, pin } = wizardState;
            const id = await createWedding(name, pin);
            if (id) {
                localStorage.setItem(`dashboard_auth_${id}`, pin);
                navigate(`/dashboard?id=${id}`);
            }
        }
    };

    const closeWizard = () => {
        setWizardState({ ...wizardState, isOpen: false });
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white relative overflow-hidden font-sans">
            {/* Ambient Lighting */}
            <div className="glow-gold top-[-10%] left-[-10%] opacity-60 animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="glow-purple bottom-[-10%] right-[-10%] opacity-50" />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 text-center z-10 animate-fade-in">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-center mb-10">
                        <div className="p-6 bg-white/5 rounded-full backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
                            <Gift size={64} className="text-gold dropshadow-glow" />
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-bold font-display mb-8 leading-tight bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent">
                        The Modern<br />Wedding Registry
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                        Curate your perfect start. Let guests coordinate anonymously. <span className="text-gold">No duplicates. No apps.</span>
                    </p>
                    <div className="flex justify-center">
                        <button className="btn-primary text-lg px-10 py-5 shadow-2xl hover:shadow-gold/40 hover:scale-105 transition-all" onClick={startRegister}>
                            Create Registry — $20 <ArrowRight size={20} className="ml-2" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

                    <div className="card hover:border-gold/40 transition-colors group">
                        <ShieldCheck size={48} className="text-gold mb-6 group-hover:scale-110 transition-transform duration-500 ease-out" />
                        <h3 className="text-2xl font-display mb-4">Anonymous Coordination</h3>
                        <p className="text-gray-400 leading-relaxed font-light">Guests see <em>what</em> is taken, but not <em>who</em> took it. Maintains the surprise while preventing the "3 Stoves Problem".</p>
                    </div>

                    <div className="card hover:border-gold/40 transition-colors group">
                        <QrCode size={48} className="text-gold mb-6 group-hover:scale-110 transition-transform duration-500 ease-out" />
                        <h3 className="text-2xl font-display mb-4">Simple QR Access</h3>
                        <p className="text-gray-400 leading-relaxed font-light">We generate a unique, elegant QR code for your invitations. Guests scan and instantly view your curated list.</p>
                    </div>

                    <div className="card hover:border-gold/40 transition-colors group">
                        <Gift size={48} className="text-gold mb-6 group-hover:scale-110 transition-transform duration-500 ease-out" />
                        <h3 className="text-2xl font-display mb-4">Curated Experience</h3>
                        <p className="text-gray-400 leading-relaxed font-light">A premium, ad-free interface designed to honor the elegance of your special day. Simple, fast, and beautiful.</p>
                    </div>

                </div>
            </section>

            {/* Registration Wizard Modal */}
            <Modal
                isOpen={wizardState.isOpen}
                onClose={closeWizard}
                title={
                    wizardState.step === 'NAME' ? 'Create Your Registry' :
                        wizardState.step === 'PIN' ? 'Secure Your Dashboard' :
                            'Complete Registration'
                }
                actions={
                    <>
                        <button onClick={closeWizard} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleNext} className="btn-primary px-6">
                            {wizardState.step === 'PAYMENT' ? 'Pay $20 & Create' : 'Next'}
                        </button>
                    </>
                }
            >
                <div className="py-2">
                    {wizardState.step === 'NAME' && (
                        <div className="space-y-4">
                            <p className="text-gray-300">Enter your couple name (e.g. "Jack & Jill") to personalize your guest page.</p>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gold" size={20} />
                                <input
                                    type="text"
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    placeholder="Couple Name"
                                    className="input-field pl-10"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                />
                            </div>
                        </div>
                    )}

                    {wizardState.step === 'PIN' && (
                        <div className="space-y-4">
                            <p className="text-gray-300">Create a 4-digit PIN. You will need this to access your dashboard later.</p>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gold" size={20} />
                                <input
                                    type="password"
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    placeholder="0000"
                                    maxLength={4}
                                    className="input-field pl-10 tracking-[0.5em] font-mono text-lg"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                />
                            </div>
                        </div>
                    )}

                    {wizardState.step === 'PAYMENT' && (
                        <div className="space-y-6 text-center">
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10 mx-auto max-w-[300px]">
                                <h4 className="text-lg font-semibold mb-2">{wizardState.name}'s Registry</h4>
                                <div className="text-3xl font-bold text-gold mb-1">$20.00</div>
                                <p className="text-xs text-gray-400">One-time payment</p>
                            </div>
                            <div className="text-sm text-gray-400 flex items-center justify-center gap-2">
                                <CreditCard size={16} /> Secure Payment via Stripe (Simulated)
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-red-400 text-sm mt-3 animate-fade-in">{error}</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};
export default LandingPage;
