'use client';
import { __rest } from "tslib";
import * as React from 'react';
const Card = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className || ''}`} {...props}/>);
});
Card.displayName = 'Card';
const CardHeader = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={`p-6 pb-0 flex flex-col space-y-1.5 ${className || ''}`} {...props}/>);
});
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<h3 ref={ref} className={`text-xl font-semibold leading-none tracking-tight ${className || ''}`} {...props}/>);
});
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<p ref={ref} className={`text-sm text-gray-500 dark:text-gray-400 ${className || ''}`} {...props}/>);
});
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={`p-6 pt-4 ${className || ''}`} {...props}/>);
});
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={`p-6 pt-0 flex items-center ${className || ''}`} {...props}/>);
});
CardFooter.displayName = 'CardFooter';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
