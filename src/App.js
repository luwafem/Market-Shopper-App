import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ProductPriceChecker from './components/ProductPriceChecker';
import PriceSearchBar from './components/PriceSearchBar';

// --- CONFIGURATION CONSTANTS ---
// ADDED ALL REQUIRED REACT ICONS HERE
import { FaInstagram, FaTwitter, FaWhatsapp, FaTiktok, FaPhoneAlt, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaQuestionCircle, FaGavel, FaShoppingCart, FaSearch, FaDollarSign } from 'react-icons/fa';
// Ensure FaGavel and FaDollarSign are in this list.

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgvzwray';
const PAYSTACK_PUBLIC_KEY = 'pk_live_2ba1413aaaf5091188571ea6f87cca34945d943c';
const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v1/inline.js';
const SHOPPING_TYPES = [
    'General Groceries', 
    'Electronics/Gadgets', 
    'Apparel/Fashion', 
    'Pharmaceuticals/Wellness',
    'Office/Home Supplies', 
    'Hardware/Tools', 
    'Mixed Basket'
];
// Image URLs for the new Carousel
const CAROUSEL_IMAGES = [
    'https://images.unsplash.com/photo-1543168256-41881157662c?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Electronics/Gadgets
    'https://images.unsplash.com/photo-1579621970588-a35d0e7ab93b?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Groceries
    'https://images.unsplash.com/photo-1627993077671-557c66c0d6ec?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Apparel/Fashion
];

// --- FEES CONSTANTS ---
const BASE_SHOPPER_FEE = 10000;
const SERVICE_FEE_RATE = 0.10;
// 10%

// LAGOS TRANSPORT FEE PRICE LIST
const LAGOS_TRANSPORT_FEES = {
    'select': 0,
    'Lagos Mainland - Yaba/Surulere (Zone 1)': 2500,
    'Lagos Mainland - Ikeja/Maryland (Zone 2)': 3500,
    'Lagos Mainland - Agege/Ogba (Zone 3)': 4500,
    'Lagos Island - Lekki Phase 1/Ikoyi (Zone 1)': 3000,
    'Lagos Island - V.I./Ajah (Zone 2)': 4000,
    'Lagos Outskirts - Ikorodu/Badagry': 6000,
    'Other Location (Quote Later)': 0,
};
// PRIORITY FEES
const PRIORITY_FEES = {
    'standard': 0,
    'priority': 5000,
};
// EMERGENCY CONTACT for general support (in footer)
const EMERGENCY_CONTACT_NUMBER = '0800-SHOPPER';

// SOCIAL MEDIA LINKS
const SOCIAL_LINKS = [
    { name: 'Instagram', url: 'https://instagram.com/honeyshopper', Icon: FaInstagram },
    { name: 'Twitter', url: 'https://twitter.com/honeyshopper', Icon: FaTwitter },
    { name: 'WhatsApp', url: 'https://wa.me/2348007467737', Icon: FaWhatsapp },
    { name: 'TikTok', url: 'https://www.tiktok.com/@honeyshopper', Icon: FaTiktok },
];


// --- HELPER FUNCTION: Local Storage Persistence Hook ---
/**
 * Custom hook to manage state that persists in localStorage.
 * @param {string} key The localStorage key.
 * @param {any} defaultValue The default value if no item is found in localStorage.
 * @returns {[any, (value: any) => void]} The state and setter function.
 */
const useStickyState = (key, defaultValue) => {
    // Initialize state from localStorage or use the default value
    const [state, setState] = useState(() => {
        try {
            if (typeof window !== 'undefined') {
                const value = window.localStorage.getItem(key);
                return value !== null ? JSON.parse(value) : defaultValue;
            }
        } catch (e) {
            // Handle error in case localStorage is unavailable (e.g., security restrictions)
            console.warn(`Error reading localStorage key “${key}”:`, e);
        }
        return defaultValue;
    });

    // useEffect to save state to localStorage whenever it changes
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(state));
            }
        } catch (e) {
            console.error(`Error setting localStorage key “${key}”:`, e);
        }
    }, [key, state]);

    return [state, setState];
};

// --- HELPER FUNCTION: Dynamic Page Title ---
const getPageTitle = (page) => {
    switch (page) {
        case 'payment':
            return 'HoneyShopper: Secure Payment';
        case 'faq':
            return 'HoneyShopper: FAQ & Help Center';
        case 'legal':
            return 'HoneyShopper: Terms of Service & Privacy';
        case 'success':
            return 'HoneyShopper: Order Submitted Successfully'; // NEW TITLE
        case 'order':
        default:
            return 'HoneyShopper: Your Personal Shopper in Lagos';
    }
};


