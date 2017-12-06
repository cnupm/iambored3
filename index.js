const cheerio = require('cheerio');
const request = require('request');
const util = require('util');
const iconv = require('iconv');

let args = process.argv.slice(2);

if(typeof args[0] === 'undefined'){
  console.log("empty url");
  return;
}

let vk_url = args[0];
let data = {};

let config = {
  url: vk_url,
  encoding: null,
  headers:{
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
    'Accept-Encoding': 'UTF-8',
    'Accept-Language': 'EN-us'
  }
}

request(config, (err, resp, body) => {
  if(err || resp.statusCode != 200){
    console.error('fetch failed: ' + err);
    return;
  }

  //translate reply body to UTF-8
  body = new Buffer(body, 'binary');
  let conv = new iconv.Iconv('windows-1251', 'utf8');
  let str = conv.convert(body).toString();

  
  $ = cheerio.load(str);
  data.name = $('.page_name').text();
  data.status = $('.page_current_info .current_text').text();
  data.online_status = $('.profile_time_lv').text() || $('.profile_online_lv').text();
  data.avatar = $('.page_avatar_img').attr('src');
  data.gifts = $('#gifts_module_count').text();

  //profile info
  let infos = $('.profile_info_row');
  data.infos = [];
  infos.each((idx, el) => {
    let item = {};
    item.title = $(el).children('.label.fl_l').text().replace(/:+$/, "").toLowerCase().replace(" ", "_");
    item.value = $(el).children('.labeled').text();
    data.infos.push(item);
  });

  //various couters
  let ctrs = $('.counts_module .page_counter');
  data.counters = [];
  ctrs.each((idx, c) => {
    let item = {};
    item.label = $(c).children('.label').text();
    item.value = $(c).children('.count').text();
    data.counters.push(item);
  });

  //modules
  let mods = $('.page_block .module');
  data.page_modules = [];
  mods.each((idx, m) => {
    let item = {};
    item.name = $(m).attr('id');
    item.count = $(m).find('.header_count').text();
    data.page_modules.push(item);
  });

  //wall posts
  let posts_data = $('.post_content');//.post.page_block.all.own');
  data.posts = [];
  posts_data.each((idx, p) => {
    let item = {};
    let pr = $(p).children('.post_info');
    item.title = pr.find('.wall_text').text();//.substr(1,5) + " (more) ..."; //skip full post text
    item.num_comments = pr.find('.wall_reply_text').length;
    item.likes = pr.find('.post_like_count._count').text();
    item.replies = [];

    //post replies
    let rp = pr.find('.reply_content');
    rp.each((cidx, cp) => {
      let reply = {};
      reply.author = $(cp).find('.author').attr('href');
      reply.text = $(cp).find('.wall_reply_text').text();//.substr(1,5) + "(more) ...";
      item.replies.push(reply);
    });

    data.posts.push(item);
  });

  let raw = JSON.stringify(data).replace(/\\n/g,'').replace(/ +(?= )/g,'');
  console.log(util.inspect(JSON.parse(raw), {depth: null, colors: true}))
});