"use client";
import React from 'react';

interface BtnProps {
    onClick?: (e?: React.MouseEvent) => void;
    children: React.ReactNode;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    className?: string;
}

export const BtnPrimary = ({ onClick, children, type = 'button', disabled = false, className = '' }: BtnProps) => (
    <button type={type} onClick={onClick} disabled={disabled}
        className={`flex items-center gap-2 bg-[#1E3932] text-[#C4A484] px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#C4A484] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] ${className}`}>
        {children}
    </button>
);

export const BtnSecondary = ({ onClick, children, type = 'button', className = '' }: BtnProps) => (
    <button type={type} onClick={onClick}
        className={`flex items-center gap-2 border border-[#1E3932] text-[#1E3932] px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-[#1E3932] hover:text-white transition-all duration-300 cursor-pointer min-h-[44px] ${className}`}>
        {children}
    </button>
);

interface BtnIconProps {
    onClick: () => void;
    title?: string;
    children: React.ReactNode;
    variant?: 'default' | 'danger' | 'gold';
}

export const BtnIcon = ({ onClick, title, children, variant = 'default' }: BtnIconProps) => {
    const cls = variant === 'danger'
        ? 'text-red-400 hover:bg-red-500 hover:text-white border-red-100'
        : variant === 'gold'
            ? 'text-[#C4A484] hover:bg-[#C4A484] hover:text-white border-[#C4A484]/20'
            : 'text-gray-500 hover:bg-[#1E3932] hover:text-white border-gray-100';
    return (
        <button type="button" onClick={onClick} title={title}
            className={`w-10 h-10 flex items-center justify-center border rounded transition-all duration-200 cursor-pointer ${cls}`}>
            {children}
        </button>
    );
};

export const StatChip = ({ icon, label, className = '' }: { icon: React.ReactNode; label: string; className?: string }) => (
    <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-500 ${className}`}>
        {icon} {label}
    </span>
);

export const ModalField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold block">{label}</label>
        {children}
    </div>
);
