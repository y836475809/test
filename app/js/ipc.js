const { ipcRenderer, ipcMain } = require("electron");
const EventEmitter = require("events");

const IPC_CHANNEL = Object.freeze({
    LIBRARY_ACITON: "ipc-library-action",
    BOOKMARK_ACITON: "ipc-bookmark-action",
    HISTORY_ACITON: "ipc-history-action",
    DOWNLOADITEM_ACITON: "ipc-downloaditem-action",
    CONFIG_ACITON: "ipc-config-action",
});

const channel_map = {
    library: IPC_CHANNEL.LIBRARY_ACITON,
    bookmark: IPC_CHANNEL.BOOKMARK_ACITON,
    history: IPC_CHANNEL.HISTORY_ACITON,
    downloaditem: IPC_CHANNEL.DOWNLOADITEM_ACITON,
    config: IPC_CHANNEL.CONFIG_ACITON,
};

class IPCClient {
    static async action(name, method, args) {
        const channel = channel_map[name];
        if (channel===undefined) {
            throw new Error(`IPCClient action: ${name} is not find`);
        }   
        return await ipcRenderer.invoke(channel, {method, args});
    }
}

class IPCServer extends EventEmitter {
    constructor(name){
        super();
        this.name = name;
    }

    handle(){  
        this.channel = channel_map[this.name];
        if (this.channel===undefined) {
            throw new Error(`IPCServer, ${this.name} is not find`);
        }   

        ipcMain.removeHandler(this.channel);
        ipcMain.handle(this.channel, async (event, _args) => {
            const { method, args } = _args;
            const func = this[method];
            if(func.constructor.method === "AsyncFunction"){
                return await this[method](args);
            }else{
                return this[method](args);
            }
        });
    }
}

module.exports = {
    IPCClient,
    IPCServer,
};