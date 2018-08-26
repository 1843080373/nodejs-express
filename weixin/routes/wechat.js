var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var xml2js = require('xml2js');
var request = require('request');
/* 微信校验 */
var token="imook";
var tulingAPI="f0d99d4e9fc44ec096afdf510c575437";
/* GET home page. */
router.get('/wechat/index', function(req, res, next) {
   try{
        var signature = req.query.signature;
        var timestamp = req.query.timestamp;
        var nonce = req.query.nonce;
        var echostr = req.query.echostr;
        /*  加密/校验流程如下： */
        //1. 将token、timestamp、nonce三个参数进行字典序排序
        var array = new Array(token,timestamp,nonce);
        array.sort();
        var str = array.toString().replace(/,/g,"");
        //2. 将三个参数字符串拼接成一个字符串进行sha1加密
        var sha1Code = crypto.createHash("sha1");
        var code = sha1Code.update(str,'utf-8').digest("hex");
        //3. 获得加密后的字符串可与signature对比，标识该请求来源于微信
        if(code===signature){
            res.send(echostr);
            console.log(""+echostr);
        }else{
            res.send("error");
        }
    }catch(error){
        console.log("error:"+error);
  	}
});

/* 微信消息处理 */
router.post('/wechat/index', function(req, res, next) {
  try{
        var xml = '';
       var json = null;
	    req.on("data",function(data){
	        xml += data;

	    });
	    req.on("end",function(){
	          //将接受到的xml数据转化为json
        xml2js.parseString(xml,  {explicitArray : false}, function(err, json) {  
                var backTime = new Date().getTime();  //创建发送时间，整数
	            if( json.xml.MsgType == 'event' ){  //消息为事件类型
	                if( json.xml.Event == 'clickEvent' ){
	                    res.send( getTxtXml( json , backTime , '你戳我干啥...' ) )  //回复用户的消息
	                }
                    if( json.xml.Event == 'subscribe' ){
                        var respText='感谢您关注偶,这里会给您提供最新的资讯和公告！\n';
                        respText+='1  我是文字\n';
                        respText+='2  我是图片\n';
                        respText+='3  我是多图文\n';
                        respText+='4  我发送模板消息\n';
                        res.send( getTxtXml( json , backTime , respText ) )  //回复用户的消息
                    }
	            }else if( json.xml.MsgType == 'text' ){  //消息为文字类型
                    var word = json.xml.Content;
                    if('1'==word){
                         res.send( getTxtXml( json , backTime , '这是一段文字' ) )  //回复用户的消息
                    }
                    else if('2'==word){
                         res.send( getImgXml( json , backTime , 'tLIuitkUyO1S-cAf5j_TAoIBiXFY2Ws_3ZH3VX2UG_l2YiOvZneLCignEEyXW9Re' ) )  //回复用户的消息
                    }
                    else if('3'==word){
                         var articles=new Array();
                         articles[0]={
                                         "Title":"晚天吹凉风",
                                         "Description":"点击进入晚天吹凉风博客",
                                         "PicUrl":"https://ss0.baidu.com/73x1bjeh1BF3odCf/it/u=1163727520,2326205650&fm=85&s=FAD05B8DC2B02637103D65850300B097",
                                         "Url":"http://www.baidu.com"
                                    };
                         articles[1]={
                                         "Title":"晚天吹凉风",
                                         "Description":"点击进入晚天吹凉风博客",
                                         "PicUrl":"https://ss0.baidu.com/73x1bjeh1BF3odCf/it/u=1163727520,2326205650&fm=85&s=FAD05B8DC2B02637103D65850300B097",
                                         "Url":"http://www.baidu.com"
                                    };
                         articles[2]={
                                         "Title":"晚天吹凉风",
                                         "Description":"点击进入晚天吹凉风博客",
                                         "PicUrl":"https://ss0.baidu.com/73x1bjeh1BF3odCf/it/u=1163727520,2326205650&fm=85&s=FAD05B8DC2B02637103D65850300B097",
                                         "Url":"http://www.baidu.com"
                                    };
                         res.send( getNewsXml( json , backTime , articles) )  //回复用户的消息
                    }
                    else if('4'==word){
                         sendTempMsg( res,json,backTime) 
                    }else{
                        info_tulingAPI(res,json,backTime);
                    }
                    
	            }
            }); 
        }); 
    }catch(error){
        console.log("error:"+error);
  	}
});


