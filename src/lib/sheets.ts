
'use server';

import { google } from 'googleapis';
import type { BudgetRequest } from './types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getGoogleAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'The GOOGLE_SERVICE_ACCOUNT_JSON environment variable was not found. Please set it to the contents of your service account JSON file.'
    );
  }

  try {
    const parsedCredentials = JSON.parse(serviceAccountJson);
    // Replace the escaped newlines in the private key
    parsedCredentials.private_key = parsedCredentials.private_key.replace(/\\n/g, '\n');
    
    return new google.auth.GoogleAuth({
        credentials: parsedCredentials,
        scopes: SCOPES,
    });
  } catch (e: any) {
     console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", e.message);
     throw new Error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Make sure it's a valid JSON string.");
  }
}

const getSheetsApi = () => {
    const auth = getGoogleAuth();
    return google.sheets({ version: 'v4', auth });
}

const ensureHeaderRow = async (sheets: any, sheetId: string) => {
    const getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:N1',
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
                        'Created At',
                        'Requester',
                        'Lembaga',
                        'Divisi',
                        'Supervisor',
                        'Amount',
                        'Status',
                        'Item Description',
                        'Category',
                        'Qty',
                        'Unit',
                        'Price',
                        'Total',
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
      console.log('Missing GOOGLE_SHEET_ID env var, skipping sheet append.');
      return;
    }
    
    await ensureHeaderRow(sheets, sheetId);

    const range = 'Sheet1!A1';
    
    const baseRow = [
      request.id,
      request.createdAt,
      request.requester.name,
      request.department?.lembaga ?? request.institution ?? '',
      request.department?.divisi ?? request.division ?? '',
      request.supervisor?.name ?? '',
      request.amount,
      request.status,
    ];

    const itemRows = request.items.map(item => [
        ...baseRow,
        item.description,
        item.category,
        item.qty,
        item.unit,
        item.price,
        item.total
    ]);


    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: itemRows,
      },
    });

    const updatedRange = response.data.updates?.updatedRange;
    if (updatedRange) {
        const match = updatedRange.match(/!A(\d+):/);
        if (match) {
            const startRow = parseInt(match[1], 10);
            const endRow = startRow + itemRows.length - 1;
            const requestRef = doc(db, 'requests', request.id);
            await updateDoc(requestRef, { 
              sheetStartRow: startRow,
              sheetEndRow: endRow,
            });
        }
    }


  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    // Re-throw the error so the calling function knows about it
    throw error;
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
        const startRow = requestData?.sheetStartRow;
        const endRow = requestData?.sheetEndRow;


        if (!startRow || !endRow) {
            console.error(`Could not find sheetRowNumber for request ID ${request.id}. Appending as new row.`);
            // This case might happen if the initial append failed.
            // We'll try to append it again.
            await appendRequestToSheet(request);
            return;
        }

        const rangeToUpdate = `Sheet1!H${startRow}:H${endRow}`;

        const values = Array(endRow - startRow + 1).fill([request.status]);

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
        // Re-throw the error so the calling function knows about it
        throw error;
    }
}
