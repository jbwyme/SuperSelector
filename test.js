casper.test.begin('Mixpanel basic tests', 2, function suite(test) {
    casper.start("https://mixpanel.com/", function() {
        casper.waitForSelector('#hlinks > :nth-child(4)', function () {
            this.click('#hlinks > :nth-child(4)');
        });
        casper.then(function() {
            test.assertUrlMatch('https://mixpanel.com/login/', 'Login loaded');
            casper.waitForSelector('#id_email', function () {
                this.click('#id_email');
            });
            casper.evaluate(function() {
                document.querySelector('#id_email').value = 'demo-user@mixpanel.com';
            });
            casper.waitForSelector('#id_password', function () {
                this.click('#id_password');
            });
            casper.evaluate(function() {
                document.querySelector('#id_password').value = 'analytics';
            });
            casper.waitForSelector('#bottom > input', function () {
                this.click('#bottom > input');
            });
        });
        casper.then(function() {
            test.assertUrlMatch(/\/report\/822019\/segmentation\//, 'Segmentation loaded');
            this.click('#funnels_link');
        });
        casper.then(function() {
            test.assertUrlMatch('https://mixpanel.com/report/822019/funnels/', 'Funnels loaded');
        });
    });
    casper.run(function() {
        test.done();
    });
});
