import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

/**
 * PaynowForm Component
 * 
 * Simulates a high-fidelity EcoCash/OneMoney payment flow.
 * 
 * Flow:
 * 1. User enters Phone Number and Selects Method (EcoCash/OneMoney).
 * 2. "Sending USSD..." loading state.
 * 3. "Check your phone" instruction state.
 * 4. Simulated "Success" after a delay.
 * 
 * @param {Object} props
 * @param {number} props.amount - Amount to pay (e.g. 20)
 * @param {string} props.coupleName - Name of the couple for reference
 * @param {function} props.onSuccess - Callback when payment "completes"
 * @param {function} props.onCancel - Callback to cancel
 */
const PaynowForm = ({ amount, coupleName, onSuccess, onCancel }) => {
    const [step, setStep] = useState('INPUT'); // INPUT, PROCESSING, WAITING_PHONE, SUCCESS
    const [phone, setPhone] = useState('');
    const [method, setMethod] = useState('ecocash'); // ecocash, onemoney
    const [error, setError] = useState('');

    const handlePay = async () => {
        // Basic Validation
        if (!phone || phone.length < 10) {
            setError('Please enter a valid valid mobile number (e.g. 077...)');
            return;
        }
        setError('');
        setStep('PROCESSING');

        // Simulate Network Request to Paynow
        setTimeout(() => {
            setStep('WAITING_PHONE');
        }, 2000);
    };

    // Simulate functionality of the "Waiting for user to enter PIN on phone"
    useEffect(() => {
        if (step === 'WAITING_PHONE') {
            const timer = setTimeout(() => {
                setStep('SUCCESS');
                setTimeout(() => {
                    onSuccess();
                }, 2000); // Wait bit to show success tick
            }, 5000); // 5 seconds "waiting"
            return () => clearTimeout(timer);
        }
    }, [step, onSuccess]);

    return (
        <div className="w-full max-w-sm mx-auto text-center font-sans text-white">

            {/* Header / Amount Display */}
            <div className="mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gold shadow-[0_0_15px_#D4AF37]" />
                    <h4 className="text-gray-400 text-sm uppercase tracking-widest mb-2 font-light">Total Amount</h4>
                    <div className="text-5xl font-bold font-display text-white group-hover:scale-105 transition-transform">
                        ${amount}<span className="text-2xl text-gold">.00</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">One-time registration fee</p>
                </div>
            </div>

            {/* Input Step */}
            {step === 'INPUT' && (
                <div className="animate-fade-in space-y-6">
                    <div className="space-y-4">
                        <label className="text-left text-sm text-gray-300 block ml-1">Select Payment Method</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setMethod('ecocash')}
                                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${method === 'ecocash'
                                        ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                        : 'bg-white/5 border-white/10 hover:border-white/30'
                                    }`}
                            >
                                {/* Simple text logo representation for now */}
                                <span className={`font-bold text-lg ${method === 'ecocash' ? 'text-blue-400' : 'text-gray-400'}`}>EcoCash</span>
                            </button>
                            <button
                                onClick={() => setMethod('onemoney')}
                                className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${method === 'onemoney'
                                        ? 'bg-orange-900/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                                        : 'bg-white/5 border-white/10 hover:border-white/30'
                                    }`}
                            >
                                <span className={`font-bold text-lg ${method === 'onemoney' ? 'text-orange-400' : 'text-gray-400'}`}>OneMoney</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 text-left">
                        <label className="text-sm text-gray-300 ml-1">Mobile Number</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Only numbers
                                placeholder="077 123 4567"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all font-mono text-lg"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-400 text-xs flex items-center gap-1 animate-fade-in"><AlertCircle size={12} /> {error}</p>}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button onClick={onCancel} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button
                            onClick={handlePay}
                            className="flex-[2] btn-primary py-3 rounded-xl shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2"
                        >
                            Pay With Phone
                        </button>
                    </div>

                    <div className="text-[10px] text-gray-600 text-center px-4">
                        Secured by Paynow. Connection Encrypted.
                    </div>
                </div>
            )}

            {/* Simulated Processing Steps */}
            {(step === 'PROCESSING' || step === 'WAITING_PHONE' || step === 'SUCCESS') && (
                <div className="py-10 animate-fade-in flex flex-col items-center justify-center space-y-6">

                    {step === 'PROCESSING' && (
                        <>
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-white/10 border-t-gold rounded-full animate-spin" />
                            </div>
                            <p className="text-gray-300 animate-pulse">Contacting Paynow...</p>
                        </>
                    )}

                    {step === 'WAITING_PHONE' && (
                        <>
                            <div className="relative">
                                <Smartphone size={64} className="text-gold animate-bounce" />
                                <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Check Your Phone</h3>
                                <p className="text-gray-400 text-sm max-w-[250px] mx-auto">
                                    We sent a USSD popup to <span className="text-gold font-mono">{phone}</span>.
                                    <br />Please enter your PIN to authorize $20.00.
                                </p>
                            </div>
                        </>
                    )}

                    {step === 'SUCCESS' && (
                        <>
                            <div className="scale-110">
                                <CheckCircle size={80} className="text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-fade-in" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Payment Received!</h3>
                                <p className="text-gray-400 text-sm">Targeting registry...</p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PaynowForm;
