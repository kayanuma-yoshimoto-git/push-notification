import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const APPSYNC_URL = 
  "https://xxxxxxxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql";
  // "http://localhost:20002/graphql"
const mutation = `
  mutation UpdatePaymentStatus($reservation_id: ID!, $status: String!) {
    updatePaymentStatus(reservation_id: $reservation_id, status: $status) {
      reservation_id
      status
    }
  }
`;

const query = `
  query GetCpmPaymentStatus($reservation_id: ID!) {
    getCpmPaymentStatus(reservation_id: $reservation_id) {
      reservation_id
      status
    }
  }
`;

app.post('/api/qr', async (req, res) => {
  const reservationId = uuidv4();
  const privateKey = fs.readFileSync('private.pem');

  const token = jwt.sign(
    {
      reservation_id: reservationId,
    },
    privateKey,
    {
      algorithm: 'RS256',
    }
  );

  const variables = {
    reservation_id: reservationId,
    status: 'PENDING',
  };

  try {
    const result = await fetch(APPSYNC_URL, {
      method: 'POST',
      headers: {
        // Lambda Authorizerの場合、Authorizationヘッダーにトークンを設定
        'Authorization': token,
        'x-api-key': '0123456789',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    const json = await result.json();

    if (json.errors) {
      console.error('GraphQL errors:', json.errors);
      return res.status(500).json({ error: 'Failed to update payment status' });
    }

    console.log('✅ Mutation success:', json);
    res.json({
      reservation_id: reservationId,
      token,
    });
  } catch (error) {
    console.error('❌ Error calling AppSync:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payment', async (req, res) => {
  const { reservation_id } = req.body;

  if (!reservation_id) {
    return res.status(400).json({ error: 'Reservation ID is required in request body' });
  }

  const privateKey = fs.readFileSync('private.pem');

  // 認証用トークンを生成
  const token = jwt.sign(
    {
      reservation_id: reservation_id,
    },
    privateKey,
    {
      algorithm: 'RS256',
    }
  );

  const variables = {
    reservation_id: reservation_id,
    status: 'PAID', // ステータスをPAIDに更新
  };

  try {
    const result = await fetch(APPSYNC_URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'x-api-key': '0123456789',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    const json = await result.json();

    if (json.errors) {
      console.error('GraphQL errors:', json.errors);
      return res.status(500).json({ error: 'Failed to update payment status' });
    }

    console.log('✅ Payment completed:', json);
    res.json({
      success: true,
      message: 'Payment status updated to PAID',
      data: json
    });
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/api/payment/:reservation_id', async (req, res) => {
  const { reservation_id } = req.params;

  if (!reservation_id) {
    return res.status(400).json({ error: 'Reservation ID is required in request body' });
  }

  const privateKey = fs.readFileSync('private.pem');

  // 認証用トークンを生成
  const token = jwt.sign(
    {
      reservation_id: reservation_id,
    },
    privateKey,
    {
      algorithm: 'RS256',
    }
  );

  const variables = {
    reservation_id: reservation_id,
  };

  try {
    const result = await fetch(APPSYNC_URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = await result.json();

    if (json.errors) {
      console.error('GraphQL errors:', json.errors);
      return res.status(500).json({ error: 'Failed to update payment status' });
    }

    console.log('✅ Payment completed:', json.data);
    res.json({
      success: true,
      message: 'Payment status updated to PAID',
      data: json.data
    });
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`QR API Server is running on http://localhost:${port}`);
});