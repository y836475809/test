
const load_rtags = (rtags, dir) => {
    rtags.map(value => {
        return `${dir}/${value}`;
    }).forEach(value => {
        const script = document.createElement("script");
        script.type = "riot/tag";
        script.src = value;
        document.body.appendChild(script);
    });
};

const load_main_rtags = (dir) => {
    const rtags = [
        "main-page.tag",
        "accordion.tag",
        "pagination.tag",
        "modal-dialog.tag",
        "library-page.tag",
        "search-page.tag",
        "download-schedule-dialog.tag",
        "download-page.tag",
        "play-history.tag",
        "setting-page.tag",
        "mylist-page.tag",
        "bookmark-page.tag"
    ];
    load_rtags(rtags, dir);
};

const load_player_rtags = (dir) => {
    const rtags = [
        "player-main-page.tag",
        "modal-dialog.tag",
        "player-tags.tag",
        "player-seek.tag",
        "player-volume.tag",
        "player-controls.tag",
        "player-video.tag",
        "player-page.tag",
        "player-viewinfo-page.tag",
        "comment-setting-dialog.tag",
        "comment-ng-setting.tag",
        "comment-display-setting.tag",
        "open-video-form.tag"
    ];
    load_rtags(rtags, dir);
};

module.exports = {
    load_main_rtags,
    load_player_rtags,
};
