
angular.module('cardsApp')
.controller('CardController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {

    $scope.classes = CLASSES_L;
    $scope.races = [];
    RACES_L.forEach((race, i) => {
        $scope.races.push({
            id: i,
            name: race
        });
    });

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
                acts: [{}]
            },

            trap: {
                events: {
                    custom: [{}]
                }
            }
        });
    };

    $scope.extractCardPic = () => {
        const match = $scope.card.url.match('^http://media-hearth.cursecdn.com/avatars/([^.]+).png$');

        if (match) {
            $scope.card.pic = $scope.card.url = match[1];
        } else {
            $scope.card.pic = $scope.card.url;
        }
    };

    $scope.selectClass = classId => {
        $scope.card.clas = classId;
    };

    $scope.saveCard = () => {
        const card = angular.copy($scope.card);

        const newCard = {};

        ['id', 'name', 'cost', 'pic', 'clas', 'type'].forEach(propName => {
            newCard[propName] = card[propName];
        });

        if (card.customAction) {
            newCard.customAction = card.customAction;
        }

        if (card.conditions) {
            newCard.conditions = card.conditions.split(',');
        }

        newCard.targetsType = parseTargetsType(card.targetsType);

        newCard.flags = getFlags(card.flags);

        if (card.type === CARD_TYPES.minion || card.type === CARD_TYPES.weapon) {
            for (var eventTypeName in card.object.events) {
                const events = card.object.events;

                events[eventTypeName] = events[eventTypeName].map(event => {
                    const act = {
                        acts: parseActCommands(event.command),
                        targetsType: parseTargetsType(event.targetsType)
                    };

                    if (eventTypeName === 'custom') {
                        act.event = parseCustomEvent(event.event);
                    }

                    return act;
                });

                if (!events[eventTypeName].length) {
                    delete events[eventTypeName];
                }
            }

            card.object.flags = getFlags(card.object.flags);

            if (card.type === CARD_TYPES.minion) {
                newCard.minion = card.object;

                delete newCard.minion.durability;
            } else {
                newCard.weapon = card.object;
                delete newCard.weapon.maxHp;
            }

        } else if (card.type === CARD_TYPES.spell) {
            newCard.spell = {};

            newCard.spell.acts = card.spell.acts.map(act => {
                return {
                    acts: parseActCommands(act.command),
                    targetsType: parseTargetsType(act.targetsType)
                };
            });
        } else if (card.type === CARD_TYPES.trap) {
            newCard.trap = {
                events: {}
            };

            newCard.trap.events['custom'] = card.trap.events['custom'].map(act => {
                return {
                    event: parseCustomEvent(act.event),
                    acts: parseActCommands(act.command),
                    targetsType: parseTargetsType(act.targetsType)
                };
            });
        }

        $http.post('/update.json', newCard)
            .success(data => {
                if (data.status === 'created') {
                    $scope.card = data.id;
                    $rootScope.$broadcast('add-card-preview', newCard);

                    $scope.newCard();
                }
            });
    };

    $scope.addField = (eventTypeName) => {
        $scope.card.minion.events[eventTypeName].push({});
    };

    $scope.removeField = (eventTypeName, index) => {
        $scope.card.minion.events[eventTypeName].splice(index, 1);
    };

    $scope.addSpellAct = () => {
        $scope.card.spell.acts.push({});
    };

    $scope.removeSpellAct = (id) => {
        $scope.card.spell.acts.splice(id, 1);
    };

    $scope.addTrapAct = () => {
        $scope.card.trap.acts.push({});
    };

    $scope.removeTrapAct = (id) => {
        $scope.card.trap.acts.splice(id, 1);
    };

    $rootScope.$on('select-card', (event, card) => {
        $scope.card = prepareCard(card);
    });

    $scope.newCard();

    function prepareCard(card) {
        card = angular.copy(card);

        card.url = card.pic;

        card.flags = card.flags && card.flags.join(',') || '';

        card.targetsType = getRawTargetsType(card.targetsType);

        card.conditions = card.conditions && card.conditions.join(',') || '';

        if (card.type === CARD_TYPES.minion) {
            card.object = card.minion;

        } else if (card.type === CARD_TYPES.weapon) {
            card.object = card.weapon;
        }

        if (card.type === CARD_TYPES.minion || card.type === CARD_TYPES.weapon) {

            card.object.flags = card.object.flags && card.object.flags.join(',') || '';

            const events = card.object.events;

            ['battlecry', 'deathrattle', 'end-turn', 'start-turn', 'aura', 'custom'].forEach(eventTypeName => {
                if (events[eventTypeName]) {
                    events[eventTypeName] = events[eventTypeName].map(event => getRawAct(event));
                } else {
                    events[eventTypeName] = [];
                }
            });

        } else if (card.type === CARD_TYPES.spell) {
            card.spell.acts = card.spell.acts.map(act => getRawAct(act));

        } else if (card.type === CARD_TYPES.trap) {
            card.trap.events['custom'] = card.trap.events['custom'].map(act => getRawAct(act));
        }

        return card;
    }

    function parseTargetsType(targetsTypeRaw) {
        if (!targetsTypeRaw) {
            return;
        }

        if (targetsTypeRaw === 'not-need') {
            return 'not-need';
        }

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

        if (targetsType === 'not-need') {
            return 'not-need';
        } else {
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
    }

    function parseActCommands(command) {
        const acts = command.split(/\s*;\s*/);

        return acts.map(act => {
            const match = act.match(/^([^(]+)(?:\(([^)]+)\))?$/);
            return {
                name: match[1],
                params: match[2] && match[2].split(/\s*,\s*/).map(tryParseNumber) || []
            }
        });
    }

    function tryParseNumber(value) {
        const number = Number(value);

        if (!isNaN(number)) {
            return number;
        } else {
            return value;
        }
    }

    function getRawCommand(acts) {
        return acts.map(act => {
            var command = act.name;

            if (act.params.length) {
                command += '(' + act.params.join(',') + ')';
            }

            return command;
        }).join(';');
    }

    function getRawAct(act) {
        var event = null;

        if (act.event) {
            event = act.event.name;

            if (act.event.params.length) {
                event += '(' + act.event.params.join(',') + ')';
            }
        }

        return {
            event: event,
            command: getRawCommand(act.acts),
            targetsType: getRawTargetsType(act.targetsType)
        };
    }

    function getFlags(flagsString) {
        return flagsString && flagsString.split(',') || [];
    }

    function parseCustomEvent(event) {
        const eventMath = event.match(/([^(]+)(?:\(([^)]+)\))?/);

        return {
            name: eventMath[1],
            params: eventMath[2] ? eventMath[2].split(',').map(tryParseNumber) : []
        }
    }

}]);
