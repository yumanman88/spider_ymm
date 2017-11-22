/**
 * Created by 鱼慢慢慢 on 2017/11/1 0001.
 */
var https = require('https');
var cheerio = require('cheerio');
var url = require('url');
var iconv = require('iconv-lite');
var fs = require('fs');
var crypto = require('crypto');
var Promise = require('bluebird');
//var path = 'test';
var path="normal"
if(path==='test'){
    var idPath = 'F:/数据集/reportData/idData/miniTestIds.txt';
    var itemPath='F:/数据集/reportData/itemTest.txt'
    var itemMd5Path = 'F:/数据集/reportData/itemMd5Test.txt'
    var eventPath='F:/数据集/reportData/eventTest.txt'
    var eventMd5Path='F:/数据集/reportData/eventMd5Test.txt'
    var allResultPath='F:/数据集/reportData/allResultTest.txt'
}else if(path=="new"){
    //var idPath = 'F:/数据集/reportData/failIds/failIds1.txt'
    var idPath = 'F:/数据集/reportData/idData/idFileNew0.txt';
    var itemPath='F:/数据集/reportData/itemData/itemNew0.txt';
    var itemMd5Path='F:/数据集/reportData/itemMd5Data/itemNew0.txt'
    var eventPath='F:/数据集/reportData/eventData/eventNew0.txt';
    var eventMd5Path = 'F:/数据集/reportData/eventMd5Data/eventNew0.txt';
    var allResultPath='F:/数据集/reportData/allResultData/allResultNew0.txt';
}else{
    var idPath = 'F:/数据集/reportData/idData/idFile121-130.txt';
    var itemPath='F:/数据集/reportData/itemData/itemData13.txt';
    var itemMd5Path='F:/数据集/reportData/itemMd5Data/itemData13.txt'
    var eventPath='F:/数据集/reportData/eventData/eventData13.txt';
    var eventMd5Path = 'F:/数据集/reportData/eventMd5Data/eventData13.txt';
    var allResultPath='F:/数据集/reportData/allResultData/allResultData13.txt';
}


