import crypto from 'crypto';

const SUBMIT_SECRET = process.env.SUBMIT_SECRET || 'md-master-default-secret';
const SUBMIT_TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5分钟有效期

// 验证提交的签名
export function verifySubmitSignature(
  levelId: number,
  score: number,
  timestamp: number,
  signature: string
): { valid: boolean; error?: string } {
  // 检查必填参数
  if (!timestamp || !signature) {
    return { valid: false, error: 'Missing signature' };
  }

  // 检查时间戳是否在有效期内
  if (Math.abs(Date.now() - timestamp) > SUBMIT_TIMESTAMP_TOLERANCE) {
    return { valid: false, error: 'Request expired' };
  }

  // 验证签名
  const payload = `${levelId}:${score}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', SUBMIT_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}
