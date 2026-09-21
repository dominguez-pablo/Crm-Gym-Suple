import { stockBus } from '../events/stockBus.js';

export const subscribeStock = (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send('ready', { ok: true });

    const onChange = (payload) => send('STOCK_CHANGED', payload);
    stockBus.on('STOCK_CHANGED', onChange);

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    const cleanup = () => {
      clearInterval(heartbeat);
      stockBus.off('STOCK_CHANGED', onChange);
    };

    req.on('close', cleanup);
  } catch (error) {
    next(error);
  }
};
