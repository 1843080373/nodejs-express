var xmlreader = require("xmlreader");
var fs = require("fs");
var md5 = require('md5-node');
 
var wxpay = {
 
    //把金额转为分
    getmoney: function (money) {
        return parseFloat(money) * 100;
    },
 
    // 随机字符串产生函数  
    createNonceStr: function () {
        return Math.random().toString(36).substr(2, 15);
    },
 
    // 时间戳产生函数  
    createTimeStamp: function () {
        return parseInt(new Date().getTime() / 1000) + '';
    },
 
    //签名加密算法
    paysignjsapi: function(
        appid,
        attach, 
        body, 
        mch_id,
        nonce_str, 
        notify_url, 
        openid, 
        out_trade_no, 
        spbill_create_ip, 
        total_fee, 
        trade_type,
        key) {
        var ret = {
            appid: appid,
            attach: attach,
            body: body,
            mch_id: mch_id,
            nonce_str: nonce_str,
            notify_url: notify_url,
            openid: openid,
            out_trade_no: out_trade_no,
            spbill_create_ip: spbill_create_ip,
            total_fee: total_fee,
            trade_type: trade_type
        };
        var string = this.raw(ret);
        string = string + '&key=' + key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
        var crypto = require('crypto');
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    },
    //签名加密算法,第二次的签名
    paysignjs: function(appid, nonceStr, package, signType, timeStamp) {
        var ret = {
            appId: appid,
            nonceStr: nonceStr,
            package: package,
            signType: signType,
            timeStamp: timeStamp
        };
        var string = this.raw(ret);
        string = string + '&key=' + key;
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    },

    getXMLNodeValue: function (xml) {
        xmlreader.read(xml, function (errors, response) {
            if (null !== errors) {
                console.log(errors)
                return;
            }
            console.log('长度===', response.xml);
            var prepay_id = response.xml.prepay_id.text();
            console.log('解析后的prepay_id==',prepay_id);
            return prepay_id;
        });
    },
    raw: function(args) {
        var keys = Object.keys(args);
        keys = keys.sort()
        var newArgs = {};
        keys.forEach(function(key) {
            newArgs[key] = args[key];
        });
        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    },
    //支付回调通知
    notify: function(xml) {
        xmlreader.read(xml, function (errors, response) {
            if (null !== errors) {
                console.log(errors)
                return;
            }
            obj = response.xml;
            var output = "";
            if (obj.return_code == "SUCCESS") {
                var reply = {
                    return_code: "SUCCESS",
                    return_msg: "OK"
                };
     
            } else {
                var reply = {
                    return_code: "FAIL",
                    return_msg: "FAIL"
                };
            }
     
            output = ejs.render(messageTpl, reply);
            return output;
        });

        
    },
}
 

 
module.exports = wxpay;
