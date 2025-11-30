import type { BinanceLinearBroker } from './broker';

import WebSocket from 'ws';
import { SocksProxyAgent  } from 'socks-proxy-agent';
import * as crypto from 'node:crypto';

import { OrderStatus, Direction, Offset, OrderType, OrderData } from '@vtrader/shared';
import { CancelOrderRequest, SendOrderRequest } from '@vtrader/shared';
import { DIRECTION_OFFSET2BINANCE, ORDERTYPE_VT2BINANCE, formatFloat } from './constants';
import { createWs } from 'src/client/ws';

/**
 * 交易API客户端
 */
export class TradeApi {
  private apiKey: string = '';
  private apiSecret: string = '';
  private broker: BinanceLinearBroker;
  private server: string = '';
  private ws: null | WebSocket = null;

  private orders: Map<string, OrderData> = new Map();

  constructor(broker: BinanceLinearBroker) {
    this.broker = broker;
  }

  /**
   * 连接到交易API
   */
  public async connect(
    apiKey: string,
    apiSecret: string,
    // server: string,
    // proxyHost?: string,
    // proxyPort?: number,
  ): Promise<void> {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    // this.server = server;

    // const wsUrl = server === 'REAL' ? REAL_TRADE_HOST : TESTNET_TRADE_HOST;

    return new Promise((resolve, reject) => {
      this.ws = createWs({
        url: this.broker.TRADE_HOST,
        agent: new SocksProxyAgent('socks5h://127.0.0.1:7890'),
        onOpen: () => {
          this.broker.writeLog('交易WebSocket连接成功');
          resolve();
        },

        onMessage: (data: WebSocket.Data) => {
          this.onMessage(data.toString());
        },

        onError: (error) => {
          this.broker.writeLog(`交易WebSocket错误: ${error}`);
          reject(error);
        },

        onClose: () => {
          this.broker.writeLog('交易WebSocket连接关闭');
        }
      });
    });
  }

  /**
   * 签名参数
   * 生成请求所需的HMAC-SHA256签名
   */
  private sign(params: any): void {
    // 添加时间戳
    const timestamp = Date.now() - this.broker.timeOffset;
    params.timestamp = timestamp;

    // 按字母顺序排序参数并生成查询字符串
    const sortedKeys = Object.keys(params).sort();
    const payload = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 使用HMAC-SHA256生成签名
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('hex');

    // 将签名添加到参数中
    params.signature = signature;
  }

  /**
   * 发送订单
   */
  public async sendOrder(req: SendOrderRequest): Promise<string> {
    // 获取合约信息
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      this.broker.writeLog(`发送订单失败，未找到合约: ${req.symbol}`);
      return '';
    }

    const order: OrderData = {
      symbol: req.symbol,
      orderId: req.orderId,
      type: OrderType.LIMIT,
      direction: req.direction,
      offset: req.offset,
      price: req.price,
      volume: req.volume,
      avgPrice: 0,
      traded: 0,
      tradePrice: 0,
      tradeVolume: 0,
      status: OrderStatus.SUBMITTING,
      time: new Date(),
      tradeCommission: 0,
      msg: '',
    };

    // 构建订单参数
    const params: any = {
      apiKey: this.apiKey,
      symbol: contract.name,
      positionSide: DIRECTION_OFFSET2BINANCE[req.direction],
      quantity: formatFloat(req.volume),
      newClientOrderId: req.orderId,
    };

    // 设置买卖方向
    if (req.direction === Direction.LONG) {
      params.side = req.offset === Offset.OPEN ? 'BUY' : 'SELL';
    } else {
      params.side = req.offset === Offset.OPEN ? 'SELL' : 'BUY';
    }

    // 设置订单类型和价格
    const orderType = OrderType.LIMIT;

    const [binanceType, timeCondition] = ORDERTYPE_VT2BINANCE[orderType];
    params.type = binanceType;
    params.timeInForce = timeCondition;
    params.price = formatFloat(req.price);

    // 签名参数
    this.sign(params);

    // 发送WebSocket消息
    const packet = {
      id: req.orderId, // 使用时间戳作为请求ID
      method: 'order.place',
      params: params,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
      this.broker.writeLog(`发送订单: ${req.symbol} ${req.direction} ${req.volume}`);

      this.broker.emit('order', order);
      this.orders.set(order.orderId, order);
    } else {
      this.broker.writeLog('WebSocket连接未建立，无法发送订单');
      return '';
    }

    return req.orderId;
  }

  

    /**
   * 撤销订单
   */
  public async cancelOrder(req: CancelOrderRequest): Promise<void> {
    // 获取合约信息
    const contract = this.broker.getContractBySymbol(req.symbol);
    if (!contract) {
      this.broker.writeLog(`撤单失败，未找到合约: ${req.symbol}`);
      return;
    }

    // 构建撤单参数
    const params: any = {
      apiKey: this.apiKey,
      symbol: contract.name,
      origClientOrderId: req.orderId
    };

    // 签名参数
    this.sign(params);

    // 发送WebSocket消息
    const packet = {
      id: req.orderId, // 使用时间戳作为请求ID
      method: 'order.cancel',
      params: params,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
      this.broker.writeLog(`发送撤单请求: ${req.symbol} 订单ID: ${req.orderId}`);
    } else {
      this.broker.writeLog('WebSocket连接未建立，无法发送撤单请求');
    }
  }

  /**
   * 停止交易API
   */
  public stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 处理WebSocket消息
   */
  private onMessage(data: string): void {
    try {
      const msg = JSON.parse(data);
      const id = msg.id;

      // console.log('onMessage', msg);
      
      // 处理异常情况
      if (msg.status !== 200) {
        const order = this.orders.get(id);

        if (order) {
          order.status = OrderStatus.REJECTED;
          order.msg = msg.error?.msg || '未知错误';
          this.broker.emit('order', order);
          this.orders.delete(id);
        }
      } else {
        this.orders.delete(id);
      }

    } catch (error) {
      this.broker.writeLog(`解析交易消息失败: ${error}`);
    }
  }
}