function getImgXml( json , backTime , mediaId ){
        var backXML = `
                <xml>
                    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
                    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
                    <CreateTime>${backTime}</CreateTime>
                    <MsgType>image</MsgType>
                    <Image>
                       <MediaId>${mediaId}</MediaId>
                    </Image>
                </xml>
            `
        return backXML;
};

function getNewsXml( json , backTime , articles ){
        var items='';
        for(var i=0;i<articles.length;i++){
             var article= articles[i];
             items+=`<item>
                      <Title><![CDATA[`+article.Title+`]]></Title>
                      <Description><![CDATA[`+article.Description+`]]></Description>
                      <PicUrl><![CDATA[`+article.PicUrl+`]]></PicUrl>
                      <Url><![CDATA[`+article.Url+`]]></Url>
                      </item>`;
        }
        var backXML = `
               <xml>
                      <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
                      <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
                      <CreateTime>${backTime}</CreateTime>
                      <MsgType><![CDATA[news]]></MsgType>
                      <ArticleCount>`+articles.length+`</ArticleCount>
                      <Articles>`+items+`</Articles>
               </xml>
            `;
        return backXML;
};

function getLinkXml( json , backTime , url, msgId){
        var backXML = `
                <xml>
                    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
                    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
                    <CreateTime>${backTime}</CreateTime>
                    <MsgType>link</MsgType>
                    <Title><![CDATA[公众平台官网链接]]></Title>
                    <Description><![CDATA[公众平台官网链接]]></Description>
                    <Url>${url}</Url>
                    <MsgId>1234567890123456</MsgId>
                </xml>
            `;
        console.log(backXML)
        return backXML;
};

function getTxtXml( json , backTime , word ){
        var backXML = `
                <xml>
                    <ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
                    <FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
                    <CreateTime>${backTime}</CreateTime>
                    <MsgType><![CDATA[text]]></MsgType>
                    <Content><![CDATA[${word}]]></Content>
                </xml>
            `
        return backXML;
};

function info_tulingAPI( res,data,backTime ){
      var word = data.xml.Content;
      request.get(
                    {
                        url:'http://www.tuling123.com/openapi/api?key='+tulingAPI+'&info='+word,
                    },
                    function(error, response, body){
                        if(response.statusCode == 200){
                            var back = '';
                            // 第四步：根据获取的用户信息进行对应操作
                            var json = JSON.parse(body);
                            /**
                             * code 说明 100000文本类 200000链接类 302000新闻类 308000菜谱类
                             */
                            var s = "";
                            if (100000 == json.code) {
                                s = json.text;
                                back = back + s;
                            } else if (200000 == json.code) {
                                s = json.text;
                                back = back + s;
                                back = "\n";
                                s = json.url;
                                back = back + s;
                            } else if (302000 == json.code) {
                                s = "待开发有点麻烦！\n";
                                 back = back + s;
                            } else if (308000 == json.code) {
                                s = "待开发有点麻烦！\n";
                                 back = back + s;
                            }
                            res.send( getTxtXml( data , backTime , back ) )  //回复用户的消息
                        }else{
                            console.log(response.statusCode);
                            res.send( getTxtXml( data , backTime , '发生异常！！！' ) )  //回复用户的消息
                        }
                    }
                );
};

/**
发送模板消息
**/
function sendTempMsg( res,data,backTime ){
     
};

module.exports = router;
