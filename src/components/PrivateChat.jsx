import React, { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, set, get } from 'firebase/database';
import { database, auth } from '../base';
import './PrivateChat.css';
import { showToast } from '../toast';

export default function PrivateChat({ recipientId, recipientName, recipeId, recipeName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  // Créer un ID de chat unique (tri alphabétique des UIDs)
  const getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  const chatId = getChatId(currentUser.uid, recipientId);

  useEffect(() => {
    if (!currentUser || !recipientId) return;

    // Charger les données de l'utilisateur actuel
    const loadCurrentUserData = async () => {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setCurrentUserData(snapshot.val());
      }
    };
    loadCurrentUserData();

    // Initialiser le chat s'il n'existe pas
    const initChat = async () => {
      const chatRef = ref(database, `privateChats/${chatId}`);
      const snapshot = await get(chatRef);
      
      if (!snapshot.exists()) {
        await set(chatRef, {
          participants: {
            [currentUser.uid]: currentUser.email,
            [recipientId]: recipientName
          },
          recipeId: recipeId || '',
          recipeName: recipeName || '',
          createdAt: Date.now()
        });
      }
    };

    initChat();

    // Écouter les messages
    const messagesRef = ref(database, `privateChats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, recipientId, chatId, recipientName, recipeId, recipeName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messagesRef = ref(database, `privateChats/${chatId}/messages`);
    
    try {
      const senderName = currentUserData && currentUserData.prenom && currentUserData.nom
        ? `${currentUserData.prenom} ${currentUserData.nom}`
        : currentUser.email;
      
      await push(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: senderName,
        timestamp: Date.now()
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      showToast('Erreur lors de l\'envoi du message', { type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="chat-modal">
        <div className="chat-container">
          <div className="chat-loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-modal" onClick={onClose}>
      <div className="chat-container" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-header-info">
              <h3>
                <span className="material-icons" style={{fontSize:'20px',marginRight:'6px',verticalAlign:'middle'}}>chat</span>
                💬 {recipientName}
              </h3>
            {recipeName && <p className="chat-recipe-ref">🍽️ À propos de : {recipeName}</p>}
          </div>
          <button className="chat-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>💬 Aucun message. Commencez la conversation ! 👋✨</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.senderId === currentUser.uid ? 'own-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <div className="message-sender">
                    {msg.senderId === currentUser.uid ? '✉️ Vous' : `💬 ${msg.senderName || recipientName}`}
                  </div>
                  <p>{msg.text}</p>
                  <span className="message-time">
                    ⏰ {new Date(msg.timestamp).toLocaleString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="💭 Tapez votre message..."
            className="chat-input"
            autoFocus
          />
          <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
            ✉️ Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
