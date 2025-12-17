import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { getWedding, addGift, toggleThankYou, verifyPin } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Gift, Copy, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

const CoupleDashboard = () => {
    const [searchParams] = useSearchParams();
    const weddingId = searchParams.get('id');
    const [wedding, setWedding] = useState(null);
    const [newItem, setNewItem] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [revealGuests, setRevealGuests] = useState(false);
    const [newItemDescription, setNewItemDescription] = useState('');

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const savedPin = localStorage.getItem(`dashboard_auth_${weddingId}`);
            if (savedPin) {
                const isValid = await verifyPin(weddingId, savedPin);
                if (isValid) {
                    setIsAuthenticated(true);
                    return;
                }
            }
        };
        if (weddingId) checkAuth();
    }, [weddingId]);

    useEffect(() => {
        if (weddingId && isAuthenticated) {
            const load = async () => {
                const data = await getWedding(weddingId);
                if (data) setWedding(data);
            };
            load();

            const subscription = supabase
                .channel(`dashboard:${weddingId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'gifts',
                    filter: `wedding_id=eq.${weddingId}`
                }, () => {
                    load();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [weddingId, isAuthenticated]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const isValid = await verifyPin(weddingId, pinInput);
        if (isValid) {
            setIsAuthenticated(true);
            localStorage.setItem(`dashboard_auth_${weddingId}`, pinInput);
            setAuthError(false);
        } else {
            setAuthError(true);
        }
    };

    const handleAddStart = async (e) => {
        e.preventDefault();
        if (!newItem.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const result = await addGift(weddingId, newItem, false, newItemDescription); // false = not a guest

        if (result && result.error) {
            alert('This gift is already on your registry.'); // Simple alert for dashboard for now
            setIsSubmitting(false);
            return;
        }

        setNewItem('');
        setNewItemDescription('');
        setIsSubmitting(false);
    };

    const handleToggleThankYou = async (giftId, currentStatus) => {
        await toggleThankYou(weddingId, giftId, !currentStatus);
        // Supabase subscription will auto-update state
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 overflow-hidden relative font-sans">
                <div className="glow-gold opacity-40 animate-pulse top-[-20%] left-[-20%]" />
                <div className="glow-purple opacity-40 bottom-[-20%] right-[-20%]" />

                <div className="glass-panel max-w-md w-full text-center space-y-8 p-10 relative z-10 border-white/10">
                    <div className="flex justify-center text-gold mb-4">
                        <div className="p-5 bg-black/40 rounded-full border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                            <Lock size={48} className="animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-display font-bold mb-3">Dashboard Locked</h2>
                        <p className="text-gray-400 font-light text-lg">Please enter your PIN to manage your registry.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <input
                            type="password"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="0000"
                            className="input-field text-center text-3xl tracking-[0.2em] md:tracking-[1em] h-20 bg-black/30 placeholder-white/10"
                            maxLength={4}
                            autoFocus
                        />
                        {authError && <p className="text-red-400 text-sm animate-shake">Incorrect PIN. Please try again.</p>}
                        <button type="submit" className="btn-primary w-full justify-center py-4 text-base tracking-widest uppercase">
                            Unlock Dashboard <Unlock size={18} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!wedding) return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-gold font-display text-xl animate-pulse">Loading Registry...</div>;

    const guestLink = `${window.location.origin}/guest/${weddingId}`;

    return (
        <div className="min-h-screen bg-dark-bg text-white pb-20 relative overflow-hidden font-sans">
            <div className="glow-gold opacity-20 top-0 left-0" />
            <div className="glow-purple opacity-20 bottom-0 right-0" />

            <header className="pt-12 pb-10 text-center space-y-3 animate-fade-in relative z-10">
                <h1 className="text-4xl md:text-6xl font-display font-bold bg-gradient-to-b from-gold via-gold-light to-gold bg-clip-text text-transparent drop-shadow-sm">
                    Wedding Dashboard
                </h1>
                <p className="text-gray-400 font-light text-lg tracking-wide uppercase">Manage your registry & invite guests</p>
            </header>

            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[380px_1fr] gap-8 relative z-10">

                {/* QR Code Section - Functionality LAST on mobile */}
                <div className="glass-panel p-6 text-center space-y-6 h-fit md:sticky top-6 hover:border-gold/30 transition-colors order-2 md:order-1">
                    <h3 className="text-2xl font-display">Guest Invite Code</h3>
                    <p className="text-gray-400 text-sm font-light">Scan to view registry</p>
                    <div className="bg-white p-4 rounded-xl inline-block mx-auto shadow-inner">
                        <QRCode value={guestLink} size={200} />
                    </div>
                    <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between gap-3 overflow-hidden border border-white/5">
                        <p className="text-xs text-gray-500 truncate flex-1 font-mono tracking-tighter">
                            {guestLink}
                        </p>
                        <button
                            onClick={() => navigator.clipboard.writeText(guestLink)}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors text-gold"
                            title="Copy Link"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                </div>

                {/* Registry Management - Functionality FIRST on mobile */}
                <div className="glass-panel p-6 space-y-8 order-1 md:order-2">
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <h3 className="text-2xl font-display flex items-center gap-3">
                            <Gift size={24} className="text-gold" /> Registry
                        </h3>
                        <button
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${revealGuests ? 'bg-gold/20 text-gold' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                                }`}
                            onClick={() => setRevealGuests(!revealGuests)}
                        >
                            {revealGuests ? <EyeOff size={14} /> : <Eye size={14} />}
                            {revealGuests ? 'Hide Guests' : 'Reveal Guests'}
                        </button>
                    </div>

                    <form onSubmit={handleAddStart} className="space-y-3">
                        <div className="flex gap-2 max-[422px]:flex-col">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Add gift (e.g. Toaster)"
                                aria-label="New gift name"
                                className="input-field flex-1 min-w-0"
                                disabled={isSubmitting}
                            />
                            <button className="btn-primary" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <span className="animate-spin">...</span> : <Plus size={20} />}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newItemDescription}
                            onChange={(e) => setNewItemDescription(e.target.value)}
                            placeholder="Optional details (e.g. Color: Red)"
                            className="input-field text-sm opacity-80"
                            disabled={isSubmitting}
                        />
                    </form>

                    <div className="space-y-3">
                        {wedding.gifts.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                <p>No gifts added yet.</p>
                                <p className="text-sm">Start building your wish list!</p>
                            </div>
                        ) : (
                            wedding.gifts.map(gift => (
                                <div key={gift.id} className="bg-black/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 group hover:bg-black/30 transition-colors">
                                    <div className="space-y-1 w-full md:w-auto">
                                        <span className="font-medium text-lg block break-words">{gift.item}</span>
                                        {gift.description && <p className="text-sm text-gray-400 break-words">{gift.description}</p>}
                                    </div>

                                    {gift.claimed ? (
                                        <div className="w-full md:w-auto md:text-right space-y-2">
                                            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-3 py-1 rounded-full text-sm font-medium border border-gold/20 w-fit md:ml-auto">
                                                <Gift size={14} />
                                                {revealGuests ? (
                                                    <span className="truncate max-w-[150px]">{gift.claimerName}</span>
                                                ) : (
                                                    "CLAIMED"
                                                )}
                                            </div>
                                            {revealGuests && gift.claimed && (
                                                <div className="flex items-center md:justify-end gap-2 text-sm text-gray-400">
                                                    <input
                                                        type="checkbox"
                                                        checked={gift.thankYouSent || false}
                                                        onChange={() => handleToggleThankYou(gift.id, gift.thankYouSent)}
                                                        className="accent-gold w-4 h-4 rounded cursor-pointer"
                                                    />
                                                    <span>Thank You Sent</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold bg-white/5 text-gray-500 px-2 py-1 rounded uppercase tracking-wider w-fit md:ml-auto">
                                            Available
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CoupleDashboard;
