import { supabase } from './supabase';

// Simple LocalStorage Database

// const DB_KEY = 'wedding_registry_db';

// const getDB = () => {
//     const data = localStorage.getItem(DB_KEY);
//     return data ? JSON.parse(data) : { weddings: {} };
// };

// const saveDB = (data) => {
//     localStorage.setItem(DB_KEY, JSON.stringify(data));
// };

export const createWedding = async (coupleName) => {
    const { data, error } = await supabase
        .from('weddings')
        .insert([{ couple_name: coupleName, created_at: new Date() }])
        .select()
        .single();

    if (error) {
        console.error('Error creating wedding:', error);
        return null;
    }
    return data.id;
};

export const getWedding = async (id) => {
    // Get wedding details
    const { data: wedding, error: wError } = await supabase
        .from('weddings')
        .select('*')
        .eq('id', id)
        .single();

    if (wError || !wedding) return null;

    // Get gifts for this wedding
    const { data: gifts, error: gError } = await supabase
        .from('gifts')
        .select('*')
        .eq('wedding_id', id);

    if (gError) {
        console.error('Error fetching gifts:', gError);
        return null; // Handle partial error better?
    }

    return {
        ...wedding,
        coupleName: wedding.couple_name, // Map to existing prop name
        gifts: gifts.map(g => ({
            ...g,
            item: g.item_name, // Map to existing prop name
            claimed: g.claimed,
            claimerName: g.claimer_name || 'Anonymous Guest',
            description: g.description,
            thankYouSent: g.thank_you_sent
        }))
    };
};

export const addGift = async (weddingId, itemName) => {
    // Check if itemName is object (rich details) or string (legacy)
    const name = typeof itemName === 'object' ? itemName.name : itemName;
    const desc = typeof itemName === 'object' ? itemName.description : '';

    const { data, error } = await supabase
        .from('gifts')
        .insert([{
            wedding_id: weddingId,
            item_name: name,
            description: desc,
            claimed: false
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding gift:', error);
        return null;
    }
    return {
        ...data,
        item: data.item_name
    };
};

export const linkGift = async (weddingId, giftId, description) => {
    // Helper to update description if needed separately
    return null;
};

export const toggleThankYou = async (giftId, status) => {
    const { error } = await supabase
        .from('gifts')
        .update({ thank_you_sent: status })
        .eq('id', giftId);
    return !error;
};

export const claimGift = async (weddingId, giftId, guestName) => {
    const { data, error } = await supabase
        .from('gifts')
        .select('claimed')
        .eq('id', giftId)
        .single();

    if (error || !data || data.claimed) return false;

    const { error: updateError } = await supabase
        .from('gifts')
        .update({
            claimed: true,
            claimer_id: 'guest_' + Math.random().toString(36).substr(2, 9),
            claimer_name: guestName || 'Anonymous'
        })
        .eq('id', giftId);

    return !updateError;
};

export const unclaimGift = async (weddingId, giftId) => {
    // Allows a guest to undo their claim
    const { error } = await supabase
        .from('gifts')
        .update({
            claimed: false,
            claimer_id: null,
            claimer_name: null,
            thank_you_sent: false // Reset tracker too if unclaimed
        })
        .eq('id', giftId);

    return !error;
};
