import { initSocket, getIO } from '../socket';
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let mockOnCallback: any;
let mockSocket: any;

jest.mock('socket.io', () => {
    return {
        Server: jest.fn().mockImplementation(() => {
            return {
                on: jest.fn((event, callback) => {
                    if (event === 'connection') {
                        mockOnCallback = callback;
                    }
                }),
            };
        }),
    };
});

jest.mock('../config/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    }
}));

describe('Socket Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if getIO is called before init', () => {
    expect(() => getIO()).toThrow('Socket.io not initialized!');
  });

  it('should initialize socket and provide IO', () => {
    const mockHttpServer = {} as HttpServer;
    const io = initSocket(mockHttpServer);
    
    expect(Server).toHaveBeenCalled();
    expect(getIO()).toBe(io);
  });

  it('should handle client connection and disconnection', () => {
    const { logger } = require('../config/logger');
    const mockHttpServer = {} as HttpServer;
    initSocket(mockHttpServer);

    // Simulate a socket connection
    mockSocket = {
      id: 'test-socket-123',
      on: jest.fn((event, callback) => {
        if (event === 'disconnect') {
          // Store disconnect callback for later
          mockSocket.disconnectCallback = callback;
        }
      }),
    };

    // Trigger connection event
    mockOnCallback(mockSocket);
    expect(logger.info).toHaveBeenCalledWith('Client connected: test-socket-123');

    // Trigger disconnect event
    mockSocket.disconnectCallback();
    expect(logger.info).toHaveBeenCalledWith('Client disconnected: test-socket-123');
  });
});
