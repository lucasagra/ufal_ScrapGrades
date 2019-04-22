const puppeteer = module.require('./puppeteer');
const diff = module.require('diff');
const fs = require('fs');
const promptly = require('promptly');

const config = module.require('./config');


start()


async function start() {
    try {
        const cpf = await promptly.prompt('Type your CPF: ');

        const password = await promptly.password('Type your password: ', {
            replace: '*'
        });

        console.log(" --- Starting bot --- ");

        deployBot(cpf, password);
        setInterval(deployBot(cpf, password), 1000 * 60 * config.minutes);
    } catch (err) {
        throw err;
    }
}

async function deployBot(cpf, password) {
    var result;
    try {
        const url = fs.readFileSync('./data/url.txt', 'utf-8');
        result = await puppeteer.checkUpdates(cpf, password, url, config.headless);
    } catch (err) {
        //console.log('Starting without url')
        result = await puppeteer.checkUpdates(cpf, password, null, config.headless);
    }

    compareAndUpdate(result, (result) => {

        fs.writeFile('./data/url.txt', result[0], 'utf8', (err) => {
            if (err) throw err;
        });
        fs.writeFile('./data/data.json', result[1], 'utf8', (err) => {
            if (err) throw err;
        });
    });
}

function compareAndUpdate(result, callback) {
    try {
        const oldstream = fs.readFileSync('./data/data.json', 'utf-8');
        const newstream = result[1];

        // console.log(diff.diffJson(JSON.parse(oldstream)[0], JSON.parse(newstream)[0]))
        let data = new Date();

        if (oldstream === newstream) {
            console.log(data.toLocaleTimeString() + " - Nothing happened");
        } else {
            console.log('\n\n' + data.toLocaleTimeString() + " - DATA HAS CHANGED" + '\n');
            showDifference(JSON.parse(oldstream), JSON.parse(newstream));
            callback(result);
        }
    } catch (err) {
        console.log('Data not found\n')
        fs.writeFile('./data/url.txt', result[0], 'utf8', (err2) => {
            if (err2) throw err2;
            console.log('Setting boletim url\n\n');
        });
        fs.writeFile('./data/data.json', result[1], 'utf8', (err2) => {
            if (err2) throw err2;
            console.log('Setting data file');
        });
    }
}

function showDifference(arrayObj1, arrayObj2) {
    for (let i = 0; i < arrayObj1.length; i++) {
        let difference = diff.diffJson(arrayObj1[i], arrayObj2[i]);
        if (difference.length > 1) {
            console.log(arrayObj1[i].name);
            for (let j = 0; j < difference.length; j++) {
                if (difference[j].added === true) {
                    console.log(difference[j].value);
                }
            }
        }
    }
}