// --- COMPONENT: Metadata Tags for SEO/Accessibility (Updated to be dynamic) ---
const MetadataTags = ({ page }) => {
    useEffect(() => {
        // Set document title dynamically
        document.title = getPageTitle(page);

        // Helper function to set or update meta tags
        const setMetaTag = (name, content) => {
            let tag = document.querySelector(`meta[name="${name}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('name', name);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
        };

        // Set description
        setMetaTag('description', 'HoneyShopper is a trusted personal shopping and delivery service in Lagos. Submit your list for groceries, electronics, and more, and choose instant pay or quote later.');
        // Set viewport for responsiveness (already in template, but good practice)
        setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        // Set keywords
        setMetaTag('keywords', 'personal shopper, Lagos delivery, grocery delivery, Nigeria, Paystack payment, shopping service');

    }, [page]); // Re-run effect when page changes

    // This component renders nothing, only performs side effects on the document head
    return null;
};

// --- COMPONENT: Toast Notification System ---
const ToastNotification = ({ message, type, isVisible, onClose }) => {
    if (!isVisible) return null;

    const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white font-semibold flex items-center transition-opacity duration-300 z-50 max-w-sm";
    
    let colorClasses = '';
    let IconComponent = FaCheckCircle;

    switch (type) {
        case 'success':
            colorClasses = 'bg-green-600';
            IconComponent = FaCheckCircle;
            break;
        case 'error':
            colorClasses = 'bg-red-600';
            IconComponent = FaExclamationTriangle;
            break;
        case 'warning':
            colorClasses = 'bg-yellow-600';
            IconComponent = FaExclamationTriangle;
            break;
        default:
            colorClasses = 'bg-gray-700';
            IconComponent = FaCheckCircle;
    }

    return (
        <div 
            className={`${baseClasses} ${colorClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            // Add role="alert" for accessibility
            role="alert"
        >
            <IconComponent className="mr-3 text-xl flex-shrink-0" />
            <div className='flex-grow text-sm'>{message}</div>
            <button 
                onClick={onClose} 
                className="ml-4 text-white opacity-80 hover:opacity-100 transition text-lg"
                aria-label="Close notification" // Add aria-label
            >
                &times;
            </button>
        </div>
    );
};


// --- HELPER COMPONENT: Input Field Abstraction ---
const FormInput = (props) => (
    <input
        {...props}
        // Reduced padding for a tighter feel
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition duration-150 placeholder-gray-500 text-sm"
    />
);

// --- COMPONENT 1: The Dynamic Shopping List Item (Updated with Budget and Notes) ---
const ShoppingListItem = ({ index, item, onChange, onRemove, showBudgetError }) => {
    return (
        <div className="flex flex-col gap-2 mb-3 p-3 bg-white rounded-lg shadow-sm items-start border border-gray-100">
            {/* Item Name and Remove Button: Reduced gap */}
            <div className='flex w-full gap-2'>
                {/* Item Name Input */}
                <input
                    type="text"
                    name={`list[${index}][item]`}
                    placeholder="E.g., Laptop charger, Tomatoes" 
                    value={item.item}
                    onChange={(e) => onChange(index, 'item', e.target.value)}
                    className="flex-grow w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37] text-sm"
                    required
                />
          
                {/* Remove Button - Reduced padding/size */}
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="bg-black text-white px-3 py-2 rounded-lg hover:bg-[#D4AF37] transition duration-150 flex-shrink-0 font-semibold text-xs"
                    aria-label={`Remove item ${index + 1}`} // Added aria-label
                >
                    X
                </button>
            </div>

            {/* Quantity, Unit, and Budget: Reduced gap */}
            <div className='flex w-full gap-2 items-center'>
 
                {/* Quantity Input (w-1/3) */}
                <div className='w-1/3 min-w-0'>
                    <input
                        type="number"
                        name={`list[${index}][quantity]`}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => onChange(index, 'quantity', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-[#D4AF37] text-sm"
                        required
                    />
                </div>
                
           
                {/* Unit Select (w-1/3) */}
                <div className='w-1/3 min-w-0'>
                    <select
                        name={`list[${index}][unit]`}
                        value={item.unit}
     
                        onChange={(e) => onChange(index, 'unit', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] bg-white text-sm"
                        required
                    >
 
                        <option value="pcs">Pcs</option>
                        <option value="kg">kg</option>
                        <option value="bags">Bags</option>
                        <option value="crates">Crates</option>
 
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Budget Input (w-1/3) */}
                <div className='w-1/3 min-w-0'>
  
                   <input
                        type="number"
                        name={`list[${index}][budget]`}
                        placeholder="Budget (NGN)"
          
                        value={item.budget || ''}
                        onChange={(e) => onChange(index, 'budget', e.target.value)}
                        className={`w-full p-2 border rounded-lg text-center focus:ring-2 focus:ring-[#D4AF37] text-sm ${showBudgetError && (!item.budget || Number(item.budget) <= 0) ?
'border-red-500 ring-red-300' : 'border-gray-300'}`}
                        min="0"
                    />
                </div>
            </div>

            {/* NEW: Item-specific Note field */}
            <div className='w-full'>
                <input
                    type="text"
                    name={`list[${index}][note]`}
                    placeholder="Specific Note (e.g., 'Must be fresh', 'Blue color only')"
                    value={item.note || ''}
                    onChange={(e) => onChange(index, 'note', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-xs italic mt-1"
                />
            </div>
            {showBudgetError && (!item.budget || Number(item.budget) <= 0) && (
     
            <p className='text-xs text-red-500 mt-1'>* Budget is required for Instant Payment mode.</p>
            )}
        </div>
    );
};

// Function to clear all relevant local storage items on success
const clearLocalStorage = () => {
    localStorage.removeItem('hs_clientInfo');
    localStorage.removeItem('hs_shoppingList');
    localStorage.removeItem('hs_shoppingType');
    localStorage.removeItem('hs_deliveryTime');
    localStorage.removeItem('hs_selectedZone');
    localStorage.removeItem('hs_selectedPriority');
    localStorage.removeItem('hs_pricingMode');
    localStorage.removeItem('hs_emergencyName');
    localStorage.removeItem('hs_emergencyPhone');
};


// --- COMPONENT 2: The Main Order Form & List Builder (Refactored with Local Storage Persistence) ---
const OrderForm = ({ navigate, showToast }) => {
    // --- State initialized using Local Storage Hook (Major UX Improvement) ---
    const [clientInfo, setClientInfo] = useStickyState('hs_clientInfo', { name: '', phone: '', email: '', address: '' });
    const initialShoppingList = [{ item: '', quantity: '', unit: 'pcs', budget: '', note: '' }];
    const [shoppingList, setShoppingList] = useStickyState('hs_shoppingList', initialShoppingList);
    const [shoppingType, setShoppingType] = useStickyState('hs_shoppingType', SHOPPING_TYPES[0]);
    const [deliveryTime, setDeliveryTime] = useStickyState('hs_deliveryTime', '');
    const [selectedZone, setSelectedZone] = useStickyState('hs_selectedZone', 'select');
    const [selectedPriority, setSelectedPriority] = useStickyState('hs_selectedPriority', 'standard');
    const [pricingMode, setPricingMode] = useStickyState('hs_pricingMode', 'quote');
    const [emergencyName, setEmergencyName] = useStickyState('hs_emergencyName', '');
    const [emergencyPhone, setEmergencyPhone] = useStickyState('hs_emergencyPhone', '');
    // --- End Local Storage Hooks ---
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBudgetError, setShowBudgetError] = useState(false);
    
    // Calculate the total budget for goods
    const totalBudget = useMemo(() => {
        // Ensure shoppingList is not empty and all items are valid
        if (shoppingList.length === 0) return 0;
        return shoppingList.reduce((total, item) => {
            const budget = Number(item.budget) || 0;
            return total + budget;
        }, 0);
    }, [shoppingList]);
    
    // Calculate the final cost details including fees
    const finalCostDetails = useMemo(() => {
        const shoppingListTotal = totalBudget; // Cost of goods
        const shopperFee = BASE_SHOPPER_FEE; // 10,000 NGN fixed fee
        const serviceFee = shoppingListTotal * SERVICE_FEE_RATE; // 10% of goods total
        
        // Find transport fee based on the selected zone
        const transportFee = 
        LAGOS_TRANSPORT_FEES[selectedZone] || 0;
        
        // Calculate Priority Fee
        const priorityFee = PRIORITY_FEES[selectedPriority] || 0;
        
        // Include priority fee in subtotal
        const subtotal = shoppingListTotal + shopperFee + serviceFee + transportFee + priorityFee;
        
        return {
        
            shoppingListTotal: shoppingListTotal,
            shopperFee: shopperFee,
            serviceFee: serviceFee,
            transportFee: transportFee,
            priorityFee: priorityFee, 
            finalAmount: Math.ceil(subtotal), // Round up for clean payment amount
        };
    }, [totalBudget, selectedZone, selectedPriority]);
    
    const finalAmount = finalCostDetails.finalAmount; // Total amount to be paid
    
    const handleClientChange = (e) => {
        setClientInfo({ ...clientInfo, [e.target.name]: e.target.value });
    };

    // Updated handler to accept 'note' field
    const handleListItemChange = (index, field, value) => {
        const newShoppingList = shoppingList.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setShoppingList(newShoppingList);
        setShowBudgetError(false); // Clear error on change
    };

    const handleAddItem = () => {
        // Updated initial item to include 'note'
        setShoppingList([...shoppingList, { item: '', quantity: '', unit: 'pcs', budget: '', note: '' }]);
    };

    const handleRemoveItem = (index) => {
        setShoppingList(shoppingList.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // General validation (using alert for blocking, pre-submission errors)
        if (shoppingList.length === 0 || shoppingList.some(item => !item.item || !item.quantity)) {
            alert("Please add at least one item with a quantity and name.");
            return;
        }

        setIsSubmitting(true);
        
        // Pricing Mode Specific Validation
        if (pricingMode === 'budget') {
            const missingBudget = shoppingList.some(item => !item.budget || Number(item.budget) <= 0);
            
            // Transport fee validation: Check if a zone is selected
            if (selectedZone === 'select' || finalCostDetails.transportFee === 0) {
                 alert("For Instant Payment, please select a Delivery Location Zone to calculate transport fee.");
                 setIsSubmitting(false); // End submitting state
                 return;
            }

            if (missingBudget || totalBudget <= 0) {
                setShowBudgetError(true);
                alert("For Instant Payment, you must set a positive budget for *all* items.");
                setIsSubmitting(false); // End submitting state
                return;
            }
            
            if (finalAmount <= 0) {
                alert("The total final amount must be greater than zero to proceed with instant payment.");
                setIsSubmitting(false); // End submitting state
                return;
            }
            
            // --- INSTANT PAYMENT MODE LOGIC ---
            // Simulate a brief delay for UX before navigation
            setTimeout(() => {
                setIsSubmitting(false); 
                // We do NOT clear local storage here, as the payment might fail and we want to preserve the list
                navigate('payment', { 
                    email: clientInfo.email, 
                    amount: finalAmount, // Use final calculated amount
                });
            }, 500);
            
        } else {
            // --- SHOPPER SOURCED PRICE MODE LOGIC (Quote Later) ---
            
            const form = e.target;
            const formData = new FormData(form);

            // Add non-form-bound states and fee details for Quote Later mode
            formData.append('Pricing Mode', 'Shopper Sourced Quote');
            formData.append('Shopping Type', shoppingType);
            formData.append('Delivery Time', deliveryTime);
            formData.append('Delivery Zone Estimate', selectedZone);
            formData.append('Delivery Priority', selectedPriority === 'priority' ? `Priority (+NGN ${PRIORITY_FEES.priority.toLocaleString()})` : 'Standard');
            formData.append('Emergency Contact Name', emergencyName || 'N/A');
            formData.append('Emergency Contact Phone', emergencyPhone || 'N/A');

            // --- Format Shopping List with Notes for submission ---
            const formattedList = shoppingList.map((item, index) => {
                const notes = item.note ? ` (Note: ${item.note})` : '';
                return `${index + 1}. ${item.item} - Qty: ${item.quantity} ${item.unit}${notes} (Budget: ${item.budget ? `NGN ${Number(item.budget).toLocaleString()}` : 'Not Set'})`;
            }).join('\n');
            
            formData.append('Shopping List (Detailed)', formattedList);
            
            // Remove the nested list fields
            shoppingList.forEach((_, index) => {
                formData.delete(`list[${index}][item]`);
                formData.delete(`list[${index}][quantity]`);
                formData.delete(`list[${index}][unit]`);
                formData.delete(`list[${index}][budget]`);
                formData.delete(`list[${index}][note]`);
            });
            // -----------------------------------------------------------

            // Include a note about fees for the shopper
            formData.append('Shopper Note on Fees', `Base Fee: NGN ${BASE_SHOPPER_FEE.toLocaleString()}, Service Rate: ${SERVICE_FEE_RATE * 100}%`);
            
            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // --- NEW: Navigate to success page instead of just toast/resetting form state ---
                    showToast(`✅ List submitted successfully! Redirecting to confirmation page.`, 'success');
                    
                    // --- Clear Local Storage on SUCCESSFUL Submission ---
                    clearLocalStorage();

                    // Navigate to the new success page
                    navigate('success'); 
                    
                } else {
                    const data = await response.json();
                    if (Object.hasOwn(data, 'errors')) {
                        showToast(`Submission failed: ${data["errors"].map(error => error["message"]).join(", ")}`, 'error');
                    } else {
                        showToast("Oops! There was an error submitting your list.", 'error');
                    }
                }
            } catch (error) {
                showToast("Oops! Network error. Please try again.", 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    

    return (
        <form onSubmit={handleSubmit} action={FORMSPREE_ENDPOINT} method="POST">
            {/* Reduced overall container padding */}
            <div className="max-w-4xl mx-auto bg-white p-4 md:p-8 rounded-3xl relative" role="form" aria-label="HoneyShopper Order Form">
                
                {/* NEW: Loading Overlay */}
                {isSubmitting && (
                    <div className="absolute inset-0 bg-black/50 z-30 flex items-center justify-center rounded-3xl" role="status" aria-label="Processing form submission">
                        <FaSpinner className="animate-spin text-5xl text-[#D4AF37]" />
                        <p className='text-white ml-4 text-lg font-bold'>Processing...</p>
                    </div>
                )}
                
                {/* Section 1: Delivery Details & Preferences */}
         
               <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-[#D4AF37] pb-2">1. Delivery Details & Preferences</h2>
                
                {/* Reduced gap- and mb- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <FormInput type="text" name="name" placeholder="Your Full Name" value={clientInfo.name} onChange={handleClientChange} required aria-label="Full Name" />
                    <FormInput type="tel" name="phone" placeholder="Contact Phone Number" value={clientInfo.phone} onChange={handleClientChange} required aria-label="Contact Phone Number" />
                    <FormInput type="email" name="email" placeholder="Email Address (For receipt & Paystack)" value={clientInfo.email} onChange={handleClientChange} required aria-label="Email Address" /> 
                    
             
               {/* Address/Location Input Field */}
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>Delivery Street Address (Detailed)</label>
                        <FormInput 
            
                         type="text"
                            name="address"
                            placeholder="Street number, building name, landmark"
                     
                        value={clientInfo.address}
                            onChange={handleClientChange}
                            required
                             aria-label="Delivery Street Address"
                        />
          
                   </div>
                    
                    {/* Preferred Delivery Time */}
                    <div>
                        <label className='block 
text-xs font-medium text-gray-700 mb-1'>Preferred Delivery Time</label>
                        <FormInput type="text" name="deliveryTime" placeholder="E.g., Tomorrow 2pm-5pm or ASAP" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} required aria-label="Preferred Delivery Time" />
                    </div>

                    {/* Type of Shopping */}
              
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>Type of Shopping</label>
                        <select
                            name="shoppingType"
           
                            value={shoppingType}
                            onChange={(e) => setShoppingType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] bg-white text-sm"
                 
            required
                             aria-label="Type of Shopping"
                        >
                            {SHOPPING_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
 
                            ))}
                        </select>
                    </div>
                </div>

             
               {/* NEW: Alternative Contact Section */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pt-3 border-t border-gray-100'>
                    <div className='sm:col-span-2'>
                        <h3 className='text-sm font-extrabold text-[#D4AF37] mb-2'>
                   
                 Alternative/Emergency Contact (In case the primary client is unreachable)
                        </h3>
                    </div>
                    <FormInput 
                  
                       type="text"
                        name="emergencyName"
                        placeholder="Alternative Contact Full Name (Optional)"
                        value={emergencyName}
              
                       onChange={(e) => setEmergencyName(e.target.value)}
                       aria-label="Alternative Contact Full Name"
                    />
                    <FormInput 
                        type="tel"
                     
                        name="emergencyPhone"
                        placeholder="Alternative Contact Phone (Optional)"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        aria-label="Alternative Contact Phone"
                
                     />
                </div>
                
                {/* Delivery Priority and Zone (in a 2-column layout now) */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pt-3 border-t border-gray-100'>
              
               {/* Delivery Priority Select */}
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>Delivery Priority</label>
                        <select
                
                            name="deliveryPriority"
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            className="w-full p-2
border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] bg-white text-sm"
                            aria-label="Delivery Priority"
                        >
                            <option value="standard">Standard (NGN 0)</option>
                            <option value="priority">Priority (NGN 5,000)</option>
        
                 </select>
                        <p className='text-xs text-[#D4AF37] mt-1'>
                            Priority offers the fastest available shopper dispatch and delivery.
</p>
                    </div>

                    {/* Delivery Location Zone Select (Mandatory for Instant Pay) */}
                    <div>
                        <label className={`block text-xs font-medium text-gray-700 mb-1 ${pricingMode 
=== 'budget' ? 'text-[#D4AF37] font-extrabold' : ''}`}>
                            {pricingMode === 'budget' ?
'* Select Delivery Zone for Transport Fee' : 'Estimated Delivery Zone'}
                        </label>
                        <select
                            name="deliveryLocationZone"
              
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] bg-white text-sm"
                    
                        required={pricingMode === 'budget'}
                        aria-label="Delivery Location Zone"
                        >
                            {Object.entries(LAGOS_TRANSPORT_FEES).map(([zone, fee]) => (
                                <option key={zone} value={zone} 
disabled={zone === 'select'}>
                                    {zone === 'select' ? '--- Select Zone ---' : `${zone} (NGN ${fee.toLocaleString()})`}
                                </option>
                   
                          ))}
                        </select>
                        <p className='text-xs text-gray-500 mt-1'>
                            {pricingMode === 'budget' ?
`Selected Fee: NGN ${finalCostDetails.transportFee.toLocaleString()}` : 'Fee will be confirmed by shopper.'}
                        </p>
                    </div>
                </div>
                
              
               {/* Section 2: Pricing Mode */}
                <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-[#D4AF37] pb-2">2.
Choose Your Payment Method</h2>
                {/* Reduced gap and padding */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <label className={`flex-1 flex items-start p-3 rounded-xl cursor-pointer transition duration-200 border-2 ${pricingMode === 'budget' ?
'bg-[#D4AF37]/50 border-[#D4AF37] ring-2 ring-[#D4AF37]' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                        <input 
                            type="radio" 
                            name="pricingMode" 
          
                            value="budget"
                            checked={pricingMode === 'budget'}
                            onChange={() => setPricingMode('budget')}
                   
                          className="w-4 h-4 mt-1 mr-2 appearance-none border-2 rounded-full checked:bg-[#D4AF37] checked:border-[#D4AF37] focus:outline-none flex-shrink-0"
                            required
                            aria-label="Client Budget (Instant Pay) mode"
                        />
                        <div>
     
                            <span className="font-bold text-gray-800 block text-sm">Client Budget (Instant Pay)</span>
                            <span className="text-xs text-gray-600">Set budget per item, add calculated fees, & pay now.</span>
                        </div>
       
                    </label>

                    <label className={`flex-1 flex items-start p-3 rounded-xl cursor-pointer transition duration-200 border-2 ${pricingMode === 'quote' ?
'bg-orange-50 border-orange-500 ring-2 ring-orange-100' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                        <input 
                            type="radio" 
                            name="pricingMode" 
          
                            value="quote"
                            checked={pricingMode === 'quote'}
                            onChange={() => setPricingMode('quote')}
                   
                          className="w-4 h-4 mt-1 mr-2 appearance-none border-2 rounded-full checked:bg-[#D4AF37] checked:border-[#D4AF37] focus:outline-none flex-shrink-0"
                            required
                            aria-label="Shopper Sourced Price (Quote Later) mode"
                        />
                        <div>
     
                            <span className="font-bold text-gray-800 block text-sm">Shopper Sourced Price (Quote Later)</span>
                            <span className="text-xs text-gray-600">Submit list and wait for shopper to send a final quote (including fees).</span>
                        </div>
   
                    </label>
                </div>
                
                {/* Section 3: Shopping List */}
                <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-[#D4AF37] pb-2">3.
Create Shopping List</h2>
                
                {/* Shopping List Items */}
                {/* Ensure shoppingList has at least one item before mapping */}
                {(shoppingList.length === 0 ? [{ item: '', quantity: '', unit: 'pcs', budget: '', note: '' }] : shoppingList).map((item, index) => (
                    <ShoppingListItem
                       
                        key={index}
                        index={index}
                        item={item}
                        onChange={handleListItemChange}
                        onRemove={handleRemoveItem}
   
                        showBudgetError={pricingMode === 'budget' && showBudgetError}
                    />
                ))}

                {/* Reduced py- and mb- */}
                <button
  
                        type="button"
                    onClick={handleAddItem}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl mb-6 hover:bg-gray-200 transition duration-150 font-bold border-2 border-dashed border-gray-300 text-sm"
                    aria-label="Add another item to shopping list"
                >
             
        + Add Another Item
                </button>
                
                {/* Total Cost Breakdown Display */}
                {pricingMode === 'budget' && finalCostDetails.finalAmount > 0 && (
             
                <div className='p-4 mb-6 bg-green-100 rounded-xl border-2 border-green-500' role="region" aria-label="Instant Payment Cost Breakdown">
                        <h3 className='text-lg font-extrabold text-green-800 mb-2 border-b border-green-300 pb-1'>
                            Estimated Instant Payment Breakdown
                        </h3>
 
                        
                        <div className='space-y-1 text-sm'>
                            <div className='flex justify-between'>
                     
            <span className='text-gray-700'>Shopping List Total (Budget)</span>
                                <span className='font-semibold text-gray-800'>NGN {finalCostDetails.shoppingListTotal.toLocaleString()}</span>
                            </div>
                      
                        <div className='flex justify-between'>
                                <span className='text-gray-700'>Base Shopper Fee</span>
                                <span className='font-semibold text-gray-800'>NGN {finalCostDetails.shopperFee.toLocaleString()}</span>
                      
                        </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-700'>10% Service Fee</span>
                             
                            <span className='font-semibold text-gray-800'>NGN {Math.ceil(finalCostDetails.serviceFee).toLocaleString()}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-700'>Transport Fee (Selected 
Zone)</span>
                                <span className='font-semibold text-gray-800'>NGN {finalCostDetails.transportFee.toLocaleString()}</span>
                            </div>
                            {/* Priority Fee in breakdown */}
    
                            <div className='flex justify-between'>
                                <span className='text-gray-700'>Delivery Priority Fee</span>
                                <span className='font-semibold text-gray-800'>NGN {finalCostDetails.priorityFee.toLocaleString()}</span>
    
                            </div>

                            <div className='flex justify-between pt-2 border-t border-green-300 font-extrabold text-lg text-green-700'>
                                <span>TOTAL DUE NOW</span>
      
                                <span>NGN {finalCostDetails.finalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                     
                    <p className='text-xs text-green-700 mt-2 text-center'>* Total amount rounded up to the nearest whole number.</p>
                    </div>
                )}
                
                {/* Section 4: Additional Notes (Now less important due to item-specific notes) */}
           
               <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-[#D4AF37] pb-2">4.
General Notes (Optional)</h2>
                <textarea 
                    name="general_notes"
                    placeholder="E.g., 'Please buy the blue version of the kettle', 'If item A is unavailable, buy item B instead'."
className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition duration-150" rows="2"
                    aria-label="General Notes for the entire order"
                ></textarea>

                {/* Submit Button (Updated with finalAmount) */}
                <button
                    type="submit"
              
                       disabled={isSubmitting}
                    className="w-full bg-black text-white text-lg font-extrabold py-4 rounded-xl hover:bg-[#D4AF37] transition duration-300  disabled:bg-gray-400 disabled:shadow-none"
                    aria-live="polite"
                >
                    {isSubmitting ? (
                        <div className='flex items-center justify-center'>
                            <FaSpinner className='animate-spin mr-2' /> Submitting...
                        </div>
                    ) : (
                        pricingMode === 'budget' 
                            ? `Pay NGN ${finalCostDetails.finalAmount.toLocaleString()} Now`
                            : 'Submit List & Wait for Quote'
                    )}
                </button>
            </div>
        </form>
    );
};

// --- FEE PRICE LIST CONSTANTS ---
const FEE_PRICES = [
    { service: 'Personal Shopping Fee', rate: '20%', description: 'Of the total value of your items, minimum NGN 1,500.', icon: FaShoppingCart },
    { service: 'Instant Pay Discount', rate: '5%', description: 'Discount applied if Client Budget (Instant Pay) mode is selected.', icon: FaDollarSign },
    { service: 'Inter-Market Transit Fee', rate: 'NGN 1,000', description: 'Applicable for items sourced from multiple, far-apart markets.', icon: FaGavel },
];

// --- FEE PRICE LIST COMPONENT ---
const FeePriceListSection = () => {
    return (
        <section className="py-8 sm:py-12 bg-white" id="fee-price-list">
            <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-2xl font-extrabold text-center text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
                    Standard Service Fees
                </h2>
                <p className="text-sm text-center text-gray-600 mb-6">
                    Transparency on our service costs. These fees are included in your final price calculation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FEE_PRICES.map((fee, index) => (
                        <div 
                            key={index} 
                            className="p-6 bg-gray-50 rounded-xl shadow-md border-t-4 border-[#D4AF37] transition hover:shadow-lg"
                        >
                            <div className="flex items-center mb-3">
                                <fee.icon className="text-xl text-black mr-3" />
                                <h3 className="text-lg font-bold text-gray-800">{fee.service}</h3>
                            </div>
                            <p className="text-2xl font-extrabold text-black mb-2">{fee.rate}</p>
                            <p className="text-sm text-gray-600">{fee.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PriceCheckPage = () => {
    return (
        <div className="mt-8">
            <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
                Pricing & Fee Guide
            </h1>
            {/* Pass state and setters down to the checker */}
            <ProductPriceChecker 
                selectedCategory={selectedPriceCategory} 
                searchTerm={priceSearchTerm} 
                setSelectedCategory={setSelectedPriceCategory} // Pass setter if you want controls inside the checker
                setSearchTerm={setPriceSearchTerm}             // Pass setter if you want controls inside the checker
            /> 
            <FeePriceListSection /> 
        </div>
    );
};

// --- COMPONENT 3: Payment Widget ---
const PaymentPage = ({ navigate, initialEmail = '', initialAmount = '', showToast, isPaystackLoaded }) => {
    const [amount, setAmount] = useState(initialAmount);
    const [clientEmail, setClientEmail] = useState(initialEmail);
    const [reference, setReference] = useState('');

    useEffect(() => {
        setAmount(initialAmount);
        setClientEmail(initialEmail);
    }, [initialAmount, initialEmail]);

    const payWithPaystack = () => {
        if (!isPaystackLoaded) {
            showToast('Payment system is still loading. Please wait a moment.', 'warning');
            return;
        }
        if (!amount || Number(amount) <= 0) { 
            showToast('Please enter a valid total amount due.', 'error');
            return; 
        }
        if (!clientEmail || !clientEmail.includes('@')) { 
            showToast('Please enter a valid email address.', 'error');
            return; 
        }
        
        // Check for PaystackPop after we know the script should be loaded
        if (typeof window.PaystackPop === 'undefined') { 
            showToast('Payment system failed to load. Please refresh the page.', 'error');
            return; 
        }

        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: clientEmail,
            amount: Math.floor(Number(amount) * 100), // Amount in Kobo/Cent
            ref: reference || `hs_${Date.now()}`, // Updated reference prefix
            onClose: () => { 
                showToast('Payment cancelled by user. Your order data remains saved in the form.', 'warning');
            },
       
         callback: (response) => {
                showToast(`Payment Successful! Reference: ${response.reference}.`, 'success');
                clearLocalStorage(); // Clear saved form data on payment success
                setAmount('');
                setClientEmail('');
                setReference('');
                navigate('order'); 
       
         },
        });
        
        handler.openIframe();
    };
    
    const isPayButtonDisabled = !(Number(amount) > 0 && clientEmail.includes('@')) || !isPaystackLoaded;

    return (
        // Reduced padding and margin-top 
        <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 mt-6" role="main" aria-label="Secure Payment Page">
            {/* Reduced h2 size, mb- and pb- */}
            <h2 className="text-2xl font-extrabold text-green-600 mb-4 border-b-2 border-green-100 pb-2 text-center">Secure Payment</h2>
            {/* Reduced mb- and text-size */}
    
            <p className="text-gray-600 mb-6 text-center text-sm">
                Complete your payment securely via Paystack.
            </p>

            {/* Paystack Loading Spinner */}
            {!isPaystackLoaded && (
                <div className='flex items-center justify-center p-3 mb-4 bg-yellow-100 rounded-lg text-yellow-800'>
                    <FaSpinner className='animate-spin mr-2' /> 
                    <p className='text-sm'>Loading secure payment widget...</p>
                </div>
            )}

            {/* Reduced mb- and text-size/padding */}
            <div className="mb-4">
                <label htmlFor="amount-input" className="block text-gray-700 font-bold mb-1 text-base">Total Amount Due (NGN)</label>
 
                <input
                    id="amount-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 45000"
  
                    className="w-full p-3 border-4 border-green-400 rounded-xl text-2xl font-extrabold text-center focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-150"
                    required
                    aria-label="Amount to pay in Naira"
                />
                {initialAmount && <p className='text-xs text-green-600 mt-1 text-center font-medium'>This amount is pre-filled from your total item budget + fees.</p>}
 
            </div>
            {/* Reduced mb- */}
            <div className="mb-4">
                <label htmlFor="email-input" className="block text-gray-700 font-bold mb-1 text-sm">Your Email for Receipt</label>
                <input
                    id="email-input"
                    type="email"
 
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition duration-150 text-sm"
         
            required
            aria-label="Email Address for receipt"
                />
                {initialEmail && <p className='text-xs text-gray-500 mt-1'>Email is pre-filled from your order details.</p>}
            </div>
            {/* Reduced mb- */}
            <div className="mb-6">
      
                <label htmlFor="ref-input" className="block text-gray-700 font-bold mb-1 text-sm">Payment Reference (Optional)</label>
                <input
                    id="ref-input"
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
     
                placeholder="Enter reference sent by shopper (if any)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition duration-150 text-sm"
                    aria-label="Payment Reference"
                />
            </div>

            {/* Reduced py- and text-size */}
    
            <button
                onClick={payWithPaystack}
                disabled={isPayButtonDisabled}
                className="w-full bg-green-600 text-white text-lg font-bold py-3 rounded-xl hover:bg-green-700 transition duration-300 shadow-xl shadow-green-300 disabled:bg-gray-400 disabled:shadow-none"
                aria-live="polite"
            >
                {isPaystackLoaded ? (
                    `Pay NGN ${Number(amount) > 0 ? Number(amount).toLocaleString() : 'Enter Amount'}`
                ) : (
                    <div className='flex items-center justify-center'><FaSpinner className='animate-spin mr-2' /> Loading...</div>
                )}
            </button>
            
            {/* Reduced mt- and text-size */}
            <button 
                onClick={() => navigate('order')}
                className="mt-4 w-full text-xs text-gray-500 hover:text-[#D4AF37] 
transition font-semibold"
            >
                Back to Order Form
            </button>
        </div>
    );
}


// --- NEW COMPONENT: Dedicated Success Page ---
const SuccessPage = ({ navigate }) => (
    <div className="container mx-auto py-16 px-4 max-w-2xl min-h-[60vh] flex items-center justify-center" role="main" aria-labelledby="success-title">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl text-center border-t-8 border-green-500">
            <FaCheckCircle className='text-6xl text-green-500 mx-auto mb-6' aria-hidden="true" />
            <h2 id="success-title" className="text-3xl font-extrabold text-gray-800 mb-3">
                Order List Submitted!
            </h2>
            <p className='text-lg text-gray-600 mb-6'>
                Thank you for choosing HoneyShopper for the **Shopper Sourced Price** option.
            </p>
            
            <div className='bg-green-50 p-4 rounded-xl border border-green-200 mb-8'>
                <h3 className='text-xl font-bold text-green-700 mb-2'>What Happens Next?</h3>
                <ol className='list-decimal list-inside text-left space-y-2 text-gray-700 text-sm'>
                    <li>
                        Our shopper is now compiling your list and sourcing the best prices.
                    </li>
                    <li>
                        We will contact you via your phone number with the **final quote (including all fees)** within **2-4 hours** (during business hours).
                    </li>
                    <li>
                        Once you approve the quote, we will send a payment link to your email.
                    </li>
                </ol>
            </div>

            <button
                onClick={() => navigate('order')}
                className="bg-black text-white text-md font-extrabold py-3 px-6 rounded-xl hover:bg-[#D4AF37] transition duration-300"
            >
                <FaShoppingCart className='inline mr-2' /> Start a New Order
            </button>
        </div>
    </div>
);


// --- NEW COMPONENT: Image Carousel ---
const ImageCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance the carousel every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % CAROUSEL_IMAGES.length);
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);

    const currentImage = CAROUSEL_IMAGES[currentIndex];

    return (
        <section className="relative h-[300px] sm:h-[400px] overflow-hidden" role="banner" aria-label="Promotional Image Carousel">
            {/* Background Image with Transition */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                style={{ backgroundImage: `url('${currentImage}')` }}
            >
            </div>

            {/* Overlay and Content */}
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-center text-white p-4">
                <div className="container mx-auto relative z-10">
                    <div className="text-5xl sm:text-6xl font-extrabold mb-3 animate-pulse" role="img" aria-label="Shopping Cart Emoji">🛒</div>
                    <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                        Your Personal Shopper for Any Store
                    </h1>
                    {/* SEO-friendly brief description */}
                    <p className='mt-2 mb-4 max-w-lg mx-auto text-sm text-gray-200'>
                        Trusted grocery, electronics, and item delivery service in Lagos, Nigeria. We shop, you relax.
                    </p>
                    <a
                        href="#order-form"
                        className="mt-4 inline-block bg-[#D4AF37] text-black text-base font-extrabold py-2 px-6 rounded-xl hover:bg-black hover:text-white transition duration-300 shadow-xl"
                        aria-label="Start Your Shopping List Now"
                    >
                        Start Your Shopping List Now!
                    </a>
                </div>
            </div>
        </section>
    );
}

// --- NEW COMPONENT: Intro Animation Screen ---
const IntroScreen = ({ onFinish }) => {
    const [opacity, setOpacity] = useState(1);
    const [display, setDisplay] = useState('flex');

    useEffect(() => {
        // Step 1: Hold the screen for 1.5 seconds
        const holdTimeout = setTimeout(() => {
            // Step 2: Start the fade out (CSS transition takes 0.5s)
            setOpacity(0);
        }, 1500);

        // Step 3: Wait for hold + transition duration, then remove element from DOM
        const hideTimeout = setTimeout(() => {
            setDisplay('hidden');
            onFinish(true); // Notify parent component that the intro is done
        }, 2000); // 1500ms (hold) + 500ms (transition)

        return () => {
            clearTimeout(holdTimeout);
            clearTimeout(hideTimeout);
        };
    }, [onFinish]);

    if (display === 'hidden') return null;

    return (
        <div 
            className="fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-500 ease-in-out"
            style={{ opacity }}
            role="dialog" // Changed to role="dialog" for a non-modal intro
            aria-label="Welcome Splash Screen"
        >
            <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce" role="img" aria-label="Honey Pot Emoji">🍯</div>
                <h1 className="text-4xl font-extrabold text-[#D4AF37]">Honey<span className='text-white'>Shopper</span></h1>
            </div>
        </div>
    );
}

// --- NEW COMPONENT: Testimonials Section ---
const TESTIMONIALS = [
    {
        quote: "HoneyShopper saved my weekend! I got fresh groceries and my new phone delivered in perfect condition. Incredible service!",
        name: "Aisha M.",
        location: "Lekki Phase 1"
    },
    {
        quote: "The instant pay option is a game-changer. I knew exactly what I was paying upfront. Seamless and fast delivery.",
        name: "Chijioke N.",
        location: "Surulere"
    },
    {
        quote: "I needed office supplies urgently. Their priority service was worth every penny. Highly recommended!",
        name: "Tayo O.",
        location: "Ikeja"
    }
];

const TestimonialsSection = () => (
    <section className="py-12 sm:py-16 bg-gray-100" role="region" aria-labelledby="testimonials-heading">
        <div className="container mx-auto px-4">
            <h2 id="testimonials-heading" className="text-3xl font-extrabold text-center text-gray-800 mb-10 border-b-2 border-[#D4AF37] inline-block mx-auto pb-2">
                What Our Clients Say
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {TESTIMONIALS.map((t, index) => (
                    <div 
                        key={index} 
                        className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-[#D4AF37] hover:shadow-xl transition duration-300 transform hover:scale-[1.02] relative"
                        role="testimonial"
                    >
                        <blockquote className="italic text-gray-600 mb-4 text-base">
                            "{t.quote}"
                        </blockquote>
                        <p className="font-bold text-gray-800 text-sm">
                            {t.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {t.location}
                        </p>
                        <div className="text-xl text-[#D4AF37] absolute top-4 right-4" aria-hidden="true">
                            ★
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// --- NEW COMPONENT: Dedicated FAQ Page ---
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 py-3">
            <button
                className="flex justify-between items-center w-full text-left font-semibold text-gray-800 hover:text-[#D4AF37] transition duration-150"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${question.slice(0, 10).replace(/\s/g, '-')}`}
            >
                <span className='text-base sm:text-lg'><FaQuestionCircle className='inline mr-2 text-gray-400' aria-hidden="true" />{question}</span>
                <span className={`text-xl transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#D4AF37]' : ''}`}>
                    &#9660; {/* Down arrow */}
                </span>
            </button>
            <div 
                id={`faq-answer-${question.slice(0, 10).replace(/\s/g, '-')}`}
                className={`pt-2 text-gray-600 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className='pl-6 pb-2 text-sm italic'>{answer}</p>
            </div>
        </div>
    );
};

const FAQPage = () => {
    const faqs = [
        {
            question: "How long does it take to get a quote?",
            answer: "For Shopper Sourced Price mode, we aim to provide a full quote within 2-4 hours during business hours (8 AM - 6 PM WAT)."
        },
        {
            question: "What if an item is out of stock or unavailable?",
            answer: "Your shopper will contact you immediately via the provided phone number to suggest a suitable alternative before making the purchase. If we cannot reach you, we will skip the item."
        },
        {
            question: "Can I order from multiple stores?",
            answer: "Yes, you can! However, multiple store visits may incur additional base shopper and transport fees, which will be calculated in your final quote."
        },
        {
            question: "Is there a minimum order value?",
            answer: "We do not enforce a strict minimum, but the fixed NGN 10,000 base shopper fee makes larger lists more cost-effective. The maximum list budget for Instant Pay is NGN 500,000."
        },
        {
            question: "What is your refund policy?",
            answer: "Refunds are processed only for items that were paid for but not purchased (e.g., if we skipped an item). Service and base shopper fees are non-refundable once the shopper has been dispatched."
        }
    ];

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl min-h-[60vh]" role="main" aria-labelledby="faq-title">
            <h2 id="faq-title" className="text-3xl font-extrabold text-center text-gray-800 mb-6 border-b-2 border-[#D4AF37] inline-block mx-auto pb-2">
                Frequently Asked Questions
            </h2>
            <div className='bg-white p-6 rounded-xl shadow-lg mt-8'>
                {faqs.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
            </div>
            <p className='text-center text-gray-500 mt-8 text-sm'>
                Can't find your answer? Please contact our general support number in the footer.
            </p>
        </div>
    );
};

// --- NEW COMPONENT: Dedicated Legal Page ---
const LegalPage = () => (
    <div className="container mx-auto py-12 px-4 max-w-4xl min-h-[60vh]" role="main" aria-labelledby="legal-title">
        <h2 id="legal-title" className="text-3xl font-extrabold text-center text-gray-800 mb-6 border-b-2 border-[#D4AF37] inline-block mx-auto pb-2">
            Terms of Service & Privacy Policy
        </h2>

        <div className='bg-white p-8 rounded-xl shadow-lg mt-8 space-y-6'>
            <section className='space-y-3' role="region" aria-labelledby="tos-heading">
                <h3 id="tos-heading" className="text-2xl font-bold text-gray-700 flex items-center">
                    <FaGavel className='mr-2 text-[#D4AF37]' aria-hidden="true" /> Terms of Service (TOS)
                </h3>
                <p className='text-sm text-gray-600'>
                    **1. Acceptance of Terms:** By using the HoneyShopper service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.
                </p>
                <p className='text-sm text-gray-600'>
                    **2. Service Fees:** All service fees, including the Base Shopper Fee, Service Fee (10%), Priority Fee, and Transport Fee, are non-refundable once the purchasing process has begun.
                </p>
                <p className='text-sm text-gray-600'>
                    **3. Liability:** HoneyShopper is responsible for purchasing the correct items as specified in the order list. We are not liable for the quality of perishable goods after successful delivery or for manufacturer defects.
                </p>
            </section>

            <section className='space-y-3 pt-4 border-t border-gray-100' role="region" aria-labelledby="privacy-heading">
                <h3 id="privacy-heading" className="text-2xl font-bold text-gray-700 flex items-center">
                    <FaGavel className='mr-2 text-[#D4AF37]' aria-hidden="true" /> Privacy Policy
                </h3>
                <p className='text-sm text-gray-600'>
                    **1. Information Collection:** We collect personal information such as your name, email, phone number, and delivery address solely for the purpose of processing and delivering your order. Payment information is handled securely by Paystack and is not stored by HoneyShopper.
                </p>
                <p className='text-sm text-gray-600'>
                    **2. Data Usage:** Your contact information may be shared with the designated shopper for direct communication regarding your order (e.g., out-of-stock items). We do not sell your data to third parties.
                </p>
                <p className='text-sm text-gray-600'>
                    **3. Consent:** By submitting an order, you consent to the collection and use of information in accordance with this policy.
                </p>
            </section>
        </div>
        <p className='text-center text-gray-500 mt-8 text-sm'>
            Last updated: {new Date().toLocaleDateString('en-GB')}
        </p>
    </div>
);



// --- NEW WRAPPER COMPONENT: Price Check Page (Combines Fees and the imported ProductPriceChecker) ---

// --- MAIN APP COMPONENT ---
export default function MarketShopperApp() { 
    const [page, setPage] = useState('order');
    const [paymentData, setPaymentData] = useState({ email: '', amount: '' });
    const [showIntro, setShowIntro] = useState(true); 
    const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
    // NEW: State to track if the Paystack script has been loaded
    const [isPaystackLoaded, setIsPaystackLoaded] = useState(false); 
    
    // --- NEW PRICE CHECKER STATE ---
    const initialCategory = 'General Groceries'; // Must match a key in your price data
    const [selectedPriceCategory, setSelectedPriceCategory] = useState(initialCategory);
    const [priceSearchTerm, setPriceSearchTerm] = useState('');
    // -------------------------------
    
    // Function to trigger the toast
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4000); // Hide after 4 seconds
    }, []);

    const navigate = useCallback((newPage, data = {}) => {
        // Scroll to top on navigation change
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setPage(newPage);
        if (newPage === 'payment') {
            setPaymentData(data);
        }
    }, []);

    // --- NEW: Paystack Script Lazy Loading Effect ---
    useEffect(() => {
        if (page === 'payment' && !isPaystackLoaded) {
            // Check if the script has already been added to the DOM
            if (document.querySelector(`script[src="${PAYSTACK_SCRIPT_URL}"]`)) {
                setIsPaystackLoaded(true);
                return;
            }

            const script = document.createElement('script');
            script.src = PAYSTACK_SCRIPT_URL;
            script.async = true;
            
            script.onload = () => {
                setIsPaystackLoaded(true);
                showToast('Paystack payment system loaded.', 'success');
            };

            script.onerror = () => {
                showToast('Failed to load Paystack payment system.', 'error');
            };

            document.body.appendChild(script);

            return () => {
                // Cleanup function if component unmounts or page changes before load
                // We won't remove it here, as it's needed globally by Paystack, but this is good practice
            };
        }
        // If not on the payment page, ensure Paystack is marked as unloaded to force load on navigation
        if (page !== 'payment') {
            setIsPaystackLoaded(false);
        }
    }, [page, isPaystackLoaded, showToast]);


   const renderContent = () => {
        if (page === 'payment') {
            return <PaymentPage 
                navigate={navigate} 
                initialEmail={paymentData.email} 
                initialAmount={paymentData.amount} 
                showToast={showToast} 
                isPaystackLoaded={isPaystackLoaded} 
            />;
        }
        
        if (page === 'success') {
            return <SuccessPage navigate={navigate} />;
        }

        if (page === 'faq') {
            return <FAQPage />;
        }

        if (page === 'legal') {
            return <LegalPage />;
        }
        
        // --- FIXED ROUTE INTEGRATION: Price Page ---
        if (page === 'prices') {
            return (
                <div className="mt-8">
                    <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
                        Pricing & Fee Guide
                    </h1>
                    {/* The ProductPriceChecker now uses the state variables directly from the MarketShopperApp scope */}
                    <ProductPriceChecker 
                        selectedCategory={selectedPriceCategory} 
                        searchTerm={priceSearchTerm}             
                        setSelectedCategory={setSelectedPriceCategory} 
                        setSearchTerm={setPriceSearchTerm}             
                    /> 
                    {/* Assuming FeePriceListSection is defined or imported globally */}
                    <FeePriceListSection /> 
                </div>
            );
        }
        // -----------------------------------------------------

        // Default 'order' page content
        return (
            <>
                {/* Hero Section Replaced by Carousel */}
                <ImageCarousel />

                {/* Price Search Bar Component - uses state variables directly */}
                <PriceSearchBar 
                    selectedCategory={selectedPriceCategory}
                    setSelectedCategory={setSelectedPriceCategory}
                    searchTerm={priceSearchTerm}
                    setSearchTerm={setPriceSearchTerm}
                    navigate={navigate} // Pass navigate to the button
                />

                {/* Main Content: The Order Form */}
                <section id="order-form" className="py-8 sm:py-12 bg-gray-50">
                            <div className="container mx-auto px-4">
                                <OrderForm navigate={navigate} showToast={showToast} /> 
                            </div>
                        </section>
                        
                        {/* How It Works Section */}
                        <section className="py-8 sm:py-12 bg-white" role="region" aria-labelledby="how-it-works-heading">
                            <div className="container mx-auto px-4">
                                <h2 id="how-it-works-heading" className="text-2xl font-extrabold text-center text-gray-800 mb-8 sm:mb-10">How It Works</h2>
                        
                                {/* Reduced gap */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Step 1: Choose Price Mode */}
                                    
                                    <div className="p-4 rounded-xl bg-white   hover:shadow-xl transition duration-300">
                                        {/* Reduced icon size and mb- */}
                                        <div className="flex items-center mb-2">
                            
                                            <div className="bg-black text-white rounded-lg w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
                                                1
                                            </div>
                                            <h3 className="text-lg font-bold ml-2 text-gray-800">Choose Price Mode</h3>
                                        </div>
                            
                                        {/* Reduced text size and mt- */}
                                        <p className="text-sm opacity-90 text-black mt-1">
                                            Select **Client Budget (Instant Pay)** for immediate payment, or **Shopper Sourced Price** for a quote later.
                                        </p>
                                    </div>
                                    
                                    {/* Step 2: Confirm Payment */}
                        
                                    <div className="p-4 rounded-xl bg-white   hover:shadow-xl transition duration-300">
                                        {/* Reduced icon size and mb- */}
                                        
                                        <div className="flex items-center mb-2">
                                            <div className="bg-black text-white rounded-lg w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
                                                2
                                    
                                            </div>
                                            <h3 className="text-lg font-bold ml-2 text-gray-800">Confirm Payment</h3>
                                        </div>
                
                                        {/* Reduced text size and mt- */}
                                        <p className="text-sm opacity-90 text-black mt-1">
                                            
                                            If Instant Pay, you pay the calculated total (including fees).
                                            If Quote Later, a shopper contacts you with the final bill.
                                        </p>
                                    </div>
                                    
                                    {/* Step 3: Delivery */}
                                
                                    <div className="p-4 rounded-xl bg-white   hover:shadow-xl transition duration-300">
                                        {/* Reduced icon size and mb- */}
                                        <div className="flex items-center mb-2">
                
                                            <div className="bg-black text-white rounded-lg w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
                                                3
                                
                                            </div>
                                            <h3 className="text-lg font-bold ml-2 text-gray-800">Delivery</h3>
                                        </div>
                
                                        {/* Reduced text size and mt- */}
                                        <p className="text-sm opacity-90 text-black mt-1">
                                            
                                            
                                            Your shopper purchases your items and delivers them promptly at your specified time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        
                        
                        
                        {/* Testimonials Section */}
                        <TestimonialsSection />
                    
                    </>
        );
    };

    return (
        // ADDED font-mono class for a techy, digital look
        <div className="min-h-screen bg-gray-50 font-mono">
            {/* NEW: Metadata Tags Component (Now Dynamic) */}
            <MetadataTags page={page} />

            {/* Conditional Intro Screen */}
            {showIntro && <IntroScreen onFinish={setShowIntro} />}

            {/* Header Section (Logo only - reduced vertical padding) */}
            <header className="bg-white  sticky top-0 z-20" role="navigation" aria-label="Main Navigation">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                
                    {/* Logo (Reduced text size) */}
                    <div className="text-2xl font-extrabold cursor-pointer" onClick={() => navigate('order')}>
                        Honey<span className="text-[#D4AF37]">Shopper</span>
                    </div>
                
                    {/* New group for Social Icons and Button */}
                    <div className="flex items-center space-x-3"> 
                        
                        {/* Social Icons - NOW VISIBLE ON ALL SCREENS AND USING REACT ICONS (text-lg on mobile, sm:text-xl on desktop) */}
                        <div className="flex space-x-3"> 
                            {SOCIAL_LINKS.map(link => (
                                <a 
                                    key={link.name} 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    title={`Follow us on ${link.name}`}
                                    className="text-gray-500 hover:text-[#D4AF37] text-lg sm:text-xl transition"
                                    aria-label={`External link to ${link.name}`}
                                >
                                    <link.Icon />
                                </a>
                            ))}
                        </div>
                        
                        {/* Payment/Order Button */}
                        <button 
                            onClick={() => navigate(page === 'order' ? 'payment' : 'order')}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                            aria-label={page === 'order' ? 'Go to Payment Page' : 'Go to Order Form'}
                        >
                            {page === 'order'
                            ? 'Payment' : 'Order'}
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {renderContent()}
            </main>

            {/* NEW: Global Toast Notification */}
            <ToastNotification 
                message={toast.message} 
                type={toast.type} 
                isVisible={toast.visible} 
                onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
            />
            
            {/* Footer Section (Updated for future links) */}
            <footer className="bg-white text-black py-8 mt-6" role="contentinfo">
                
                <div className="container mx-auto text-center px-4">

                
                    {/* Branding */}
                    <div className="text-lg font-extrabold mb-0.5 mt-4">
                        Honey<span className="text-[#D4AF37]">Shopper</span>
                    </div>
                    
                    {/* Utility Links Section */}
                    <div className="mb-4 flex justify-center space-x-4 border-b border-gray-200 pb-4">
                        <button 
                            onClick={() => navigate('faq')}
                            className="text-sm font-semibold text-gray-600 hover:text-[#D4AF37] transition"
                        >
                            FAQ / Help Center
                        </button>
                        <button 
                            onClick={() => navigate('legal')}
                            className="text-sm font-semibold text-gray-600 hover:text-[#D4AF37] transition"
                        >
                            Terms & Privacy
                        </button>
                        <button 
                            onClick={() => navigate('order')}
                            className="text-sm font-semibold text-gray-600 hover:text-[#D4AF37] transition"
                        >
                            New Order
                        </button><button 
                            onClick={() => navigate('prices')} // <-- New button
                            className="text-sm font-semibold text-gray-600 hover:text-[#D4AF37] transition"
                        >
                            Price Guide
                        </button>
                    </div>
                    
                    {/* Copyright */}
                    <p className="text-xs opacity-80">
                        &copy;
                        {new Date().getFullYear()} All rights reserved. Market Shopper is a product of HoneyGroup.
                    </p>
                </div>
            </footer>
        </div>
    );
}