'use server';

import { google } from 'googleapis';
import type { BudgetRequest } from './types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

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

export async function appendRequestToSheet(request: Omit<BudgetRequest, 'createdAt' | 'updatedAt'> & {createdAt: string, updatedAt: string}) {
  try {
    const sheets = getSheetsApi();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      console.log('Missing GOOGLE_SHEET_ID env var, skipping sheet append.');
      return;
    }
    
    await ensureHeaderRow(sheets, sheetId);

    const range = 'Sheet1!A1';

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

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    // Extract the range of the newly added row
    const updatedRange = response.data.updates?.updatedRange;
    if (updatedRange) {
        const match = updatedRange.match(/!A(\d+):/);
        if (match) {
            const rowNumber = parseInt(match[1], 10);
             // Update Firestore document with the sheet's row number
            const requestRef = doc(db, 'requests', request.id);
            await updateDoc(requestRef, { sheetRowNumber: rowNumber });
        }
    }


  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
  }
}

export async function updateRequestInSheet(request: BudgetRequest) {
    try {
        const sheets = getSheetsApi();
        const sheetId = process.env.GOOGLE_SHEET_ID;
        if (!sheetId) {
          console.log('Missing GOOGLE_SHEET_ID env var, skipping sheet update.');
          return;
        }

        const requestRef = doc(db, 'requests', request.id);
        const requestSnap = await getDoc(requestRef);
        const requestData = requestSnap.data();
        const rowNumber = requestData?.sheetRowNumber;

        if (!rowNumber) {
            console.error(`Could not find sheetRowNumber for request ID ${request.id}. Appending as new row.`);
            // The type for appendRequestToSheet is slightly different, so we need to ensure compatibility
            await appendRequestToSheet({
              ...request,
              createdAt: new Date(request.createdAt).toISOString(),
              updatedAt: new Date(request.updatedAt).toISOString()
            });
            return;
        }

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

    