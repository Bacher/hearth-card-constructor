
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const app = express();

app.use(bodyParser.json());

app.use(express.static('../www'));

const CARDS_FILENAME = '../../Hearthstone/server/data/cards.json';

var cards = JSON.parse(fs.readFileSync(CARDS_FILENAME).toString());

//cards.forEach(card => {
//    if (card.minion) {
//        card.minion.events = card.minion.events || {};
//    }
//});
//writeCards();

function writeCards() {
    fs.writeFile(CARDS_FILENAME, JSON.stringify(cards, null, '  '));
}

var maxCardId = -1;

cards.forEach(card => {
    if (maxCardId < card.id) {
        maxCardId = card.id;
    }
});

const server = app.listen(8088, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Hearthstone server listening %s:%s', host, port);


    app.get('/cards.json', (req, res) => {
        res.json(cards);
    });

    app.post('/update.json', (req, res) => {

        const updatedCard = req.body;
        var status;

        const index = _.findIndex(cards, card => card.id === updatedCard.id);

        if (index !== -1) {
            status = 'updated';
            cards[index] = updatedCard;
        } else {
            status = 'created';
            cards.push(updatedCard);
        }

        res.json({
            status
        });

        cards = cards.sort((card1, card2) => {
            if (card1.cost !== card2.cost) {
                return card1.cost - card2.cost;
            } else if (card1.name !== card2.name) {
                return card1.name.localeCompare(card2.name);
            } else {
                return card2.type - card1.type;
            }
        });

        writeCards();

        if (updatedCard.id > maxCardId) {
            maxCardId = updatedCard.id;
        }

        console.log('Card id:%s %s.', updatedCard.id, status);
    });
});

function tryParseNumber(value) {
    const number = Number(value);

    if (!isNaN(number)) {
        return number;
    } else {
        return value;
    }
}