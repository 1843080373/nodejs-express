/**
 * @Module   : Wechat oauth Module
 * @Brief   : Process Wechat oauth
 */
var express = require('express');
var router = express.Router();
var request = require('request');

/* 微信登陆 */
var AppID = 'wx0985b6dbaeeff28c';
var AppSecret = 'd3ba2d045ffc578abd0e9d23f8c93404';

router.get('/index', function(req,res, next){
    res.render('index');
});


router.get('/wx_login', function(req,res, next){
    //console.log("oauth - login")
    
    // 第一步：用户同意授权，获取code
    var router = 'get_wx_access_token';
    // 这是编码后的地址
    var return_uri = url_encode('http://k87zjw.natappfree.cc/oauth/')+router;  
    var scope = 'snsapi_userinfo';
    console.log(return_uri);
    res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid='+AppID+'&redirect_uri='+return_uri+'&response_type=code&scope='+scope+'&state=STATE#wechat_redirect');
      
});

router.get('/send_tempMsg', function(req,res, next){
    request.get(
        {   
            url:'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+AppID+'&secret='+AppSecret,
        },
        function(error, response, body){
            if(response.statusCode == 200){
                
                // 第三步：拉取用户信息(需scope为 snsapi_userinfo)
                console.log(JSON.parse(body));
                var data = JSON.parse(body);
                var access_token = data.access_token;
                var openid ='o0BJQ5uR7L6QjrwRek8sklsuOXpc';
                //发送模板消息
                sendTemplateMsg(res,openid,access_token);
            }else{
                console.log(response.statusCode);
            }
        }
    );
});


router.get('/get_wx_access_token', function(req,res, next){
    //console.log("get_wx_access_token")
    //console.log("code_return: "+req.query.code)
    
    // 第二步：通过code换取网页授权access_token
    var code = req.query.code;
    request.get(
        {   
            url:'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+AppID+'&secret='+AppSecret+'&code='+code+'&grant_type=authorization_code',
        },
        function(error, response, body){
            if(response.statusCode == 200){
                
                // 第三步：拉取用户信息(需scope为 snsapi_userinfo)
                //console.log(JSON.parse(body));
                var data = JSON.parse(body);
                var access_token = data.access_token;
                var openid = data.openid;
                request.get(
                    {
                        url:'https://api.weixin.qq.com/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN',
                    },
                    function(error, response, body){
                        if(response.statusCode == 200){
                            
                            // 第四步：根据获取的用户信息进行对应操作
                            var userinfo = JSON.parse(body);
                            //console.log(JSON.parse(body));
                            console.log('获取微信信息成功！'+body);
                            // 小测试，实际应用中，可以由此创建一个帐户
                            res.send("\
                                <h1>"+userinfo.nickname+" 的个人信息</h1>\
                                <p><img src='"+userinfo.headimgurl+"' /></p>\
                                <p>"+userinfo.city+"，"+userinfo.province+"，"+userinfo.country+"</p>\
                            ");
                            
                        }else{
                            console.log(response.statusCode);
                        }
                    }
                );
            }else{
                console.log(response.statusCode);
            }
        }
    );
});

function url_encode(url){
    url = encodeURIComponent(url);
    url = url.replace(/\%3A/g, ":");
    url = url.replace(/\%2F/g, "/");
    url = url.replace(/\%3F/g, "?");
    url = url.replace(/\%3D/g, "=");
    url = url.replace(/\%26/g, "&");
    return url;
}


/**
 * 发送模板消息
   @param  { res } res 
 * @param  { string } openid [发送模板消息的接口需要用到openid参数]
 * @param  { string } access_token [发送模板消息的接口需要用到access_token参数]
 */

function sendTemplateMsg(res,openid, access_token) {

        var url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=`+access_token; //发送模板消息的接口

        var requestData = { //发送模板消息的数据
            touser: openid,
            template_id: 'O7n71NjSoc2dB6w4XOEfRl4aGVOxo-nhVu7w8oJhxnE',
            url: 'http://m.caihang.com',
            topcolor: '#000000',
            data: {
                keyword3: {
                    value: '大龙虾',
                    color: "#328392"
                },
                keyword1: {
                    value: 'OD0001',
                    color: '#328392'
                },
                keyword2: {
                    value: '预定订单',
                    color: '#328392'
                },
                remark: {
                    value: '请及时确认订单!',
                    color: '#929232'
                },
                first: {
                    value: '您好，您有一条待确认订单!',
                    color: '#000000'
                }
            }
        };

        request({
            url: url,
            method: 'post',
            son: true,
            headers: {
                     "content-type": "application/json",
                    },
            body: JSON.stringify(requestData),
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // 请求成功的处理逻辑
                res.send(body);
            }
        });
    }

module.exports = router;