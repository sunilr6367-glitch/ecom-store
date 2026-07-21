import { orderService } from './src/services/order-service';

async function main() {
  const data = await orderService.getOrder('ea67b2e1-186d-4eb9-b4d5-e7fc22a715ea'); // from previous script output
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

main().catch(console.error);
