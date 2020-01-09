const test = require("ava");
const {Application} = require("spectron");
const electronPath = require("electron");
const path = require("path");

test.beforeEach(async t => {
    t.context.app = new Application({
        path: electronPath,
        env: {
            SPECTRON: "true",
        },
        args: [path.join(__dirname, ".."), "test-player-main.html"]    });
  
    await t.context.app.start();
});
  
test.afterEach.always(async t => {
    await t.context.app.stop();
});

test("e2e 1", async t => {
    const app = t.context.app;
    await app.client.waitUntilWindowLoaded();
    const win = app.browserWindow;
    await app.client.$(".debug-btn1").click();

    t.is(await app.client.getTitle(),"oo" );
    // t.false(await win.isDevToolsOpened());
    // t.true(await win.isVisible());
    // t.true(await win.isFocused());
    // const {width, height} = await win.getBounds();
    // t.true(height > 0);
});