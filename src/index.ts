import express, { Express, Request, Response } from 'express';
import { validateCard, maskCardNumber } from './libs/validator/cardValidator';

const app: Express = express();
app.use(express.json());

app.post('/validate', (req: Request, res: Response) => {
  const { number } = req.body;

  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Card number is required and must be a string' });
  }

  const result = validateCard(number);

  const maskedNumber = maskCardNumber(number);
  console.log(`Validating card: ${maskedNumber}, Result: ${result.valid ? 'valid' : 'invalid'}`);

  if (!result.valid) {
    return res.status(400).json({ error: result.message });
  }

  return res.status(200).json({
    valid: result.valid,
    scheme: result.scheme,
    message: result.message
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export { app };

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

