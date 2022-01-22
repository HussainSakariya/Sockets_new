var socket = io();


$('#regformlink').click(function () {
    $('body').load('/register.html');
});

$('#regform').click(function () {
    alert($('#reguser').val());
    // socket.emit('setUsername', $('#reguser').val());
});

$('#loginform').click(function () {
    socket.emit('chackUsername', $('#user').val());
});

function clickClient(id) {
    localStorage.setItem('fromuser', id)
    socket.emit('setGroup', { 'touser': localStorage.getItem('touser'), 'fromuser': localStorage.getItem('fromuser') });
}

$('#sendmsg').click(function () {
    var msg = $('#msg').val()
    if (msg) {
        var d = new Date()
        dt = "at." + d.getHours() + ":" + d.getMinutes()
        socket.emit('addmsg', { msg: msg, touser: localStorage.getItem("touser"), fromuser: localStorage.getItem("fromuser"), dt: dt });
        $('#msg').val('')
    }

});

socket.on('opengroupbox', function (data) {
    alert('grp');
    $('.msg_box').load('/groupbox.html');
});

socket.on('userNotExists', function (data) {
    alert(data);
    $('body').load('/index.html');
});


socket.on('userExists', function (data) {
    alert(data);
});

socket.on('userSet', function () {
    $('body').load('/msgbox.html');
    socket.emit('getUsers');
});

socket.on('setUsers', function (data) {
    for (var user of data.users) {
        // $('#users').append($('<li>').text(user.username));
        if (data.user != user.username) {
            $('#users').append('<li><button id=' + user.username + ' onclick="clickClient(this.id)">' + user.username + '</button>  </li>');
        }
    }
    localStorage.setItem("touser", data.user);
    $('#userid').text(data.user)

});




// socket.on('newmsg', function (data) {
//     if (user) {
//         document.getElementById('message-container').innerHTML += '<div><b>' +
//             data.user + '</b>: ' + data.message + '</div>'
//     }
// })


