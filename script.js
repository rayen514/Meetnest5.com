let posts = [];
let friends = [];
let friendRequests = [];
let currentUser = null;
let currentChatFriend = null;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('posts')) {
        posts = JSON.parse(localStorage.getItem('posts'));
        displayPosts();
    }

    if (localStorage.getItem('friends')) {
        friends = JSON.parse(localStorage.getItem('friends'));
    }

    if (localStorage.getItem('friendRequests')) {
        friendRequests = JSON.parse(localStorage.getItem('friendRequests'));
    }

    if (localStorage.getItem('currentUser')) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        document.querySelector('.profile-container').style.display = 'none';
    }

    document.getElementById('searchFriend').addEventListener('input', searchFriends);
    displayFriendRequests();
});

function createProfile() {
    const profileName = document.getElementById('profileName').value;
    const profilePicture = document.getElementById('profilePicture').files[0];

    if (profileName && profilePicture) {
        const reader = new FileReader();
        reader.onload = function (e) {
            currentUser = {
                name: profileName,
                picture: e.target.result
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.querySelector('.profile-container').style.display = 'none';
        };
        reader.readAsDataURL(profilePicture);
    } else {
        alert('Veuillez remplir tous les champs.');
    }
}

function createPost() {
    const postText = document.getElementById('postText').value;
    const postFile = document.getElementById('postFile').files[0];

    if (!postText && !postFile) {
        alert('Veuillez entrer du texte ou sélectionner un fichier.');
        return;
    }

    const post = {
        id: Date.now(),
        user: currentUser,
        text: postText,
        file: postFile ? URL.createObjectURL(postFile) : null,
        fileType: postFile ? postFile.type.split('/')[0] : null,
        comments: [],
        reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 }
    };

    posts.unshift(post);
    localStorage.setItem('posts', JSON.stringify(posts));
    displayPosts();
    resetForm();
}

function displayPosts() {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.innerHTML = `
            <button class="deletePostButton" onclick="deletePost(${post.id})">Supprimer</button>
            <p><strong>${post.user.name}</strong></p>
            <img src="${post.user.picture}" alt="Profile Picture" style="width: 50px; height: 50px; border-radius: 50%;">
            <p>${post.text}</p>
            ${post.file && post.fileType === 'image' ? `<img src="${post.file}" alt="Post Image"><button onclick="downloadFile('${post.file}', 'image.jpg')">Télécharger</button>` : ''}
            ${post.file && post.fileType === 'video' ? `<video controls><source src="${post.file}" type="video/mp4"></video><button onclick="downloadFile('${post.file}', 'video.mp4')">Télécharger</button>` : ''}
            <div class="reactions">
                <span class="reaction" onclick="react(${post.id}, 'like')">👍 (${post.reactions.like})</span>
                <span class="reaction" onclick="react(${post.id}, 'love')">❤️ (${post.reactions.love})</span>
                <span class="reaction" onclick="react(${post.id}, 'haha')">😂 (${post.reactions.haha})</span>
                <span class="reaction" onclick="react(${post.id}, 'wow')">😮 (${post.reactions.wow})</span>
                <span class="reaction" onclick="react(${post.id}, 'sad')">😢 (${post.reactions.sad})</span>
                <span class="reaction" onclick="react(${post.id}, 'angry')">😡 (${post.reactions.angry})</span>
            </div>
            <div class="comments">
                ${post.comments.map(comment => `
                    <div class="comment">
                        <strong>${comment.user}:</strong> ${comment.text}
                    </div>
                `).join('')}
                <form onsubmit="addComment(event, ${post.id})">
                    <input type="text" placeholder="Ajouter un commentaire..." required>
                    <button type="submit">Commenter</button>
                </form>
            </div>
        `;
        postsContainer.appendChild(postElement);
    });
}

function react(postId, reactionType) {
    const post = posts.find(post => post.id === postId);
    if (post) {
        const userId = currentUser.name;
        const userReactions = JSON.parse(localStorage.getItem('userReactions')) || {};

        if (!userReactions[userId]) {
            userReactions[userId] = {};
        }

        if (!userReactions[userId][postId]) {
            userReactions[userId][postId] = true;

            post.reactions[reactionType]++;
            localStorage.setItem('posts', JSON.stringify(posts));
            localStorage.setItem('userReactions', JSON.stringify(userReactions));
            displayPosts();
        } else {
            alert('Vous avez déjà réagi à ce post.');
        }
    }
}

