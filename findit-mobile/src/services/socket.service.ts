import { io, Socket } from 'socket.io-client';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string): void {
    // TODO: To be implemented 
  }

  public disconnect(): void {
    // TODO: To be implemented
  }

  public joinConversation(conversationId: string): void {
    // TODO: To be implemented
  }

  public leaveConversation(conversationId:string): void {
    // TODO: To be implemented
  }

  public sendMessage(conversationId: string, content: string): void {
    // TODO: To be implemented
  }

  public markRead(conversationId: string, messageId: string): void {
    // TODO: To be implemented
  }
}

export default SocketService.getInstance();
