import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { getWedding, addGift, toggleThankYou } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Gift, Copy, Eye, EyeOff } from 'lucide-react';

const CoupleDashboard = () => {
    const [searchParams] = useSearchParams();
    const weddingId = searchParams.get('id');
    const [wedding, setWedding] = useState(null);
    const [newItem, setNewItem] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [revealGuests, setRevealGuests] = useState(false);
    const [newItemDescription, setNewItemDescription] = useState('');

    useEffect(() => {
        if (weddingId) {
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
    }, [weddingId]);

    const handleAddStart = async (e) => {
        e.preventDefault();
        if (!newItem.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setIsSubmitting(true);
        await addGift(weddingId, { name: newItem, description: newItemDescription });
        setNewItem('');
        setNewItemDescription('');
        setIsSubmitting(false);

        const updated = await getWedding(weddingId); // Refresh
        if (updated) setWedding(updated);
    };

    const handleToggleThankYou = async (giftId, currentStatus) => {
        const success = await toggleThankYou(giftId, !currentStatus);
        if (success) {
            // Optimistic update or wait for realtime
            const updated = await getWedding(weddingId);
            if (updated) setWedding(updated);
        }
    };

    if (!wedding) return <div className="container" style={{ padding: '2rem' }}>Loading Registry...</div>;

    const guestLink = `${window.location.origin}/guest/${weddingId}`;

    return (
        <div className="container dashboard-container">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Wedding Dashboard</h1>
                <p>Manage your registry and invite guests.</p>
            </header>

            <div className="dashboard-grid">

                {/* QR Code Section */}
                <div className="card qr-section">
                    <h3>Your Guest Invite Code</h3>
                    <p className="qr-subtitle">Put this on your invitations</p>
                    <div className="qr-container">
                        <QRCode value={guestLink} size={150} />
                    </div>
                    <div className="qr-link-container">
                        <p className="qr-link">
                            {guestLink}
                        </p>
                    </div>
                </div>

                {/* Registry Management */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Your Gift Registry</h3>
                        <div className="reveal-controls">
                            <button
                                className={`reveal-toggle ${revealGuests ? 'active' : ''}`}
                                onClick={() => setRevealGuests(!revealGuests)}
                            >
                                {revealGuests ? <EyeOff size={16} /> : <Eye size={16} />}
                                {revealGuests ? 'Hide Guests' : 'Reveal Guests'}
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleAddStart} className="add-gift-form" style={{ flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Add gift (e.g. Toaster)"
                                aria-label="New gift name"
                                className="add-gift-input"
                                disabled={isSubmitting}
                            />
                            <button className="btn-primary" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? '...' : <Plus size={20} />}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newItemDescription}
                            onChange={(e) => setNewItemDescription(e.target.value)}
                            placeholder="Optional details (e.g. Color: Red)"
                            className="add-gift-input"
                            style={{ fontSize: '0.9rem', padding: '0.6rem' }}
                            disabled={isSubmitting}
                        />
                    </form>

                    <div className="gift-list">
                        {wedding.gifts.length === 0 ? (
                            <p className="gift-list-empty">No gifts added yet.</p>
                        ) : (
                            wedding.gifts.map(gift => (
                                <div key={gift.id} className="gift-item">
                                    <div>
                                        <span style={{ fontWeight: '500' }}>{gift.item}</span>
                                        {gift.description && <div className="item-description">{gift.description}</div>}
                                    </div>
                                    {gift.claimed ? (
                                        <span className="gift-claimed">
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                    <Gift size={14} />
                                                    {revealGuests ? (
                                                        <span className="guest-name">{gift.claimerName}</span>
                                                    ) : (
                                                        "GUEST BRINGING THIS"
                                                    )}
                                                </div>
                                                {revealGuests && gift.claimed && (
                                                    <div className="thank-you-control">
                                                        <input
                                                            type="checkbox"
                                                            checked={gift.thankYouSent || false}
                                                            onChange={() => handleToggleThankYou(gift.id, gift.thankYouSent)}
                                                            className="thank-you-checkbox"
                                                        />
                                                        <span>Thank You Sent</span>
                                                    </div>
                                                )}
                                            </div>
                                        </span>
                                    ) : (
                                        <span className="gift-needed">Still needed</span>
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