var contentBaseUrl = 'https://ts.voc.com.cn/note/view/';
var idString = fs.readFileSync(idPath,'utf-8');
var idArray = idString.split(' ');
var timeReg = /时间：\s*([0-9]{4}\/[0-9]{2}\/[0-9]{2}\s*[0-9]{2}:[0-9]{2})/;
var upTimeReg =/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\s*[0-9]{2}:[0-9]{2}/;
var fromReg = /来源：\s*([\u4e00-\u9fa5]+)$/;
var userReg = /者：\s*([\u4e00-\u9fa5“”\w]+)/;
var clickReg = /点击数：\s*([0-9]+)/;
var sum =0;
var itemArray=[];
var itemMd5Array=[];
var eventArray=[];
var eventMd5Array=[];
var allResultArray=[];
startFetch(idArray,8);
function startFetch(arr,num) {
    if(arr.length==0) return;
    if(arr.length>0&&arr.length<num) num=arr.length;
    var littleArr = arr.splice(0,num);
    spider(littleArr);
    if(arr.length>0){
        setTimeout(function () {
            startFetch(arr,num);
        },20000)
    }
}
function spider(arr) {
    var fetchContentArray= [];
    arr.forEach(function (item) {
        fetchContentArray.push(getContent(contentBaseUrl+item+'.html',item))
    });
    Promise.all(fetchContentArray).then(function(pages){
        pages.forEach(function(message){
            var html = message.html;
            var id = message.id;
            resolveContent(html,id);
        })
    }).then(function(){
        writeContent();
    });
}
function writeContent() {
    var itemData = itemArray.join('\n')+'\n';
    var itemMd5Data = itemMd5Array.join('\n')+'\n';
    var eventData = eventArray.join('\n')+'\n';
    var eventMd5Data = eventMd5Array.join('\n')+'\n';
    var allData = allResultArray.join('\n')+'\n';
    fs.appendFile(itemPath,itemData,function (err) {
        if(err){
            console.log('item写入失败')
            console.log(err)
        }else{
            //console.log('item写入成功')
            itemArray=[];
        }
    });
    fs.appendFile(itemMd5Path,itemMd5Data,function (err) {
        if(err){
            console.log('itemMD5写入失败')
            console.log(err)
        }else{
            //console.log('itemMD5写入成功')
            itemMd5Array=[];
        }
    });
    fs.appendFile(eventPath,eventData,function (err) {
        if(err){
            console.log('event写入失败')
        }else{
            //console.log('event写入成功')
            eventArray=[];
        }
    })
    fs.appendFile(eventMd5Path,eventMd5Data,function (err) {
        if(err){
            console.log('eventMD5写入失败')
            console.log(err)
        }else{
            //console.log('eventMD5写入成功')
            eventMd5Array=[];
        }
    })
    fs.appendFile(allResultPath,allData,function (err) {
        if(err){
            console.log('allData写入失败')
            console.log(err)
        }else{
            //console.log('allData写入成功')
            allResultArray=[];
        }
    })
}
function getContent(url,id){
    return new Promise(function(resolve,reject){
        console.log(url);
        https.get(url,function(res){
            var html ='';
            if(!res) {
                console.log(id + ' fail ');
                reject();
                return;
            }
            res.on('data',function(data){
                html+=data.toString('utf-8');
                //html+=iconv.decode(data,'GBK');
            });
            res.on('end',function () {
                var result ={};
                result.id=id;
                result.html=html;
                resolve(result);
            });
        })
            .on('error',function(e){
                reject(e);
                console.log('爬虫失败'+url);
            });
    })
}
function resolveContent(html,id){
    var result={};
    var resultString;
    result.itemid =id;
    var itemObj={};
    var itemMd5Obj={};
    var itemString;
    var itemMd5String;
    var eventArr=[];
    var eventMd5Arr=[];
    var eventMd5String;
    var eventString;
    var $ = cheerio.load(html,{decodeEntities:false});
    result.title = $('h1').text().trim().replace(/“|”|/g,'');
    if(result.title=='很抱歉'){
        console.log(id+' fail '+ sum);
        return;
    }
    var grayText = $('.ctime').text();
    result.create_at = grayText.match(timeReg)[1];
    result.device = fromReg.test(grayText)?grayText.match(fromReg)[1]:"投诉直通车";
    result.clickNum = clickReg.test(grayText)? grayText.match(clickReg)[1]:"100";
    result.deviceid=md5Hash(result.device);
    result.domain = $('.ctime label').text().trim();
    result.domainid=md5Hash(result.domain);
    result.text = $('#contents p').text().trim().replace(/\n/g,'').replace(/\t/g,'').replace(/\n/g,'').replace(' ','').replace(/“|”|《|》/g,'');;
    result.user='';
    if(result.title&&result.title.indexOf("回复")!=-1&&result.title.indexOf("回复")!=result.title.length-2){
        arr = result.title.split("回复");
        result.title=arr[1];
        result.user = arr[0];
    }
    result.title = result.title.replace(' ','').replace("回复",'').replace("回应",'').replace(/“|”/g,'');
    if($('.gray').length==0){
        if(!result.user)
            result.user='记者';
        result.update_at=result.create_at;
        result.timeStamp = Date.parse(new Date(result.update_at));
    }else{
        var messageBy = $('.gray')[0];
        var message = $(messageBy).text().replace('\n','').replace(' ','');
        var stampTime = message.match(upTimeReg)[0];
        result.update_at = stampTime;
        result.timeStamp = Date.parse(new Date(stampTime));
        result.user = message.match(userReg)[1];
    }
    result.userid = md5Hash(result.user);
    //userid,domainid为汉字的itemdata
    itemObj.domainid=result.domain;
    itemObj.title=result.title;
    itemObj.text=result.text;
    itemObj.deviceid=result.device;
    itemObj.create_at=result.create_at;
    itemObj.update_at=result.update_at;
    itemObj.timestamp=result.timeStamp;
    itemObj.clickNum=result.clickNum;
    itemString=id+':::'+JSON.stringify(itemObj)+":::"+result.timeStamp;
    itemArray.push(itemString);
    //userid,domainid为md5码的itemdata
    itemMd5Obj.domainid = result.domainid;
    itemMd5Obj.deviceid=result.deviceid;
    itemMd5Obj.clickNum=result.clickNum;
    itemMd5Obj.title=result.title;
    itemMd5Obj.text=result.text;
    itemMd5Obj.create_at=result.create_at;
    itemMd5Obj.update_at=result.update_at;
    itemMd5Obj.timeStamp=result.timeStamp;
    itemMd5String=id+':::'+JSON.stringify(itemMd5Obj)+":::"+result.timeStamp;
    itemMd5Array.push(itemMd5String);
    //userid、deviceid、domainid为汉字的eventdata
    eventArr.push(result.user);
    eventArr.push(id);
    eventArr.push(result.timeStamp);
    eventArr.push(result.device);
    eventArr.push(result.domain);
    eventArr.push(result.domain);
    eventArr.push(result.domain);
    eventArr.push('impression');
    eventArr.push(id);
    eventArr.push(id);
    eventArr.push(id);
    eventString=eventArr.join(':');
    eventArray.push(eventString);
    //userid、deviceid、domainid为md5码的eventdata
    eventMd5Arr.push(result.userid);
    eventMd5Arr.push(id);
    eventMd5Arr.push(result.timeStamp);
    eventMd5Arr.push(result.deviceid);
    eventMd5Arr.push(result.domainid);
    eventMd5Arr.push(result.domainid);
    eventMd5Arr.push(result.domainid);
    eventMd5Arr.push('impression');
    eventMd5Arr.push(id);
    eventMd5Arr.push(id);
    eventMd5Arr.push(id);
    eventMd5String = eventMd5Arr.join(':');
    eventMd5Array.push(eventMd5String);

    resultString =JSON.stringify(result);
    allResultArray.push(resultString);
    sum++;
    console.log(id + ' success  '+ sum);
}
function md5Hash(str) {
    str = str.replace(' ','').replace(/\s*|\t*|\n*/g,'');
    str = (new Buffer(str)).toString("binary");
    var ret = crypto.createHash('md5').update(str).digest("hex");
    return ret;
}

