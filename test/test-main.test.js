const test = require("ava");
const {Application} = require("spectron");
const electronPath = require("electron");
const path = require("path");
// const { SettingStore } = require("../app/js/setting-store"); //error

test.beforeEach(async t => {
    t.context.app = new Application({
        path: electronPath,
        env: {
            SPECTRON: "true",
        },
        args: [path.join(__dirname, ".."), "test-main.html"]    });
  
    await t.context.app.start();
});
  
test.afterEach.always(async t => {
    await t.context.app.stop();
});

test("e2e 1", async t => {
    const app = t.context.app;
    
    await app.client.waitUntilWindowLoaded();
    const win = app.browserWindow;
    // app.client.getRenderProcessLogs().then(function (logs) {
    //     logs.forEach(function (log) {
    //         console.log(log.message);
    //         console.log(log.source);
    //         console.log(log.level);
    //     });
    // });

    await new Promise(resolve => setTimeout(resolve, 10000));
    const info = "library-content .library-controls-container .item-info";
    t.is(await app.client.$(info).getText(), "項目数 9/9");
    t.is(await app.client.getTitle(),"oo" );
});