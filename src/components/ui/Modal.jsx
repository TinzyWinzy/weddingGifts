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
            <div className="relative bg-card-bg border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-serif font-bold text-white">{title}</h3>
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
