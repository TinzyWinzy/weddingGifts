
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWedding, getWedding, addGift, claimGift } from '../lib/store';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn(),
            select: vi.fn(),
            eq: vi.fn(),
            update: vi.fn(),
            single: vi.fn()
        }))
    }
}));

describe('Store Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createWedding should return an ID on success', async () => {
        const mockReturn = { data: { id: 'test-id' }, error: null };
        const insertMock = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(mockReturn) }) });

        supabase.from.mockReturnValue({ insert: insertMock });

        const id = await createWedding('Test Couple');
        expect(id).toBe('test-id');
        expect(supabase.from).toHaveBeenCalledWith('weddings');
    });

    it('addGift should insert data correctly', async () => {
        const mockReturn = { data: { item_name: 'Toaster' }, error: null };
        const insertMock = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(mockReturn) }) });

        supabase.from.mockReturnValue({ insert: insertMock });

        const result = await addGift('w_123', 'Toaster');
        expect(result.item).toBe('Toaster');
    });
});