function addComment(event, postId) {
    event.preventDefault();
    const post = posts.find(post => post.id === postId);
    if (post) {
        const commentText = event.target.querySelector('input').value;
        post.comments.push({ user: currentUser.name, text: commentText });
        localStorage.setItem('posts', JSON.stringify(posts));
        displayPosts();
        event.target.reset();
    }
}

function deletePost(postId) {
    posts = posts.filter(post => post.id !== postId);
    localStorage.setItem('posts', JSON.stringify(posts));
    displayPosts();
}

function deleteAllPosts() {
    posts = [];
    localStorage.setItem('posts', JSON.stringify(posts));
    displayPosts();
}

function resetForm() {
    document.getElementById('postText').value = '';
    document.getElementById('postFile').value = null;
}

function downloadFile(fileUrl, filename) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function searchFriends(event) {
    const searchTerm = event.target.value.toLowerCase();
    const friendRequestContainer = document.getElementById('friendRequestContainer');
    friendRequestContainer.innerHTML = '';

    friends.forEach(friend => {
        if (friend.name.toLowerCase().includes(searchTerm)) {
            const requestElement = document.createElement('div');
            requestElement.classList.add('friend-request');
            requestElement.innerHTML = `
                <span>${friend.name}</span>
                <button onclick="sendFriendRequest('${friend.name}')">Envoyer une invitation</button>
            `;
            friendRequestContainer.appendChild(requestElement);
        }
    });
}

function sendFriendRequest(friendName) {
    const request = { from: currentUser.name, to: friendName };
    friendRequests.push(request);
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    displayFriendRequests();
}

function displayFriendRequests() {
    const friendRequestContainer = document.getElementById('friendRequestContainer');
    friendRequestContainer.innerHTML = '';
    friendRequests.forEach(request => {
        if (request.to === currentUser.name) {
            const requestElement = document.createElement('div');
            requestElement.classList.add('friend-request');
            requestElement.innerHTML = `
                <span>${request.from}</span>
                <button onclick="acceptFriendRequest('${request.from}')">Accepter</button>
            `;
            friendRequestContainer.appendChild(requestElement);
        }
    });
}

function acceptFriendRequest(friendName) {
    friends.push({ name: friendName });
    friendRequests = friendRequests.filter(request => request.from !== friendName || request.to !== currentUser.name);
    localStorage.setItem('friends', JSON.stringify(friends));
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    displayFriendRequests();
}

function openChat(friendName) {
    currentChatFriend = friendName;
    document.getElementById('chatContainer').classList.add('active');
    loadChatMessages();
}

function loadChatMessages() {
    const chatMessagesContainer = document.getElementById('chatMessages');
    chatMessagesContainer.innerHTML = '';

    const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    const chatKey = currentUser.name + '_' + currentChatFriend;
    const reverseChatKey = currentChatFriend + '_' + currentUser.name;
    const chatMessages = messages[chatKey] || messages[reverseChatKey] || [];

    chatMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.innerHTML = `
            <strong>${message.user}:</strong> ${message.text}
        `;
        chatMessagesContainer.appendChild(messageElement);
    });
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messageText = chatInput.value;
    chatInput.value = '';

    if (messageText) {
        const messages = JSON.parse(localStorage.getItem('chatMessages')) || {};
        const chatKey = currentUser.name + '_' + currentChatFriend;
        const reverseChatKey = currentChatFriend + '_' + currentUser.name;

        if (!messages[chatKey]) {
            messages[chatKey] = [];
        }
        if (!messages[reverseChatKey]) {
            messages[reverseChatKey] = [];
        }

        const message = { user: currentUser.name, text: messageText };
        messages[chatKey].push(message);

        localStorage.setItem('chatMessages', JSON.stringify(messages));
        loadChatMessages();
    }
}

function closeChat() {
    document.getElementById('chatContainer').classList.remove('active');
    currentChatFriend = null;
}
