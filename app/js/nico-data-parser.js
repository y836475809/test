
const cheerio = require("cheerio");

/**
 * 
 * @param {string} xml 
 */
function xml_comment(xml, is_owner) {
    let $ = cheerio.load(xml);

    let threads = [];
    $("thread").each((i, el) => {
        const item = $(el);
        const obj = {
            resultcode:parseInt(item.attr("resultcode")),
            thread:item.attr("thread"),
            server_time:parseInt(item.attr("server_time")),
            last_res:parseInt(item.attr("last_res")),
            ticket:item.attr("ticket"),
            revision:parseInt(item.attr("revision"))
        };
        if(is_owner){
            obj.fork = 1;
        }
        threads.push({thread:obj});
    });

    let comments = [];
    $("chat").each(function (i, el) {
        const item = $(el);
        if(!item.attr("deleted")){
            const content = item.text();
            const no = parseInt(item.attr("no"));
            const vpos = parseInt(item.attr("vpos"));
            const date = parseInt(item.attr("date"));
            
            const obj = {
                no: no,
                vpos: vpos,
                date: date,
                content: content
            };
            if(is_owner){
                obj.fork = 1;
            }
            const mail = item.attr("mail");
            if(mail){
                obj.mail = mail;
            }
            const user_id = item.attr("user_id");
            if(user_id){
                obj.user_id = user_id;
            }
            comments.push({chat:obj});
        }
    });

    return threads.concat(comments);
}

/**
 * 
 * @param {string} xml 
 */
function xml_thumb_info(xml) {
    let $ = cheerio.load(xml);

    const video_id = $("video_id").text();
    const title = $("title").text();
    const description = $("description").text();
    const thumbnail_url = $("thumbnail_url").text();
    const first_retrieve = $("first_retrieve").text();
    const length = $("length").text();
    const movie_type = $("movie_type").text();

    const size_high = parseInt($("size_high").text());
    const size_low = parseInt($("size_low").text());

    const view_counter = parseInt($("view_counter").text());
    const comment_num = parseInt($("comment_num").text());
    const mylist_counter = parseInt($("mylist_counter").text());
    const last_res_body = $("last_res_body").text();
    const watch_url = $("watch_url").text();
    const thumb_type = $("thumb_type").text();
    const embeddable = parseInt($("embeddable").text());
    const no_live_play = parseInt($("no_live_play").text());

    let tags = [];
    $("tag").each(function (i, el) {
        const item = $(el);
        const text = item.text();
        const lock = item.attr("lock");
        tags.push({ text: text, lock: lock == "1" ? true : false });
    });

    const user_id = $("user_id").text();
    const user_nickname = $("user_nickname").text();
    const user_icon_url = $("user_icon_url").text();

    return {
        video_id: video_id,
        title: title,
        description: description,
        thumbnail_url: thumbnail_url,
        first_retrieve: first_retrieve,
        length: length,
        video_type: movie_type,
        size_high: size_high,
        size_low: size_low,
        view_counter: view_counter,
        comment_counter: comment_num,
        mylist_counter: mylist_counter,
        last_res_body: last_res_body,
        watch_url: watch_url,
        thumb_type: thumb_type,
        embeddable: embeddable,
        no_live_play: no_live_play,
        tags: tags,
        user_id: user_id,
        user_nickname: user_nickname,
        user_icon_url: user_icon_url
    };
}

const json_comment = (json_str) => {
    const json_data = JSON.parse(json_str);
    
    const threads = json_data.filter(value => {
        return value.hasOwnProperty("thread");
    });

    const chats =  json_data.filter(value => {
        return value.hasOwnProperty("chat");
    }).filter(value => {
        return !value.chat.hasOwnProperty("deleted");
    });

    return threads.concat(chats);
};

const makeComments = (comment_data) => {
    const comments = comment_data.filter(value => {
        return value.hasOwnProperty("chat") && !value.chat.hasOwnProperty("deleted");
    }).map(value => {
        if(value.chat.hasOwnProperty("fork")){
            value.chat.user_id = "owner";
        }
        if(!value.chat.hasOwnProperty("mail")){
            value.chat.mail = "184";
        }
        return value.chat;
    });

    comments.sort((a, b) => {
        if (a.vpos < b.vpos) return -1;
        if (a.vpos > b.vpos) return 1;
        return 0;
    });
    return comments;
};

module.exports.xml_comment = xml_comment;
module.exports.xml_thumb_info = xml_thumb_info;
module.exports.json_comment = json_comment;
module.exports.makeComments = makeComments;