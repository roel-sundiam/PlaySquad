import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly url = environment.socketUrl;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io(this.url, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  connect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  joinClub(clubId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-club', clubId);
    }
  }

  leaveClub(clubId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-club', clubId);
    }
  }

  startTyping(clubId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing-start', { clubId });
    }
  }

  stopTyping(clubId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing-stop', { clubId });
    }
  }

  onNewMessage(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('new-message', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('new-message');
        }
      };
    });
  }

  onMessageUpdated(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('message-updated', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('message-updated');
        }
      };
    });
  }

  onMessageDeleted(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('message-deleted', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('message-deleted');
        }
      };
    });
  }

  onReactionAdded(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('reaction-added', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('reaction-added');
        }
      };
    });
  }

  onReactionRemoved(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('reaction-removed', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('reaction-removed');
        }
      };
    });
  }

  onReplyAdded(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('reply-added', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('reply-added');
        }
      };
    });
  }

  onUserJoinedChat(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('user-joined-chat', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('user-joined-chat');
        }
      };
    });
  }

  onUserLeftChat(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('user-left-chat', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('user-left-chat');
        }
      };
    });
  }

  onUserTyping(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('user-typing', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('user-typing');
        }
      };
    });
  }

  onEventPublished(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('event-published', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('event-published');
        }
      };
    });
  }

  onEventCancelled(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('event-cancelled', (data) => {
          observer.next(data);
        });
      }
      return () => {
        if (this.socket) {
          this.socket.off('event-cancelled');
        }
      };
    });
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}