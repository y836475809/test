const { DataIpcMain } = require("./data-ipc");

class DownloadItemIpcMain extends DataIpcMain {
    constructor(){
        super("downloaditem");
    }

    setData(args){
        const { items } = args;
        this.items = items;
    }

    getData(){
        return this.items;
    }

    updateData(args){
        const { items } = args;
        this.items = items;
        this.emit("updated", {items});
    }

    getIncompleteIDs() {
        const ids = [];
        this.items.forEach(item => {
            if(item.state != 2){
                ids.push(item.id);
            } 
        });
        return ids;
    }
}

module.exports = {
    DownloadItemIpcMain
};