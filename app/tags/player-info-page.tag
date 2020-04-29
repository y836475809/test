<player-info-page>
    <style scoped>
        :scope {
            display: grid;
            --panel-padding: 4px;
            --video-panel-height: 100px;
            --user-icon-panel-height: 30px;
            --user-panel-height: 30px;
            --user-thumbnail-size: 50px;
            --description-panel-height: 100px;
            grid-template-rows: 
                var(--video-panel-height) 
                calc(var(--user-icon-panel-height) + var(--user-panel-height) + var(--description-panel-height)) 
                1fr;
            grid-template-columns: 1fr 1fr;  
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: hidden;
            --controls-container-height: 30px;
            --toggle-icon-size: 15px;
            --toggle-icon-margin: 2px;
        }    
        .viewinfo-panel{
            width: 100%;
            height: 100%;
            padding: var(--panel-padding);
        }

        .viewinfo-video-panel{
            grid-row: 1 / 2;
            grid-column: 1 / 3; 
            display: flex; 
        } 
        .video-thumbnail{
            user-select: none;
            margin-left: calc(0px - var(--panel-padding));
            width: 130px;
            height: 100px;
        }
        .video-info{
            user-select: none;
            margin-left: 5px;
            white-space: nowrap;
        }
        
        .viewinfo-description-panel{
            grid-row: 2 / 3;
            grid-column: 1 / 3; 
            /* border: 1px solid var(--control-border-color); */
            border-radius: 2px;
            margin-right:  5px;
        } 
        .description-user-thumbnail{
            user-select: none;
            padding-top: 5px;
            padding-left: 5px;
            width: var(--user-thumbnail-size); 
            height: var(--user-thumbnail-size); 
        }
        .description-user-name{
            user-select: none;
            vertical-align: middle;
            padding-left: 5px;
        }
        .description-container-normal {
            width: 100%;
            /* height: 100%; */
            height: calc(100% - var(--user-icon-panel-height));
            border: 1px solid var(--control-border-color);
        }
        .description-container-popup {
            position: absolute;
            top: 0px;
            border: solid 1px #aaa;
            border-radius: 3px;
            background-color: white; 
            box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.3);
            z-index: 999;
            padding: 5px;
        }
        .description-container-popup .icon-button {
            margin-left: auto;
        }
        .description-container-popup .description-user-name  {
            height: 20px; 
            line-height: 20px; 
        }
        .description-container-popup .description-user-name  {
            height: var(--user-thumbnail-size); 
            line-height: var(--user-thumbnail-size); 
        }
        .description-content {
            padding: 2px;
            width: 100%;
            height: calc(100% - var(--user-panel-height) - var(--toggle-icon-margin) * 2);  
            border-top: 1px solid var(--control-border-color);
            overflow-x: auto;
            overflow-y: auto;         
        }
        .description-content-html {
            white-space:nowrap;  
        } 
        .description-content-text {
            white-space: normal;
        } 

        .viewinfo-comments-panel{
            grid-row: 3 / 4;
            grid-column: 1 / 3; 
            background-color: var(--control-color);
        }   

        .viewinfo-controls-container {
            height: var(--controls-container-height);
        }
        .comment-checkbox{
            height: 25px;
            vertical-align:middle;
        }

        .comment-grid-container {
            width: 100%;
            height: calc(100% - var(--controls-container-height));
        }

        .icon-panel {
            height: var(--user-icon-panel-height);
            display: flex;
        }
        .icon-contain{
            display: flex;
            margin-left: auto;
        }
        .icon-button{
            font-size: 20px;
            height: 30px;
            width: 30px;
            margin-left: 5px;
        }
        .icon-button:hover{
            cursor: pointer;
            background-color: lightgray; 
        }
        .icon-button[data-state="false"]{
            pointer-events: none;
            opacity: 0.2;
        }

        .video-info > .content {
            display: flex
        }
        .video-info > .content > .label {
            min-width: calc(5em + 3px);
        }
        .notice-deleted {
            font-weight: bold;
            color: red;
        }

        .icon-layer1{
            left: -5px;
        }

        .icon-layer2{
            position: relative;
            left: 25%;
            top: 25%;
            font-size: 0.6em;
        }
    </style>
    
    <div class="viewinfo-panel viewinfo-video-panel">
        <div>
            <img src={this.video_thumbnail_url} class="video-thumbnail">
        </div>
        <div class="video-info">
            <div class="content">
                <div class="label">投稿日</div>: {this.first_retrieve}
            </div>
            <div class="content">
                <div class="label">再生</div>: {this.view_counter.toLocaleString()}
            </div>
            <div class="content">
                <div class="label">コメント</div>: {this.comment_counter.toLocaleString()}
            </div>
            <div class="content">
                <div class="label">マイリスト</div>: {this.mylist_counter.toLocaleString()}
            </div>
            <div class="content">
                {this.videoStateOnline()} {this.videoStateLocal()}
            </div>
            <div class="content">
                <div class="notice-deleted">{this.videoStateDeleted()}</div>
            </div>
        </div>
    </div>
    <div class="viewinfo-description-panel">   
        <div class="icon-panel">
            <div class="icon-contain">
                <div title="動画情報更新" class="center-hv">
                    <span class="icon-button center-hv fa-stack" 
                        data-state={String(this.enableUpdateData())} 
                        onclick={this.onclickUpdateThumbInfo}>
                        <i class="icon-layer1 fas fa-info fa-stack-1x"></i>
                        <i class="icon-layer2 fas fa-sync-alt fa-stack-1x"></i>
                      </span>
                </div>
            </div>         
        </div>
        <div class="description-container description-container-normal">
            <div style="display: flex;" class="center-v">
                <div class="description-user-name">投稿者: {this.user_nickname}</div>
                <div class="icon-button center-hv" onclick={this.onclickPopupDescription}>
                    <i title="ポップアップ表示" class="far fa-comment-alt"></i>
                </div>
            </div>
            <div class="description-content {this.description_content_class}" onmouseup={oncontextmenu_description}></div>
        </div>
        <div style="display: none;" class="description-container description-container-popup">
            <div style="display: flex;">
                <img class="description-user-thumbnail" src={this.user_thumbnail_url}>
                <div class="description-user-name">投稿者: {this.user_nickname}</div>
                <div class="icon-button center-hv" onclick={this.onclickCloseDescription}>
                    <i title="閉じる" class="fas fa-times"></i>
                </div>
            </div>
            <div class="description-content {this.description_content_class}" onmouseup={oncontextmenu_description}></div>
        </div>
    </div>
    <div class="viewinfo-panel viewinfo-comments-panel">
        <div style="display: flex;">
            <div class="viewinfo-controls-container">
                <input class="comment-checkbox" type="checkbox" 
                    onclick={this.onclickSyncCommentCheck} /><label>同期</label>
            </div>
            <span class="icon-button center-hv" onclick={this.onclickToggleComment}>
                <i title="コメント表示/非表示切り替え" class={this.toggle_comment_class}></i>
            </span>
            <div class="icon-contain">
                <div title="コメント更新" class="center-hv">
                    <span class="icon-button center-hv fa-stack" 
                        data-state={String(this.enableUpdateData())} 
                        onclick={this.onclickUpdateComment}>
                        <i class="icon-layer1 far fa-comment-dots fa-stack-1x"></i>
                        <i class="icon-layer2 fas fa-sync-alt fa-stack-1x"></i>
                    </span>
                </div>
            </div>
        </div>
        <div class="comment-grid-container">
            <div class="comment-grid"></div>
        </div>
    </div>
    
    <script>
        /* globals logger */
        const { remote, clipboard, ipcRenderer } = window.electron;
        const { Menu } = remote;
        const { GridTable } = window.GridTable;
        const time_format = window.TimeFormat;
        const SyncCommentScroll = window.SyncCommentScroll;
        const { IPC_CHANNEL } = window.IPC_CHANNEL;

        const obs = this.opts.obs; 

        const row_height = 25;

        this.is_deleted = false;
        this.is_online = false;
        this.is_saved = false;

        this.video_thumbnail_url = "";
        this.title =  "-";
        this.first_retrieve =  "";
        this.view_counter = 0;
        this.comment_counter = 0;
        this.mylist_counter = 0;
        this.user_thumbnail_url = "";
        
        this.description_content_class = "description-content-text";

        let sync_comment_scroll = new SyncCommentScroll();
        let sync_comment_checked = this.opts.sync_comment_checked;

        this.enableDonwload = () => {
            return this.is_deleted === false && this.is_saved === false;
        };
        this.enableUpdateData = () => {
            return this.is_deleted === false && this.is_saved === true;
        };

        this.videoStateOnline = () => {
            if(this.is_online === true){
                return "オンライン再生";
            }else{
                return "ローカル再生";
            }
        };
        this.videoStateLocal = () => {
            if(this.is_saved === true){
                return "保存済み";
            }else{
                return "";
            }
        };
        this.videoStateDeleted = () => {
            if(this.is_deleted === true){
                return "削除されています";
            }else{
                return "";
            }
        };

        const timeFormatter = (row, cell, value, columnDef, dataContext)=> {
            return time_format.toTimeString(value * 10 / 1000);
        };
        const dateFormatter = (row, cell, value, columnDef, dataContext)=> {
            //sec->ms
            return time_format.toDateString(value * 1000);
        };

        const columns = [
            {id: "vpos", name: "時間", sortable: true, formatter: timeFormatter},
            {id: "content", name: "コメント", sortable: true},
            {id: "user_id", name: "ユーザーID", sortable: true},
            {id: "date", name: "投稿日", sortable: true, formatter: dateFormatter},
            {id: "no", name: "番号", sortable: true},
            {id: "mail", name: "オプション", sortable: true}
        ];
        const options = {
            rowHeight: row_height,
            _saveColumnWidth: true,
        };   
        const grid_table = new GridTable("comment-grid", columns, options);

        this.onclickSyncCommentCheck = (e) => {
            const checked = e.target.checked;
            sync_comment_checked = checked;
            obs.trigger("player-main-page:sync-comment-checked", checked);
        };

        const resizeCommentList = () => {
            const container = this.root.querySelector(".comment-grid-container");
            grid_table.resizeFitContainer(container);
        };

        const updateSyncCommentCheckBox = () => {
            let ch_elm = this.root.querySelector(".comment-checkbox");
            ch_elm.checked = sync_comment_checked;
        };

        const createWatchLinkMenu = (video_id) => {
            const nemu_templete = [
                { label: "再生", click() {
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    }); 
                }},
                { label: "オンラインで再生", click() {
                    ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ONLINE, {
                        video_id: video_id,
                        time: 0
                    });
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        const watchLinkClick = (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            const paths = e.target.href.split("/");
            const video_id = paths.pop();

            ipcRenderer.send(IPC_CHANNEL.PLAY_BY_VIDEO_ID, {
                video_id: video_id,
                time: 0
            }); 
            
            return false;
        };

        const watchLinkMouseUp = (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            const paths = e.target.href.split("/");
            const video_id = paths.pop();
            
            if(e.button === 2){
                createWatchLinkMenu(video_id).popup({window: remote.getCurrentWindow()}); 
            }
            return false;
        };

        const mylistLinkClick = (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            const paths = e.target.href.split("/");
            const mylist_id = paths.pop();
            obs.trigger("player-main-page:load-mylist", mylist_id);
            return false;
        };

        const setDescription = (content_elms, description) => {
            content_elms.forEach(content_elm => {    
                content_elm.innerHTML = description;

                if(content_elm.childElementCount==0){
                    this.description_content_class = "description-content-text";
                }else{
                    this.description_content_class = "description-content-html";
                    const a_tags = content_elm.querySelectorAll("a");
                    a_tags.forEach(value=>{
                        if(/^https:\/\/www.nicovideo.jp\/watch\//.test(value.href)){
                            value.onclick = watchLinkClick;
                            value.onmouseup = watchLinkMouseUp;
                        }else if(/^https:\/\/www.nicovideo.jp\/mylist\//.test(value.href)){
                            value.onclick = mylistLinkClick;
                        }else{
                            value.onclick = (e) =>{
                                e.preventDefault();
                                return false;
                            };
                        }
                    });
                }
            });
        };

        this.onclickPopupDescription = (e) => {
            const elm = this.root.querySelector(".description-container-popup");
            elm.style.display = "";

            if(this.user_thumbnail_url != this.user_icon_url){
                this.user_thumbnail_url = this.user_icon_url;
            }
            const parent_elm = this.root.querySelector(".viewinfo-description-panel");
            const css_style = getComputedStyle(this.root);
            const panel_height = parseInt(css_style.getPropertyValue("--user-icon-panel-height"));
            
            const container_width = elm.clientWidth; 
            const left = parent_elm.offsetLeft - (container_width-parent_elm.offsetWidth);
            elm.style.top = parent_elm.offsetTop + panel_height + "px";
            elm.style.left = left + "px";
        };

        this.onclickCloseDescription = (e) => {
            const elm = this.root.querySelector(".description-container-popup");
            elm.style.display = "none";
        };

        const popupDescriptionMenu = (type, text) => {
            let menu_template = null;
            if(type=="watch"){
                const video_id = text;
                menu_template = createWatchLinkMenu(video_id);
            }
            if(type=="mylist"){
                const mylist_id = text;
                const menu_templete = [
                    { label: "mylistを開く", click() {
                        obs.trigger("player-main-page:load-mylist", mylist_id);
                    }}
                ];
                menu_template = Menu.buildFromTemplate(menu_templete);
            }
            if(type=="text"){
                const menu_templete = [
                    { label: "コピー", click() {
                        clipboard.writeText(text);
                    }}
                ];
                menu_template = Menu.buildFromTemplate(menu_templete);    
            }   
            menu_template.popup({window: remote.getCurrentWindow()});
        };
        this.oncontextmenu_description = (e) => {
            if(e.button !== 2){
                return;
            }
            
            const text = document.getSelection().toString();
            if(text==""){
                return;
            }

            if(/^sm\d+/.test(text)){
                const video_id = text.match(/sm\d+/)[0];
                popupDescriptionMenu("watch", video_id);
                return;
            }
            if(/^mylist\/\d+/.test(text)){
                const mylist_id = text.match(/\d+/)[0]; 
                popupDescriptionMenu("mylist", mylist_id);
                return;
            }

            popupDescriptionMenu("text", text);
        };

        this.toggle_comment_class = "far fa-comment-dots";
        this.onclickToggleComment = (e) => {
            let comment_visible = true;
            
            if(/dots/.test(this.toggle_comment_class)){
                this.toggle_comment_class = "fas fa-comment-slash";
                comment_visible = false;
            }else{
                this.toggle_comment_class = "far fa-comment-dots";
                comment_visible = true;
            }
            this.update();

            obs.trigger("player-video:change-comment-visible", comment_visible);
        };

        this.onclicAddDownload = (e) => {
            const item = {
                thumb_img: this.video_thumbnail_url,
                id: this.video_id,
                name: this.title,
                state: 0
            };
            obs.trigger("player-main-page:add-download-item", item);
        };
        
        this.onclickUpdateThumbInfo = (e) => {
            obs.trigger("player-main-page:update-data", this.video_id, "thumbinfo");
        };

        this.onclickUpdateComment = (e) => {
            logger.debug("player video info update video_id=", this.video_id);
            obs.trigger("player-main-page:update-data", this.video_id, "comment");
        };

        const setComments = (comments) => {
            sync_comment_scroll.setComments(comments);

            const grid_table_comments = comments.map((value, index) => {
                return Object.assign(value, { id: index });
            });
            grid_table.clearSelected();
            grid_table.setData(grid_table_comments);    
            grid_table.scrollToTop();
        };

        obs.on("player-info-page:update-comments", (args)=> {
            const comments = args;
            setComments(comments);
        });

        obs.on("player-info-page:sync-comment-checked", (args)=> {
            sync_comment_checked = args;
            updateSyncCommentCheckBox();
        });

        obs.on("player-info-page:set-viewinfo-data", (args)=> {
            resizeCommentList();

            const { viewinfo, comments, state } = args;

            this.is_deleted = viewinfo.is_deleted;

            if(state){
                this.is_online = state.is_online;
                this.is_saved = state.is_saved;
            }
            
            if(this.is_deleted===undefined){
                this.is_deleted = false;
            }
            if(this.is_online===undefined){
                this.is_online = false;
            }
            if(this.is_saved===undefined){
                this.is_saved = false;
            }

            const thumb_info = viewinfo.thumb_info;
            const video = thumb_info.video;
            const thread = thumb_info.thread;
            const owner = thumb_info.owner;
            const description = video.description;

            this.video_id = video.video_id;
            this.title = video.title;
            this.video_thumbnail_url = video.thumbnailURL;
            this.first_retrieve = time_format.toDateString(video.postedDateTime);
            this.view_counter = video.viewCount;
            this.comment_counter = thread.commentCount;
            this.mylist_counter = video.mylistCount;
            this.user_nickname = owner.nickname;
            this.user_icon_url = owner.iconURL;
            
            setDescription(this.root.querySelectorAll(".description-content"), description);

            setComments(comments);
            
            this.update();
        });

        obs.on("player-info-page:seek-update", (current_sec)=> {
            if(!sync_comment_checked){
                return;
            }

            const comment_index =  sync_comment_scroll.getCommentIndex(current_sec);
            grid_table.scrollRow(comment_index);
        });

        const triggerAddCommentNG = (args) => {
            obs.trigger("player-main-page:add-comment-ng", args);
        };

        const createMenu = () => {
            const nemu_templete = [
                { label: "コメントをNGリストに登録", click() {
                    const items = grid_table.getSelectedDatas();
                    const texts = items.map(item=>{
                        return item.text;
                    });
                    triggerAddCommentNG({ ng_matching_texts: texts, ng_user_ids: [] });
                }},
                { label: "ユーザーIDをNGリストに登録", click() {
                    const items = grid_table.getSelectedDatas();
                    const user_ids = items.map(item=>{
                        return item.user_id;
                    });
                    triggerAddCommentNG({ ng_matching_texts: [], ng_user_ids: user_ids });
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };

        this.on("mount", () => {  
            grid_table.init(this.root.querySelector(".comment-grid"));
            grid_table.grid.registerPlugin(new Slick.AutoTooltips());

            grid_table.onDblClick(async (e, data)=>{
                const sec = data.vpos * 10 / 1000;
                obs.trigger("player-video:seek", sec);
            });

            const context_menu = createMenu();
            grid_table.onContextMenu((e)=>{
                context_menu.popup({window: remote.getCurrentWindow()});
            });

            resizeCommentList();
        });
        
        obs.on("window-resized", ()=> {
            resizeCommentList();
        });

        obs.on("player-info-page:split-resized", ()=> {
            resizeCommentList();
        });
    </script>
</player-info-page>