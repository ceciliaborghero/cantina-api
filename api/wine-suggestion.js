// Wine suggestion API

const wines = [
    { id: 1, name: 'Chardonnay', type: 'White', description: 'A crisp and fruity white wine.' },
    { id: 2, name: 'Cabernet Sauvignon', type: 'Red', description: 'A full-bodied red wine.' },
    { id: 3, name: 'Pinot Noir', type: 'Red', description: 'A light and aromatic red wine.' },
    { id: 4, name: 'Sauvignon Blanc', type: 'White', description: 'A zesty and refreshing white wine.' }
];

function suggestWine(type) {
    const suggestions = wines.filter(wine => wine.type === type);
    return suggestions.length > 0 ? suggestions : 'No suggestions available for this type.';
}

module.exports = { suggestWine };