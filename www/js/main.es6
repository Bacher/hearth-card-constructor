
const CARD_TYPES = {
    minion: 1,
    spell: 2,
    weapon: 3,
    trap: 4
};

const CLASSES = {
    neutral: 0,
    warrior: 1,
    shaman: 2,
    rogue: 3,
    paladin: 4,
    hunter: 5,
    druid: 6,
    warlock: 7,
    mage: 8,
    priest: 9
};

angular.module('cardsService', ['ngResource'])
.factory('Cards', ['$resource', function($resource) {
    return $resource('/cards.json', {}, {
        query: {
            method: 'GET',
            params: {},
            isArray: true
        }
    });
}]);

angular.module('cardsApp', ['cardsService']);
