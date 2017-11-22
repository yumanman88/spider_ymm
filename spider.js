var http = require('http');
var cheerio = require('cheerio');
var url = require('url');
var zlib = require('zlib');
var fs = require('fs');
var superagent = require('superagent');
var url = 'https://bugzilla.mozilla.org/buglist.cgi?quicksearch=a';
//var url = 'https://www.baidu.com/';
var containId = {};

superagent.get(url).end(function(err,res){
	if(err){
		console.log('ddd')
		console.log(err);
		console.log('出错了')
	}
	let $ = cheerio.load(res.text);
	let tbody = $('.sorttable_body')[0];
	var trs = tbody.children;
	var existId={};
	var sumNum=0;
	console.log(trs.length);
	trs.forEach(function(node,index){
		if(node.name=='tr'){
			var result={};
            result.id = $(node).find('.bz_id_column').children().first().text().replace(/[\s\n\r]/g,'').replace('\n','').replace(" ",'');
            if(existId['id']) return;

            result.product = $(node).find('.bz_product_column').children().first().text().replace(/[\s\n\r]/g,'').replace('\n','').replace(" ",'');
            result.component = $(node).find('.bz_component_column').children().first().text().replace(/[\s\n\r]/g,'').replace('\n','').replace(" ",'')
            result.assigned = $(node).find('.bz_assigned_to_column').children().first().text().replace(/[\s\n\r]/g,'').replace('\n','').replace(" ",'');
            result.bugStatus = $(node).find('.bz_bug_status_column').children().first().text().replace(/[\s\n\r]/g,'').replace('\n','').replace(" ",'');
            result.title = $(node).find('.bz_short_desc_column').children().first().text().replace(/[\n\r]/g,'').replace('\n','').replace(/(^\s*)|(\s*$)/g, "");
            result.dateTime = $(node).find('.bz_changeddate_column').text().replace('\n','').replace(" ",'');
            if(result.id&&result.product&&result.component&&result.assigned&&result.bugStatus&&result.title&&result.dateTime){
                var output = JSON.stringify(result);
                sumNum++;
                existId[result.id]=true;
                console.log(output);
            }
		}
	})
	console.log(sumNum);
});
