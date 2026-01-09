import React, { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { database, auth } from '../base';
import { useNavigate } from 'react-router-dom';
import PrivateChat from './PrivateChat';
import './ChatList.css';

export default function ChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [usersData, setUsersData] = useState({});
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const chatsRef = ref(database, 'privateChats');
    const unsubscribe = onValue(chatsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userChats = [];
        
        // Traiter chaque chat et charger les données utilisateur individuellement
        for (const [chatId, chatData] of Object.entries(data)) {
          if (!chatId.includes(currentUser.uid)) continue;
          
          const participants = chatData.participants || {};
          const otherUserId = Object.keys(participants).find(uid => uid !== currentUser.uid);
          
          // Charger les données de l'autre utilisateur
          let otherUserName = participants[otherUserId] || 'Utilisateur';
          let otherUserPhoto = '';
          
          try {
            const userSnapshot = await get(ref(database, `users/${otherUserId}`));
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              if (userData.prenom && userData.nom) {
                otherUserName = `${userData.prenom} ${userData.nom}`;
              }
              otherUserPhoto = userData.photo || '';
            }
          } catch (error) {
            console.error('Erreur chargement utilisateur:', error);
            // Continuer avec le nom de fallback
          }
          
          // Récupérer le dernier message
          const messages = chatData.messages ? Object.values(chatData.messages) : [];
          const lastMessage = messages.length > 0 
            ? messages.sort((a, b) => b.timestamp - a.timestamp)[0]
            : null;

          userChats.push({
            chatId,
            otherUserId,
            otherUserName,
            otherUserPhoto,
            recipeName: chatData.recipeName || '',
            recipeId: chatData.recipeId || '',
            lastMessage,
            createdAt: chatData.createdAt || 0
          });
        }
        
        // Trier par timestamp du dernier message
        userChats.sort((a, b) => {
          const timeA = a.lastMessage?.timestamp || a.createdAt;
          const timeB = b.lastMessage?.timestamp || b.createdAt;
          return timeB - timeA;
        });

        setChats(userChats);
      } else {
        setChats([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="chat-list-container">
        <div className="chat-list-loading">Chargement des conversations...</div>
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h1>
          <span className="material-icons" style={{fontSize:'28px',marginRight:'8px',verticalAlign:'middle'}}>forum</span>
          Mes conversations
        </h1>
        <button className="chat-list-back" onClick={() => navigate('/')} title="Retour au menu principal">
          <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>home</span>
          Accueil
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="chat-list-empty">
          <p>Aucune conversation pour le moment.</p>
          <p>Contactez un auteur de recette pour démarrer une conversation ! 🍽️</p>
        </div>
      ) : (
        <div className="chat-list-items">
          {chats.map((chat) => (
            <div
              key={chat.chatId}
              className="chat-list-item"
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-item-avatar">
                {chat.otherUserPhoto ? (
                  <img src={chat.otherUserPhoto} alt={chat.otherUserName} />
                ) : (
                  <div className="avatar-placeholder">
                    {chat.otherUserName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="chat-item-content">
                <div className="chat-item-header">
                  <h3>
                    💬 {chat.otherUserName}
                  </h3>
                  {chat.lastMessage && (
                    <span className="chat-item-time">
                      ⏰ {new Date(chat.lastMessage.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                {chat.recipeName && (
                  <p className="chat-item-recipe">
                    <span className="material-icons" style={{fontSize:'14px',marginRight:'4px',verticalAlign:'middle'}}>receipt</span>
                    🍽️ {chat.recipeName}
                  </p>
                )}
                {chat.lastMessage && (
                  <p className="chat-item-last-message">
                    {chat.lastMessage.senderId === currentUser.uid ? '✉️ Vous: ' : '💬 '}
                    {chat.lastMessage.text}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedChat && (
        <PrivateChat
          recipientId={selectedChat.otherUserId}
          recipientName={selectedChat.otherUserName}
          recipeId={selectedChat.recipeId}
          recipeName={selectedChat.recipeName}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
}
