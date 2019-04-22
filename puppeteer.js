const puppeteer = module.require('puppeteer');

module.exports = {

    checkUpdates: async (username, password, urlBoletim, headlessConfig) => {
        try {
            const browser = await puppeteer.launch({
                headless: headlessConfig,
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });
            // console.log('Headless browser launched');

            const page = await browser.newPage();
            await page.goto('https://sistemas.ufal.br/academico/login.seam');
            //console.log('Entering sistemas.ufal.br')

            await page.type('[id="loginForm:username"]', username);
            await page.type('[id="loginForm:password"]', password);

            await page.screenshot({
                path: './data/home.png'
            });

            await Promise.all([
                page.waitForNavigation(),
                page.click('[id="loginForm:entrar"]')
            ]);

            //console.log(`Logging in ${username} . . .`);

            var url = page.url().split('?');

            if (url.length > 1) {

                if (urlBoletim !== null) {
                    //if there is boletim url saved

                    await Promise.all([
                        page.waitForNavigation(),
                        await page.goto(urlBoletim),
                        await page.screenshot({
                            path: './data/Boletim.png'
                        })
                    ]);

                    var data = await page.evaluate(() => {
                        const subjects = []
                        let tmp = document.querySelectorAll('table');

                        for (let i = 2; i < tmp.length; i++) {
                            let tmp2 = tmp[i].querySelectorAll('tr');

                            for (let j = 1; j < tmp2.length; j++) {

                                let obj = {
                                    name: tmp2[j].querySelectorAll('td')[0].innerText,
                                    ab1: tmp2[j].querySelectorAll('td')[3].innerText,
                                    ab2: tmp2[j].querySelectorAll('td')[4].innerText,
                                    reav: tmp2[j].querySelectorAll('td')[5].innerText,
                                    final: tmp2[j].querySelectorAll('td')[6].innerText,
                                    media: tmp2[j].querySelectorAll('td')[7].innerText,
                                    sit: tmp2[j].querySelectorAll('td')[9].innerText,
                                }

                                subjects.push(obj);
                            }
                        }

                        return subjects;
                    });

                    await browser.close();
                    data = JSON.stringify(data)
                    // console.log(data);
                    return [urlBoletim, data];

                } else {
                    //if there is no boletim url saved (first time)

                    var cid = url[1].split('=');

                    await page.screenshot({
                        path: './data/logged.png'
                    });

                    var selector = await page.evaluate(() => document.querySelector('[id="selectMatriculaPanelCDiv"]'));
                    if (selector) {
                        await Promise.all([
                            page.waitForNavigation(),
                            page.click('[value="Selecionar"]')
                        ]);
                    }

                    await Promise.all([
                        page.waitForNavigation(),
                        await page.goto(`https://sistemas.ufal.br/academico/matricula/visualizar.seam?cid=${cid[1]}`),
                        await page.screenshot({
                            path: './data/details.png'
                        })
                    ]);

                    await Promise.all([
                        page.waitForNavigation(),
                        page.evaluate(() => document.querySelector('[title="Boletim"]').click())
                    ]);

                    await Promise.all([
                        page.waitForNavigation(),
                        page.evaluate(() => document.querySelector('[title="Boletim"]').click())
                    ]);

                    await page.screenshot({
                        path: './data/Boletim.png'
                    })

                    const newUrlBoletim = await page.url();

                    var data = await page.evaluate(() => {
                        const subjects = [];
                        let tmp = document.querySelectorAll('table');

                        for (let i = 2; i < tmp.length; i++) {
                            let tmp2 = tmp[i].querySelectorAll('tr');

                            for (let j = 1; j < tmp2.length; j++) {

                                let obj = {
                                    name: tmp2[j].querySelectorAll('td')[0].innerText,
                                    ab1: tmp2[j].querySelectorAll('td')[3].innerText,
                                    ab2: tmp2[j].querySelectorAll('td')[4].innerText,
                                    reav: tmp2[j].querySelectorAll('td')[5].innerText,
                                    final: tmp2[j].querySelectorAll('td')[6].innerText,
                                    media: tmp2[j].querySelectorAll('td')[7].innerText,
                                    sit: tmp2[j].querySelectorAll('td')[9].innerText,
                                }

                                subjects.push(obj);
                            }
                        }

                        return subjects;
                    });

                    await browser.close();
                    data = JSON.stringify(data)
                    // console.log(data);
                    return [newUrlBoletim, data];
                }

            } else {
                await browser.close();
                console.log("Incorrect CPF or PASSWORD")
                return null;
            }
        } catch (err) {
            console.log(err)
        }
    }
}
