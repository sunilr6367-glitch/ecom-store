import { Hono } from 'hono';
import { homepageService } from '../services/homepage-service';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const homepage = await homepageService.getHomepage();
    return c.json(homepage);
  } catch (error) {
    console.error('[Homepage] aggregation failed:', error);
    return c.json({ error: 'Failed to load homepage' }, 500);
  }
});

export default app;
