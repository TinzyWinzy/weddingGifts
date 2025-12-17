import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative glass-panel w-full max-w-md p-6 space-y-4 animate-fade-in shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-display font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="text-gray-300">
                    {children}
                </div>

                {actions && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
