import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getWedding, claimGift, unclaimGift, addGift } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Gift, Check, RotateCcw } from 'lucide-react';
import Modal from './ui/Modal';

const GuestPortal = () => {
    const { weddingId } = useParams();
    const [wedding, setWedding] = useState(null);
    const [claimingId, setClaimingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal State
    const [modal, setModal] = useState({ isOpen: false, type: null, title: '', message: '', data: null });
    const [guestNameInput, setGuestNameInput] = useState('');

    const loadData = async () => {
        const data = await getWedding(weddingId);
        if (data) setWedding({ ...data });
    };

    useEffect(() => {
        if (weddingId) {
            loadData();
            const interval = setInterval(loadData, 2000);
            return () => clearInterval(interval);
        }
    }, [weddingId]);

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

    // Modal Handlers
    const openInfoModal = (title, message) => {
        setModal({ isOpen: true, type: 'INFO', title, message, data: null });
    };

    const openClaimModal = (giftId) => {
        setModal({ isOpen: true, type: 'CLAIM', title: 'Claim Gift', data: { giftId } });
        setGuestNameInput('');
    };

    const openUndoModal = (giftId) => {
        setModal({ isOpen: true, type: 'UNDO', title: 'Undo Claim', message: 'Are you sure you want to unclaim this gift?', data: { giftId } });
    };

    const closeModal = () => {
        setModal({ ...modal, isOpen: false });
        setGuestNameInput('');
    };

    // Actions
    const handleConfirmClaim = async () => {
        if (!guestNameInput.trim()) return;
        const giftId = modal.data.giftId;

        setClaimingId(giftId);
        closeModal(); // Close input modal

        const success = await claimGift(weddingId, giftId, guestNameInput);
        setClaimingId(null);

        if (success) {
            addMyClaim(giftId);
            openInfoModal('Awesome!', `Thanks ${guestNameInput}. You have marked this gift as taken.`);
            loadData();
        } else {
            openInfoModal('Too Late!', "Someone just beat you to it!");
            loadData();
        }
    };

    const handleConfirmUndo = async () => {
        const giftId = modal.data.giftId;
        await unclaimGift(weddingId, giftId);
        removeMyClaim(giftId);
        closeModal();
        loadData();
    };

    const handleAddStart = async (e) => {
        e.preventDefault();
        const input = e.target.elements.newItem.value;
        if (!input.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const result = await addGift(weddingId, input, true);

        if (result && result.error) {
            openInfoModal('Already Listed', `"${input}" is already on the registry!`);
            e.target.reset();
            setIsSubmitting(false);
            return;
        }

        e.target.reset();
        setIsSubmitting(false);

        openInfoModal('Wonderful!', `We've marked that you are bringing a "${input}".`);
        loadData();
    };

    if (!wedding) return <div className="min-h-screen bg-dark-bg flex items-center justify-center text-gold font-display text-xl animate-pulse">Loading Registry...</div>;

    return (
        <div className="min-h-screen bg-dark-bg text-white pb-20 font-sans relative overflow-hidden">
            <div className="glow-gold opacity-20 top-[-20%] right-[-20%]" />
            <div className="glow-purple opacity-20 bottom-[-20%] left-[-20%]" />

            <header className="pt-16 pb-12 text-center space-y-4 animate-fade-in relative z-10">
                <div className="text-gold uppercase tracking-[0.3em] text-sm mb-2">My Wedding Registry</div>
                <h2 className="text-4xl md:text-7xl font-display font-medium text-white drop-shadow-2xl">
                    {wedding.coupleName}
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto opacity-70"></div>
            </header>

            <div className="max-w-3xl mx-auto px-6 space-y-10 animate-fade-in relative z-10">

                {/* Guest Input Section */}
                <div className="glass-panel text-center space-y-6 p-8 border-gold/10">
                    <div>
                        <h3 className="text-xl font-display mb-2">Bringing a surprise gift?</h3>
                        <p className="text-gray-400 text-sm font-light">
                            Help us avoid duplicates by listing it below.
                        </p>
                    </div>
                    <form onSubmit={handleAddStart} className="flex gap-3">
                        <input
                            name="newItem"
                            type="text"
                            placeholder="I am giving a..."
                            aria-label="Gift description"
                            className="input-field flex-1 bg-black/40"
                            disabled={isSubmitting}
                        />
                        <button className="btn-primary whitespace-nowrap bg-gradient-to-r from-gray-200 to-white text-black hover:from-white hover:to-gray-100 shadow-none border-0" type="submit" disabled={isSubmitting} style={{ background: '#fff' }}>
                            {isSubmitting ? '...' : 'Post'}
                        </button>
                    </form>
                </div>

                {/* Registry List */}
                <div className="glass-panel space-y-4">
                    <h3 className="text-2xl font-display flex items-center gap-3 border-b border-white/10 pb-6 mb-4 px-2">
                        <Gift size={24} className="text-gold" /> Desired Gifts
                    </h3>
                    <div className="space-y-3">
                        {wedding.gifts.map(gift => (
                            <div key={gift.id} className={`p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${gift.claimed ? 'bg-black/40 border border-white/5 opacity-75' : 'bg-black/20 hover:bg-black/30'
                                }`}>
                                <div className="space-y-1">
                                    <span className={`font-medium text-lg block ${gift.claimed ? 'line-through text-gray-500' : 'text-white'}`}>
                                        {gift.item}
                                    </span>
                                    {gift.description && <p className="text-sm text-gray-400">{gift.description}</p>}
                                    {gift.claimed && (
                                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">
                                            <Check size={12} /> TAKEN
                                        </div>
                                    )}
                                </div>

                                <div className="w-full md:w-auto">
                                    {gift.claimed ? (
                                        getMyClaims().includes(gift.id) ? (
                                            <button
                                                className="w-full md:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                                onClick={() => openUndoModal(gift.id)}
                                            >
                                                <RotateCcw size={16} />
                                                Undo Claim
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-500 italic block text-center md:text-right">
                                                Someone is bringing this
                                            </span>
                                        )
                                    ) : (
                                        <button
                                            className="btn-primary w-full md:w-auto"
                                            onClick={() => openClaimModal(gift.id)}
                                            disabled={claimingId === gift.id}
                                        >
                                            {claimingId === gift.id ? (
                                                <span>...</span>
                                            ) : (
                                                <>
                                                    <Gift size={18} />
                                                    I'll Bring This
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {wedding.gifts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No gifts requested yet.</p>
                            <p className="text-sm text-gold mt-2">Be the first to post a surprise gift!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                actions={
                    modal.type === 'CLAIM' ? (
                        <button onClick={handleConfirmClaim} className="btn-primary px-6">Claim It</button>
                    ) : modal.type === 'UNDO' ? (
                        <>
                            <button onClick={closeModal} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleConfirmUndo} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors">Yes, Unclaim</button>
                        </>
                    ) : (
                        <button onClick={closeModal} className="btn-primary px-6">Close</button>
                    )
                }
            >
                {modal.type === 'CLAIM' && (
                    <div className="space-y-4">
                        <p>To claim this gift, please enter your name so the couple knows who to thank!</p>
                        <input
                            type="text"
                            value={guestNameInput}
                            onChange={(e) => setGuestNameInput(e.target.value)}
                            placeholder="Your Name"
                            className="input-field"
                            autoFocus
                        />
                    </div>
                )}
                {modal.type === 'UNDO' && (
                    <p>{modal.message}</p>
                )}
                {modal.type === 'INFO' && (
                    <p>{modal.message}</p>
                )}
            </Modal>
        </div>
    );
};

export default GuestPortal;
