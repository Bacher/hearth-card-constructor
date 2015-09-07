
angular.module('cardsApp')
.controller('CardController', ['$rootScope', '$scope', function($rootScope, $scope) {
    $scope.cardTypes = [
        { name: 'minion', id: 1 },
        { name: 'spell', id: 2 },
        { name: 'weapon', id: 3 },
        { name: 'trap', id: 4 }
    ];

    $scope.newCard = () => {
        $scope.card = prepareCard({
            id: 'NEW_CARD',
            pic: '',
            name: '',
            clas: 0,
            cost: 0,
            flags: [],
            type: 1,
            targetsType: null,

            minion: {
                attack: 0,
                maxHp: 0,
                durability: 0,
                flags: [],
                race: 0,
                events: {}
            },

            spell: {
                acts: []
            }
        });
    };

    $scope.extractCardPic = () => {
        const match = $scope.card.url.match('^http://media-hearth.cursecdn.com/avatars/([^.]+).png$');

        if (match) {
            $scope.card.pic = $scope.card.url = match[1];
        }
    };

    $scope.saveCard = () => {
        const card = this.card;
        const newCard = {};

        ['id', 'pic', 'name', 'clas', 'type'].forEach(propName => {
            newCard[propName] = card[propName];
        });

        if (card.type === CARD_TYPES.minion || card.type === CARD_TYPES.weapon) {
            if (card.type === CARD_TYPES.minion) {
                newCard.minion = card.object;

                delete newCard.minion.durability;
            } else {
                newCard.weapon = card.object;
                delete newCard.weapon.maxHp;
            }

            for (var eventTypeName in newCard.object.events) {
                const events = newCard.object.events;

                events[eventTypeName] = events[eventTypeName].map(event => {
                    const command = parseActCommand(event.command);

                    const act = {
                        actName: command.name,
                        actParams: command.params,
                        targetsType: parseTargetsType(event.targetsType)
                    };

                    if (eventTypeName === 'custom') {
                        act.eventName = event.eventName;
                    }

                    return act;
                });
            }

            delete card.object;
        }

    };

    $scope.addField = (eventName) => {
        $scope.card.minion.events[eventName].push({});
    };

    $rootScope.$on('select-card', (event, card) => {
        $scope.card = prepareCard(card);
    });

    $scope.newCard();

    function prepareCard(card) {
        card = angular.copy(card);

        card.url = card.pic;

        card.flags = card.flags && card.flags.join(',') || '';

        if (card.type === CARD_TYPES.minion) {
            card.object = card.minion;

            card.targetsType = getRawTargetsType(card.targetsType);

        } else if (card.type === CARD_TYPES.weapon) {
            card.object = card.weapon;
        }

        if (card.type === CARD_TYPES.minion || card.type === CARD_TYPES.weapon) {

            card.object.flags = card.object.flags && card.object.flags.join(',') || '';

            const events = card.object.events;

            ['battlecry', 'deathrattle', 'end-turn', 'start-turn', 'aura', 'custom'].forEach(eventTypeName => {
                if (events[eventTypeName]) {
                    if (!Array.isArray(events[eventTypeName])) {
                        events[eventTypeName] = [events[eventTypeName]];
                    }

                    events[eventTypeName] = events[eventTypeName].map(event => getRawAct(event));
                } else {
                    events[eventTypeName] = [];
                }
            });
        }

        return card;
    }

    function parseTargetsType(targetsTypeRaw) {
        const match = targetsTypeRaw.match(/^([^\.]+)(?:\.(.+))?$/);
        const targetsDetails = match[1].split('&');

        const targetsType = {
            names: targetsDetails
        };

        if (match[2]) {
            const mods = match[2].split('.');

            targetsType.modificators = mods.map(mod => {
                const modMatch = mod.match(/^([^(]+)(?:\(([^)]+)\))?/);

                return {
                    name: modMatch[1],
                    params: modMatch[2] && modMatch[2].split(',').map(tryParseNumber) || []
                };
            });
        }

        return targetsType;
    }

    function getRawTargetsType(targetsType) {
        if (!targetsType) {
            return null;
        }

        var raw = targetsType.names.join('&');

        if (targetsType.modificators) {
            targetsType.modificators.forEach(mod => {
                raw += '.' + mod.name;

                if (mod.params) {
                    raw += '(' + mod.params.join(',') + ')';
                }
            });
        }

        return raw;
    }

    function parseActCommand(command) {
        const match = command.match(/^([^(]+)(?:\(([^)]+)\))?$/);

        return {
            name: match[1],
            params: (match[2] || '').split(/\s*,\s*/).map(tryParseNumber)
        }
    }

    function tryParseNumber(value) {
        const number = Number(value);

        if (!isNaN(number)) {
            return number;
        } else {
            return value;
        }
    }

    function getRawCommand(act) {
        // fixme
        var raw = act.actName || act.name;

        if (act.params.length) {
            raw += '(' + act.params.join(',') + ')';
        }

        return raw;
    }

    function getRawAct(event) {
        return {
            command: getRawCommand(event),
            targetsType: getRawTargetsType(event.targetsType)
        };
    }

}]);
