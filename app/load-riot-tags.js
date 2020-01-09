
const load_player_rtags = (dir) => {
    [
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
    ].map(value => {
        return `${dir}/${value}`;
    }).forEach(value => {
        const script = document.createElement("script");
        script.type = "riot/tag";
        script.src = value;
        document.body.appendChild(script);
    });
};
module.exports = {
    load_player_rtags,
};
