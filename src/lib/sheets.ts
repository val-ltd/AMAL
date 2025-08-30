import { google } from 'googleapis';
import type { BudgetRequest } from './types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getGoogleAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON env var');
  }

  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  return new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: SCOPES,
  });
}

export async function appendRequestToSheet(request: BudgetRequest) {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new Error('Missing GOOGLE_SHEET_ID env var');
    }

    const range = 'Sheet1!A1'; // Assumes data is appended to Sheet1

    // Ensure header row exists
    const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:J1',
    });
    
    if (!getResponse.data.values || getResponse.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [
                        'ID',
                        'Title',
                        'Amount',
                        'Status',
                        'Requester',
                        'Institution',
                        'Division',
                        'Supervisor',
                        'Created At',
                        'Description',
                    ],
                ],
            },
        });
    }


    const values = [
      [
        request.id,
        request.title,
        request.amount,
        request.status,
        request.requester.name,
        request.institution ?? '',
        request.division ?? '',
        request.supervisor?.name ?? '',
        request.createdAt,
        request.description,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    // In a real app, you might want to handle this more gracefully
    // For now, we'll just log the error and not re-throw it so the app doesn't crash
  }
}
