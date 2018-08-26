var express = require('express');
var request = require('request');
var xmlreader = require("xmlreader");
var router = express.Router();
var outTradeId = Date.now().toString();
var wxpay = require('./util');
 
 
var appid     = 'wx4492fde581248a1d';
var appsecret = 'a5a91cdbc9b737b028e8bd95d7ed65c0';
var mchid     = '1512382871';
var mchkey    = 'bbfe124b99377409d104994f91e56bb1';
var wxurl     = 'http://i5wzbs.natappfree.cc/notify';


router.get('/payPage', function(req,res){
    res.render('weixinpay');
});

router.get('/pay',(req,res)=>{
    
    //首先拿到前端传过来的参数
    let orderCode = outTradeId;
    let money     = 1.79;
 
    console.log('APP传过来的参数是',orderCode+'----'+money+'----'+appid+'-----'+appsecret+'-----'+mchid+'-----'+mchkey);
 
    //首先生成签名sign
    let mch_id = mchid;
    let nonce_str = wxpay.createNonceStr();
    let timestamp = wxpay.createTimeStamp();
    let body = '测试微信支付';
    let out_trade_no = orderCode;
    let total_fee = wxpay.getmoney(money);
    let spbill_create_ip = '127.0.0.1';
    let notify_url = wxurl;
    let trade_type = 'JSAPI';
    let openId = 'o0BJQ5uR7L6QjrwRek8sklsuOXpc';
    let attach=body;
    let device_info='sandbox';
    let sign = wxpay.paysignjsapi(
        appid,
        body,
        attach,
        mch_id,
        device_info,
        nonce_str,
        notify_url,
        out_trade_no,
        spbill_create_ip,
        total_fee,
        trade_type,
        mchkey);
 
    console.log('sign==',sign);
 
    //组装xml数据
    var formData  = "<xml>";
    formData  += "<appid>"+appid+"</appid>";  //appid
    formData  += "<body>"+body+"</body>";
    formData  += "<attach>"+attach+"</attach>";
    formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
    formData  += "<device_info>"+device_info+"</device_info>";
    formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
    formData  += "<notify_url>"+notify_url+"</notify_url>";
    formData  += "<openid>"+openId+"</openid>";
    formData  += "<out_trade_no>"+out_trade_no+"</out_trade_no>";
    formData  += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
    formData  += "<total_fee>"+total_fee+"</total_fee>";
    formData  += "<trade_type>"+trade_type+"</trade_type>";
    formData  += "<sign>"+sign+"</sign>";
    formData  += "</xml>";
 
    console.log('formData===',formData);
 
    var url = 'https://api.mch.weixin.qq.com/sandboxnew/pay/unifiedorder';
 
    request({url:url,method:'POST',body: formData},function(err,response,body){
        if(!err && response.statusCode == 200){
            console.log(body);
 
            xmlreader.read(body.toString("utf-8"), function (errors, response) {
                if (null !== errors) {
                    console.log(errors)
                    return;
                }
                console.log('长度===', response);
                var prepay_id = response.xml.prepay_id.text();
                console.log('解析后的prepay_id==',prepay_id);
                //将预支付订单和其他信息一起签名后返回给前端
                let finalsign = wxpay.paysignjsapifinal(appid,mch_id,prepay_id,nonce_str,timestamp,mchkey);
 
                res.render('pay',{'appId':appid,'partnerId':mchid,'nonceStr':nonce_str,'timeStamp':timestamp,'packageStr':'prepay_id='+prepay_id,'sign':finalsign});
 
            });
        }
    });
});

／／微信回调通知 采用数据流形式读取微信返回的xml数据 此处不在累赘
router.post('/notify', function(req, res, next){
 wxpay.notify(req.body);
});
module.exports = router;