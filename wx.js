//取得node httpsClient服务
var https = require('https');
var http = require('http');
var debug = true;
//修改参数可以关闭console.log调试
if(!debug){
	windows.console= {log:function(){}};
}

//建立客户端获取wxtoken,为了安全应该从数据库获取
var appID = '',
 appsecret = '';

var getWXTicket = function(){
	var access_token='',ticket='';
	https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appID+'&secret='+appsecret,
		function(response){
		console.log('statusCode:'+response.statusCode);
		console.log('headers:'+response.headers);

		response.on('data',function(data){
			access_token =  JSON.parse(data);
			console.log('access_token.access_token:'+access_token.access_token);
		});

		response.on('end',function(){
			//根据token获取ticket
			https.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+access_token.access_token+'&type=jsapi',
				function(response){
					console.log('statusCode:'+response.statusCode);
					console.log('headers:'+response.headers);

					response.on('data',function(data){
						ticket = JSON.parse(data);
						console.log('ticket.ticket:'+ticket.ticket);
					});
					response.on('end',function(){
						session.setAttr('ticket',ticket.ticket);
					});
				});
		});
	}).on('error',function(e){
		console.error(e);
	});
}

//自定义简单session对象
var session = {
	id:'',
	_attr:{},//属性
	_msg:[],//保存推送的消息
	getAllAttr:function(){return this._attr;},//获得所有属性
	getAttr:function(key){return this._attr[key]},//获得对应属性
	removeAttr:function(key){delete this._attr[key]},//删除对应属性
	setAttr:function(key,value){this._attr[key] = value},//设置属性
	write:function(msg){this._msg.push(msg)},//将消息加入推送消息
	getAndPushMsg:function(){var result = this._msg;this._msg=[];return result;},//推送消息
	close:function(){this.setAttr('state',0)},//关闭会话
	destory:function(){this.setAttr('state',-1)},//销毁会话
	replace:function(session){this._attr = session.getAllAttr()},//替换session
	refreshLastTime:function(){this.setAttr('lastTime',new Date())},//刷新最后访问时间
	init:function(id){
		this.id = id;
		this.setAttr('createTime',new Date());
		this.setAttr('state',1);
	}//初始化session对象
};
getWXTicket();
//加入定时任务定时更新token值，由于微信过期时间是2小时，这里设置为1小时
var getticketForHour = setInterval(function(){
	getWXTicket();
},3600000);

//创建获取微信ticket的服务
var url = require('url');
http.createServer(function(request,response){
	var wxURL_path = url.parse(request.url).pathname;
	console.log(wxURL_path.indexOf('ticket'));

	if(wxURL_path.indexOf('ticket') !== -1){
		response.writeHead(200, {'Content-type' : 'text/html'});
		response.write(session.getAttr('ticket'));
	}
    response.end();

}).listen(5000);

