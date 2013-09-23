var express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io').listen(server);

var userList = [],
	blackList = [],
	likeitList = [],
	blackWords = ["校长","书记","sb","fuck","脑残","中共","法轮功","共产党","6.4","天安门","自焚","拆迁","大V","自由","民主","薄熙来","谷开来","王立军","习近平","胡锦涛","江泽民","蛤蟆","新疆","国母","影帝","八九","坦克","学潮","彭丽媛","宪政","薛蛮子","表哥","捅鸡局","GFW","屠城","骆家辉","赖昌星","重庆","乱伦","美狗","五毛","人民","操你","中共下台","打倒中共","打倒共党","一党独裁","达赖","刘淇","李克强","回良玉","曾培炎","穆斯林","炸弹","我操","操你妈","干你全家","干你妈","西藏","赵紫阳","推翻中国共产党","马克思","海伍德","陈光诚","北京","暴动","藏独","台湾","木耳","上床","JB"],
	msgOrder = 0;
	
server.listen(80);

app.configure(function () {
	app.use(express.static(__dirname + '/statics'));
});

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
app.get('/jquery.min.js', function (req, res) {
	res.sendfile(__dirname + '/jquery.min.js');
});
app.get('/KLfOsLWr', function (req, res) {
	res.sendfile(__dirname + '/admin.html');
});
app.get('/vip', function (req, res) {
	res.sendfile(__dirname + '/vip.html');
});

io.sockets.on('connection', function (socket) {
	socket.on('login', function(data) {
		var clientInfo = {};
		data = chkUsername(trim(data));
		console.log(data + " has login");
		socket.name = data;
		clientInfo.isVIP = 0;
		clientInfo.username = data;
		clientInfo.clientID = socket.id;
		clientInfo.clientIP = socket.handshake.address.address;
		userList.push(clientInfo);
		socket.emit('userlist', userList);
		socket.broadcast.emit('userlist', userList);
		
		likeitList[msgOrder] = 0;
		var msg = {
			id : msgOrder++,
			username: '系统信息',
			time: getCurrTime(),
			msg: '欢迎新用户 ' + socket.name + ' 的到来...'
		};
		socket.emit('msg', msg);
		socket.broadcast.emit('msg', msg);
	});
	
	socket.on('vip_login', function(data) {
		var clientInfo = {};
		data = chkUsername(trim(data));
		console.log(data + " has login");
		socket.name = data;
		clientInfo.isVIP = 1;
		clientInfo.username = data;
		clientInfo.clientID = socket.id;
		clientInfo.clientIP = socket.handshake.address.address;
		userList.push(clientInfo);
		socket.emit('userlist', userList);
		socket.broadcast.emit('userlist', userList);
		
		likeitList[msgOrder] = 0;
		var msg = {
			id : msgOrder++,
			username: '系统信息',
			time: getCurrTime(),
			msg: '欢迎VIP用户 ' + socket.name + ' 的到来...'
		};
		socket.emit('msg', msg);
		socket.broadcast.emit('msg', msg);
	});
	
	socket.on('blackit', function(data) {
		data = trim(data);
		for (var i in userList) {
			if (userList[i].username == data) {
				blackList.push(userList[i]);
				userList.splice(i, 1);
				break;
			}
		}
		socket.emit('userlist', userList);
		socket.broadcast.emit('userlist', userList);
		socket.emit('blacklist', blackList);
		socket.broadcast.emit('blacklist', blackList);
	});
	
	socket.on('msg', function(data) {
		var re = {};
		var isBlack = 0;
		for (var i in blackList) {
			if (blackList[i].clientIP == socket.handshake.address.address) {
				isBlack = 1;
				break;
			}
		}
		if (isBlack) {
			re = {
				username: '系统信息',
				time: getCurrTime(),
				msg: '<b style="color:red;font-weight:bold;">抱歉,您被系统疑似恶意刷屏,已被暂时禁言.</b>'
			};
			socket.emit('msg', re);
		}
		else {
			likeitList[msgOrder] = 0;
			re = {
				id : msgOrder++,
				username: socket.name,
				time: getCurrTime(),
				msg: trim(data)
			};
			socket.emit('msg', re);
			socket.broadcast.emit('msg', re);
		}
	});
	
	/*socket.on('vip_msg', function(data) {
		var re = {
			username: '<span style="color:#f00">' + socket.name + '</span>',
			time: getCurrTime(),
			msg: trim(data)
			};
		socket.emit('msg', re);
		socket.broadcast.emit('msg', re);
		socket.emit('vip_msg', re);
		socket.broadcast.emit('vip_msg', re);
	});*/
	
	socket.on('notice', function(data) {
		data = trim(data);
		socket.emit('notice', data);
		socket.broadcast.emit('notice', data);
	});
	
	socket.on('user', function() {
		socket.emit('userlist', userList);
	});
	
	socket.on('admin', function() {
		socket.emit('userlist', userList);
		socket.emit('blacklist', blackList);
		socket.emit('blackwords', blackWords);
	});
	
	socket.on('likeit', function(data) {
		var reg = /^\d*$/;
		if (reg.test(data)) {
			likeitList[data]++;
		}
		socket.emit('likeitList', likeitList);
		socket.broadcast.emit('likeitList', likeitList);
	});
	
	socket.on('addblackword', function(data) {
		data = trim(data);
		blackWords.push(data);
		socket.emit('blackwords', blackWords);
	});
	
	socket.on('delblackuser', function(data) {
		data = trim(data);
		for (var i in blackList) {
			if (blackList[i].username == data) {
				blackList.splice(i, 1);
				break;
			}
		}
		socket.emit('blacklist', blackList);
	});

	socket.on('disconnect', function() {
		for (var i in userList) {
			if (userList[i].clientID == socket.id) {
				userList.splice(i, 1);
				break;
			}
		}
		socket.emit('userlist', userList);
		socket.broadcast.emit('userlist', userList);
		
		likeitList[msgOrder] = 0;
		var msg = {
			id : msgOrder++,
			username: '系统信息',
			time: getCurrTime(),
			msg: socket.name + ' 悄悄地离开了聊天室...'
		};
		socket.emit('msg', msg);
		socket.broadcast.emit('msg', msg);
	});
});

function chkUsername(data) {
	//var flag = 0;
	for (var i in userList) {
		if (userList[i].username == data) {
			//flag = 1;
			//break;
			return "Hacker_" + Math.round(Math.random() * 10000);
		}
	}
	for (var j in blackWords) {
		if (blackWords[j] == data)
			return "Guest_" + Math.round(Math.random() * 10000);
	}
	return data;
}
function trim(str) {
	//return ((s.replace(/<(.+?)>/gi,'')).replace(/\n\r/gi,'')).replace(/\n/gi,'');  
	var s = "";
	if (str.length == 0) return "";   
	s = str.replace(/&/g, "&gt;");   
	s = s.replace(/</g, "&lt;");   
	s = s.replace(/>/g, "&gt;");   
	s = s.replace(/ /g, "&nbsp;");   
	s = s.replace(/\'/g, "&#39;");   
	s = s.replace(/\"/g, "&quot;");   
	s = s.replace(/\n/g, "<br>");   
	return s;
}
var getCurrTime = function () {
	var d = new Date();
	return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
};