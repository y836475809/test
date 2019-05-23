const electron = require("electron");
const session = electron.session;
// アプリケーションを操作するモジュール
const { app } = electron;
// ネイティブブラウザウィンドウを作成するモジュール
const { BrowserWindow } = electron;

const fs = require("fs");
const path = require("path");
const { IPCMsg, IPCMonitor } = require("./js/ipc-monitor");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

global.main_window = null;
global.player_window = null;
// ウィンドウオブジェクトをグローバル参照をしておくこと。
// しないと、ガベージコレクタにより自動的に閉じられてしまう。
let win = null;
let player_win = null;
let is_debug_mode = false;

const ipc_monitor = new IPCMonitor();
ipc_monitor.listenMain();

function createWindow() {
    global.sharedObj = {
        base_dir: __dirname
    };

    let html = "html/index.html";
    if (process.argv.length > 2) {
        html = process.argv[2];

        if(process.argv[process.argv.length-1]=="--debug"){
            is_debug_mode = true;
        }
    }

    // ブラウザウィンドウの作成
    win = new BrowserWindow({ width: 1000, height: 600 });

    // アプリケーションのindex.htmlの読み込み
    win.loadURL(`file://${__dirname}/${html}`);

    if(is_debug_mode){
        // DevToolsを開く
        win.webContents.openDevTools();
    }

    // ウィンドウが閉じられた時に発行される
    win.on("closed", () => {
        // ウィンドウオブジェクトを参照から外す。
        // もし何個かウィンドウがあるならば、配列として持っておいて、対応するウィンドウのオブジェクトを消去するべき。
        if (player_win !== null) {
            player_win.close();
        }
        win = null;
    });

    global.main_window = win;
}

// このメソッドはElectronが初期化を終えて、ブラウザウィンドウを作成可能になった時に呼び出される。
// 幾つかのAPIはこのイベントの後でしか使えない。
app.on("ready", ()=>{
    createWindow();

    ipc_monitor.on(IPCMsg.SHOW_PLAYER_SYNC, async (event, args) => {
        await createPlayerWindow();
        player_win.show();
        event.returnValue = true;
    });

    ipc_monitor.on(IPCMsg.SET_COOKIE_SYNC, async (event, args) => {
        const cookies = args;
        const ps = cookies.map(cookie=>{
            return new Promise((resolve, reject) => {
                session.defaultSession.cookies.set(cookie, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        });
        try {
            await Promise.all(ps);
            event.returnValue = "ok";
        } catch (error) {
            event.returnValue = "error";
        }
    });
});

// すべてのウィンドウが閉じられた時にアプリケーションを終了する。
app.on("window-all-closed", () => {
    // macOSでは、Cmd + Q(終了)をユーザーが実行するまではウィンドウが全て閉じられても終了しないでおく。
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // macOS では、ドックをクリックされた時にウィンドウがなければ新しく作成する。
    if (win === null) {
        createWindow();
    }
});

const createPlayerWindow = () => {
    return new Promise((resolve, reject) => {
        if(player_win !== null){
            resolve();
            return;
        }

        player_win = new BrowserWindow({ width: 800, height: 600 });
        player_win.webContents.on("did-finish-load", () => {
            if(is_debug_mode){
                player_win.webContents.openDevTools();
            }
            player_win.on("close", (e) => {
                player_win = null;
            });

            resolve();
        });

        const player_path = `file://${__dirname}/html/player.html`;
        player_win.loadURL(player_path);

        global.player_window = player_win;
    });  
};

app.on("login", function(event, webContents, request, authInfo, callback) {
    if(authInfo.isProxy){
        event.preventDefault();
        try {
            const f = path.join(app.getPath("userData"), "proxy.json");
            const p = JSON.parse(fs.readFileSync(f));
            callback(p.name, p.pass);      
        } catch (error) {
            callback(null, null);
        }
    }
});