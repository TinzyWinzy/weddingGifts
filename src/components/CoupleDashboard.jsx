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
        await addGift(weddingId, newItem, false, newItemDescription); // false = not a guest
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
            <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
                <div className="card max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center text-gold mb-4">
                        <Lock size={64} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-2">Dashboard Locked</h2>
                        <p className="text-gray-400">Please enter your PIN to access the registry.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="0000"
                            className="input-field text-center text-2xl tracking-[0.5em] h-16"
                            maxLength={4}
                            autoFocus
                        />
                        {authError && <p className="text-red-400 text-sm">Incorrect PIN. Please try again.</p>}
                        <button type="submit" className="btn-primary w-full justify-center py-3 text-lg">
                            Unlock Dashboard <Unlock size={20} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!wedding) return <div className="container" style={{ padding: '2rem' }}>Loading Registry...</div>;

    const guestLink = `${window.location.origin}/guest/${weddingId}`;

    return (
        <div className="min-h-screen bg-dark-bg text-white pb-20">
            <header className="pt-12 pb-8 text-center space-y-2 animate-fade-in">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gold">Wedding Dashboard</h1>
                <p className="text-gray-400">Manage your registry and invite guests.</p>
            </header>

            <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[350px_1fr] gap-8">

                {/* QR Code Section */}
                <div className="card text-center space-y-6 h-fit sticky top-6">
                    <h3 className="text-xl font-semibold">Guest Invite Code</h3>
                    <p className="text-gray-400 text-sm">Scan to view registry</p>
                    <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                        <QRCode value={guestLink} size={200} />
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between gap-2 overflow-hidden">
                        <p className="text-xs text-gray-400 truncate flex-1 font-mono">
                            {guestLink}
                        </p>
                        <button
                            onClick={() => navigator.clipboard.writeText(guestLink)}
                            className="p-2 hover:bg-white/10 rounded-md transition-colors"
                            title="Copy Link"
                        >
                            <Copy size={14} className="text-gold" />
                        </button>
                    </div>
                </div>

                {/* Registry Management */}
                <div className="card space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Gift size={20} className="text-gold" /> Registry
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
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Add gift (e.g. Toaster)"
                                aria-label="New gift name"
                                className="input-field flex-1"
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
                                <div key={gift.id} className="bg-black/20 rounded-xl p-4 flex justify-between items-start group hover:bg-black/30 transition-colors">
                                    <div className="space-y-1">
                                        <span className="font-medium text-lg block">{gift.item}</span>
                                        {gift.description && <p className="text-sm text-gray-400">{gift.description}</p>}
                                    </div>

                                    {gift.claimed ? (
                                        <div className="text-right space-y-2">
                                            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-3 py-1 rounded-full text-sm font-medium border border-gold/20">
                                                <Gift size={14} />
                                                {revealGuests ? (
                                                    <span className="truncate max-w-[150px]">{gift.claimerName}</span>
                                                ) : (
                                                    "CLAIMED"
                                                )}
                                            </div>
                                            {revealGuests && gift.claimed && (
                                                <div className="flex items-center justify-end gap-2 text-sm text-gray-400">
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
                                        <span className="text-xs font-semibold bg-white/5 text-gray-500 px-2 py-1 rounded uppercase tracking-wider">
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
