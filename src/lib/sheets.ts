
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

const getSheetsApi = () => {
    const auth = getGoogleAuth();
    return google.sheets({ version: 'v4', auth });
}

const ensureHeaderRow = async (sheets: any, sheetId: string) => {
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
                        'Category',
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
};

export async function appendRequestToSheet(request: BudgetRequest) {
  try {
    const sheets = getSheetsApi();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new Error('Missing GOOGLE_SHEET_ID env var');
    }
    
    await ensureHeaderRow(sheets, sheetId);

    const range = 'Sheet1!A1'; // The range to find the next empty row in.

    const values = [
      [
        request.id,
        request.category,
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
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
  }
}

export async function updateRequestInSheet(request: BudgetRequest) {
    try {
        const sheets = getSheetsApi();
        const sheetId = process.env.GOOGLE_SHEET_ID;
        if (!sheetId) {
            throw new Error('Missing GOOGLE_SHEET_ID env var');
        }

        // Find the row with the matching request ID
        const findResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:A', // Search in the ID column
        });

        const rowValues = findResponse.data.values;
        if (!rowValues) {
            console.error(`Could not find request with ID ${request.id} in the sheet.`);
            return;
        }

        const rowIndex = rowValues.findIndex(row => row[0] === request.id);
        if (rowIndex === -1) {
            console.error(`Could not find request with ID ${request.id} in the sheet.`);
            return;
        }

        const rowNumber = rowIndex + 1; // 1-based index
        const rangeToUpdate = `Sheet1!A${rowNumber}:J${rowNumber}`;

        const values = [
            [
                request.id,
                request.category,
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

        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: rangeToUpdate,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });

    } catch (error) {
        console.error('Error updating Google Sheet:', error);
    }
}
