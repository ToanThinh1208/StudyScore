import { useState, useRef, useEffect, type ReactNode } from 'react';

interface DropdownProps {
    trigger: ReactNode;
    children: ReactNode;
    align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-card rounded-md shadow-lg border border-border py-1 z-50`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

interface DropdownItemProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function DropdownItem({ children, onClick, className = '' }: DropdownItemProps) {
    return (
        <div
            className={`px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
