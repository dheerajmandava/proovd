import { __rest } from "tslib";
import * as React from 'react';
const Alert = React.forwardRef((_a, ref) => {
    var { className, variant = 'default' } = _a, props = __rest(_a, ["className", "variant"]);
    // Base styles
    let baseStyles = 'relative w-full rounded-lg border p-4';
    // Variant styles
    let variantStyles = '';
    switch (variant) {
        case 'default':
            variantStyles = 'bg-gray-50 border-gray-200 text-gray-900';
            break;
        case 'destructive':
            variantStyles = 'bg-red-50 border-red-500 text-red-900';
            break;
        case 'warning':
            variantStyles = 'bg-amber-50 border-amber-500 text-amber-900';
            break;
    }
    const alertStyles = `${baseStyles} ${variantStyles} ${className || ''}`;
    return (<div ref={ref} role="alert" className={alertStyles} {...props}/>);
});
Alert.displayName = 'Alert';
const AlertTitle = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<h5 ref={ref} className={`mb-1 font-medium leading-none tracking-tight ${className || ''}`} {...props}/>);
});
AlertTitle.displayName = 'AlertTitle';
const AlertDescription = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={`text-sm text-gray-600 ${className || ''}`} {...props}/>);
});
AlertDescription.displayName = 'AlertDescription';
export { Alert, AlertTitle, AlertDescription };
