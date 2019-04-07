<download-page>
    <style scoped>
        :scope {
            width: 100%;
            height: 100%;
            background-color: var(--control-color);
        }

        .control-container{
            background-color: var(--control-color);
        }
    </style>

    <div class="control-container">
        <button onclick={onclickStartDownload}>start</button>
        <button onclick={onclickStopDownload}>stop</button>
    </div>
    <download-list contextmenu={this.context_menu}></download-list>

    <script>
        /* globals app_base_dir obs */
        const { remote } = require("electron");
        const { Menu } = remote;
        const { SettingStore } = require(`${app_base_dir}/js/setting-store`);
        const { NicoNicoDownloader } = require(`${app_base_dir}/js/niconico-downloader`);

        require(`${app_base_dir}/tags/download-list.tag`);

        const library_dir = SettingStore.getLibraryDir();

        const createMenu = () => {
            const nemu_templete = [
                { label: "Play", click() {
                    //TODO
                }},
                { label: "delete", click() {
                    obs.trigger("delete-selected-items", (deleted_ids)=>{ 
                        obs.trigger("search-page:delete-download-ids", deleted_ids);
                    });
                }},
            ];
            return Menu.buildFromTemplate(nemu_templete);
        };
        this.context_menu = createMenu();
        
        let is_cancel = false;
        let nico_down = null;

        this.onclickStartDownload = (e) => {
            obs.trigger("start-download", async (video_id, on_progress)=>{
                if(is_cancel){
                    return "cancel";
                }
                nico_down = new NicoNicoDownloader(video_id, library_dir);
                const result = await nico_down.download((state)=>{
                    on_progress(state);
                });  
                if(result.state=="ok"){
                    const item = nico_down.getDownloadedItem();
                    obs.trigger("search-page:complete-download-ids", [item.video_id]);
                    obs.trigger("add-library-item", item);
                    return result.state;
                }else {
                    console.log("reason: ", result);
                    return result.state;
                }
            });
        };

        this.onclickStopDownload = (e) => {
            is_cancel = true;
            if(nico_down){
                nico_down.cancel();
            }
            obs.trigger("cancel-download");
        };

        this.on("mount", () => {
            
        });
    </script>
</download-page>