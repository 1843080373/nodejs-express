var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var xml2js = require('xml2js');

/* 微信校验 */
var token="imook";
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
	                if( json.xml.EventKey == 'clickEvent' ){
	                    res.send( getXml( json , backTime , '你戳我干啥...' ) )  //回复用户的消息
	                }
	            }else if( json.xml.MsgType == 'text' ){  //消息为文字类型
	                res.send( getXml( json , backTime , `你发"${json.xml.Content}"过来干啥？` ) )  //回复用户的消息
	            }
            }); 
        }); 
    }catch(error){
        console.log("error:"+error);
  	}
});

function getXml( json , backTime , word ){
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

module.exports = router;
