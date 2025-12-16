import React from 'react';

// NOTE: This constant must also be available in your main file, but 
// for simplicity, we'll redefine the keys here, as they are part of the UI.
const CATEGORY_KEYS = [
    'General Groceries', 
    'Electronics/Gadgets', 
    'Apparel/Fashion',
];

// This component is only the UI for the search bar.
// It relies on functions and state passed down from the parent (MarketShopperApp).
const PriceSearchBar = ({ selectedCategory, setSelectedCategory, searchTerm, setSearchTerm, navigate }) => {

    return (
        <section className="bg-white py-4 border-b border-gray-100 shadow-sm" id="price-search-bar">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    
                    <div className="flex-1 w-full">
                         <label className='block text-xs font-semibold text-gray-700 mb-0.5'>Search Item Price</label>
                        <input
                            type="text"
                            placeholder="Type an item (e.g., Rice, Smartphone, Shoes)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] text-sm"
                        />
                    </div>
                    
                    <div className="w-full sm:w-auto sm:min-w-[150px]">
                        <label className='block text-xs font-semibold text-gray-700 mb-0.5'>Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] bg-white text-sm font-semibold"
                        >
                            {CATEGORY_KEYS.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={() => navigate('prices')}
                        className="w-full sm:w-auto bg-black text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-md mt-2 sm:mt-4"
                    >
                        Check Prices
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PriceSearchBar;