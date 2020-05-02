
const IPC_CHANNEL =  Object.freeze({   
    PLAY_BY_VIDEO_ID: "ipc-play-by-video-id",
    PLAY_BY_VIDEO_DATA: "ipc-play-by-video-data",
    PLAY_BY_VIDEO_ONLINE: "ipc-play-by-video-online",
    GET_VIDEO_ITEM: "ipc-get-videoitem-data",
    GET_VIDEO_ITEM_REPLY: "ipc-get-videoitem-reply",

    SEARCH_TAG: "ipc-search-tag",
    LOAD_MYLIST: "ipc-load-mylist",
    ADD_DOWNLOAD_ITEM: "ipc-add-download-item",
    ADD_PLAY_HISTORY: "ipc-add-play-history",
    ADD_BOOKMARK: "ipc-add-bookmark",

    UPDATE_DATA: "ipc-update-data",
    RETURN_UPDATE_DATA: "ipc-return-update-data",
    CANCEL_UPDATE_DATA: "ipc-cancel-update-data",

    SHOW_PLAYER: "ipc-show-player",
    READY_PLAYER: "ipc-ready-player",
    SET_COOKIE: "ipc-set-cookie",
    IMPORT_NNDD_DB: "ipc-import-nndd-db",

    DELETE_LIBRARY_ITEMS: "ipc-delete-library-items",

    APP_CLOSE: "ipc-app-close",

    LOG_LEVEL: "ipc-log-level",

    RELOAD_CSS: "ipc-reload-css",
    MAIN_CSS_LOADED: "ipc-main-css-loaded",

    MAIN_TOASTR: "ipc-main-toastr",

    MAIN_HTML_LOADED: "ipc-main-html-loaded",
});

module.exports = {
    IPC_CHANNEL
};