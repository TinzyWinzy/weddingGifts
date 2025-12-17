import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWedding, addGift } from '../lib/store';
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

        // Mock Dup Check: select -> eq -> ilike -> maybeSingle
        const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
        const ilikeMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
        const eqMock = vi.fn().mockReturnValue({ ilike: ilikeMock });
        const selectReadMock = vi.fn().mockReturnValue({ eq: eqMock });

        // Mock Insert: insert -> select -> single
        const singleMock = vi.fn().mockResolvedValue(mockReturn);
        const selectWriteMock = vi.fn().mockReturnValue({ single: singleMock });
        const insertMock = vi.fn().mockReturnValue({ select: selectWriteMock });

        supabase.from.mockReturnValue({
            select: selectReadMock,
            insert: insertMock
        });

        const result = await addGift('w_123', 'Toaster');
        expect(result.item).toBe('Toaster');
    });
});
