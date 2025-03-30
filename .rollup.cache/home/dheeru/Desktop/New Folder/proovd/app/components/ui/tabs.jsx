'use client';
import { __rest } from "tslib";
import * as React from 'react';
const Tabs = React.forwardRef((_a, ref) => {
    var { className, value, onValueChange, children } = _a, props = __rest(_a, ["className", "value", "onValueChange", "children"]);
    const [activeTab, setActiveTab] = React.useState(value || '');
    React.useEffect(() => {
        if (value) {
            setActiveTab(value);
        }
    }, [value]);
    const handleTabChange = (newValue) => {
        setActiveTab(newValue);
        if (onValueChange) {
            onValueChange(newValue);
        }
    };
    return (<div ref={ref} className={`${className || ''}`} {...props}>
        {React.Children.map(children, child => {
            if (!React.isValidElement(child))
                return child;
            // Add the activeTab and onTabChange props
            return React.cloneElement(child, {
                activeTab,
                onTabChange: handleTabChange,
            });
        })}
      </div>);
});
Tabs.displayName = 'Tabs';
const TabsList = React.forwardRef((_a, ref) => {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 ${className || ''}`} {...props}/>);
});
TabsList.displayName = 'TabsList';
const TabsTrigger = React.forwardRef((_a, ref) => {
    var { className, value, activeTab, onTabChange } = _a, props = __rest(_a, ["className", "value", "activeTab", "onTabChange"]);
    const isActive = activeTab === value;
    return (<button ref={ref} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
          ${isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'} ${className || ''}`} onClick={() => onTabChange === null || onTabChange === void 0 ? void 0 : onTabChange(value)} {...props}/>);
});
TabsTrigger.displayName = 'TabsTrigger';
const TabsContent = React.forwardRef((_a, ref) => {
    var { className, value, activeTab } = _a, props = __rest(_a, ["className", "value", "activeTab"]);
    const isActive = activeTab === value;
    if (!isActive)
        return null;
    return (<div ref={ref} className={`mt-2 ${className || ''}`} {...props}/>);
});
TabsContent.displayName = 'TabsContent';
export { Tabs, TabsList, TabsTrigger, TabsContent };
