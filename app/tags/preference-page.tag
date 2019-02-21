<preference-page>
    <style scoped>
        :scope {
            position: absolute;
            z-index: 9999; 
        }
        .pref-container{
            position: absolute;
            width: 100vw;
            height: 100vh;
            margin: 0;
            background-color:black;
            opacity: 0.95;
        }
        .pref-page{
            --pref-container-margin: 25px;
            position: absolute;
            top: var(--pref-container-margin);
            left: var(--pref-container-margin);
            width: calc(100vw - var(--pref-container-margin) * 2);
            height: calc(100vh - var(--pref-container-margin) * 2);
            display: block;
            background-color: var(--control-color);
            border: 1px solid var(--control-border-color);
        }
        .display-none{
            display: none;
        }
        button, input, select, textarea {
            font-family : inherit;
            font-size   : 100%;
        }
        .param{
            display: block;
            margin: 5px;
        }
        .group{
            /* display: flex; */
            padding: 5px;
            margin: 10px;
        }
        #library-dir{
            width: 300px;
        }
        .pref-close-btn{
            position: absolute;
            width: 25px;
            height: 25px;
            top: 5px;
            left: calc(100% - 30px);            
        }
        .pref-checkbox{
            height: 25px;
            vertical-align:middle;
        }
    </style>

    <div class={ this.isloading === true ? "pref-container" : "display-none" }>
            <div class="pref-page">
    <div class="group">
        <label class="param">Library dir</label>
        <input id="library-dir" type="text" readonly>
        <input type="button" value="Select" onclick={onclickSelectLibrarayPath}>
    </div>
    <div class="group">
        <label class="param">Refresh library</label>
        <input type="button" value="Refresh" onclick={onclickRefreshLibrary}>
    </div>
    <div class="group">
        <label class="param">Import db</label>
        <input type="button" value="Import" onclick={onclickImport}>
    </div>
    <button class="pref-close-btn" type="button" onclick={onclickClose}>x</button>
    </div>
</div>
    <indicator ref="indicator"></indicator>

    <script>
        /* globals riot obs */
        const { ipcRenderer, remote } = require("electron");
        const { dialog } = require("electron").remote;
        const { SettingStore } = require("../js/setting-store");

        require("./indicator.tag");
        riot.mount("indicator");
        
        this.isloading = false;
        let self = this;
        const setLibraryDirAtt = (value) => {
            document.getElementById("library-dir").setAttribute("value", value);
        };

        this.on("mount", () => {
            const path = SettingStore.getLibraryDir();
            if(!path){
                setLibraryDirAtt("");
            }else{
                setLibraryDirAtt(path);
            } 
        });

        obs.on("on_change_show_pref_page", (is_show)=> {
            this.isloading = is_show;
            this.update();
        });

        this.onclickClose = () => {
            this.isloading = false;
            this.update();            
        };

        const selectFileDialog = (name, extensions)=>{
            const paths = dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ["openFile"],
                title: "Select",
                defaultPath: ".",
                filters: [
                    {name: name, extensions: extensions}, 
                    {name: "All", extensions: ["*"]},
                ]
            });
            if(paths){
                return paths[0];
            }
            return null;
        };

        const selectFolderDialog = ()=>{
            const paths = dialog.showOpenDialog(remote.getCurrentWindow(), {
                properties: ["openDirectory"],
                title: "Select",
                defaultPath: "."
            });
            if(paths){
                return paths[0];
            }
            return null;
        };

        this.onclickSelectLibrarayPath = ()=>{
            const path = selectFolderDialog();
            if(!path){
                return;
            }
            setLibraryDirAtt(path);

            SettingStore.setLibraryDir(path);
        };

        this.onclickRefreshLibrary = ()=>{
            obs.trigger("refresh_library");
        };

        this.onclickImport = ()=>{
            const db_file_path = selectFileDialog("Sqlite db", ["db"]);
            if(!db_file_path){
                return;
            }

            self.refs.indicator.showLoading("Now Loading...");
            setTimeout(() => {      
                obs.trigger("import-library-from-sqlite", db_file_path);              
            }, 100);
        };

        obs.on("import-library-from-sqlite-rep", (error) => { 
            if(error){
                dialog.showMessageBox(remote.getCurrentWindow(),{
                    type: "error",
                    buttons: ["OK"],
                    message: error.message
                });
            }else{
                dialog.showMessageBox(remote.getCurrentWindow(),{
                    type: "info",
                    buttons: ["OK"],
                    message: "Conversion complete"
                });
            }
            self.refs.indicator.hideLoading();   
        });
    </script>
</preference-page>