
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
    .factory('Card', ['$resource',
    function($resource){
        return $resource('/cards.json', {}, {
            query: {
                method: 'GET',
                params: {},
                isArray: true
            }
        });
    }]);

angular.module('cardsApp', ['cardsService'])
    .controller('CardsController', ['$scope', 'Card', function($scope, Card) {
        this.cards = Card.query();

        $scope.selectCardType = cardType => {
            $scope.filter.cardType = cardType;
            $scope.drawCards();
        };

        $scope.selectCardClass = clas => {
            $scope.filter.cardClass = clas;
            $scope.drawCards();
        };

        $scope.drawCards = () => {
            $scope.cards = this.cards.filter(card => {
                const filter = $scope.filter;
                if (filter.cardClass) {
                    const clas = filter.cardClass - 1;
                    if (card.clas !== clas) {
                        return false;
                    }
                }

                if (filter.cardType) {
                    if (card.type !== filter.cardType) {
                        return false;
                    }
                }

                return true;
            });
        };

        $scope.cardTypes = [
            'All',
            'Minions',
            'Spells',
            'Weapons',
            'Traps'
        ];

        $scope.classes = [
            'all',
            'neutral',
            'warrior',
            'shaman',
            'rogue',
            'paladin',
            'hunter',
            'druid',
            'warlock',
            'mage',
            'priest'
        ];

        $scope.filter = {
            cardType: 0,
            cardClass: 0
        };

        $scope.cards = [];

    }]);
