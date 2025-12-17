import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getWedding, claimGift, unclaimGift, addGift } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Gift, Check, RotateCcw } from 'lucide-react';

const GuestPortal = () => {
    const { weddingId } = useParams();
    const [wedding, setWedding] = useState(null);
    const [claimingId, setClaimingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        const data = await getWedding(weddingId);
        if (data) setWedding({ ...data }); // Clone to force re-render
    };

    const getMyClaims = () => {
        try {
            return JSON.parse(localStorage.getItem(`claims_${weddingId}`)) || [];
        } catch { return []; }
    };

    const addMyClaim = (giftId) => {
        const claims = getMyClaims();
        if (!claims.includes(giftId)) {
            localStorage.setItem(`claims_${weddingId}`, JSON.stringify([...claims, giftId]));
        }
    };

    const removeMyClaim = (giftId) => {
        const claims = getMyClaims();
        localStorage.setItem(`claims_${weddingId}`, JSON.stringify(claims.filter(id => id !== giftId)));
    };

    useEffect(() => {
        loadData();

        const subscription = supabase
            .channel(`guest:${weddingId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'gifts',
                filter: `wedding_id=eq.${weddingId}`
            }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [weddingId]);

    const handleClaim = async (giftId) => {
        if (claimingId) return;

        const name = window.prompt("To claim this gift, please enter your name so the couple knows who to thank!");
        if (!name) return; // Cancelled

        setClaimingId(giftId);
        const success = await claimGift(weddingId, giftId, name);
        setClaimingId(null);

        if (success) {
            addMyClaim(giftId);
            alert(`Awesome! Thanks ${name}. You have marked this gift as taken.`);
            loadData();
        } else {
            alert("Someone just beat you to it!");
            loadData();
        }
    };

    const handleUndo = async (giftId) => {
        if (!confirm("Are you sure you want to unclaim this gift?")) return;

        await unclaimGift(weddingId, giftId);
        removeMyClaim(giftId);
        loadData();
    };

    const handleAddStart = async (e) => {
        e.preventDefault();
        const input = e.target.elements.newItem.value;
        if (!input.trim() || isSubmitting) return;

        setIsSubmitting(true);
        // Guest adds gift -> true (isGuest)
        await addGift(weddingId, input, true);
        e.target.reset();
        setIsSubmitting(false);

        alert(`Wonderful! We've marked that you are bringing a "${input}".`);
        loadData();
    };

    if (!wedding) return <div className="container" style={{ padding: '2rem' }}>Loading Registry...</div>;

    return (
        <div className="container guest-container">
            <header className="guest-header">
                <h2 className="guest-title">Wedding Registry</h2>
                <p>for {wedding.coupleName}</p>
            </header>

            {/* Guest Input Section */}
            <div className="card guest-input-card">
                <h3 style={{ marginBottom: '0.5rem' }}>Bringing something not on the list?</h3>
                <p className="guest-input-hint">
                    Post what you are giving to avoid duplicate gifts!
                </p>
                <form onSubmit={handleAddStart} className="guest-form">
                    <input
                        name="newItem"
                        type="text"
                        placeholder="I am giving a..."
                        aria-label="Gift description"
                        className="guest-input"
                        disabled={isSubmitting}
                    />
                    <button className="btn-primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? '...' : 'Post Gift'}
                    </button>
                </form>
            </div>

            <div className="card">
                <h3 className="registry-title">Current Registry Status</h3>
                <div className="registry-list">
                    {wedding.gifts.map(gift => (
                        <div key={gift.id} className={`registry-item ${gift.claimed ? 'taken' : ''}`}>
                            <div>
                                <span className="item-name">
                                    {gift.item}
                                </span>
                                {gift.description && <div className="item-description">{gift.description}</div>}
                                {gift.claimed && (
                                    <div className="taken-badge">
                                        <Check size={14} style={{ verticalAlign: 'middle' }} /> TAKEN
                                    </div>
                                )}
                            </div>

                            {gift.claimed ? (
                                getMyClaims().includes(gift.id) ? (
                                    <button
                                        className="btn-primary claim-btn"
                                        style={{ background: '#666' }}
                                        onClick={() => handleUndo(gift.id)}
                                    >
                                        <RotateCcw size={14} className="claim-icon" />
                                        Undo
                                    </button>
                                ) : (
                                    <span className="taken-text">
                                        Someone is bringing this
                                    </span>
                                )
                            ) : (
                                <button
                                    className="btn-primary claim-btn"
                                    onClick={() => handleClaim(gift.id)}
                                    disabled={claimingId === gift.id}
                                >
                                    {claimingId === gift.id ? (
                                        <span>...</span>
                                    ) : (
                                        <>
                                            <Gift size={16} className="claim-icon" />
                                            I'll Bring This
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {wedding.gifts.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Be the first to post a gift!</p>}
            </div>
        </div>
    );
};

export default GuestPortal;
