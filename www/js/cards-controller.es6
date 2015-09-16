angular.module('cardsApp')
.controller('CardsController', ['$rootScope', '$scope', 'Cards', function($rootScope, $scope, Cards) {

    this.cards = Cards.query();

    $scope.selectCardType = cardType => {
        $scope.filter.cardType = cardType;
        $scope.drawCards();
    };

    $scope.selectCardClass = clas => {
        $scope.filter.cardClass = clas;
        $scope.drawCards();
    };

    $scope.drawCards = () => {
         const cards = this.cards.filter(card => {
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

        $scope.cards = splitOnManaCostGroups(cards);
    };

    $scope.showDetails = card => {
        $rootScope.$broadcast('select-card', card);
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

    $rootScope.$on('add-card-preview', (event, card) => {
        this.cards.push(card);

        $scope.drawCards();
    });

    $scope.cards = [];

    $scope.card = {};

    function splitOnManaCostGroups(cards) {
        const packs = [];

        cards.forEach(card => {
            if (!packs[card.cost]) {
                packs[card.cost] = [];
            }

            packs[card.cost].push(card);
        });

        return packs;
    }

}]);
