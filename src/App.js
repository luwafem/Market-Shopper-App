import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURATION CONSTANTS ---
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgvzwray'; 
const PAYSTACK_PUBLIC_KEY = 'pk_live_2ba1413aaaf5091188571ea6f87cca34945d943c'; 
const SHOPPING_TYPES = [
    'General Groceries', 
    'Electronics/Gadgets', 
    'Apparel/Fashion', 
    'Pharmaceuticals/Wellness',
    'Office/Home Supplies', 
    'Hardware/Tools', 
    'Mixed Basket'
];

// --- FEES CONSTANTS ---
const BASE_SHOPPER_FEE = 10000;
const SERVICE_FEE_RATE = 0.10; // 10%

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

// --- HELPER COMPONENT: Input Field Abstraction ---
const FormInput = (props) => (
    <input
        {...props}
        // Reduced padding for a tighter feel
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-150 placeholder-gray-500 text-sm"
    />
);

// --- COMPONENT 1: The Dynamic Shopping List Item (Updated with Budget) ---
const ShoppingListItem = ({ index, item, onChange, onRemove, showBudgetError }) => {
    return (
        <div className="flex flex-col gap-2 mb-3 p-3 bg-white rounded-xl shadow-md border border-gray-100 items-start">
            {/* Item Name and Remove Button: Reduced gap */}
            <div className='flex w-full gap-2'>
                {/* Item Name Input */}
                <input
                    type="text"
                    name={`list[${index}][item]`}
                    placeholder="E.g., Laptop charger, Tomatoes" 
                    value={item.item}
                    onChange={(e) => onChange(index, 'item', e.target.value)}
                    className="flex-grow w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 text-sm"
                    required
                />
                {/* Remove Button - Reduced padding/size */}
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition duration-150 flex-shrink-0 font-semibold text-xs"
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
                        className="w-full p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-orange-500 text-sm"
                        required
                    />
                </div>
                
                {/* Unit Select (w-1/3) */}
                <div className='w-1/3 min-w-0'>
                    <select
                        name={`list[${index}][unit]`}
                        value={item.unit}
                        onChange={(e) => onChange(index, 'unit', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-sm"
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
                        placeholder="Budget"
                        value={item.budget || ''}
                        onChange={(e) => onChange(index, 'budget', e.target.value)}
                        className={`w-full p-2 border rounded-lg text-center focus:ring-2 focus:ring-orange-500 text-sm ${showBudgetError && (!item.budget || Number(item.budget) <= 0) ? 'border-red-500 ring-red-300' : 'border-gray-300'}`}
                        min="0"
                    />
                </div>
            </div>
            {showBudgetError && (!item.budget || Number(item.budget) <= 0) && (
                <p className='text-xs text-red-500 mt-1'>* Budget is required for Instant Payment mode.</p>
            )}
        </div>
    );
};

// --- COMPONENT 2: The Main Order Form & List Builder (Refactored) ---
const OrderForm = ({ navigate }) => {
    const [clientInfo, setClientInfo] = useState({ name: '', phone: '', email: '', address: '' });
    const [shoppingList, setShoppingList] = useState([{ item: '', quantity: '', unit: 'pcs', budget: '' }]);
    const [shoppingType, setShoppingType] = useState(SHOPPING_TYPES[0]);
    const [deliveryTime, setDeliveryTime] = useState('');
    const [selectedZone, setSelectedZone] = useState('select'); 
    const [selectedPriority, setSelectedPriority] = useState('standard'); 
    const [pricingMode, setPricingMode] = useState('quote'); 
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBudgetError, setShowBudgetError] = useState(false);
    // NEW STATES FOR EMERGENCY CONTACT
    const [emergencyName, setEmergencyName] = useState(''); 
    const [emergencyPhone, setEmergencyPhone] = useState(''); 

    // Calculate the total budget for goods
    const totalBudget = useMemo(() => {
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
        const transportFee = LAGOS_TRANSPORT_FEES[selectedZone] || 0;
        
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
        setShoppingList([...shoppingList, { item: '', quantity: '', unit: 'pcs', budget: '' }]);
    };

    const handleRemoveItem = (index) => {
        setShoppingList(shoppingList.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // General validation
        if (shoppingList.length === 0 || shoppingList.some(item => !item.item || !item.quantity)) {
            alert("Please add at least one item with a quantity and name.");
            return;
        }

        // Pricing Mode Specific Validation
        if (pricingMode === 'budget') {
            const missingBudget = shoppingList.some(item => !item.budget || Number(item.budget) <= 0);
            
            // Transport fee validation: Check if a zone is selected
            if (selectedZone === 'select' || finalCostDetails.transportFee === 0) {
                 alert("For Instant Payment, please select a Delivery Location Zone to calculate transport fee.");
                 return;
            }

            if (missingBudget || totalBudget <= 0) {
                setShowBudgetError(true);
                alert("For Instant Payment, you must set a positive budget for *all* items.");
                return;
            }
            
            if (finalAmount <= 0) {
                alert("The total final amount must be greater than zero to proceed with instant payment.");
                return;
            }
            
            // --- INSTANT PAYMENT MODE LOGIC ---
            // Navigate directly to payment page with calculated total amount
            navigate('payment', { 
                email: clientInfo.email, 
                amount: finalAmount, // Use final calculated amount
            });

            // Set a successful submission message for this flow before navigating
            setIsSubmitted(true); 

        } else {
            // --- SHOPPER SOURCED PRICE MODE LOGIC (Quote Later) ---
            setIsSubmitting(true);
            
            // Programmatically submit the form (Formspree will handle the email)
            const form = e.target;
            const formData = new FormData(form);

            // Add non-form-bound states and fee details for Quote Later mode
            formData.append('Pricing Mode', 'Shopper Sourced Quote');
            formData.append('Shopping Type', shoppingType);
            formData.append('Delivery Time', deliveryTime);
            formData.append('Delivery Zone Estimate', selectedZone);
            formData.append('Delivery Priority', selectedPriority === 'priority' ? `Priority (+NGN ${PRIORITY_FEES.priority.toLocaleString()})` : 'Standard'); 
            
            // ADD NEW EMERGENCY CONTACT FIELDS TO SUBMISSION
            formData.append('Emergency Contact Name', emergencyName || 'N/A');
            formData.append('Emergency Contact Phone', emergencyPhone || 'N/A');

            // Include a note about fees for the shopper
            formData.append('Shopper Note on Fees', `Base Fee: NGN ${BASE_SHOPPER_FEE.toLocaleString()}, Service Rate: ${SERVICE_FEE_RATE * 100}%`);
            
            fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    setIsSubmitted(true);
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            alert(data["errors"].map(error => error["message"]).join(", "));
                        } else {
                            alert("Oops! There was an error submitting your list.");
                        }
                    })
                }
            }).catch(error => {
                alert("Oops! Network error.");
            }).finally(() => {
                setIsSubmitting(false);
            });
        }
    };
    
    // Success message logic remains the same (reduced py- and mt- for compactness)
    if (isSubmitted) {
        if (pricingMode === 'budget') {
            return (
                <div className="container mx-auto py-12 px-4 text-center bg-white rounded-xl shadow-2xl max-w-2xl mt-6">
                    <h2 className="text-3xl font-extrabold text-green-600 mb-3">Redirecting to Payment...</h2>
                    <p className="text-lg text-gray-700">Your total of **NGN {finalAmount.toLocaleString()}** is ready for instant payment (includes all fees).</p>
                </div>
            );
        }

        // Quote Later success message
        return (
             <div className="container mx-auto py-12 px-4 text-center bg-white rounded-xl shadow-2xl max-w-2xl mt-6">
                 <h2 className="text-3xl font-extrabold text-orange-600 mb-3">✅ List Received!</h2>
                 <p className="text-lg text-gray-700">Thank you, <span className="font-semibold">{clientInfo.name}</span>. Your list is now with your shopper.</p>
                 <p className="mt-4 text-base text-gray-600 border-t pt-3">We will contact you at <span className="font-mono text-green-700">{clientInfo.phone}</span> with the final quote (including fees and transport) shortly.</p>
                 <button 
                     onClick={() => navigate('payment')}
                     className="mt-6 bg-green-600 text-white text-base font-semibold py-2 px-6 rounded-xl hover:bg-green-700 transition duration-300 shadow-xl"
                 >
                     Go to Payment Page (for manual payment)
                 </button>
             </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} action={FORMSPREE_ENDPOINT} method="POST">
            {/* Reduced overall container padding */}
            <div className="max-w-4xl mx-auto bg-white p-4 md:p-8 rounded-3xl shadow-2xl border border-gray-100">
                
                {/* Section 1: Delivery Details & Preferences */}
                <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-orange-100 pb-2">1. Delivery Details & Preferences</h2>
                
                {/* Reduced gap- and mb- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <FormInput type="text" name="name" placeholder="Your Full Name" value={clientInfo.name} onChange={handleClientChange} required />
                    <FormInput type="tel" name="phone" placeholder="Contact Phone Number" value={clientInfo.phone} onChange={handleClientChange} required />
                    <FormInput type="email" name="email" placeholder="Email Address (For receipt & Paystack)" value={clientInfo.email} onChange={handleClientChange} required /> 
                    
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
                        />
                    </div>
                    
                    {/* Preferred Delivery Time */}
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>Preferred Delivery Time</label>
                        <FormInput type="text" name="deliveryTime" placeholder="E.g., Tomorrow 2pm-5pm or ASAP" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} required />
                    </div>

                    {/* Type of Shopping */}
                    <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>Type of Shopping</label>
                        <select
                            name="shoppingType"
                            value={shoppingType}
                            onChange={(e) => setShoppingType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                            required
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
                        <h3 className='text-sm font-extrabold text-orange-600 mb-2'>
                            Alternative/Emergency Contact (In case the primary client is unreachable)
                        </h3>
                    </div>
                    <FormInput 
                        type="text" 
                        name="emergencyName" 
                        placeholder="Alternative Contact Full Name (Optional)" 
                        value={emergencyName} 
                        onChange={(e) => setEmergencyName(e.target.value)} 
                    />
                    <FormInput 
                        type="tel" 
                        name="emergencyPhone" 
                        placeholder="Alternative Contact Phone (Optional)" 
                        value={emergencyPhone} 
                        onChange={(e) => setEmergencyPhone(e.target.value)} 
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
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                        >
                            <option value="standard">Standard (NGN 0)</option>
                            <option value="priority">Priority (NGN 5,000)</option>
                        </select>
                        <p className='text-xs text-gray-500 mt-1'>
                            Priority offers the fastest available shopper dispatch and delivery.
                        </p>
                    </div>

                    {/* Delivery Location Zone Select (Mandatory for Instant Pay) */}
                    <div>
                        <label className={`block text-xs font-medium text-gray-700 mb-1 ${pricingMode === 'budget' ? 'text-red-600 font-extrabold' : ''}`}>
                            {pricingMode === 'budget' ? '* Select Delivery Zone for Transport Fee' : 'Estimated Delivery Zone'}
                        </label>
                        <select
                            name="deliveryLocationZone"
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                            required={pricingMode === 'budget'}
                        >
                            {Object.entries(LAGOS_TRANSPORT_FEES).map(([zone, fee]) => (
                                <option key={zone} value={zone} disabled={zone === 'select'}>
                                    {zone === 'select' ? '--- Select Zone ---' : `${zone} (NGN ${fee.toLocaleString()})`}
                                </option>
                            ))}
                        </select>
                        <p className='text-xs text-gray-500 mt-1'>
                            {pricingMode === 'budget' ? `Selected Fee: NGN ${finalCostDetails.transportFee.toLocaleString()}` : 'Fee will be confirmed by shopper.'}
                        </p>
                    </div>
                </div>
                
                {/* Section 2: Pricing Mode */}
                <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-orange-100 pb-2">2. Choose Your Payment Method</h2>
                {/* Reduced gap and padding */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <label className={`flex-1 flex items-start p-3 rounded-xl cursor-pointer transition duration-200 border-2 ${pricingMode === 'budget' ? 'bg-green-50 border-green-500 ring-2 ring-green-100' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                        <input 
                            type="radio" 
                            name="pricingMode" 
                            value="budget" 
                            checked={pricingMode === 'budget'} 
                            onChange={() => setPricingMode('budget')} 
                            className="w-4 h-4 mt-1 mr-2 appearance-none border-2 rounded-full checked:bg-green-600 checked:border-green-600 focus:outline-none flex-shrink-0"
                            required
                        />
                        <div>
                            <span className="font-bold text-gray-800 block text-sm">Client Budget (Instant Pay)</span>
                            <span className="text-xs text-gray-600">Set budget per item, add calculated fees, & pay now.</span>
                        </div>
                    </label>

                    <label className={`flex-1 flex items-start p-3 rounded-xl cursor-pointer transition duration-200 border-2 ${pricingMode === 'quote' ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-100' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                        <input 
                            type="radio" 
                            name="pricingMode" 
                            value="quote" 
                            checked={pricingMode === 'quote'} 
                            onChange={() => setPricingMode('quote')} 
                            className="w-4 h-4 mt-1 mr-2 appearance-none border-2 rounded-full checked:bg-orange-600 checked:border-orange-600 focus:outline-none flex-shrink-0"
                            required
                        />
                        <div>
                            <span className="font-bold text-gray-800 block text-sm">Shopper Sourced Price (Quote Later)</span>
                            <span className="text-xs text-gray-600">Submit list and wait for shopper to send a final quote (including fees).</span>
                        </div>
                    </label>
                </div>
                
                {/* Section 3: Shopping List */}
                <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-orange-100 pb-2">3. Create Shopping List</h2>
                
                {/* Shopping List Items */}
                {shoppingList.map((item, index) => (
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
                >
                    + Add Another Item
                </button>
                
                {/* Total Cost Breakdown Display */}
                {pricingMode === 'budget' && finalCostDetails.finalAmount > 0 && (
                    <div className='p-4 mb-6 bg-green-100 rounded-xl border-2 border-green-500'>
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
                                <span className='text-gray-700'>Transport Fee (Selected Zone)</span>
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
                
                {/* Section 4: Additional Notes */}
                <h2 className="text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-orange-100 pb-2">4. Additional Notes</h2>
                <textarea 
                    name="notes"
                    placeholder="E.g., 'Please buy the blue version of the kettle', 'If item A is unavailable, buy item B instead'." 
                    className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-150" rows="2"
                ></textarea>

                {/* Submit Button (Updated with finalAmount) */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-600 text-white text-lg font-extrabold py-4 rounded-xl hover:bg-orange-700 transition duration-300 shadow-xl shadow-orange-300 disabled:bg-gray-400 disabled:shadow-none"
                >
                    {pricingMode === 'budget' 
                        ? `Pay NGN ${finalCostDetails.finalAmount.toLocaleString()} Now`
                        : (isSubmitting ? 'Submitting...' : 'Submit List & Wait for Quote')
                    }
                </button>
            </div>
        </form>
    );
};

// --- COMPONENT 3: Payment Widget ---
const PaymentPage = ({ navigate, initialEmail = '', initialAmount = '' }) => {
    const [amount, setAmount] = useState(initialAmount);
    const [clientEmail, setClientEmail] = useState(initialEmail);
    const [reference, setReference] = useState('');

    useEffect(() => {
        setAmount(initialAmount);
        setClientEmail(initialEmail);
    }, [initialAmount, initialEmail]);

    const payWithPaystack = () => {
        if (!amount || Number(amount) <= 0) { alert('Please enter a valid total amount due.'); return; }
        if (!clientEmail || !clientEmail.includes('@')) { alert('Please enter a valid email address.'); return; }
        
        if (typeof window.PaystackPop === 'undefined') { alert('Payment system not fully loaded.'); return; }

        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: clientEmail,
            amount: Math.floor(Number(amount) * 100), // Amount in Kobo/Cent
            ref: reference || `ms_${Date.now()}`,
            onClose: () => { console.log('Payment window closed by user.'); },
            callback: (response) => {
                alert(`Payment Successful! Transaction Ref: ${response.reference}`);
                setAmount('');
                setClientEmail('');
                setReference('');
                navigate('order'); 
            },
        });
        
        handler.openIframe();
    };
    
    const isPayButtonDisabled = !(Number(amount) > 0 && clientEmail.includes('@'));

    return (
        // Reduced padding and margin-top 
        <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 mt-6">
            {/* Reduced h2 size, mb- and pb- */}
            <h2 className="text-2xl font-extrabold text-green-600 mb-4 border-b-2 border-green-100 pb-2 text-center">💳 Secure Payment</h2>
            {/* Reduced mb- and text-size */}
            <p className="text-gray-600 mb-6 text-center text-sm">
                Complete your payment securely via Paystack.
            </p>

            {/* Reduced mb- and text-size/padding */}
            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-1 text-base">Total Amount Due (NGN)</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 45000"
                    className="w-full p-3 border-4 border-green-400 rounded-xl text-2xl font-extrabold text-center focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-150"
                    required
                />
                {initialAmount && <p className='text-xs text-green-600 mt-1 text-center font-medium'>* This amount is pre-filled from your total item budget + fees.</p>}
            </div>
            {/* Reduced mb- */}
            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-1 text-sm">Your Email for Receipt</label>
                <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-150 text-sm"
                    required
                />
                {initialEmail && <p className='text-xs text-gray-500 mt-1'>* Email is pre-filled from your order details.</p>}
            </div>
            {/* Reduced mb- */}
            <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-1 text-sm">Payment Reference (Optional)</label>
                <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter reference sent by shopper (if any)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-150 text-sm"
                />
            </div>

            {/* Reduced py- and text-size */}
            <button
                onClick={payWithPaystack} 
                disabled={isPayButtonDisabled}
                className="w-full bg-green-600 text-white text-lg font-bold py-3 rounded-xl hover:bg-green-700 transition duration-300 shadow-xl shadow-green-300 disabled:bg-gray-400 disabled:shadow-none"
            >
                Pay NGN {Number(amount) > 0 ? Number(amount).toLocaleString() : 'Enter Amount'}
            </button>
            
            {/* Reduced mt- and text-size */}
            <button 
                onClick={() => navigate('order')}
                className="mt-4 w-full text-xs text-gray-500 hover:text-orange-600 transition font-semibold"
            >
                Back to Order Form
            </button>
        </div>
    );
}

// --- MAIN APP COMPONENT ---
export default function MarketShopperApp() { 
    // Simple state-based routing
    const [page, setPage] = useState('order'); // 'order' or 'payment'
    const [paymentData, setPaymentData] = useState({ email: '', amount: '' });
    
    const navigate = (newPage, data = {}) => {
        setPage(newPage);
        if (newPage === 'payment') {
            setPaymentData(data);
        }
    };

    const renderContent = () => {
        if (page === 'payment') {
            return <PaymentPage 
                navigate={navigate} 
                initialEmail={paymentData.email} 
                initialAmount={paymentData.amount} 
            />;
        }
        return (
            <>
                {/* Hero Section (Reduced vertical padding: py-10 for mobile, py-16 for desktop) */}
                <section className="bg-orange-600 py-10 sm:py-16 text-center text-white relative overflow-hidden">
                    {/* Placeholder for "Image" */}
                    <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: "url('https://example.com/placeholder-market.jpg')"}}></div>
                    <div className="container mx-auto px-4 relative z-10">
                        {/* Reduced icon size and mb- */}
                        <div className="text-5xl sm:text-6xl font-extrabold mb-3 animate-pulse">🛒</div>
                        {/* Reduced h1 size */}
                        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                            Your Personal Shopper for Any Store
                        </h1>
                        {/* Reduced mt- and py- */}
                        <a
                            href="#order-form"
                            className="mt-4 inline-block bg-green-500 text-white text-base font-extrabold py-2 px-6 rounded-xl hover:bg-green-600 transition duration-300 shadow-xl"
                        >
                            Start Your Shopping List Now!
                        </a>
                    </div>
                </section>

                {/* Main Content: The Order Form (Reduced vertical padding) */}
                <section id="order-form" className="py-8 sm:py-12 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <OrderForm navigate={navigate} />
                    </div>
                </section>
                
                {/* How It Works Section - Reduced vertical padding and h2 mb- */}
                <section className="py-8 sm:py-12 bg-white">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-extrabold text-center text-gray-800 mb-8 sm:mb-10">How It Works</h2>
                        {/* Reduced gap */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Step 1: Choose Price Mode */}
                            <div className="p-4 rounded-xl bg-green-50 shadow-lg border-t-4 border-green-500 hover:shadow-xl transition duration-300">
                                {/* Reduced icon size and mb- */}
                                <div className="flex items-center mb-2">
                                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
                                        1
                                    </div>
                                    <h3 className="text-lg font-bold ml-2 text-gray-800">Choose Price Mode</h3>
                                </div>
                                {/* Reduced text size and mt- */}
                                <p className="text-sm opacity-90 text-gray-700 mt-1">
                                    Select **Client Budget (Instant Pay)** for immediate payment, or **Shopper Sourced Price** for a quote later.
                                </p>
                            </div>
                            
                            {/* Step 2: Confirm Payment */}
                            <div className="p-4 rounded-xl bg-orange-50 shadow-lg border-t-4 border-orange-500 hover:shadow-xl transition duration-300">
                                {/* Reduced icon size and mb- */}
                                <div className="flex items-center mb-2">
                                    <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
                                        2
                                    </div>
                                    <h3 className="text-lg font-bold ml-2 text-gray-800">Confirm Payment</h3>
                                </div>
                                {/* Reduced text size and mt- */}
                                <p className="text-sm opacity-90 text-gray-700 mt-1">
                                    If **Instant Pay**, you pay the calculated total (including fees). If **Quote Later**, a shopper contacts you with the final bill.
                                </p>
                            </div>
                            
                            {/* Step 3: Delivery */}
                            <div className="p-4 rounded-xl bg-gray-50 shadow-lg border-t-4 border-gray-500 hover:shadow-xl transition duration-300">
                                {/* Reduced icon size and mb- */}
                                <div className="flex items-center mb-2">
                                    <div className="bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-base font-bold flex-shrink-0">
                                        3
                                    </div>
                                    <h3 className="text-lg font-bold ml-2 text-gray-800">Delivery</h3>
                                </div>
                                {/* Reduced text size and mt- */}
                                <p className="text-sm opacity-90 text-gray-700 mt-1">
                                    Your shopper purchases your items and delivers them promptly at your specified time.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </>
        );
    };

    return (
        // ADDED font-mono class for a techy, digital look
        <div className="min-h-screen bg-gray-50 font-mono">
            {/* Header Section (Logo only - reduced vertical padding) */}
            <header className="bg-white shadow sticky top-0 z-20">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    {/* Logo (Reduced text size) */}
                    <div className="text-2xl font-extrabold cursor-pointer" onClick={() => navigate('order')}>
                        🛒 Market<span className="text-orange-600">Shopper</span>
                    </div>
                    {/* Reduced padding and text size */}
                    <button 
                        onClick={() => navigate(page === 'order' ? 'payment' : 'order')}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                    >
                        {page === 'order' ? 'Payment' : 'Order'}
                    </button>
                </div>
            </header>

            <main>
                {renderContent()}
            </main>

            {/* Footer Section */}
            <footer className="bg-gray-900 text-white py-4 mt-6">
                <div className="container mx-auto text-center px-4">
                    {/* Emergency Contact (General Support) */}
                    <div className='border-b border-gray-700 pb-2 mb-2'>
                        <p className='text-xs font-semibold text-red-400'>
                            <span className='mr-1'>🚨</span>General Support: 
                            <a href={`tel:${EMERGENCY_CONTACT_NUMBER}`} className='hover:text-red-300 ml-1 underline'>
                                {EMERGENCY_CONTACT_NUMBER}
                            </a>
                        </p>
                    </div>

                    {/* Reduced text size and mb- */}
                    <div className="text-lg font-extrabold mb-0.5">
                        Market<span className="text-orange-500">Shopper</span>
                    </div>
                    {/* Reduced text size */}
                    <p className="text-xs opacity-80">
                        &copy; {new Date().getFullYear()} All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}