'use client';
import { __rest } from "tslib";
import * as React from 'react';
const Button = React.forwardRef((_a, ref) => {
    var { className, variant = 'default', size = 'default' } = _a, props = __rest(_a, ["className", "variant", "size"]);
    // Base styles
    let baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    // Variant styles
    let variantStyles = '';
    switch (variant) {
        case 'default':
            variantStyles = 'bg-primary text-white hover:bg-primary/90';
            break;
        case 'destructive':
            variantStyles = 'bg-red-500 text-white hover:bg-red-600';
            break;
        case 'outline':
            variantStyles = 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900';
            break;
        case 'secondary':
            variantStyles = 'bg-gray-100 text-gray-900 hover:bg-gray-200';
            break;
        case 'ghost':
            variantStyles = 'bg-transparent hover:bg-gray-100 text-gray-900';
            break;
        case 'link':
            variantStyles = 'bg-transparent text-primary underline-offset-4 hover:underline';
            break;
    }
    // Size styles
    let sizeStyles = '';
    switch (size) {
        case 'default':
            sizeStyles = 'h-10 px-4 py-2 text-sm';
            break;
        case 'sm':
            sizeStyles = 'h-8 px-3 text-xs';
            break;
        case 'lg':
            sizeStyles = 'h-11 px-8 text-base';
            break;
        case 'icon':
            sizeStyles = 'h-10 w-10';
            break;
    }
    const buttonStyles = `${baseStyles} ${variantStyles} ${sizeStyles} ${className || ''}`;
    return (<button className={buttonStyles} ref={ref} {...props}/>);
});
Button.displayName = 'Button';
export { Button };
