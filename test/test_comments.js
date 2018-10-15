// @ts-check

let getRandom = (min, max)=>{
    return Math.floor(Math.random() * (max-min+1) + min);
};

let randomText = (min, max)=>{
    const s = "abcdefghijklmnopqrstuvwxyz0123456789()!?^あいうえおかきくけこさしすせそー";
    
    let cm = "";
    const cm_len = getRandom(min, max);
    for (let index = 0; index < cm_len; index++) {
        cm += s[getRandom(0, s.length-1)];
    }

    return cm;
};

module.exports.randomComments = function(cm_num, interval_ms){
    const interval_min = 200/10;
    const interval_max = interval_ms/10;
    const text_max = 30;

    let cms = [];
    cms.push({ no: 1, vpos: 0, text: randomText(1, text_max) });

    for (let index = 1; index < cm_num; index++) {
        const text = randomText(1, text_max);
        const interval = getRandom(interval_min, interval_max);
        const vpos = cms[cms.length-1].vpos + interval;
        cms.push({ no: index+1, vpos: vpos, text: text });
    }

    return cms;
};

module.exports.sampleComments = function(){
    return  [
        { no: 1, vpos: 0,    text: "あああああああああAAAああああ" },
        { no: 2, vpos: 143,  text: "いいいいいい" },
        { no: 3, vpos: 241,  text: "うううううううううううううう"},
        { no: 4, vpos: 274,  text: "ええええええええええ"},
        { no: 5, vpos: 362,  text: "おおおおおおおおおおおお" },
        { no: 6, vpos: 399,  text: "かかかかかかかかかかかかかかか" },
        { no: 7, vpos: 432,  text: "ききき" },
        { no: 8, vpos: 635,  text: "bbbbくくくくくくくくくくくくくくくく"},
        { no: 9, vpos: 712,  text: "けけけけけけ" },
        { no: 10, vpos: 743, text: "ここここここここここここここここここここここここここここここ" },
    ];
};