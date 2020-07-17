<play-history-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
        }

        .history-grid-container {
            background-color: var(--control-color);
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
    </style>
    
    <div class="history-grid-container">
        <div class="history-grid"></div>
    </div>    

    <script>
        /* globals logger */
        const { remote, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { GridTable, wrapFormatter, buttonFormatter } = window.GridTable;
        const { BookMark } = window.BookMark;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;
        const { IPCClient } = window.IPC;

        const obs = this.opts.obs; 

        const infoFormatter = (row, cell, value, columnDef, dataContext)=> {
            const video_id = dataContext.id;
            return `ID: ${video_id}`;
        };

        const columns = [
            {id: "thumb_img", name: "サムネイル", height:100, width: 130},
            {id: "title", name: "名前", sortable: true, formatter:wrapFormatter},
            {id: "command", name: "操作", sortable: false, 
                formatter: buttonFormatter.bind(this,["play", "stack", "bookmark", "download"])},
            {id: "info", name: "情報",sortable: false, formatter:infoFormatter},
            {id: "play_date", name: "再生日", sortable: true},
            {id: "url", name: "url", sortable: true}
        ];
        const options = {
            rowHeight: 100,
            id_click_as_dbclick:"thumb_img"
        }; 
        const grid_table = new GridTable("history-grid", columns, options);

        const play = (item, online) => {
            ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                video_id : item.id,
                time : 0,
                online: online
            });
        };

        const addStackItems = (items) => {
            const stack_items = items.map(item => {
                return {
                    id: item.id,
                    title: item.title, 
                    thumb_img:item.thumb_img
                };
            });
            obs.trigger("play-stack-page:add-items", {items:stack_items});
        };

        const addBookmarkItems = (items) => {
            const bk_items = items.map(item => {
                return BookMark.createVideoItem(item.title, item.id);
            });
            obs.trigger("bookmark-page:add-items", bk_items);
        };

        const addDownloadItems = (items) => {
            obs.trigger("download-page:add-download-items", items);
        };

        const createMenu = () => {
            const menu_templete = [
                { label: "再生", click() {
                    const items = grid_table.getSelectedDatas();
                    play(items[0], false);
                }},
                { label: "オンラインで再生", click() {
                    const items = grid_table.getSelectedDatas();
                    play(items[0], true);
                }},
                { label: "後で見る", click() {
                    const items = grid_table.getSelectedDatas();
                    addStackItems(items);
                }},
                { type: "separator" },
                { label: "ブックマーク", click() {
                    const items = grid_table.getSelectedDatas();
                    addBookmarkItems(items);
                }}
            ];
            return Menu.buildFromTemplate(menu_templete);
        };

        this.on("mount", async () => {
            grid_table.init(".history-grid");
            grid_table.setupResizer(".history-grid-container");
            grid_table.onDblClick((e, data)=>{
                const video_id = data.id;
                ipcRenderer.send(IPC_CHANNEL.PLAY_VIDEO, {
                    video_id : video_id,
                    time : 0,
                    online: false
                });
            });
            grid_table.onButtonClick(async (e, cmd_id, data)=>{
                if(cmd_id == "play"){
                    play(data, false);
                }
                if(cmd_id == "stack"){
                    addStackItems([data]);
                }
                if(cmd_id == "bookmark"){
                    addBookmarkItems([data]);
                }
                if(cmd_id == "download"){
                    addDownloadItems([data]);
                }
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });           

            try {
                const items = await IPCClient.request("history", "getData");
                grid_table.setData(items);
            } catch (error) {
                logger.error(error);
                obs.trigger("main-page:toastr", {
                    type: "error",
                    title: "再生履歴の読み込み失敗",
                    message: error.message,
                });
                // grid_table.setData([]); 
            }
        });

        ipcRenderer.on(IPC_CHANNEL.ADD_PLAY_HISTORY, async (event, args)=>{
            const { history_item } = args;
            await IPCClient.request("history", "add", { history_item });
            const items = await IPCClient.request("history", "getData");
            grid_table.setData(items);
        });
    </script>
</play-history-page>
