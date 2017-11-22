var https = require('https');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');
var Promise = require('bluebird');
var idBaseUrl = 'https://ts.voc.com.cn/note/list/11/';
var ids={}
var idPages=[];
var idPath = 'F:/数据集/reportData/idData/idFileNew0.txt';
for(var i=1;i<=1;i++){
    idPages.push(i+'.html');
}
var sum = 0;

var fetchIdArray = [];
idPages.forEach(function (item) {
    fetchIdArray.push(getIds(idBaseUrl+item));
})
Promise.all(fetchIdArray).then(function(pages){
    pages.forEach(function(html){
        resolveId(html);
    })
}).then(function () {
    var idArr = Object.keys(ids);
    var idString = idArr.join(' ');
    fs.writeFile(idPath,idString,function (err) {
        if(err) console.log('fail');
        else
            console.log('success');
    });
})
function getIds(url){
    return new Promise(function(resolve,reject){
        console.log(url);
        https.get(url,function(res){
            var html ='';
            if(!res) {
                reject();
                return;
            }
            res.on('data',function(data){
                html+=data.toString('utf-8');
            });
            res.on('end',function () {
                resolve(html);
            });
        })
            .on('error',function(e){
            reject(e);
            console.log('爬虫失败'+url);
        });
    })
}
function resolveId(html){
    var littleSum = 0;
    var $ = cheerio.load(html);
    var tbody = $('tbody')[0];
    var reg = /\/([0-9]+).html$/;
    var trs = $(tbody).find('tr');
    trs.each(function(index,node){
        if(node.name=='tr'){
            if($(node).find('th').length==0){
                var aNode = $(node).find('a');
                if(aNode&&aNode.attr('href')){
                    var href = aNode.attr('href');
                    id = href.match(reg)[1];
                    if(!ids[id]) ids[id]=true
                    littleSum++;
                    sum++;
                }
            }
        }
    });
    console.log(littleSum+'  :   '+ sum)
}



