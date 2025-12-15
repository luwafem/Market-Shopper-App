import React, { useMemo } from 'react'; // Removed useState
import { FaSearch } from 'react-icons/fa'; // Required icon

// --- CONSTANT: Estimated Product Prices ---
// This constant must be defined for the component to work
const ESTIMATED_PRODUCT_PRICES = {
    'General Groceries': [
        { item: 'Rice (50kg Bag)', price: 65000, unit: 'bag', last_updated: 'Dec 2025' },
        { item: 'Beans (Bag)', price: 42000, unit: 'bag', last_updated: 'Dec 2025' },
        { item: 'Tomato Paste (Crate of 100)', price: 18000, unit: 'crate', last_updated: 'Dec 2025' },
        { item: 'Vegetable Oil (5Litre)', price: 9500, unit: 'pcs', last_updated: 'Dec 2025' },
        { item: 'Titus Sardines (Carton)', price: 16000, unit: 'carton', last_updated: 'Dec 2025' },
    ],
    'Electronics/Gadgets': [
        { item: 'Smartphone (Mid-Range)', price: 180000, unit: 'pcs', last_updated: 'Dec 2025' },
        { item: 'Laptop (Standard)', price: 450000, unit: 'pcs', last_updated: 'Dec 2025' },
        { item: 'Smart TV (50")', price: 320000, unit: 'pcs', last_updated: 'Dec 2025' },
    ],
    'Apparel/Fashion': [
        { item: 'Men\'s Designer Shoes', price: 45000, unit: 'pair', last_updated: 'Dec 2025' },
        { item: 'Ladies Handbag (Leather)', price: 30000, unit: 'pcs', last_updated: 'Dec 2025' },
    ],
};

// --- COMPONENT: Product Price Checker (Now accepts state as props) ---
const ProductPriceChecker = ({ 
    selectedCategory, 
    searchTerm,
    // We accept setters but don't use them in this component anymore, 
    // as the controls are moved to PriceSearchBar.js.
    // They are kept here only to avoid errors if they are conditionally passed.
    setSelectedCategory,
    setSearchTerm
}) => {
    // Removed local state initialization (initialCategory, useState, etc.)

    const formatCurrency = (amount) => `NGN ${amount.toLocaleString()}`;

    // Filter logic now relies entirely on props (selectedCategory, searchTerm)
    const filteredPrices = useMemo(() => {
        const prices = ESTIMATED_PRODUCT_PRICES[selectedCategory] || [];
        if (!searchTerm) return prices;

        return prices.filter(item =>
            item.item.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedCategory, searchTerm]);

    return (
        <section className="py-8 bg-gray-50" id="product-price-list">
            <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-2xl font-extrabold text-center text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
                    Estimated Product Price List <FaSearch className='inline text-sm ml-2 text-[#D4AF37]'/>
                </h2>
                <p className="text-sm text-center text-gray-600 mb-6">
                    Showing results for **{selectedCategory}** and search term **"{searchTerm || 'All'}"**. <span className="font-semibold text-red-500">Prices are subject to market fluctuations.</span>
                </p>

                {/* --- REMOVED: Controls (Category Select & Search Input) are now in PriceSearchBar.js --- */}

                {/* Price Table/List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-4 bg-black text-white font-bold grid grid-cols-10 text-xs sm:text-sm uppercase">
                        <span className="col-span-4">Item</span>
                        <span className="col-span-3 text-right">Estimated Price</span>
                        <span className="col-span-1 text-center">Unit</span>
                        <span className="col-span-2 text-right">Update Date</span>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {filteredPrices.length > 0 ? (
                            filteredPrices.map((item, index) => (
                                <div key={index} className="p-4 grid grid-cols-10 text-xs sm:text-sm hover:bg-gray-50">
                                    <span className="col-span-4 font-medium text-gray-800">{item.item}</span>
                                    <span className="col-span-3 text-right font-extrabold text-[#D4AF37]">{formatCurrency(item.price)}</span>
                                    <span className="col-span-1 text-center text-gray-600">{item.unit}</span>
                                    <span className="col-span-2 text-right text-gray-500">{item.last_updated}</span>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-gray-500">No items found matching your search in this category.</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductPriceChecker;