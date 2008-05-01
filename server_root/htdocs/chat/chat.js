var channel;
var ticket;
var queueName = null;

function mkElement(name, cls) {
    var e = document.createElement(name);
    e.className = cls;
    return e;
}

function mkSpan(cls, content) {
    var node = mkElement("span", cls);
    node.appendChild(document.createTextNode(content));
    return node;
}

var mimeTypeHandlers = {
    "text/plain": function(delivery) {
	var utterance = mkElement("div", "utterance");
	utterance.appendChild(mkSpan("nick", delivery.routing_key));
	utterance.appendChild(mkSpan("message", delivery.content));
	$("chatOutput").appendChild(utterance);
    },

    "application/json": function(delivery) {
	var parsedMessage = JSON.parse(delivery.content);
    }
};

function initUsername() {
    var username = document.location.search.match(/username=([^&]+)/);
    if (username) {
	username = username[1].replace(/\+/g, " ");
	username = unescape(username);
    }

    if (username) {
	return username;
    } else {
	return "user" + Math.floor(Math.random() * 1e10);
    }
}

function chatMain() {
    log("Starting.");

    $("userName").value = initUsername();
    $("chatMessage").focus();

    var rabbitService = new JsonRpcService("/rpc/rabbitmq", onRabbitServiceReady,
					   {debug: true,
					    debugLogger: log,
					    timeout: 30000});

    function onRabbitServiceReady() {
	log("onRabbitServiceReady");
	channel = new RabbitChannel(rabbitService, on_open,
				    { debug: true,
				      debugLogger: log });
    }

    function on_open() {
	log("on_open");
	channel.accessRequest("/data").addCallback(on_ticket);
    }

    function on_ticket(newTicket) {
	log("on_ticket");
	ticket = newTicket;
	change_channel();
    }
}

function change_channel() {
    log("change_channel: " + $("channelName").value);
    channel.exchangeDeclare(ticket, $("channelName").value, "fanout")
    .addCallback(on_exchange_declared);

    function on_exchange_declared() {
	log("on_exchange_declared");
	if (queueName != null) {
	    channel.queueDelete(ticket, queueName)
	    .addCallback(function (messageCount) {
			     log("queue deleted");
			     declare_fresh_queue();
			 });

	    queueName = null;
	} else {
	    declare_fresh_queue();
	}
    }

    function declare_fresh_queue() {
	log("declare_fresh_queue");
	channel.queueDeclare(ticket).addCallback(on_queue_declared);
    }

    function on_queue_declared(newQueueName) {
	log("on_queue_declared");
	queueName = newQueueName;
	channel.queueBind(ticket, queueName, $("channelName").value).addCallback(on_queue_bound);
    }

    function on_queue_bound() {
	log("on_queue_bound");
	$("chatOutput").innerHTML = "";
	channel.basicConsume(ticket, queueName,
			     {
				 deliver: function(delivery) {
				     var mimeType = delivery.props.content_type;
				     if (mimeType == null) {
					 mimeType = "text/plain";
				     }
				     var handler = mimeTypeHandlers[mimeType];
				     if (handler != null) {
					 handler(delivery);
				     } else {
					 log({props: delivery.props, unhandled: delivery.content});
				     }
				 }
			     },
			     { no_ack: true });
    }
}

function send_chat() {
    channel.basicPublish(ticket, $("channelName").value, $("userName").value,
			 $("chatMessage").value,
			 { content_type: "text/plain" });
    $("chatMessage").value = "";
}

function log() {
    $A(arguments).each(function (arg) {
			   if (typeof(arg) == 'string') {
			       $("testOutput").appendChild(document.createTextNode(arg + "\n"));
			   } else {
			       $("testOutput").appendChild(document
							   .createTextNode(JSON.stringify(arg) +
									   "\n"));
			   }
		       });
}
