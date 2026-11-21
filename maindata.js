"use strict";
const str_not_found_text =
`
<ul>
<li><a href="%{onepage}#apple">[apple]を表示</a></li>
<li><a href="%{onepage}#index_abc">アルファベット順の一覧を表示</a></li>
<li><a href="%{onepage}#index_kana">カタカナ順の一覧を表示</a></li>
<li><a href="%{onepage}#special_q_xxx">フリー全文検索</a></li>
<li><a href="%{onepage}#special_q_アル">[アル]を全文検索</a></li>
<li><a href="%{onepage}#special_ql_appla">[appla]をあいまい検索</a></li>
<li><a href="%{onepage}#special_tag_分類:フルーツ">備考タグ[分類:フルーツ]検索</a></li>
<li><a href="%{onepage}#special_tag_品詞:形容動詞">備考タグ[品詞:形容動詞]検索</a></li>
<li><a href="%{onepage}#special_tag_構成:xxx-or">備考タグ[構成:xxx-or]検索</a></li>
<li><a href="%{onepage}#special_group_分類">備考グループ[分類]検索</a></li>
<li><a href="%{onepage}#special_group_品詞">備考グループ[品詞]検索</a></li>
<li><a href="%{onepage}#special_group_構成">備考グループ[構成]検索</a></li>
</ul>
`;
(function () {
  const dict = dict_text.replaceAll(/\r\n/g, '\n')
    .replaceAll(/■x(?=■)/g, '■')
    .replaceAll(/\[([a-z0-9\-_']+)\]\(\)/g, '[$1]($1)')
    .replaceAll(/\[%([a-z0-9\-_']+)\]\(/g, '$1 [$1](')
    .split('\n').map((item) => item.split('■'));
  const dict_map = new Map();
  const fl_id = 0;
  const fl_hash = 8;
  const fl_enwd = 9;
  const fl_jawd = 1;
  const fl_mean = 2;
  const fl_link = 3;
  const fl_wlst = 4;
  const fl_typo = 5;
  const fl_rmrk = 6;
  const fl_hidden = 7;
  const NAME_ONE_PAGE = 'one_page.html';
  const NAME_DEBUG_PAGE = 'debug_page.html';

  let is_enable = true;
  let is_link_onepage = true;
  let str_target = NAME_ONE_PAGE;
  let debug_mode = false;
  {
    const myname = location.pathname.split('/').pop() || 'index.html';
    const disable_list = [
      'use_history.html',
      'index.html'
    ];
    if (disable_list.includes(myname)) {
      is_enable = false;
    }
    if (myname === NAME_ONE_PAGE) {
      is_link_onepage = false;
    }else if (myname === NAME_DEBUG_PAGE) {
      debug_mode = true;
      str_target = NAME_DEBUG_PAGE;
    }
  }
  const text_onepage = is_link_onepage ? str_target : '';
  const not_found_text = str_not_found_text.replaceAll('%{onepage}', text_onepage);

  let debug_text ='';
  {
    let prev = null;
    dict.forEach((item) => {
      if (item) {
        prev = item;
      }else{
        if (prev) {
          debug_text += prev + ':空要素検出\n';
        }
        prev = null;
      }
    });
  }
  const $ = (id) => {
    return document.getElementById(id);
  }
  const HISTORY_KEY = 'pageHistoryEn';
  const DISABLED_KEY = 'pageHistoryEnDisabled';
  const MAX_ITEMS = 20;
  const EXCEPTIONS = [
    'use_history.html',
    'index_abc.html',
    'index_kana.html',
    'index.html'
  ];

  const kana_map = {
    'ｱ':'ア','ｲ':'イ','ｳ':'ウ','ｴ':'エ','ｵ':'オ',
    'ｶ':'カ','ｷ':'キ','ｸ':'ク','ｹ':'ケ','ｺ':'コ',
    'ｻ':'サ','ｼ':'シ','ｽ':'ス','ｾ':'セ','ｿ':'ソ',
    'ﾀ':'タ','ﾁ':'チ','ﾂ':'ツ','ﾃ':'テ','ﾄ':'ト',
    'ﾅ':'ナ','ﾆ':'ニ','ﾇ':'ヌ','ﾈ':'ネ','ﾉ':'ノ',
    'ﾊ':'ハ','ﾋ':'ヒ','ﾌ':'フ','ﾍ':'ヘ','ﾎ':'ホ',
    'ﾏ':'マ','ﾐ':'ミ','ﾑ':'ム','ﾒ':'メ','ﾓ':'モ',
    'ﾔ':'ヤ','ﾕ':'ユ','ﾖ':'ヨ',
    'ﾗ':'ラ','ﾘ':'リ','ﾙ':'ル','ﾚ':'レ','ﾛ':'ロ',
    'ﾜ':'ワ','ｦ':'ヲ','ﾝ':'ン',
    'ｧ':'ァ','ｨ':'ィ','ｩ':'ゥ','ｪ':'ェ','ｫ':'ォ',
    'ｯ':'ッ','ｬ':'ャ','ｭ':'ュ','ｮ':'ョ','ｰ':'ー'
  };
  const kana_dakuten = {
    'カ':'ガ','キ':'ギ','ク':'グ','ケ':'ゲ','コ':'ゴ',
    'サ':'ザ','シ':'ジ','ス':'ズ','セ':'ゼ','ソ':'ゾ',
    'タ':'ダ','チ':'ヂ','ツ':'ヅ','テ':'デ','ト':'ド',
    'ハ':'バ','ヒ':'ビ','フ':'ブ','ヘ':'ベ','ホ':'ボ',
    'ウ':'ヴ'
  };
  const kana_handaku = {
    'ハ':'パ','ヒ':'ピ','フ':'プ','ヘ':'ペ','ホ':'ポ'
  };
  const historyDiv = $('history');
  const fn_trim_max = (text, max) => {
    return max < text.length ? text.substr(0,max) + '..' : text;
  }
  const fn_full_katakana = (text) => {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (kana_map[c]) {
        const next = text[i + 1];
        const base = kana_map[c];
        if (next === 'ﾞ' && kana_dakuten[base]) {
          result += kana_dakuten[base];
          i++;
        } else if (next === 'ﾟ' && kana_handaku[base]) {
          result += kana_handaku[base];
          i++;
        } else {
          result += base;
        }
      } else if (c === 'ﾞ') {
        result += '゛';
      } else if (c === 'ﾟ') {
        result += '゜';
      } else {
        result += c;
      }
    }
    return result;
  }
  const fn_hira_kata = (text) => {
    return text.replaceAll(/[\u3041-\u3096]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
  }
  const fn_id_to_hash = (id_text) => {
    return id_text.replaceAll(/'/g,'%27').toLowerCase();
  }
  const fn_id_to_enword = (id_text) => {
    return id_text.replaceAll(/_/g, ' ');
  }
  const make_cache = () => {
    dict.forEach((item, index) => {
      const mark = '●';
      const pos = item[fl_id].indexOf(mark);
      const s = item[fl_id];
      let hash;
      if (pos === -1) {
        hash = fn_id_to_hash(s);
        dict[index][fl_enwd] = fn_id_to_enword(s);
      } else {
        hash = fn_id_to_hash(s.substr(0, pos));
        dict[index][fl_enwd] = fn_id_to_enword(s.substr(pos + mark.length));
      }
      dict[index][fl_hash] = hash;
      dict_map.set(hash, item);
    });
  }
  make_cache();
  const fn_list_to_br = (text) => {
    return text.replaceAll(/　/g, '<br>')
      .replaceAll(/  /g, '<br>');
  }
  const fn_list_to_br2 = (text) => {
    return text.replaceAll(/  /g, '<br>');
  }
  const fn_list_to_br4 = (text) => {
    return text.replaceAll(/  /g, '　');
  }
  const fn_list_markup = (text) => {
    return text.replaceAll('●','')
      .replaceAll(/\[#c\]\(([a-z]+)\)/g, '色:<span style="color:$1; border: 1px black solid;background-color:white;">⬛⬛⬛</span>')
      .replaceAll(/\[([a-z0-9_.\-']+)\]\(([^()\[\]\r\n<>]+)\)/g, (match, id, name) => {
      const deadlink = dict_map.has(id) ? '' : ' class="deadlink"';
      return '<a href="#' + (id) + '"' + deadlink + '>' + name + '</a>';
    });
  }
  const fn_delete_markup = (text) => {
    return text.replaceAll('●','')
      .replaceAll(/\[#c\]\(([a-z]+)\)/g, '')
      .replaceAll(/\[([a-z0-9_.\-']+)\]\(([^()\[\]\r\n<>]+)\)/g, (match, id, name) => {
      return name;
    });
  }
  const fn_delete_markup2 = (text) => {
    return text.replaceAll('●','　')
      .replaceAll(/\[#c\]\(([a-z]+)\)/g, '')
      .replaceAll(/\[([a-z0-9_.\-']+)\]\(([^()\[\]\r\n<>]+)\)/g, (match, id, name) => {
      return name;
    });
  }
  const fn_deadlink_markup = (text) => {
    let out = [];
    text.replaceAll(/\[([a-z0-9_.\-']+)\]\(([^()\[\]\r\n<>]+)\)/g, (match, id, name) => {
      const deadlink = dict_map.has(id);
      if (!deadlink) {
        out.push([id, name]);
      }
      return '';
    });
    return out;
  }
  const fn_list_query = (text) => {
    return text.replaceAll(/(分類|構成|品詞):([^　 \t\r\n'"`<>()\[\]]+)/g, '<a href="#special_tag_$1:$2">$1:$2</a>');
  }
  const fn_list_to_brlink = (text) => {
    return fn_list_markup(fn_list_to_br(text));
  }
  const fn_list_to_br2link = (text) => {
    return fn_list_markup(fn_list_to_br2(text));
  }
  const fn_list_to_br3link = (text) => {
    return fn_list_query(fn_list_markup(fn_list_to_br2(text)));
  }
  const fn_trim = (text) => {
    return (text.trim()
      .replaceAll(/[\t]/g, '')
      .replaceAll(/[ 　＿]/g, '_')
      .replaceAll(/_+/g, '_')
      .replaceAll(/\xFE0F/g, '') // 絵文字セレクター
      .replaceAll(/\xFE0E/g, '')// 絵文字セレクター
      .toLowerCase());
  }
  const fn_text_to_hash = (text) => {
    const q = fn_trim(text);
    const hit0 = dict_map.get(q);
    if (hit0) {
      return hit0[fl_hash];
    }
    const q1 = '　' + q + '　';
    const hit1 = dict.find(item => ('　' + item[1].replaceAll(/●/g, '　') + '　').includes(q1));
    if (hit1) {
      return hit1[fl_hash];
    }
    const fn_kick = (text) => {
      return text.replaceAll(/(ー?)・/g, '');
    }
    if (2 <= q.length && q.endsWith('ー')) {
      const q_dash = '　' + q.substr(0, q.length - 1) + '　';
      const hit1_dash = dict.find(item => ('　' + fn_kick(item[1]).replaceAll(/●/g, '　') + '　').includes(q_dash));
      if (hit1_dash) {
        return hit1_dash[fl_hash];
      }
    }
    const fn_key1 = (text) => {
      return fn_hira_kata(fn_kick(text));
    }
    const fn_key2 = (text) => {
      return fn_full_katakana(text);
    }
    const fn_1 = (text) => {
      return fn_delete_markup(fn_list_to_br4(fn_kick(text)));
    }
    const fn_2 = (text) => {
      return fn_delete_markup2(fn_list_to_br4(fn_kick(text)));
    }
    const q2 = '　' + fn_key1(q) + '　';
    const hit2 = dict.find(item => ('　' + fn_1(item[2]) + '　' + fn_2(item[2]) + '　').includes(q2));
    if (hit2) {
      return hit2[fl_hash];
    }
    const q2_2 = fn_key2(q2);
    const hit2_2 = dict.find(item => ('　' + fn_1(item[2]) + '　' + fn_2(item[2]) + '　').includes(q2));
    if (hit2_2) {
      return hit2_2[fl_hash];
    }
    const hit3 = dict.find(item => ('　' + fn_1(item[3]) + '　' + fn_2(item[3]) + '　').includes(q2));
    if (hit3) {
      return hit3[fl_hash];
    }
    const hit3_2 = dict.find(item => ('　' + fn_1(item[3]) + '　' + fn_2(item[3]) + '　').includes(q2_2));
    if (hit3) {
      return hit3_2[fl_hash];
    }
    return '';
  }
  const enter_search = () => {
    const hash = fn_text_to_hash($('searchtext').value);
    if (hash !== '') {
      suggest_box.style.display = 'none';
      location.hash = hash;
    }
  }
  const fn_show = (id) => {
//    console.log(id);
    window.scrollTo(0, 0);
    let query = '';
    let tag = '';
    let group = '';
    let is_backsort = false;
    let is_likesearch = false;
    let is_group2 = false;
    let id2 = id;
    if (id.startsWith('special_')) {
      if (id.startsWith('special_q')) {
        let param = id.substr(9);
        let hoge = param.replace(/^[^_]*?_/, '');
        let q2l = (param.match(/^[^_]*?_/) || ['_'])[0];
        // special_q_hoge
        // special_q2_hoge
        // special_ql_hoge
        // special_q2l_hoge
        is_backsort = q2l.includes('2') ? true : false;
        is_likesearch = q2l.includes('l') ? true : false;
        const q = query = decodeURIComponent(hoge);
        if (q.match(/[<>#\[\]\{\}()\|+\*\?&"]/)) {
          id2 = query = '';
        }
      } else if (id.startsWith('special_tag_')) {
        const q = tag = decodeURIComponent(id.substr(12));
        if (q.match(/[<>#\[\]\{\}()\|+\?\*&"]/)) {
          id2 = tag = '';
        }
      } else if (id.startsWith('special_group_')) {
        const q = group = decodeURIComponent(id.substr(14));
        if (q.match(/[<>#\[\]\{\}()\|+\?\*&"]/)) {
          id2 = group = '';
        }
      } else if (id.startsWith('special_group2_')) {
        const q = group = decodeURIComponent(id.substr(15));
        is_group2 = true;
        if (q.match(/[<>#\[\]\{\}()\|+\?\*&"]/)) {
          id2 = group = '';
        }
      }
    }
    const item = ((id2 === '') ? null : dict_map.get(id));
    let text_enword;
    let text_title;
    let is_index = false;
    let is_index_kana = false;
    let index_page = 0;
    let index_field = '';
    const list_kana_name = ['aa','ai','au','ae','ao', 'ka','ki','ku','ke','ko', 'sa','si','su','se','so', 'ta','ti','tu','te','to', 'na','ni','nu','ne','no',
          'ha','hi','hu','he','ho', 'ma','mi','mu','me','mo', 'ya','yu','yo', 'ra','ri','ru','re','ro', 'wa','xa', 'all'];
    const list_abc_name = 'abcdefghijklmnopqrstuvwxyz@'.split('');
    {
      list_abc_name.push('all');
      const str_index_kana = 'index_kana';
      let str_index_xxx = str_index_kana;
      let list_xxx = list_kana_name;
      if (id.startsWith(str_index_kana)) {
        is_index_kana = true;
      }else{
        str_index_xxx = 'index_abc';
        list_xxx  = list_abc_name;
      }
      if (id.startsWith(str_index_xxx)) {
        is_index = true;
        if (id.startsWith('_', str_index_xxx.length)) {
          list_xxx.forEach((param, index1) => {
            if (id.startsWith(param, str_index_xxx.length + 1)) {
              index_page = index1;
              // index_kana_ai1 index_abc_b2
              index_field = id.charAt(str_index_xxx.length + param.length + 1);
              if(index_field.match(/[^2-9]/)){
                index_field = '';
              }
            }
          });
        }
      }
    }
    if (item) {
      $('bodypart').style.display = 'block';
      text_enword = item[fl_enwd];
      $('bodypart2').innerHTML = '';
    } else if (is_index) {
      text_enword = 'abc一覧表示';
      if (is_index_kana) {
        text_enword = 'カナ一覧表示';
      }
      $('bodypart').style.display = 'none';
    } else if (query !== '') {
      $('bodypart').style.display = 'none';
      if (query === 'xxx') {
        text_enword = '検索';
      }else{
        text_enword = '検索＝' + query;
      }
    } else if (tag !== '') {
      $('bodypart').style.display = 'none';
      text_enword = 'タグ＝' + tag;
    } else if (group !== '') {
      $('bodypart').style.display = 'none';
      text_enword = 'グループ＝' + group;
    } else {
      const id3 = (id2 !== '' ? id2 : 'hooooo');
      text_enword = '見つかりません';
      $('bodypart').style.display = 'none';
      let add_str = '<div><a href="#special_q_' + id3 + '">' + id3 +'</a> で全文検索</div>';
      add_str += '<div><br><a href="https://www.google.com/search?q=' + id3 + '">' + id3 +'</a> でgoogle検索(外部送信)</div>';
      add_str += not_found_text;
      $('bodypart2').innerHTML = add_str;
    }
    text_title = '[' + text_enword + '] - 辞書 - 小説誤字fix(js)';
    document.title = text_title;
    $('enword').textContent  = text_enword;
    if (item) {
      let dict_idx = 0;
      for(let idx = 0; idx < dict.length; idx++) {
        if (dict[idx][fl_hash] === id) {
          dict_idx = idx;
          break;
        }
      }
      const prev = ((0 < dict_idx) ?
        ('前：<a href="#' + dict[dict_idx-1][fl_hash] + '">' + dict[dict_idx-1][fl_enwd] + '</a>　　') : '');
      const next = ((dict_idx + 1 < dict.length) ?
        ('次：<a href="#' + dict[dict_idx+1][fl_hash] + '">' + dict[dict_idx+1][fl_enwd] + '</a>  ') : '');
      const prev_next = '<hr><div>' + prev + next + '</div>';
      $('jaword').innerHTML    = fn_list_to_br2link(item[1]);
      $('means').innerHTML     = fn_list_to_br2link(item[2]);
      $('links').innerHTML     = item[3] ? fn_list_to_br2link(item[3]) : ''; // '――';
      $('wordlist').innerHTML  = item[4] ? fn_list_to_br2link(item[4]) : ''; // '――';
      $('typo').innerHTML      = item[5] ? fn_list_to_br2link(item[5]) : ''; // '――';
      const text_remarks =       item[6] ? fn_list_to_br3link(item[6]) : '';
      $('remarks').innerHTML   = text_remarks + prev_next;
    }else{
      if (is_index) {
        let text_list = '';
        let text_head = '<div><a href="#special_q_xxx">全文検索</a></div>' + 
          '<h2 class="wordlisthead">単語一覧</h2><div class="wordlistbody">';
        let text_page = '';
        let count = 0;
        const list_kana = [
          'ア','イ','ウ','エ','オ','カガ','キギ','クグ','ケゲ','コゴ','サザ','シジ','スズ','セゼ','ソゾ',
          'タダ','チヂ','ツヅ','テデ','トド','ナ','ニ','ヌ','ネ','ノ',
          'ハバパ','ヒビピ','フブプヴ','ヘベペ','ホボポ','マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワヰヱヲン','その他', 'all'];
        const list_abc = list_abc_name.slice();
        list_abc[list_abc.length - 2] = 'その他';
        const list_page_name = is_index_kana ? list_kana_name : list_abc_name;
        const list_page_text = is_index_kana ? list_kana : list_abc;
        if (is_index_kana) {
          text_head += '<div><a href="#index_abc">アルファベット順に切替</a></div>';
        }else{
          text_head += '<div><a href="#index_kana">カナ順に切替</a></div>';
        }
        let dict_filter = [];
        {
          const fn_char_head = is_index_kana ?
              ((item) => { return item[fl_jawd].charAt(0) })
            : ((item) => { return item[fl_hash].charAt(0) });
          if(list_page_name[index_page] === (is_index_kana ? 'xa' : '@')){
            for(const item1 of dict) {
              let is_list = false;
              for (const top_char of list_page_text) {
                if (top_char.includes(fn_char_head(item1))){
                  is_list = true;
                  break;
                }
              }
              if (is_list === false) {
                dict_filter.push(item1);
              }
            }
          } else if(list_page_name[index_page] === 'all') {
            dict_filter = dict.slice();
          }else{
            for(const item2 of dict){
              if (list_page_text[index_page].includes(fn_char_head(item2))){
                dict_filter.push(item2);
              }
            }
          }
          const index__ = index_field == '' ? 0 : parseInt(index_field);
          const hn_af_index = (item, idx) => {
            if((index__ === idx) && item[idx]){
              text_list += '　' + fn_delete_markup(item[idx]);
            }
          }
          const fn_add_field = (item) => {
            if(index__ != 0){
              text_list += '■';
            }
            hn_af_index(item, 2);
            hn_af_index(item, 3);
            hn_af_index(item, 4);
            hn_af_index(item, 5);
            hn_af_index(item, 6);
            hn_af_index(item, 7);
          }
          count = dict_filter.length;
          if(is_index_kana){
            const collator = new Intl.Collator('ja');
            dict_filter.sort((a, b) => collator.compare(fn_delete_markup(a[1]), fn_delete_markup(b[1])));
            dict_filter.forEach(item => {
              text_list += fn_delete_markup(item[fl_jawd]) + '　<a href="#' + item[fl_hash] + '">' + item[fl_enwd] + '</a>';
              fn_add_field(item);
              text_list += '<br>';
            });
          }else{
            dict_filter.forEach(item => {
              text_list += '<a href="#' + item[fl_hash] + '">' + item[fl_enwd] + '</a>　' + fn_delete_markup(item[fl_jawd]);
              fn_add_field(item);
              text_list += '<br>';
            });
          }
          text_page = '<div class="pageguide">';
          text_page += '<div style="margin-top:1em; margin-bottom:1em">';
          if(is_index_kana){
            text_page += '<div style="margin-top:1em; margin-bottom:1em">';
            text_page +=   '<a href="#index_kana_aa' + index_field + '">ア</a>';
            text_page +=   '<a href="#index_kana_aa' + index_field + '">ア</a>';
            text_page += '　<a href="#index_kana_ka' + index_field + '">カ</a>';
            text_page += '　<a href="#index_kana_sa' + index_field + '">サ</a>';
            text_page += '　<a href="#index_kana_ta' + index_field + '">タ</a>';
            text_page += '　<a href="#index_kana_na' + index_field + '">ナ</a>';
            text_page += '</div>';
            text_page += '<div style="margin-top:1em; margin-bottom:1em">';
            text_page +=   '<a href="#index_kana_ha' + index_field + '">ハ</a>';
            text_page += '　<a href="#index_kana_ma' + index_field + '">マ</a>';
            text_page += '　<a href="#index_kana_ya' + index_field + '">ヤ</a>';
            text_page += '　<a href="#index_kana_ra' + index_field + '">ラ</a>';
            text_page += '　<a href="#index_kana_wa' + index_field + '">ワ</a>';
            text_page += '　<a href="#index_kana_xa' + index_field + '">他</a>';
            text_page += '　<a href="#index_kana_all' + index_field + '">all</a>';
          }else{
            text_page +=   '<a href="#index_abc_a' + index_field + '">abc</a>';
            text_page += '　<a href="#index_abc_d' + index_field + '">def</a>';
            text_page += '　<a href="#index_abc_g' + index_field + '">ghi</a>';
            text_page += '　<a href="#index_abc_j' + index_field + '">jkl</a>';
            text_page += '　<a href="#index_abc_m' + index_field + '">mno</a>';
            text_page += '</div>';
            text_page += '<div style="margin-top:1em; margin-bottom:1em">';
            text_page +=   '<a href="#index_abc_p' + index_field + '">pqr</a>';
            text_page += '　<a href="#index_abc_s' + index_field + '">stu</a>';
            text_page += '　<a href="#index_abc_v' + index_field + '">vwx</a>';
            text_page += '　<a href="#index_abc_y' + index_field + '">yz</a>';
            text_page += '　<a href="#index_abc_@' + index_field + '">他</a>';
            text_page += '　<a href="#index_abc_all' + index_field + '">all</a>';
          }
          text_page += '</div>';
          let temp__ = '';
          const fn_hash = (diff) => {
            const hash = list_page_name[index_page + diff] + temp__;
            return hash;
          }
          const fn_text = (diff,index) => {
            const text = list_page_text[index_page + diff];
            if (text === 'その他') {
              return text;
            }
            if (text === 'all') {
              return text;
            }
            return text.charAt(0);
          }
          const hash_haed = is_index_kana ? '#index_kana_' : '#index_abc_';
          text_page += '</div><div style="margin-top:1em; margin-bottom:1em">';
          text_page += '<a href="' + hash_haed + fn_hash(0) +  '">通常</a>';
          text_page += '　<a href="' + hash_haed + fn_hash(0) + '2">02</a>';
          text_page += '　<a href="' + hash_haed + fn_hash(0) + '3">03</a>';
          text_page += '　<a href="' + hash_haed + fn_hash(0) + '4">04</a>';
          text_page += '　<a href="' + hash_haed + fn_hash(0) + '5">05</a>';
          text_page += '　<a href="' + hash_haed + fn_hash(0) + '6">06</a>';
          text_page += '</div><div style="margin-top:1em; margin-bottom:1em">';
          temp__ = index_field;
          if (0 <= index_page - 1) {
            text_page += '　<a href="' + hash_haed + fn_hash(-1) + '">&lt;[' + fn_text(-1) + ']</a> ';
          }else{
            text_page += '&lt;先頭';
          }
          text_page += ' ■■' + fn_text(0) + '■■ ';
          if (index_page + 1 < list_page_name.length) {
            text_page += '<a href="' + hash_haed + fn_hash(1) + '">[' + fn_text(1) + ']&gt;</a>';
          }else{
            text_page += '末尾&gt;';
          }
          text_page += '</div>';
          text_list = text_head +  text_page + '<hr>' + text_list + '<hr>' + text_page;
        }
        text_list += '</div><p>' + count + '件</p>';
        $('bodypart2').innerHTML = text_list;
      } else if (query !== '') {
        let is_moved = false;
        let query2 = (query === 'xxx') ? '' : query;
        {
          let text_list = '';
          const text_query = (query2 !== '' ? ('[' + query2 + ']') : '');
          text_list += '<h2 class="wordlisthead">検索' + text_query + '</h2><div class="wordlistbody">';
          let count = 0;
          let hits = 0;
          text_list += '<div class="allform"><div class="box-button"><input type="text" id="allquery" value="' + query2 + '" placeholder="apple"><button id="allsearch">全文検索</button></div>';
          let text_one = is_backsort ? ' checked' : '';
          let text_like = is_likesearch ? ' checked' : '';
          text_list += '<input type="checkbox" id="backsort" ' + text_one + ' value="1">';
          text_list += '<label for="backsort">逆順に表示</label><br>';
          text_list += '<input type="checkbox" id="likesearch" ' + text_like + ' value="1">';
          text_list += '<label for="likesearch">簡易あいまい検索</label>';
          text_list += '</div><hr>';
          if (query2 !== '') {
            const fn_del_x = (text) => {
              if (text === 'x') { return '' }
              return fn_delete_markup(text.replaceAll(/([　●]|  )/g, ''));
            };
            const fn_replace_like = (text) => {
              return (text
                .replaceAll('e', 'a')
                .replaceAll('aa', 'a')
                .replaceAll('oo', 'o')
                .replaceAll('r', 'l')
                .replaceAll('mm', 'm')
                .replaceAll('ss', 's')
                .replaceAll('ll', 'l')
                .replaceAll('pp', 'p')
                .replaceAll('nm', 'm')
                .replaceAll('ー', '')
                .replaceAll('ヴァ', 'バ')
                .replaceAll('ヴィ', 'ビ')
                .replaceAll('ヴゥ', 'ブ')
                .replaceAll('ヴェ', 'ベ')
                .replaceAll('ヴォ', 'ボ')
                .replaceAll('ヴ', 'ブ')
                .replaceAll('ァ', 'ア')
                .replaceAll('ィ', 'イ')
                .replaceAll('ゥ', 'ウ')
                .replaceAll('ェ', 'エ')
                .replaceAll('ォ', 'オ')
                .replaceAll('ヲ', 'オ')
                .replaceAll('ッ', 'ツ')
                );
            };
            const query3 = fn_replace_like(query2);
            const fn_list_up = (item) => {
              count++;
              const hash = item[fl_hash];
              const target = (hash + ';' + item[1] + ';' + item[2] + ';' + 
                (item[3] ? (fn_del_x(item[3]) + ';') : '') +
                (item[4] ? (fn_del_x(item[4]) + ';') : '') +
                (item[5] ? (fn_del_x(item[5]) + ';') : '') +
                (item[6] ? (fn_del_x(item[6]) + ';') : '') +
                (item[7] ? (item[7]) : ''));
              const fn_add_item = () => {
                hits++;
                text_list += '<a href="#' + hash + '">' + item[fl_enwd] + '</a>　' + fn_delete_markup(item[1]) + '<br>';
              };
              if (is_likesearch) {
                if (fn_replace_like(target).includes(query3)){
                  fn_add_item();
                }
              } else {
                if (target.includes(query2)){
                  fn_add_item();
                }
              }
            };
            if (is_backsort) {
              const dict_rev = dict.toReversed();
              dict_rev.forEach(fn_list_up);
            }else{
              dict.forEach(fn_list_up);
            }
            text_list += '</div><p>' + hits + ' / ' + count + '件</p>';
            if (hits === 0) {
              text_list += '<p>こちらのリストからも探せます</p>' + not_found_text;
            }
          } else {
            text_list += '</div><p>こちらのリストからも探せます</p>';
            text_list += not_found_text;
          }
          $('bodypart2').innerHTML = text_list;
          const fn_search_query = () => {
            const value = $('allquery').value;
            const value_fix = value.replaceAll(/["*+<>&]+/g, '');
            const special_2 = $('backsort').checked ? '2' : '';
            const special_l = $('likesearch').checked ? 'l' : '';
            const special__ = special_2 + special_l;
            if (value_fix !== ''){
              location.hash = 'special_q' + special__ + '_' + value_fix;
            }
          };
          $('allsearch').addEventListener("click", fn_search_query);
          $('allquery').addEventListener("keydown", (event) => {
            if (event.isComposing || event.keyCode === 229) {
              return;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              fn_search_query();
            }
          });
        }
      } else if (tag !== '') {
        let text_list = '';
        text_list += '<h2 class="wordlisthead">タグ[' + tag + ']</h2><div class="wordlistbody">';
        let count = 0;
        let hits = 0;
        let map = new Map();
        let key = '　'+ tag + '　';
        dict.forEach(item => {
          count++;
          const target = (
            (item[6] ? ('　' + (item[6].replaceAll(/  /g,'　')) + '　') : '') +
            (item[7] ? ('　' + (item[7].replaceAll(/  /g,'　')) + '　') : ''));
          if (target.includes(key)) {
            hits++;
            text_list += '<a href="#' + item[fl_hash] + '">' + item[fl_enwd] + '</a>　' + fn_delete_markup(item[1]) + '<br>';
          }
        });
        text_list += '</div><p>' + hits + '件 / 総データ' + count + '件</p>';
        $('bodypart2').innerHTML = text_list;
      } else if (group !== '') {
        let text_list = '';
        text_list += '<h2 class="wordlisthead">グループ[' + group + ']</h2><div class="wordlistbody">';
        if (is_group2) {
          text_list += '<a href="#special_group_' + group + '">タグ名でソートする</a><br><br>';
        }else{
          text_list += '<a href="#special_group2_' + group + '">件数でソートする</a><br><br>';
        }
        let count = 0;
        let hits = 0;
        let map = new Map();
        let regex_group = group.replaceAll(/[\-+\[\]\{\}]/g,'\\$1');
        let key = '　('+ regex_group + ':([^<>()　 \t]+))　';
        let re_key = new RegExp(key);
        dict.forEach(item => {
          count++;
          const target = (item[6] ? ('　' + item[6] + '　') : '');
          const ret = target.match(re_key);
          if (ret) {
            if (!map.has(ret[1])) {
              hits++;
              map.set(ret[1], 1);
            }else{
              const c = map.get(ret[1]) + 1;
              map.set(ret[1], c);
            }
          }
        });
        const sort_list = [];
        map.forEach((value, tag) => sort_list.push({value:value, tag:tag}));
        if (is_group2) {
          sort_list.sort((a, b) => {return parseInt(b.value) - parseInt(a.value)});
        }else {
          const collator = new Intl.Collator('ja');
          sort_list.sort((a, b) => collator.compare(a.tag, b.tag));
        }
        sort_list.forEach((item) => {
          text_list += '<a href="#special_tag_' + item.tag + '">' + item.tag + '</a>　' + item.value + '件<br>';
        });
        text_list += '</div><p>' + hits + 'グループ / 総データ' + count + '件</p>';
        $('bodypart2').innerHTML = text_list;
      }
    }
    const page_match = document.title.match(/\[(.+)\]/);
    const page = page_match ? page_match[1] : location.href;
    fn_add_history(location.href, page);
  }
  const update = () => {
    const id = location.hash.slice(1); // #apple → apple
    if (id) {
      fn_show(id);
      fn_render_history();
    }
  }
  if(is_enable){
    window.addEventListener("hashchange", update);
    window.addEventListener("load", update);
    $('btnsearch').addEventListener("click", enter_search);
  }
  const suggest_box = $('suggest');
  const fn_show_suggestions = (query) => {
    if (!query || query.length < 1) {
      suggest_box.style.display = 'none';
      return;
    }
    const q = fn_hira_kata(fn_full_katakana(query.toLowerCase().replaceAll(/・/g, '')));
    const results = [];
    for (const item of dict) {
      const id = item[fl_id];
      const ja = item[1];
      const mean = item[2].replaceAll(/・/g, '');
      const target = (id + ' ' + ja + ' ' + mean).toLowerCase();
      if (target.includes(q)) {
        results.push(item);
        if (results.length >= 12) break;
      }
    }
    if (results.length === 0) {
      suggest_box.style.display = 'none';
      return;
    }
    let html = '';
    results.forEach(item => {
      const en = item[fl_enwd];
      const kana = fn_trim_max(item[1].split('　')[0], 10);
      const ja = fn_trim_max(fn_delete_markup(item[2]).split('　')[0], 5);
      html += `<div data-id="${item[fl_hash]}"><span class="en">${en}</span><span class="ja">${kana}: ${ja}</span></div>`;
    });
    suggest_box.innerHTML = html;
    suggest_box.style.display = 'block';
  }
  if (is_enable) {
    suggest_box.addEventListener('click', e => {
      const div = e.target.closest('div[data-id]');
      if (!div) return;
      location.hash = div.dataset.id;
      suggest_box.style.display = 'none';
      $('searchtext').value = '';
    });
    $('searchtext').addEventListener('input', e => {
      fn_show_suggestions(e.target.value.trim());
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.searchbox')) {
        suggest_box.style.display = 'none';
      }
    });
    $('searchtext').addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        suggest_box.style.display = 'none';
      }
    });
  }

  const id = is_enable ? location.hash.slice(1) : false; // #apple → apple
  if (id) {
    fn_show(id);
  } else {
      $('bodypart').style.display = 'none';
      $('bodypart2').innerHTML = not_found_text;
  }

  const fn_my_all_test = () => {
    let deadlink_list = new Set();
    let double_list = new Set();
    dict.forEach((item) => {
      let hash = fn_id_to_hash(item[fl_hash]);
      if (double_list.has(hash)) {
        debug_text += item[0] + ':[0]重複登録\n';
      }
      double_list.add(hash);
      if (item[0].includes(' ')) {
        debug_text += item[0] + ':[0]半角スペース\n';
      }
      let c = item[0].match(/[^a-zA-Z0-9_.'\-\[\]●]/);
      if (c) {
        debug_text += item[0] + '[' + c + ']:[0]範囲外文字\n'
      }
      const fn_text_item = (x) => {
        if (item[x]) {
          const text = fn_delete_markup(item[x]);
          if (text.includes('](')) {
            debug_text += item[0] + ':[' + x + ']マークアップ不正1\n'
          }
          if (text.includes(')[')) {
            debug_text += item[0] + ':[' + x + ']マークアップ不正2\n'
          }
          if (text.includes(']()')) {
            debug_text += item[0] + ':[' + x + ']マークアップ不正3\n'
          }
          if (text.includes(':(')) {
            debug_text += item[0] + ':[' + x + ']マークアップ不正4\n'
          }
          if (text.includes(']](')) {
            debug_text += item[0] + ':[' + x + ']マークアップ不正5\n'
          }
          if (text.includes('[]')) {
            debug_text += item[0] + ':[' + x + ']マークアップ不正6\n'
          }
          const deadlink = fn_deadlink_markup(item[x]);
          deadlink.forEach((key) => {
            deadlink_list.add(key[0] + '■' + key[1]);
          });
          if (item[x].startsWith('　')) {
            debug_text += item[0] + ':[' + x + ']先頭空白検出不正1\n'
          }
          if (item[x].startsWith(' ')) {
            debug_text += item[0] + ':[' + x + ']先頭空白検出不正2\n'
          }
          if (item[x].endsWith('　')) {
            debug_text += item[0] + ':[' + x + ']末空白検出不正1\n'
          }
          if (item[x].endsWith(' ')) {
            debug_text += item[0] + ':[' + x + ']末空白検出不正2\n'
          }
          if (item[x].includes('（')) {
            debug_text += item[0] + ':[' + x + ']全角前括弧空白検出不正\n'
          }
          if (item[x].includes('）')) {
            debug_text += item[0] + ':[' + x + ']全角前括弧空白検出不正\n'
          }
          if (item[x].includes('[' + item[fl_hash] + '](')) {
            debug_text += item[0] + ':[' + x + ']自己参照\n'
          }
        }
      }
      fn_text_item(1);
      fn_text_item(2);
      fn_text_item(3);
      fn_text_item(4);
      fn_text_item(5);
      fn_text_item(6);
      if (item[2]) {
        if (!item[2].match(/[^\x20-\x7f　]+/) ){
          debug_text += item[0] + ':[2]日本語訳確認\n';
        }
      }
      if (item[5] ? item[5] === item[1] : false) {
        debug_text += item[0] + ':[5]誤用typo不正\n';
      }
    });

    deadlink_list.forEach((link) => {
      debug_text += link + ':デッドリンク\n';
    });
// */
    debug_text = debug_text.replaceAll('\n', '<br>');
  }
  if (debug_mode) {
    fn_my_all_test();
  }



  if (!historyDiv) return;
  const isDisabled = localStorage.getItem(DISABLED_KEY) === 'true';
  let pathname = location.pathname;
  if (pathname.split('/').pop() === 'one_page.html') {
    pathname = pathname + location.hash;
  }
  const filename = pathname.split('/').pop() || 'index.html';
  const isException = EXCEPTIONS.some(ex => 
    filename === ex || pathname.endsWith('/' + ex)
  );
  const page_match = document.title.match(/\[(.+)\]/);
  const page = page_match ? page_match[1] : filename;

  function fn_add_history (url, page) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const current = {
      url: url,
      title: page
    };
    history = history.filter(item => item.url !== current.url);
    history.unshift(current);
    if (history.length > MAX_ITEMS) history = history.slice(0, MAX_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
  if (!isDisabled && !isException) {
    fn_add_history(location.href, page);
  }
  let buttonArea = $('history-buttons');
  if (!buttonArea) {
    buttonArea = document.createElement('div');
    buttonArea.id = 'history-buttons';
    buttonArea.style.marginTop = '8px';
    historyDiv.parentNode.insertBefore(buttonArea, historyDiv.nextSibling);
  }

  function fn_render_history() {
    const disabled = localStorage.getItem(DISABLED_KEY) === 'true';
    const history = disabled ? [] : JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    historyDiv.innerHTML = '';
    if (history.length === 0) {
      historyDiv.textContent = disabled ? '履歴は無効です' : '履歴はありません';
    } else {
      const ul = document.createElement('ul');
      history.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        li.appendChild(a);
        ul.appendChild(li);
      });
      historyDiv.appendChild(ul);
    }

    buttonArea.textContent = '';
    if (disabled) {
      const enableBtn = document.createElement('button');
      enableBtn.type = 'button';
      enableBtn.textContent = '有効にする';
      enableBtn.addEventListener('click', function() {
        localStorage.removeItem(DISABLED_KEY);
        location.reload();
      });
      buttonArea.appendChild(enableBtn);
    } else {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.textContent = 'クリア';
      clearBtn.addEventListener('click', function() {
        localStorage.removeItem(HISTORY_KEY);
        fn_render_history();
      });
      buttonArea.appendChild(clearBtn);

      const disableBtn = document.createElement('button');
      disableBtn.type = 'button';
      disableBtn.textContent = '無効';
      disableBtn.style.marginLeft = '8px';
      disableBtn.addEventListener('click', function() {
        localStorage.setItem(DISABLED_KEY, 'true');
        localStorage.removeItem(HISTORY_KEY);
        fn_render_history();
      });
      buttonArea.appendChild(disableBtn);
    }
  }
  fn_render_history();
  let debug_text_top = (debug_text === '') ? '' : '【テストに問題があります。】';
  const debug_text_bottom = (debug_text === '') ? (debug_mode ? 'test OK.' : '') : debug_text;
  if(debug_mode && debug_text_top === ''){
     debug_text_top = '【お知らせ】特にお知らせはありません。';
  }
  $('jstop').textContent = debug_text_top;
  $('jsbottom').innerHTML = '<br>ver 0.1 alpha 2026-11-18　' + str_data_version + '<br>' + debug_text_bottom;
})();
