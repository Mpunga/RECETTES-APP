import React, { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, set, get, remove, update } from 'firebase/database';
import { database, auth } from '../base';
import './PrivateChat.css';
import { showToast } from '../toast';

export default function PrivateChat({ recipientId, recipientName, recipeId, recipeName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { messageId, x, y }
  const [editingMessage, setEditingMessage] = useState(null); // { id, text }
  const [replyingTo, setReplyingTo] = useState(null); // { id, text, senderName }
  const messagesEndRef = useRef(null);
  const longPressTimer = useRef(null);
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
        // Récupérer le nom complet de l'utilisateur actuel
        const currentUserName = currentUserData && currentUserData.prenom && currentUserData.nom
          ? `${currentUserData.prenom} ${currentUserData.nom}`
          : currentUser.email;
        
        await set(chatRef, {
          participants: {
            [currentUser.uid]: currentUserName,
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

  // Gérer l'appui long
  const handleLongPressStart = (e, msg) => {
    e.preventDefault();
    
    // Capturer les coordonnées immédiatement
    const target = e.currentTarget;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    let x = clientX;
    let y = clientY;
    
    // Si pas de coordonnées client, utiliser le rect de l'élément
    if (!x || !y) {
      if (target) {
        const rect = target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }
    
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        messageId: msg.id,
        message: msg,
        x: x,
        y: y
      });
    }, 500); // 500ms pour appui long
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Fermer le menu contextuel
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Supprimer pour moi
  const handleDeleteForMe = async (msgId) => {
    try {
      const messageRef = ref(database, `privateChats/${chatId}/messages/${msgId}`);
      await update(messageRef, {
        [`deletedFor_${currentUser.uid}`]: true
      });
      showToast('Message supprimé pour vous', { type: 'success' });
      setContextMenu(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showToast('Erreur lors de la suppression', { type: 'error' });
    }
  };

  // Supprimer pour tout le monde
  const handleDeleteForEveryone = async (msgId) => {
    try {
      const messageRef = ref(database, `privateChats/${chatId}/messages/${msgId}`);
      await remove(messageRef);
      showToast('Message supprimé pour tout le monde', { type: 'success' });
      setContextMenu(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showToast('Erreur lors de la suppression', { type: 'error' });
    }
  };

  // Modifier le message
  const handleEditMessage = (msg) => {
    setEditingMessage({ id: msg.id, text: msg.text });
    setNewMessage(msg.text);
    setContextMenu(null);
  };

  // Copier le message
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Message copié', { type: 'success' });
    }).catch(() => {
      showToast('Erreur lors de la copie', { type: 'error' });
    });
    setContextMenu(null);
  };

  // Répondre au message
  const handleReplyTo = (msg) => {
    setReplyingTo({
      id: msg.id,
      text: msg.text,
      senderName: msg.senderId === currentUser.uid ? 'Vous' : (msg.senderName || recipientName)
    });
    setContextMenu(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const senderName = currentUserData && currentUserData.prenom && currentUserData.nom
      ? `${currentUserData.prenom} ${currentUserData.nom}`
      : currentUser.email;

    try {
      if (editingMessage) {
        // Modifier le message existant
        const messageRef = ref(database, `privateChats/${chatId}/messages/${editingMessage.id}`);
        await update(messageRef, {
          text: newMessage.trim(),
          edited: true,
          editedAt: Date.now()
        });
        showToast('Message modifié', { type: 'success' });
        setEditingMessage(null);
      } else {
        // Envoyer un nouveau message
        const messagesRef = ref(database, `privateChats/${chatId}/messages`);
        const messageData = {
          text: newMessage.trim(),
          senderId: currentUser.uid,
          senderName: senderName,
          timestamp: Date.now()
        };

        // Ajouter les infos de réponse si applicable
        if (replyingTo) {
          messageData.replyTo = {
            messageId: replyingTo.id,
            text: replyingTo.text,
            senderName: replyingTo.senderName
          };
        }

        await push(messagesRef, messageData);
        setReplyingTo(null);
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      showToast('Erreur lors de l\'envoi du message', { type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <button className="chat-back-btn" onClick={onClose} title="Retour">
            <span className="material-icons">arrow_back</span>
          </button>
          <div className="chat-header-info">
              <h3>
                <span className="material-icons" style={{fontSize:'20px',marginRight:'6px',verticalAlign:'middle'}}>chat</span>
                💬 {recipientName}
              </h3>
            {recipeName && <p className="chat-recipe-ref">🍽️ À propos de : {recipeName}</p>}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>💬 Aucun message. Commencez la conversation ! 👋✨</p>
            </div>
          ) : (
            messages.map((msg) => {
              // Ne pas afficher si supprimé pour moi
              if (msg[`deletedFor_${currentUser.uid}`]) return null;

              return (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.senderId === currentUser.uid ? 'own-message' : 'other-message'}`}
                  onMouseDown={(e) => handleLongPressStart(e, msg)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={(e) => handleLongPressStart(e, msg)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                >
                  <div className="message-content">
                    <div className="message-sender">
                      {msg.senderId === currentUser.uid ? '✉️ Vous' : `💬 ${msg.senderName || recipientName}`}
                    </div>
                    
                    {/* Afficher le message auquel on répond */}
                    {msg.replyTo && (
                      <div className="message-reply-preview">
                        <div className="reply-sender">{msg.replyTo.senderName}</div>
                        <div className="reply-text">{msg.replyTo.text}</div>
                      </div>
                    )}

                    <p>{msg.text}</p>
                    
                    <span className="message-time">
                      ⏰ {new Date(msg.timestamp).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                      {msg.edited && <span className="message-edited"> (modifié)</span>}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Menu contextuel */}
        {contextMenu && (
          <div
            className="message-context-menu"
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              transform: 'translate(-50%, -100%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => handleReplyTo(contextMenu.message)}>
              <span className="material-icons">reply</span>
              Répondre
            </button>
            <button onClick={() => handleCopyMessage(contextMenu.message.text)}>
              <span className="material-icons">content_copy</span>
              Copier
            </button>
            {contextMenu.message.senderId === currentUser.uid && (
              <>
                <button onClick={() => handleEditMessage(contextMenu.message)}>
                  <span className="material-icons">edit</span>
                  Modifier
                </button>
                <button onClick={() => handleDeleteForEveryone(contextMenu.messageId)}>
                  <span className="material-icons">delete_forever</span>
                  Supprimer pour tous
                </button>
              </>
            )}
            <button onClick={() => handleDeleteForMe(contextMenu.messageId)}>
              <span className="material-icons">delete</span>
              Supprimer pour moi
            </button>
          </div>
        )}

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          {/* Barre de réponse intégrée */}
          {replyingTo && (
            <div className="reply-bar">
              <div className="reply-bar-content">
                <span className="material-icons">reply</span>
                <div className="reply-bar-info">
                  <div className="reply-bar-name">{replyingTo.senderName}</div>
                  <div className="reply-bar-text">{replyingTo.text}</div>
                </div>
              </div>
              <button className="reply-bar-close" onClick={() => setReplyingTo(null)} type="button">
                <span className="material-icons">close</span>
              </button>
            </div>
          )}
          
          <div className="chat-input-row">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={editingMessage ? "✏️ Modifier le message..." : "💭 Tapez votre message..."}
              className="chat-input"
              autoFocus
            />
            {editingMessage && (
              <button 
                type="button" 
                className="chat-cancel-btn" 
                onClick={() => {
                  setEditingMessage(null);
                  setNewMessage('');
                }}
              >
                Annuler
              </button>
            )}
            <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
              {editingMessage ? '✏️ Modifier' : '✉️ Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
