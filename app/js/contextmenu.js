const { ipcMain, Menu, clipboard } = require("electron");
const { toTimeString } = require("./time-format"); 
const { getWatchURL } = require("./nico-url"); 
const { Command } = require("./command"); 

const getMenuEnable = (menu_id, data) => {
    const { title, thumbnailURL } = data;

    if(menu_id == "show-open-video-form"){
        return true;
    }
    if(menu_id == "copy-url"){
        return true;
    }
    if(menu_id == "reload"){
        return true;
    }

    if(!title || !thumbnailURL) {
        return false;
    }

    return true;
};

const setupPlayerCM1 = (window) => {
    ipcMain.handle("app:show-player-contextmeu", async (event, args) => {
        const { play_data } = args;
        const { video_id, title, thumbnailURL, online } = play_data;
        return await new Promise((resolve, reject) => {
            const menu_items = [
                { 
                    id: "add-bookmark",
                    label: "ブックマーク", click() {
                        const items = [{
                            title: title,
                            id: video_id
                        }];
                        Command.addBookmarkItems(null, items);
                        resolve(null);
                    }
                },
                { 
                    id: "add-bookmark-time",
                    label: "ブックマーク(時間)", 
                },
                { 
                    id: "add-stack-time",
                    label: "後で見る", 
                },
                { type: "separator" },
                { 
                    id: "add-download",
                    label: "ダウンロードに追加", click() {
                        const items = [{
                            thumb_img: thumbnailURL,
                            id: video_id,
                            title: title,
                            state: 0
                        }];
                        Command.addDownloadItems(null, items);
                        resolve(null);
                    }
                },   
                { type: "separator" },
                { 
                    id: "copy-url",
                    label: "urlをコピー", click() {
                        const url = getWatchURL(video_id);
                        clipboard.writeText(url);
                        resolve(null);
                    }
                },
                { type: "separator" },
                { 
                    id: "show-open-video-form",
                    label: "動画ID/URLを指定して再生",
                },               
                { type: "separator" },
                { 
                    id: "reload",
                    label: "再読み込み", click() {
                        ipcMain.emit("app:play-video", null, {
                            video_id: video_id,
                            time: 0,
                            online: online
                        });
                        resolve(null);
                    }
                },
                { type: "separator" },
                {
                    id: "change-movie-size",
                    label: "動画のサイズに変更", 
                },
                { type: "separator" },
                {
                    label: "ヘルプ",
                    submenu: [
                        { role: "reload" },
                        { role: "forcereload" },
                        { role: "toggledevtools" },
                    ]
                } 
            ];
    
            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    const id = menu_item.id;
                    if(!menu_item.click){         
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                    menu_item.enabled = getMenuEnable(id, play_data);
                }
            });

            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const setupPlayerCM2 = (window, store, history, config) => {
    ipcMain.handle("app:show-player-contextmeu2", async (event, args) => {
        return await new Promise((resolve, reject) => {
            const createMenuItems = (items) => {
                return items.map(item=>{
                    const { id, title, time } = item;
                    const getTitle = () => {
                        if(time){
                            return `[${toTimeString(time)}] ${title}`;
                        }else{
                            return title;
                        } 
                    };
                    return { 
                        label: getTitle(), click() {
                            resolve({
                                video_id: id,
                                time: time?time:0,
                                online: false
                            });
                        }
                    };
                });
            };

            const history_num = config.get("player.contextmenu.history_num", 5);
            const stack_num = config.get("player.contextmenu.stack_num", 5);
            const history_items = history.getData("history").slice(1, history_num+1);
            const stack_items = store.getItems("stack").slice(0, stack_num);
            
            const menu_items = createMenuItems(history_items);
            if(stack_items.length > 0){
                menu_items.push({ type: "separator" });
                Array.prototype.push.apply(menu_items, createMenuItems(stack_items));
            }
            const context_menu =  Menu.buildFromTemplate(menu_items.concat());
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const ngcomment = (window) => {
    ipcMain.handle("app:popup-player-contextmenu-ngcomment", async (event, args) => {
        return await new Promise((resolve, reject) => {
            const createMenuItems = () => {
                const menu_templete = [
                    { 
                        id: "add-comment-ng=list",
                        label: "コメントをNGリストに登録", 
                    },
                    { 
                        id: "add-uerid-ng=list",
                        label: "ユーザーIDをNGリストに登録", 
                    },
                ];
                menu_templete.forEach(menu_item => {
                    if(menu_item.type != "separator"){
                        if(!menu_item.click){         
                            menu_item.click = ()=>{
                                resolve(menu_item.id);
                            };
                        }
                    }
                });
                return Menu.buildFromTemplate(menu_templete);
            };
            const context_menu = createMenuItems();
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const watchlink = (window) => {
    ipcMain.handle("app:popup-player-contextmenu-watchlink", async (event, args) => {
        const { video_id, url } = args;
        return await new Promise(resolve => {
            const context_menu = Menu.buildFromTemplate([
                { label: "再生", click() {
                    Command.play({id:video_id}, false);
                    resolve(null);
                }},
                { label: "オンラインで再生", click() {
                    Command.play({id:video_id}, true);
                    resolve(null);
                }},
                { label: "URLをコピー", click() {
                    clipboard.writeText(url);
                    resolve(null);
                }}
            ]);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const mylistlink = (main_win, window) => {
    ipcMain.handle("app:popup-player-contextmenu-mylistlink", async (event, args) => {
        const { mylist_id, url } = args;
        return await new Promise(resolve => {
            const context_menu = Menu.buildFromTemplate([
                { label: "マイリストで開く", click() {
                    main_win.webContents.send("app:load-mylist", mylist_id);
                    resolve(null);
                }},
                { label: "URLをコピー", click() {
                    clipboard.writeText(url);
                    resolve(null);
                }}
            ]);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const link = (window) => {
    ipcMain.handle("app:popup-player-contextmenu-link", async (event, args) => {
        const { url } = args;
        return await new Promise(resolve => {
            const context_menu = Menu.buildFromTemplate([
                { label: "URLをコピー", click() {
                    clipboard.writeText(url);
                    resolve(null);
                }}
            ]);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const text = (window) => {
    ipcMain.handle("app:popup-player-contextmenu-text", async (event, args) => {
        const { text } = args;
        return await new Promise(resolve => {
            const context_menu = Menu.buildFromTemplate([
                { label: "コピー", click() {
                    clipboard.writeText(text);
                    resolve(null);
                }}
            ]);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const getBookMarkMenuEnable = (type, items) => {
    if(items.length === 0) {
        return false;
    }

    if(type == "play"){
        return true;
    }
    if(type == "go-to-library"){
        return true;
    }
    if(type == "delete"){
        return true;
    }
    if(type == "toggle-mark"){
        return true;
    }

    return false;
};

const bookmark = (window) => {
    ipcMain.handle("app:popup-listview-bookmark", async (event, args) => {
        const { items } = args;
        return await new Promise(resolve => {
            const context_menu = Menu.buildFromTemplate([
                { 
                    id: "play",
                    label: "再生", click() {
                        const { video_id, time } = items[0].data;
                        Command.play({
                            id: video_id,
                            time: time
                        }, false);
                        resolve(null);
                    }
                },
                { 
                    id: "play",
                    label: "オンラインで再生", click() {
                        const { video_id, time } = items[0].data;
                        Command.play({
                            id: video_id,
                            time: time
                        }, true);
                        resolve(null);
                    }
                },
                { 
                    id: "go-to-library",
                    label: "ライブラリの項目へ移動", click() {
                        resolve("go-to-library");
                    }
                },
                { 
                    id: "toggle-mark",
                    label: "マークの切り替え", click() {
                        resolve("toggle-mark");
                    }
                },
            ]);
            context_menu.items.forEach(menu => {
                const id = menu.id;
                menu.enabled = getBookMarkMenuEnable(id, items);
            });
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const toggleMark = (window) => {
    ipcMain.handle("app:popup-listview-toggle-mark", async (event, args) => {
        return await new Promise(resolve => {
            const context_menu = Menu.buildFromTemplate([
                { 
                    id: "toggle-mark",
                    label: "マークの切り替え", click() {
                        resolve("toggle-mark");
                    }
                },
            ]);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const download = (window) => {
    ipcMain.handle("app:popup-download-contextmenu", async (event, args) => {
        const { items } = args;
        return await new Promise(resolve => {
            const menu_items = [
                { 
                    label: "再生", click() {
                        Command.play(items[0], false);
                        resolve(null);
                    }
                },
                { 
                    label: "オンラインで再生", click() {
                        Command.play(items[0], true);
                        resolve(null);
                    }
                },
                { 
                    label: "後で見る",click() {
                        Command.addStackItems(null, items);
                        resolve(null);
                    }
                },
                { type: "separator" },
                { 
                    label: "ブックマーク", click() {
                        Command.addStackItems(null, items);
                        resolve(null);
                    }
                },
                { type: "separator" },
                { 
                    id:"delete",
                    label: "削除", 
                }
            ];
            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    if(!menu_item.click){         
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                }
            });
            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: window});
        });
    });
};

const librayMain = (main_win) => {
    ipcMain.handle("app:popup-library-contextmenu", async (event, args) => {
        const { items } = args;
        return await new Promise(resolve => {
            const menu_items = [
                { label: "再生", click() {
                    Command.play(items[0], false);
                    resolve(null);
                }},
                { label: "オンラインで再生", click() {
                    Command.play(items[0], true);
                    resolve(null);
                }},
                { label: "後で見る", click() {
                    Command.addStackItems(null, items);
                    resolve(null);
                }},
                { type: "separator" },
                { 
                    id:"update-comment",
                    label: "コメント更新",
                },
                { 
                    id:"update-thumbnail",
                    label: "画像更新", 
                },
                { 
                    id:"update-except-video",
                    label: "動画以外を更新",
                },
                { type: "separator" },
                { label: "ブックマーク", click() {
                    Command.addBookmarkItems(null, items);
                    resolve(null);
                }
                },
                { type: "separator" },
                { 
                    id:"conver-to-xml",
                    label: "NNDD形式(XML)に変換",
                },
                { type: "separator" },
                { 
                    id:"delete",
                    label: "削除", 
                }
            ];
            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    if(!menu_item.click){      
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                }
            });
            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: main_win});
        });
    });
};

const librayConvertVideo = (main_win) => {
    ipcMain.handle("app:popup-library-convert-video-contextmenu", async (event, args) => {
        return await new Promise(resolve => {
            const menu_items = [
                { 
                    id: "convert-video",
                    label: "mp4に変換",
                },
            ];
            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    if(!menu_item.click){      
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                }
            });
            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: main_win});
        });
    });
};

const mylist = (main_win) => {
    ipcMain.handle("app:popup-myist-contextmenu", async (event, args) => {
        const { context_menu_type, items } = args;

        return await new Promise(resolve => {
            let menu_items; 
            if(context_menu_type == "main"){
                menu_items = [
                    { label: "再生", async click() {
                        Command.play(items[0], false);
                        resolve(null);
                    }},
                    { label: "オンラインで再生", async click() {
                        Command.play(items[0], true);
                        resolve(null);
                    }},
                    { label: "後で見る", click() {
                        Command.addStackItems(null, items);
                        resolve(null);
                    }},
                    { type: "separator" },
                    { label: "ダウンロードに追加", click() {
                        Command.addDownloadItems(null, items);
                        resolve(null);
                    }},
                    { label: "ダウンロードから削除", click() {
                        Command.deleteDownloadItems(null, items);
                        resolve(null);
                    }},
                    { type: "separator" },
                    { label: "ブックマーク", click() {
                        Command.addBookmarkItems(null, items);
                        resolve(null);
                    }}
                ];
            }
            if(context_menu_type == "convert-video"){
                menu_items = [
                    { 
                        id: "convert-video",
                        label: "mp4に変換",
                    }
                ];
            }

            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    if(!menu_item.click){      
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                }
            });
            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: main_win});
        });
    });
};

const playhistory = (main_win) => {
    ipcMain.handle("app:popup-play-history-contextmenu", async (event, args) => {
        const { items } = args;

        return await new Promise(resolve => {
            const menu_items = [
                { label: "再生", click() {
                    Command.play(items[0], false);
                    resolve(null);
                }},
                { label: "オンラインで再生", click() {
                    Command.play(items[0], true);
                    resolve(null);
                }},
                { label: "後で見る", click() {
                    Command.addStackItems(null, items);
                    resolve(null);
                }},
                { type: "separator" },
                { label: "ダウンロードに追加", click() {
                    Command.addDownloadItems(null, items);
                    resolve(null);
                }},
                { label: "ダウンロードから削除", click() {
                    Command.deleteDownloadItems(null, items);
                    resolve(null);
                }},
                { type: "separator" },
                { label: "ブックマーク", click() {
                    Command.addBookmarkItems(null, items);
                    resolve(null);
                }}
            ];

            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    if(!menu_item.click){      
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                }
            });
            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: main_win});
        });
    });
};

const settingNGComment = (player_win) => {
    ipcMain.handle("app:popup-setting-ng-comment-contextmenu", async (event, args) => {
        return await new Promise(resolve => {
            const menu_items = [
                { 
                    id:"delete",
                    label: "削除",
                }
            ];

            menu_items.forEach(menu_item => {
                if(menu_item.type != "separator"){
                    if(!menu_item.click){      
                        menu_item.click = ()=>{
                            resolve(menu_item.id);
                        };
                    }
                }
            });
            const context_menu = Menu.buildFromTemplate(menu_items);
            context_menu.addListener("menu-will-close", () => {
                setTimeout(()=>{
                    resolve(null);
                }, 200); 
            });  
            context_menu.popup({window: player_win});
        });
    });
};

module.exports = { 
    setupPlayerCM1,
    setupPlayerCM2,
    player : {
        ngcomment,
        watchlink,
        mylistlink,
        link,
        text,
        settingNGComment,
    },
    listview : {
        toggleMark,
        bookmark,
    },
    main: {
        download,
        librayMain,
        librayConvertVideo,
        mylist,
        playhistory,
    }
};