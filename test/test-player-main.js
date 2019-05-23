const Application = require("spectron").Application;
const assert = require("assert");
const electronPath = require("electron");
const path = require("path");

const main = async () => {
    const app = new Application({
        // path: "_bin/electron/electron.exe",
        path: electronPath,
        env: {
            SPECTRON: true,
            ELECTRON_ENABLE_LOGGING: true,
            ELECTRON_ENABLE_STACK_DUMPING: true
        },
        args: [path.join(__dirname, "../"), "../test/test-player-main.html"]
    });

    await app.start();
    const count = await app.client.getWindowCount();
    assert.equal(count, 1);
    // let main_index = 0;
    // let debug_index = 1;
    // if(count>1){
    //     if(await app.client.windowByIndex(0).isExisting("button[data-test='load1']")===true){
    //         main_index = 0;
    //         debug_index = 1;
    //     }else{
    //         main_index = 1;
    //         debug_index = 0;
    //     }
    // }
    // await app.client.windowByIndex(main_index).click("button[data-test='load1']");
    await app.client.click("button[data-test='load1']");

    await app.stop();
};

main();